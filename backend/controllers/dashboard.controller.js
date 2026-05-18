import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import StockAlert from "../models/StockAlert.js";

/**
 * GET DASHBOARD SNAPSHOT
 * OWNER only
 * Returns comprehensive business intelligence:
 * - Daily/Monthly Sales & Profit
 * - 30-Day Profit/Sales Trend
 * - Top 5 Profitable Medicines
 * - Low Stock / Expiry Alerts Summary
 * - Dead Stock Analysis
 */
export const getDashboardSnapshot = async (req, res, next) => {
  try {
    const medicalStoreId = req.user.medicalStoreId;
    const today = new Date();
    
    // Time Ranges
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Daily Stats (Optimized)
    const dailyStats = await Sale.aggregate([
      { 
        $match: { 
          medicalStoreId, 
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: { $ne: 'VOID' } 
        } 
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalProfit: { $sum: "$netProfit" },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Monthly Stats (Optimized)
    const monthlyStats = await Sale.aggregate([
      { 
        $match: { 
          medicalStoreId, 
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $ne: 'VOID' } 
        } 
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalProfit: { $sum: "$netProfit" },
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. 30-Day Sales & Profit Trend (For Chart)
    const salesTrend = await Sale.aggregate([
      {
        $match: {
          medicalStoreId,
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'VOID' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$grandTotal" },
          profit: { $sum: "$netProfit" },
          bills: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Top 5 Profitable Medicines (Smart Analysis)
    // We join SaleItem with Medicine to get names
    const topMedicines = await SaleItem.aggregate([
      { $match: { medicalStoreId } },
      {
        $group: {
          _id: "$medicineId",
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
          totalProfit: { 
            $sum: { 
              $multiply: [
                "$quantity", 
                { $subtract: ["$sellingPrice", "$purchasePrice"] } 
              ] 
            } 
          }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "medicines",
          localField: "_id",
          foreignField: "_id",
          as: "medicine"
        }
      },
      { $unwind: "$medicine" },
      {
        $project: {
          name: "$medicine.name",
          dosage: "$medicine.dosage",
          totalQuantity: 1,
          totalRevenue: 1,
          totalProfit: 1
        }
      }
    ]);

    // 5. Alerts Summary (Actionable Intelligence)
    const alerts = await StockAlert.aggregate([
      { $match: { medicalStoreId, isResolved: false } },
      {
        $group: {
          _id: "$type", // LOW_STOCK, EXPIRY, etc.
          count: { $sum: 1 }
        }
      }
    ]);

    const lowStockCount = alerts.find(a => a._id === 'LOW_STOCK')?.count || 0;
    const expiryCount = alerts.find(a => a._id === 'EXPIRY')?.count || 0;

    // Get latest 5 alerts for display
    const latestAlerts = await StockAlert.find({
      medicalStoreId,
      isResolved: false,
    })
      .sort({ priority: -1, createdAt: -1 }) // CRITICAL first
      .limit(5);

    // 7. Recent Sales Activity
    const recentSales = await Sale.find({
      medicalStoreId,
      status: { $ne: 'VOID' } 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('customerId', 'name');

    // 6. Dead Stock Analysis (Items > 90 days old with no sales recently)
    // Simplified heuristic: Old batches with significant stock
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const deadStockCount = await MedicineBatch.countDocuments({
      medicalStoreId,
      createdAt: { $lt: ninetyDaysAgo },
      quantityRemaining: { $gt: 0 },
      // Ideally check lastSaleDate, but createdAt is a good proxy for "unsold" for now
    });

    // ----------------------------------------------------
    // DATA SANITIZATION FOR STAFF
    // ----------------------------------------------------
    if (req.user.role === 'STAFF') {
      return res.status(200).json({
        success: true,
        data: {
          daily: {
            sales: dailyStats[0]?.totalSales || 0,
            profit: 0, // HIDDEN
            bills: dailyStats[0]?.count || 0
          },
          // User: "What staff CANNOT see: Monthly / yearly analytics" -> Hiding monthly summary
          monthly: {
            sales: 0, 
            profit: 0,
            bills: 0
          },
          trends: [], // HIDDEN
          topMedicines: [], // HIDDEN (Usually profit driven)
          alerts: {
            lowStock: lowStockCount,
            expiry: expiryCount,
            total: lowStockCount + expiryCount,
            latest: latestAlerts // OK for staff (read-only)
          },
          recentActivity: recentSales.map(sale => {
            const s = sale.toObject();
            delete s.totalCost;
            delete s.grossProfit;
            delete s.netProfit;
            return s;
          }), // Filtered
          deadStockCount: 0 // HIDDEN
        },
      });
    }

    // ----------------------------------------------------
    // FULL DATA FOR OWNER
    // ----------------------------------------------------
    res.status(200).json({
      success: true,
      data: {
        daily: {
          sales: dailyStats[0]?.totalSales || 0,
          profit: dailyStats[0]?.totalProfit || 0,
          bills: dailyStats[0]?.count || 0
        },
        monthly: {
          sales: monthlyStats[0]?.totalSales || 0,
          profit: monthlyStats[0]?.totalProfit || 0,
          bills: monthlyStats[0]?.count || 0
        },
        trends: salesTrend, // Array of { _id: date, sales, profit }
        topMedicines,
        alerts: {
          lowStock: lowStockCount,
          expiry: expiryCount,
          total: lowStockCount + expiryCount,
          latest: latestAlerts
        },
        recentActivity: recentSales,
        deadStockCount
      },
    });

  } catch (error) {
    next(error);
  }
};

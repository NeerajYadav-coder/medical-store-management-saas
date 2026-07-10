import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Medicine from "../models/Medicine.js";
import MedicineBatch from "../models/MedicineBatch.js";
import StockAlert from "../models/StockAlert.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";

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
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Determine custom range limits if requested
    let useSlidingWindow = false;
    let startDateLimit;
    let daysLimit = 30;
    
    if (req.query.range) {
      useSlidingWindow = true;
      if (req.query.range === 'week' || req.query.range === '7d') daysLimit = 7;
      else if (req.query.range === 'month' || req.query.range === '30d') daysLimit = 30;
      else if (req.query.range === 'quarter' || req.query.range === '90d') daysLimit = 90;
      else if (req.query.range === 'year' || req.query.range === '365d') daysLimit = 365;
      
      startDateLimit = new Date();
      startDateLimit.setDate(startDateLimit.getDate() - daysLimit);
    }

    const statsStartDate = useSlidingWindow ? startDateLimit : startOfMonth;
    const statsEndDate = useSlidingWindow ? new Date() : endOfMonth;

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
          createdAt: { $gte: statsStartDate, $lte: statsEndDate },
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

    // 3. Sales & Profit Trend (For Chart)
    const trendStartDate = useSlidingWindow ? startDateLimit : ninetyDaysAgo;
    let dateFormat = "%Y-%m-%d";
    if (req.query.range === 'year') {
      dateFormat = "%Y-%m";
    }

    const salesTrend = await Sale.aggregate([
      {
        $match: {
          medicalStoreId,
          createdAt: { $gte: trendStartDate },
          status: { $ne: 'VOID' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          sales: { $sum: "$grandTotal" },
          profit: { $sum: "$netProfit" },
          bills: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Top 5 Profitable Medicines (Smart Analysis)
    // Instead of aggregating millions of SaleItems (which is O(N) and includes voided sales bugs),
    // we use the pre-calculated atomic aggregate stats on the Medicine collection directly.
    const topMeds = await Medicine.find({ 
      medicalStoreId,
      totalProfit: { $gt: 0 }
    })
    .sort({ totalProfit: -1 })
    .limit(5);

    const topMedicines = topMeds.map(m => ({
      name: m.name,
      dosage: m.dosage,
      totalQuantity: m.totalUnitsSold,
      totalRevenue: m.totalRevenue,
      totalProfit: m.totalProfit
    }));

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

    
    const deadStockCount = await MedicineBatch.countDocuments({
      medicalStoreId,
      createdAt: { $lt: ninetyDaysAgo },
      quantityRemaining: { $gt: 0 },
      // Ideally check lastSaleDate, but createdAt is a good proxy for "unsold" for now
    });

    // 8. Pending purchases
    const pendingPurchases = await Purchase.countDocuments({
      medicalStoreId,
      paymentStatus: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      status: { $ne: 'CANCELLED' }
    });

    // 9. Active staff members
    const activeStaff = await User.countDocuments({
      medicalStoreId,
      role: 'STAFF',
      isActive: true
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
          deadStockCount: 0, // HIDDEN
          pendingPurchases,
          activeStaff
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
        deadStockCount,
        pendingPurchases,
        activeStaff
      },
    });

  } catch (error) {
    next(error);
  }
};

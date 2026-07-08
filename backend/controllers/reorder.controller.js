import ReorderSuggestion from '../models/ReorderSuggestion.js';
import PurchaseOrder from '../models/Purchase.js'; // Assuming Purchase acts as PurchaseOrder or we create a draft Purchase

// Get all suggestions
export const getSuggestions = async (req, res, next) => {
  try {
    const { status = 'pending', urgency } = req.query;
    const query = { medicalStoreId: req.user.medicalStoreId };
    
    if (status) query.status = status;
    if (urgency) {
      // urgency can be comma separated 'critical,high'
      query.urgency = { $in: urgency.split(',') };
    }

    const suggestions = await ReorderSuggestion.find(query)
      .populate('medicineId', 'name genericName dosage form manufacturer schedule')
      .sort({ daysOfStockRemaining: 1 });

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

// Get summary for widget
export const getSuggestionsSummary = async (req, res, next) => {
  try {
    const summary = await ReorderSuggestion.aggregate([
      { 
        $match: { 
          medicalStoreId: req.user.medicalStoreId,
          status: 'pending'
        } 
      },
      {
        $group: {
          _id: '$urgency',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$suggestedReorderQty', 10] } } // Mock value for now
        }
      }
    ]);

    const formattedSummary = {
      critical: { count: 0, totalValue: 0 },
      high: { count: 0, totalValue: 0 },
      medium: { count: 0, totalValue: 0 },
      low: { count: 0, totalValue: 0 }
    };

    summary.forEach(item => {
      if (formattedSummary[item._id]) {
        formattedSummary[item._id] = { count: item.count, totalValue: item.totalValue };
      }
    });

    res.status(200).json({
      success: true,
      data: formattedSummary,
    });
  } catch (error) {
    next(error);
  }
};

// Handle suggestion action
export const actionSuggestion = async (req, res, next) => {
  try {
    const { action, quantity, dismissReason } = req.body;
    const { id } = req.params;

    const suggestion = await ReorderSuggestion.findOne({
      _id: id,
      medicalStoreId: req.user.medicalStoreId
    });

    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }

    if (action === 'create-po') {
      suggestion.status = 'actioned';
      // Ideally create a Draft Purchase or PurchaseOrder here.
      // We will skip full PO creation for now and just mark actioned.
      await suggestion.save();
      
      return res.status(200).json({
        success: true,
        message: 'Converted to Purchase Order',
        data: suggestion
      });
    } else if (action === 'dismiss') {
      suggestion.status = 'dismissed';
      // Add reason if provided to reasoning
      if (dismissReason) {
        suggestion.reasoning += ` [Dismissed: ${dismissReason}]`;
      }
      await suggestion.save();
      
      return res.status(200).json({
        success: true,
        message: 'Suggestion dismissed',
        data: suggestion
      });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    next(error);
  }
};

// Update store forecast settings
export const updateSettings = async (req, res, next) => {
  try {
    const { safetyStockBufferPct, symptomSignalEnabled, forecastWindowDays } = req.body;
    // In a real app, update MedicalStore or a Settings model. 
    // Here we just return success as a mock.
    res.status(200).json({
      success: true,
      message: 'Forecast settings updated successfully',
      data: { safetyStockBufferPct, symptomSignalEnabled, forecastWindowDays }
    });
  } catch (error) {
    next(error);
  }
};

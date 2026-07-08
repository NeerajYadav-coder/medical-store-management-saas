/**
 * services/forecastEngine.js
 * 
 * Standalone service module for demand forecasting.
 */

export function forecastDemand(salesHistory, options = {}) {
  const { windowDays = 14, seasonalityEnabled = false, symptomSignalMultiplier = 1 } = options;
  
  if (!salesHistory || salesHistory.length === 0) {
    return {
      avgDailyDemand: 0,
      predictedDemand: 0,
      confidence: 'low',
      trend: 0,
    };
  }

  // Filter out stockout days
  const validHistory = salesHistory.filter(day => !day.wasStockedOut);
  
  // Sort ascending by date
  validHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalDays = validHistory.length;
  let confidence = 'low';

  // 3.4 Confidence scoring
  if (totalDays >= 60) {
    confidence = 'high';
  } else if (totalDays >= 28) {
    confidence = 'medium';
  }

  if (totalDays === 0) {
    return {
      avgDailyDemand: 0,
      predictedDemand: 0,
      confidence: 'low',
      trend: 0,
    };
  }

  // 3.1 Baseline: weighted moving average
  // Exponential weighting, half-life ~10 days
  const k = 0.0693; // ln(0.5) / -10
  
  let weightedSum = 0;
  let weightSum = 0;
  
  const latestDate = new Date(validHistory[validHistory.length - 1].date);

  validHistory.forEach(day => {
    const dayDate = new Date(day.date);
    const diffTime = Math.abs(latestDate - dayDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Use the last 28 days of non-stockout sales days.
    if (diffDays <= 28) {
      const weight = Math.exp(-k * diffDays);
      weightedSum += day.unitsSold * weight;
      weightSum += weight;
    }
  });

  let avgDailyDemand = 0;
  if (weightSum > 0) {
    avgDailyDemand = weightedSum / weightSum;
  }

  // 3.2 Seasonality adjustment
  const seasonalMultiplier = (seasonalityEnabled && options.seasonalMultiplier) ? options.seasonalMultiplier : 1;
  
  if (seasonalityEnabled && !options.seasonalMultiplier && totalDays < 365) {
     confidence = 'low'; // Low confidence if missing history for seasonality
  }

  avgDailyDemand = avgDailyDemand * seasonalMultiplier;
  
  // 3.3 Symptom-trend signal
  avgDailyDemand = avgDailyDemand * symptomSignalMultiplier;

  const predictedDemand = avgDailyDemand * windowDays;

  // Calculate simple trend for explainability (compare last 14 days vs prior 14 days)
  let recentSum = 0, recentCount = 0;
  let olderSum = 0, olderCount = 0;
  validHistory.forEach(day => {
    const diffDays = Math.ceil(Math.abs(latestDate - new Date(day.date)) / (1000 * 60 * 60 * 24));
    if (diffDays <= 14) {
      recentSum += day.unitsSold;
      recentCount++;
    } else if (diffDays > 14 && diffDays <= 28) {
      olderSum += day.unitsSold;
      olderCount++;
    }
  });

  const recentAvg = recentCount > 0 ? recentSum / recentCount : 0;
  const olderAvg = olderCount > 0 ? olderSum / olderCount : 0;
  
  let trend = 0;
  if (olderAvg > 0) {
    trend = ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  return {
    avgDailyDemand,
    predictedDemand,
    confidence,
    trend,
  };
}

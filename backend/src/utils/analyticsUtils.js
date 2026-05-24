/**
 * Analytics Utilities
 * Helper functions for report calculations and data formatting
 */

/**
 * Calculate percentage change between two values
 */
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Calculate percentage of a value
 */
const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format duration in days to human readable format
 */
const formatDuration = (days) => {
  if (days < 1) return '< 1 day';
  if (days === 1) return '1 day';
  if (days < 7) return `${Math.round(days)} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
};

/**
 * Calculate average from array of numbers
 */
const calculateAverage = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return Math.round((sum / numbers.length) * 100) / 100;
};

/**
 * Format metric object for display
 */
const formatMetric = (label, value, unit = '', comparison = null) => {
  const formatted = {
    label,
    value,
    unit,
  };

  if (comparison !== null) {
    formatted.change = calculatePercentageChange(value, comparison);
    formatted.trend = comparison > value ? 'down' : comparison < value ? 'up' : 'stable';
  }

  return formatted;
};

/**
 * Group array by a key function
 */
const groupBy = (array, keyFunction) => {
  return array.reduce((grouped, item) => {
    const key = keyFunction(item);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
    return grouped;
  }, {});
};

/**
 * Sort array by multiple fields
 */
const sortByMultiple = (array, ...sortFunctions) => {
  return [...array].sort((a, b) => {
    for (const func of sortFunctions) {
      const comparison = func(a, b);
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
};

/**
 * Extract top N items from array
 */
const getTopN = (array, n, sortKey = null) => {
  if (sortKey) {
    return array.sort((a, b) => b[sortKey] - a[sortKey]).slice(0, n);
  }
  return array.slice(0, n);
};

/**
 * Calculate distribution percentages
 */
const calculateDistribution = (items) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return items;

  return items.map((item) => ({
    ...item,
    percentage: Math.round((item.count / total) * 100),
  }));
};

/**
 * Format date range string
 */
const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return 'All time';
  if (!startDate) return `Until ${new Date(endDate).toDateString()}`;
  if (!endDate) return `From ${new Date(startDate).toDateString()}`;
  return `${new Date(startDate).toDateString()} - ${new Date(endDate).toDateString()}`;
};

/**
 * Generate summary statistics
 */
const generateSummaryStats = (data) => {
  if (!data || data.length === 0) {
    return {
      count: 0,
      sum: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }

  const numbers = data.filter((n) => typeof n === 'number');
  if (numbers.length === 0) {
    return {
      count: data.length,
      sum: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }

  const sum = numbers.reduce((acc, n) => acc + n, 0);
  const sorted = [...numbers].sort((a, b) => a - b);

  return {
    count: numbers.length,
    sum: Math.round(sum * 100) / 100,
    average: Math.round((sum / numbers.length) * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: numbers.length % 2 === 0
      ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
      : sorted[Math.floor(numbers.length / 2)],
  };
};

/**
 * Aggregate time series data
 */
const aggregateTimeSeries = (data, intervalKey) => {
  return data.reduce((agg, item) => {
    const interval = item[intervalKey];
    if (!agg[interval]) {
      agg[interval] = { interval, count: 0, sum: 0 };
    }
    agg[interval].count += 1;
    if (item.value) {
      agg[interval].sum += item.value;
    }
    return agg;
  }, {});
};

/**
 * Calculate trend direction
 */
const calculateTrend = (currentValue, previousValue) => {
  if (currentValue === previousValue) return 'stable';
  return currentValue > previousValue ? 'up' : 'down';
};

/**
 * Format large numbers with suffix
 */
const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

/**
 * Create comparison between two periods
 */
const createPeriodComparison = (currentData, previousData, metricKey) => {
  const current = currentData[metricKey] || 0;
  const previous = previousData[metricKey] || 0;
  const change = current - previous;
  const percentChange = previous > 0 ? Math.round((change / previous) * 100) : 0;

  return {
    current,
    previous,
    change,
    percentChange,
    trend: calculateTrend(current, previous),
  };
};

/**
 * Flatten nested aggregation results
 */
const flattenAggregationResults = (results) => {
  return results.map((item) => {
    const flattened = {};

    Object.entries(item).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        flattened[key] = value[0];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          flattened[`${key}_${nestedKey}`] = nestedValue;
        });
      } else {
        flattened[key] = value;
      }
    });

    return flattened;
  });
};

/**
 * Safe access to nested object properties
 */
const safeGet = (obj, path, defaultValue = null) => {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }

  return result;
};

module.exports = {
  calculatePercentageChange,
  calculatePercentage,
  formatDuration,
  calculateAverage,
  formatMetric,
  groupBy,
  sortByMultiple,
  getTopN,
  calculateDistribution,
  formatDateRange,
  generateSummaryStats,
  aggregateTimeSeries,
  calculateTrend,
  formatNumber,
  createPeriodComparison,
  flattenAggregationResults,
  safeGet,
};

/**
 * utils/exportCSV.js
 * 
 * Reusable utility to export arrays of objects to CSV files directly in the browser.
 * Handles nested fields, commas, double-quotes, dates, and currency formatting.
 */

/**
 * Escapes a cell value to ensure valid CSV format
 */
const escapeCSVCell = (val) => {
  if (val === null || val === undefined) return '';
  
  let str = String(val);
  
  // Clean up whitespace / newlines
  str = str.replace(/\r?\n|\r/g, ' ');
  
  // If the cell contains quotes, commas, or semicolons, wrap it in double quotes
  // and escape existing double quotes by doubling them
  if (str.includes('"') || str.includes(',') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

/**
 * Exports data to a CSV file and triggers a browser download
 * 
 * @param {Array<Object>} data - The data rows to export
 * @param {Array<Object>} columns - List of column definitions: { key: 'nested.key', label: 'Header Name', format: (val) => ... }
 * @param {string} filename - The default name of the downloaded file
 */
export const exportToCSV = (data, columns, filename = 'export.csv') => {
  if (!data || !data.length) {
    throw new Error('No data available to export');
  }

  // 1. Create headers row
  const headers = columns.map(col => escapeCSVCell(col.label)).join(',');

  // 2. Map data rows
  const rows = data.map(item => {
    return columns.map(col => {
      // Resolve nested keys (e.g. 'userId.name')
      let value = item;
      const keys = col.key.split('.');
      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = value[key];
        } else {
          value = undefined;
          break;
        }
      }

      // Apply custom formatter if provided
      if (col.format) {
        value = col.format(value, item);
      }

      return escapeCSVCell(value);
    }).join(',');
  });

  // 3. Assemble CSV content
  const csvContent = [headers, ...rows].join('\n');

  // 4. Create blob and download link
  // Use UTF-8 BOM to ensure proper Excel decoding of special characters (like ₹ symbol)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up URL object
  URL.revokeObjectURL(url);
};

export default exportToCSV;

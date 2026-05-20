/**
 * utils/exportPDF.js
 * 
 * Reusable utility to generate and download beautifully styled, high-fidelity PDF reports
 * directly from the browser using a temporary, print-optimized window.
 */

/**
 * Formats a value for displaying in the PDF cell
 */
const formatCell = (val, col, item) => {
  if (val === null || val === undefined) return '—';
  if (col.format) return col.format(val, item);
  return String(val);
};

/**
 * Generates and triggers a high-fidelity PDF print of a dataset
 * 
 * @param {Array<Object>} data - The dataset to report on
 * @param {Array<Object>} columns - Columns config: { key: 'nested.key', label: 'Header', align: 'left'|'center'|'right', format: (val, row) => ... }
 * @param {Object} options - Configuration options
 * @param {string} options.title - Document Title
 * @param {string} options.subtitle - Document Subtitle / Filter state
 * @param {Array<Object>} options.summaryCards - Optional KPI cards to display at the top: { label: '...', value: '...' }
 */
export const exportToPDF = (data, columns, options = {}) => {
  const {
    title = 'Data Report',
    subtitle = 'Active Records',
    summaryCards = []
  } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  // Generate table headers
  const headersHtml = columns.map(col => `
    <th class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}">
      ${col.label}
    </th>
  `).join('');

  // Generate table rows
  const rowsHtml = data.map((item, idx) => {
    const cellsHtml = columns.map(col => {
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

      const formattedVal = formatCell(value, col, item);
      const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
      return `<td class="${alignClass}">${formattedVal}</td>`;
    }).join('');

    return `<tr>${cellsHtml}</tr>`;
  }).join('');

  // Generate KPI cards HTML
  const kpisHtml = summaryCards.length > 0 ? `
    <div class="kpi-grid">
      ${summaryCards.map(card => `
        <div class="kpi-card">
          <p class="kpi-label">${card.label}</p>
          <p class="kpi-value">${card.value}</p>
        </div>
      `).join('')}
    </div>
  ` : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #1f2937;
            padding: 40px;
            margin: 0;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }

          .logo-area {
            text-align: left;
          }

          .store-name {
            font-size: 20px;
            font-weight: 800;
            margin: 0;
            color: #4f46e5;
            letter-spacing: -0.5px;
          }

          .doc-title {
            font-size: 26px;
            font-weight: 800;
            margin: 5px 0 0 0;
            color: #111827;
            letter-spacing: -0.5px;
          }

          .doc-subtitle {
            font-size: 14px;
            font-weight: 500;
            margin: 4px 0 0 0;
            color: #4b5563;
          }

          .meta-area {
            text-align: right;
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(${Math.min(summaryCards.length, 4)}, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }

          .kpi-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px 15px;
          }

          .kpi-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6b7280;
            margin: 0;
            letter-spacing: 0.5px;
          }

          .kpi-value {
            font-size: 18px;
            font-weight: 800;
            color: #111827;
            margin: 5px 0 0 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          th {
            background-color: #f3f4f6;
            color: #374151;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border-bottom: 2px solid #e5e7eb;
          }

          td {
            font-size: 12px;
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
            color: #4b5563;
            font-weight: 500;
          }

          tr:nth-child(even) td {
            background-color: #fafafa;
          }

          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }

          .footer {
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            font-weight: 500;
          }

          @media print {
            body {
              padding: 20px;
            }
            .kpi-card {
              background-color: #f9fafb !important;
            }
            th {
              background-color: #f3f4f6 !important;
            }
            tr:nth-child(even) td {
              background-color: #fafafa !important;
            }
            @page {
              margin: 1.2cm;
              size: A4 portrait;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-area">
            <h1 class="store-name">MEDICAL PHARMACY SYSTEM</h1>
            <h2 class="doc-title">${title}</h2>
            <p class="doc-subtitle">${subtitle}</p>
          </div>
          <div class="meta-area">
            <p style="margin: 0;">Date: ${new Date().toLocaleDateString('en-IN')}</p>
            <p style="margin: 4px 0 0 0;">Time: ${new Date().toLocaleTimeString('en-IN')}</p>
            <p style="margin: 4px 0 0 0;">Records: ${data.length}</p>
          </div>
        </div>

        ${kpisHtml}

        <table>
          <thead>
            <tr>
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          This report is programmatically generated and authenticated by the system. Page 1 of 1
        </div>

        <script>
          // Run print once font resources are loaded
          window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          });
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export default exportToPDF;

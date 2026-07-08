import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Generate a clean, modern PDF invoice for a sale.
 * @param {object} sale - The sale document
 * @param {object} store - The medical store document
 * @param {Array} items - The items in the sale
 * @param {string} outputPath - The path to save the generated PDF
 * @returns {Promise<void>}
 */
export const generateInvoicePDF = (sale, store, items, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A5', margin: 30 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // --- Header Branding ---
      doc.fillColor('#065f46')
         .rect(0, 0, doc.page.width, 60)
         .fill();

      doc.fillColor('#ffffff')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(store.name, 30, 20);

      // Store Details (on right side of header)
      doc.fontSize(8)
         .font('Helvetica')
         .text(store.address || '', doc.page.width - 230, 15, { width: 200, align: 'right' });
      doc.text(`Phone: ${store.phone || ''}`, doc.page.width - 230, 27, { width: 200, align: 'right' });
      
      let dlGstText = '';
      if (store.drugLicenseNumber) dlGstText += `DL: ${store.drugLicenseNumber}`;
      if (store.gstNumber) dlGstText += (dlGstText ? ' | ' : '') + `GSTIN: ${store.gstNumber}`;
      if (dlGstText) {
        doc.text(dlGstText, doc.page.width - 230, 39, { width: 200, align: 'right' });
      }

      // --- Invoice Meta Information ---
      doc.fillColor('#000000').moveDown(4);
      const startY = doc.y;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text('INVOICE', 30, startY);
      doc.fontSize(8).font('Helvetica').fillColor('#4b5563');
      doc.text(`Bill No: #${sale.billNumber}`, 30, startY + 18);
      doc.text(`Date: ${new Date(sale.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 30, startY + 30);

      // Customer Info (aligned right)
      doc.font('Helvetica-Bold').fillColor('#111827').text('Billed To:', doc.page.width - 180, startY, { width: 150, align: 'right' });
      doc.fontSize(8).font('Helvetica').fillColor('#4b5563');
      doc.text(sale.customerName || 'Walk-in Customer', doc.page.width - 180, startY + 14, { width: 150, align: 'right' });
      if (sale.customerPhone) {
        doc.text(`Phone: ${sale.customerPhone}`, doc.page.width - 180, startY + 26, { width: 150, align: 'right' });
      }

      doc.moveDown(2);

      // --- Items Table ---
      const tableTop = doc.y + 10;
      doc.strokeColor('#e5e7eb').lineWidth(1);
      doc.moveTo(30, tableTop).lineTo(doc.page.width - 30, tableTop).stroke();

      // Table Headers
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
      doc.text('Item Description', 35, tableTop + 6);
      doc.text('Qty', doc.page.width - 160, tableTop + 6, { width: 30, align: 'right' });
      doc.text('Price', doc.page.width - 110, tableTop + 6, { width: 35, align: 'right' });
      doc.text('Total', doc.page.width - 65, tableTop + 6, { width: 35, align: 'right' });

      doc.moveTo(30, tableTop + 20).lineTo(doc.page.width - 30, tableTop + 20).stroke();

      // Table Rows
      let currentY = tableTop + 25;
      doc.fontSize(8).font('Helvetica').fillColor('#4b5563');

      items.forEach(item => {
        doc.text(item.medicineName, 35, currentY, { width: doc.page.width - 210 });
        doc.text(item.quantity.toString(), doc.page.width - 160, currentY, { width: 30, align: 'right' });
        doc.text(`₹${item.sellingPrice.toFixed(2)}`, doc.page.width - 110, currentY, { width: 35, align: 'right' });
        doc.text(`₹${item.totalAmount.toFixed(2)}`, doc.page.width - 65, currentY, { width: 35, align: 'right' });
        
        currentY += 16;
        
        // Draw thin row separator
        doc.strokeColor('#f3f4f6').moveTo(30, currentY - 2).lineTo(doc.page.width - 30, currentY - 2).stroke();
      });

      currentY += 5;
      doc.strokeColor('#d1d5db').moveTo(30, currentY).lineTo(doc.page.width - 30, currentY).stroke();

      // --- Financial Totals ---
      currentY += 10;
      doc.fontSize(8).font('Helvetica').fillColor('#374151');
      
      doc.text('Subtotal:', doc.page.width - 150, currentY, { width: 70, align: 'right' });
      doc.text(`₹${sale.subtotal.toFixed(2)}`, doc.page.width - 75, currentY, { width: 45, align: 'right' });

      if (sale.discountAmount > 0) {
        currentY += 12;
        doc.fillColor('#059669').text('Discount:', doc.page.width - 150, currentY, { width: 70, align: 'right' });
        doc.text(`-₹${sale.discountAmount.toFixed(2)}`, doc.page.width - 75, currentY, { width: 45, align: 'right' });
      }

      if (sale.totalGst > 0) {
        currentY += 12;
        doc.fillColor('#374151').text('GST Tax:', doc.page.width - 150, currentY, { width: 70, align: 'right' });
        doc.text(`₹${sale.totalGst.toFixed(2)}`, doc.page.width - 75, currentY, { width: 45, align: 'right' });
      }

      currentY += 14;
      doc.strokeColor('#9ca3af').moveTo(doc.page.width - 150, currentY - 2).lineTo(doc.page.width - 30, currentY - 2).stroke();
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827');
      doc.text('Grand Total:', doc.page.width - 150, currentY, { width: 70, align: 'right' });
      doc.text(`₹${sale.grandTotal.toFixed(2)}`, doc.page.width - 75, currentY, { width: 45, align: 'right' });

      currentY += 12;
      doc.fontSize(7).font('Helvetica').fillColor('#6b7280');
      doc.text(`Paid via: ${sale.paymentMode || 'CASH'}`, doc.page.width - 150, currentY, { width: 115, align: 'right' });

      // --- Footer ---
      doc.moveDown(4);
      doc.strokeColor('#e5e7eb').moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
      doc.moveDown(1);
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#065f46').text('Wish you a speedy recovery! (Get Well Soon ❤️)', { align: 'center' });
      doc.fontSize(7).font('Helvetica').fillColor('#6b7280').text('Thank you for trusting us with your health care needs.', { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

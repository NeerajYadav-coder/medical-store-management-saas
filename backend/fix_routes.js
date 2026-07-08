const fs = require('fs');
const filePath = '/home/neeraj/Documents/Ar_026/neeraj/MedicalSaas/backend/routes/purchase.routes.js';
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /\/\/ Parse supplier invoice image using AI OCR[\s\S]*?module\.exports = router;|export default router;/g;

const newRoute = `// Parse supplier invoice image using AI OCR
router.post('/parse-invoice', async (req, res, next) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    const base64Data = image.replace(/^data:image\\/\\w+;base64,/, '');
    
    // We will use Groq API with the 3 fallback keys
    const GROQ_API_KEYS = [
      'YOUR_GROQ_API_KEY_1',
      'YOUR_GROQ_API_KEY_2',
      'YOUR_GROQ_API_KEY_3'
    ];

    // Qwen is superior for complex dense tables and multi-lingual OCR
    // Llama is good for general tasks. We will try Qwen first, then Llama.
    const VISION_MODELS = [
      'qwen/qwen3.6-27b',
      'meta-llama/llama-4-scout-17b-16e-instruct'
    ];

    const promptText = \`You are an elite AI system with over 10 years of domain expertise in Indian Pharmacy operations and Medical Billing.
Your specific job is to perform high-precision Optical Character Recognition (OCR) and structured data extraction from the provided supplier purchase invoice image. 
Medical invoices in India are extremely dense, noisy, and contain complex table grids. 
Examples of columns you will see: HSN, MFG, BATCH, EXP, QTY, FREE, RATE, N.RATE, S.RATE, MRP, DISC, CGST, SGST.

EXTRACT THE FOLLOWING INVOICE METADATA:
1. "supplierName": The name of the medical agency/distributor/supplier (e.g., "MAHAVEER MEDICAL AGENCY", "BANSAL DISTRIBUTERS", "SONALI MEDICAL STORE").
2. "supplierPhone": Their contact number.
3. "supplierEmail": Their email.
4. "supplierGstNumber": The 15-character GSTIN of the supplier (e.g., 09AANPG9333R1ZT).
5. "supplierDrugLicenseNumber": The DL (Drug License) number(s) (e.g., UP8020B001216).
6. "supplierBillNumber": The unique Invoice/Bill/Memo Number (e.g., "MMG002367", "GST003495").
7. "supplierBillDate": The date of the invoice strictly in YYYY-MM-DD format (convert 09-12-25 to 2025-12-09).

EXTRACT THE FOLLOWING LINE ITEMS (Array of Objects):
8. "items": An Array of Objects. For each medicine/product row in the invoice table, meticulously extract and map values from left to right into this array. Each object must contain exactly:
- "medicineName": The exact raw product name printed (e.g., "ASTHAKIND-DX-SYP 100ML", "CALCIGARD 10 CAP").
- "cleanName": The core brand name without dosage form, strength, or volume (e.g., "ASTHAKIND-DX", "CALCIGARD"). Aggressively strip terms like TAB, CAP, SYP, INJ, DROP, ML, MG, GM, BOLUS.
- "dosage": The strength or volume (e.g., "625MG", "250MG", "60ML", "10 CAP"). Extract this from the product name or packing.
- "form": Must be exactly one of: ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'POWDER', 'GEL', 'SPRAY', 'INHALER', 'SUSPENSION', 'LOTION', 'OTHER']. Infer this from terms like TAB, CAP, SYP, INJ, DROP.
- "unitType": Packaging type. Must be exactly one of: ['STRIP', 'BOTTLE', 'VIAL', 'TUBE', 'BOX', 'PIECE', 'SACHET', 'AMPOULE']. (E.g., Tablets are usually STRIP, Syrups/Drops are BOTTLE, Injections are VIAL/AMPOULE).
- "unitsPerPack": Integer. Number of individual units in one pack. VERY IMPORTANT: Read the 'Packing' or 'Unit' column. "1*10" or "1x10" means 10. "1*15" means 15. "20X1X10 TA" means 10. "100ML" or "15ML" or "1" means 1. "10GM" means 1.
- "manufacturer": The manufacturing company, if present. Look for a separate 'MFG' column or abbreviations.
- "quantity": Integer. The billed quantity. Look closely for 'Qty.' or 'QTY' column. DO NOT confuse with HSN (e.g., 9018, 3004 are HSN codes, not quantity).
- "freeQuantity": Integer. The free quantity given. Look for 'Free' or 'SCH.' column. Default 0.
- "purchasePrice": Number. The primary billing rate or Price to Retailer (PTR). Look for 'Rate', 'N.Rate' (Net Rate), or 'PTR' column. DO NOT confuse with 'S.Rate' (Secondary Rate) or 'Amount'.
- "mrp": Number. The Maximum Retail Price per pack. Look for 'MRP' or 'Mrp.' column.
- "discountPercent": Number. The discount percentage applied. Look for 'Dis%', 'DISC.', or 'Disc' column (e.g., 29.52). Default 0.
- "gstRate": Number. The GST percentage (e.g., 5, 12, 18). Look for 'GST%' column. If split into CGST and SGST, sum them (e.g., CGST 2.5% + SGST 2.5% = 5).
- "batchNumber": String. The batch number. Look for 'Batch' or 'B.NO'.
- "expiryDate": String. The expiry date in YYYY-MM-DD format. Look for 'Exp.' column. Convert MM/YY to the LAST day of that month (e.g., "11/25" -> "2025-11-30", "Jul-27" -> "2027-07-31").

CRITICAL INSTRUCTIONS:
- You must deeply analyze the column headers and align the numbers perfectly. It is very easy to shift numbers (e.g. putting GST% in Discount, or HSN in Quantity). Read Left-to-Right carefully.
- If a field is missing, return an empty string or 0 as appropriate.
- Ensure the output is a PERFECT, strict JSON object containing the 7 metadata keys and the 1 "items" array key.
- No markdown wrappers, no introductory text, just the raw JSON object.
\`;

    let parsedData = null;
    let lastError = null;

    // Iterate models first, then API keys
    for (const model of VISION_MODELS) {
      if (parsedData) break;
      
      for (let i = 0; i < GROQ_API_KEYS.length; i++) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${GROQ_API_KEYS[i]}\`
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: promptText },
                    { type: 'image_url', image_url: { url: \`data:image/jpeg;base64,\${base64Data}\` } }
                  ]
                }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.1
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(\`Groq API error (\${response.status}): \${errText}\`);
          }

          const data = await response.json();
          let candidateText = data.choices?.[0]?.message?.content;
          
          if (!candidateText) {
            throw new Error('Empty response from Groq API');
          }

          const cleanJsonStr = candidateText.trim().replace(/^\\s*\`\`\`json\\s*/i, '').replace(/\\s*\`\`\`\\s*$/, '');
          parsedData = JSON.parse(cleanJsonStr);
          
          // Break out of the API key loop since we succeeded!
          console.log(\`Successfully parsed invoice using model \${model} with Groq API key \${i + 1}\`);
          break;
        } catch (err) {
          console.error(\`OCR attempt failed with model \${model}, key \${i + 1}:\`, err.message);
          lastError = err;
          // Proceed to the next fallback API key
        }
      }
    }

    if (!parsedData) {
      throw lastError || new Error('All Groq API fallback models and keys failed to parse the invoice');
    }

    res.status(200).json({
      success: true,
      isMock: false,
      data: parsedData,
    });

  } catch (error) {
    console.error('Invoice parse error:', error);
    next(error);
  }
});

export default router;
`;

if (content.match(regex)) {
  content = content.replace(regex, newRoute);
  fs.writeFileSync(filePath, content);
  console.log('Successfully updated purchase.routes.js');
} else {
  console.log('Regex did not match!');
}

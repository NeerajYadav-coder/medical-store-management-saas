# MedicalStore SaaS - Implementation Plan

## 🎯 Vision
Build a multi-tenant Medical Store SaaS that captures **intelligence from day one** for future own-label manufacturing.

---

## 📊 Core Entities & Smart Fields

### 1. User ✅ (Already Built)
- Authentication, Roles (OWNER/STAFF)
- Multi-store isolation via `medicalStoreId`

### 2. MedicalStore ✅ (Already Built)
- SaaS tenant isolation
- Store branding, GST, Drug License

### 3. Medicine (Master Catalog)
```
- name, genericName (salt)
- category (tablet, syrup, injection, etc.)
- manufacturer, brand
- hsnCode, gstRate
- schedule (H, H1, X, OTC)
- defaultMRP, defaultPurchasePrice
- isActive
- tags[] (for search)
- SMART FIELDS:
  - symptomCategories[] (cold, fever, pain, cough, etc.)
  - therapeuticClass (analgesic, antibiotic, etc.)
  - substituteFor[] (reference to similar medicines)
```

### 4. MedicineBatch (Physical Stock)
```
- medicineId (reference)
- medicalStoreId (tenant isolation)
- batchNumber
- SMART FIELDS:
  - manufacturingDate     ← Ready for own-label
  - expiryDate
- purchasePrice, sellingPrice, mrp
- quantity (current stock)
- reorderLevel
- supplierId (who supplied)
- purchaseItemId (which invoice)
- isActive
```

### 5. Supplier
```
- name, contactPerson
- phone, email, address
- gstNumber, drugLicenseNumber
- SMART FIELDS:
  - vendorCode            ← Unique code for quick identification
  - marginCategory (high/medium/low)
  - avgMarginPercentage
  - paymentTerms (days)
  - rating (1-5)
- creditLimit, currentCredit
- isActive
- notes
```

### 6. Customer
```
- name, phone, emailU
- address
- SMART FIELDS:
  - isRepeatBuyer         ← Auto-calculated after 2nd purchase
  - totalPurchases
  - totalSpent
  - lastVisitDate
  - loyaltyCategory (REGULAR, VIP, BULK)
  - preferredDoctor       ← Doctor they usually come from
- creditLimit, currentCredit
- notes
```

### 7. Doctor (New - for prescription tracking)
```
- name, phone
- clinic, address
- specialization
- SMART FIELDS:
  - totalPrescriptions    ← Count of referred customers
  - avgPrescriptionValue
  - topMedicines[]        ← What they prescribe most
- isActive
- notes
```

### 8. Purchase (Invoice)
```
- purchaseNumber (auto-generated)
- supplierId
- invoiceNumber (supplier's invoice)
- invoiceDate, dueDate
- subtotal, discount, gst, total
- paymentStatus (PENDING, PARTIAL, PAID)
- paidAmount, balanceAmount
- notes
```

### 9. PurchaseItem
```
- purchaseId
- medicineId
- batchNumber
- SMART FIELDS:
  - manufacturingDate     ← Capture even for third-party
  - expiryDate
- quantity, freeQuantity
- purchasePrice, mrp
- gstRate, gstAmount
- totalAmount
```

### 10. Sale (Bill)
```
- billNumber (auto-generated)
- customerId (optional)
- SMART FIELDS:
  - doctorId              ← Who prescribed
  - isPrescribed          ← true if doctor-suggested
  - symptoms[]            ← Why buying (cold, fever, pain)
- subtotal, discount, gst, total
- discountType (MANUAL, AUTO, RULE)
- discountRuleId (if auto)
- paymentMode (CASH, UPI, CARD, CREDIT)
- paymentStatus
- billedBy (userId - staff who billed)
- notes
```

### 11. SaleItem
```
- saleId
- medicineId
- batchId (specific batch used - FIFO)
- quantity
- mrp, sellingPrice
- discount
- gstRate, gstAmount
- totalAmount
- SMART FIELDS:
  - profitAmount          ← Calculated: selling - purchase
  - profitPercentage
```

### 12. SymptomCategory (Master)
```
- name (Cold, Fever, Body Ache, Headache, Cough, etc.)
- icon
- commonMedicines[]       ← Quick suggestions
- isActive
```

### 13. DiscountRule
```
- name
- type (CUSTOMER_LOYALTY, MEDICINE_CATEGORY, BULK, FESTIVE)
- conditions (JSON)
- discountType (PERCENTAGE, FLAT)
- discountValue
- priority
- isActive
- validFrom, validTo
```

### 14. AuditLog
```
- action (CREATE, UPDATE, DELETE, VOID, LOGIN, etc.)
- entityType (Sale, Purchase, Medicine, etc.)
- entityId
- userId (who did it)
- oldValue (JSON)
- newValue (JSON)
- ipAddress
- timestamp
- reason (for voids/cancellations)
```

### 15. StockAlert
```
- type (LOW_STOCK, EXPIRING, EXPIRED, REORDER)
- medicineId, batchId
- message
- severity (LOW, MEDIUM, HIGH, CRITICAL)
- isRead, isResolved
- resolvedBy, resolvedAt
```

### 16. CashDrawer (For fraud prevention)
```
- date, shift
- userId (who opened)
- openingBalance
- closingBalance
- expectedBalance (calculated from sales)
- discrepancy
- notes
- status (OPEN, CLOSED)
```

---

## 🔄 Smart Auto-Calculations

1. **Repeat Buyer Detection**
   - After 2nd purchase → `isRepeatBuyer = true`
   - Update `purchaseCount` on every sale

2. **Symptom Intelligence**
   - Link symptoms to medicine categories
   - When own-label ready → know which painkiller to push

3. **Doctor Analytics**
   - Track prescriptions per doctor
   - Know who sends most business

4. **Supplier Margin Tracking**
   - Calculate avg margin per supplier
   - Tag best margin suppliers with `vendorCode`

5. **FIFO Batch Selection**
   - Auto-select oldest non-expired batch for billing
   - Alert on near-expiry during billing

---

## 📈 Future Intelligence Reports

1. **Salt vs Brand Loyalty** - Using repeat buyer + prescribed data
2. **Symptom-wise Top Sellers** - Which medicine sells most for fever?
3. **Doctor ROI** - Revenue from each doctor's prescriptions
4. **Supplier Performance** - Margin, delivery, quality ranking
5. **Own-Label Opportunity** - High-volume generics to manufacture

---

## 🏗️ Build Order

### Phase 1: Core Models (NOW)
1. SymptomCategory (master)
2. Doctor
3. Medicine (with symptom mapping)
4. Supplier (with vendorCode)
5. Customer (with repeat tracking)

### Phase 2: Stock & Purchase
6. MedicineBatch
7. Purchase + PurchaseItem
8. StockAlert

### Phase 3: Sales & Billing
9. Sale + SaleItem
10. DiscountRule
11. CashDrawer

### Phase 4: Intelligence
12. AuditLog
13. Analytics Dashboard
14. Reports

---

## 📅 Timeline Estimate

- Phase 1: 2-3 days
- Phase 2: 2-3 days
- Phase 3: 3-4 days
- Phase 4: 2-3 days

**Total: ~10-12 days for complete backend + frontend**

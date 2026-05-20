/**
 * components/inventory/MedicineForm.jsx
 * 
 * RESPONSIBILITY:
 * - Add/Edit medicine form inside modal
 * - Handles all fields including smart metadata
 * - Real-time validation and error notifications
 */

import { useState, useEffect } from 'react'
import { X, Package, Shield, IndianRupee, Layers } from 'lucide-react'
import Button from '@components/common/Button'
import { Input, Select, Textarea } from '@components/common/Input'

const FORM_OPTIONS = [
  { value: 'TABLET', label: 'Tablet' },
  { value: 'CAPSULE', label: 'Capsule' },
  { value: 'SYRUP', label: 'Syrup' },
  { value: 'INJECTION', label: 'Injection' },
  { value: 'CREAM', label: 'Cream' },
  { value: 'OINTMENT', label: 'Ointment' },
  { value: 'DROPS', label: 'Drops' },
  { value: 'POWDER', label: 'Powder' },
  { value: 'GEL', label: 'Gel' },
  { value: 'SPRAY', label: 'Spray' },
  { value: 'INHALER', label: 'Inhaler' },
  { value: 'SUSPENSION', label: 'Suspension' },
  { value: 'LOTION', label: 'Lotion' },
  { value: 'PATCH', label: 'Patch' },
  { value: 'SUPPOSITORY', label: 'Suppository' },
  { value: 'OTHER', label: 'Other' },
]

const UNIT_OPTIONS = [
  { value: 'STRIP', label: 'Strip' },
  { value: 'BOTTLE', label: 'Bottle' },
  { value: 'VIAL', label: 'Vial' },
  { value: 'TUBE', label: 'Tube' },
  { value: 'BOX', label: 'Box' },
  { value: 'PIECE', label: 'Piece' },
  { value: 'SACHET', label: 'Sachet' },
  { value: 'AMPOULE', label: 'Ampoule' },
  { value: 'CARTRIDGE', label: 'Cartridge' },
]

const SCHEDULE_OPTIONS = [
  { value: 'OTC', label: 'OTC (Over the Counter)' },
  { value: 'H', label: 'Schedule H' },
  { value: 'H1', label: 'Schedule H1' },
  { value: 'X', label: 'Schedule X' },
  { value: 'G', label: 'Schedule G' },
  { value: 'AYUSH', label: 'AYUSH' },
  { value: 'NONE', label: 'None' },
]

const GST_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
]

const STORAGE_OPTIONS = [
  { value: 'ROOM_TEMP', label: 'Room Temperature' },
  { value: 'REFRIGERATED', label: 'Refrigerated (2°C - 8°C)' },
  { value: 'COOL_DRY', label: 'Cool & Dry Place' },
  { value: 'PROTECT_LIGHT', label: 'Protect From Light' },
]

export default function MedicineForm({
  medicine = null,
  onSubmit,
  onClose,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    dosage: '',
    form: 'TABLET',
    unitType: 'STRIP',
    unitsPerPack: 10,
    stripsPerBox: 1,
    manufacturer: '',
    brand: '',
    hsnCode: '',
    gstRate: 12,
    schedule: 'OTC',
    defaultMRP: '',
    defaultSellingPrice: '',
    defaultPurchasePrice: '',
    reorderLevel: 10,
    description: '',
    sideEffects: '',
    storageCondition: 'ROOM_TEMP',
  })

  const [errors, setErrors] = useState({})

  // Load existing medicine data for edit mode
  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || '',
        genericName: medicine.genericName || '',
        dosage: medicine.dosage || '',
        form: medicine.form || 'TABLET',
        unitType: medicine.unitType || 'STRIP',
        unitsPerPack: medicine.unitsPerPack ?? 10,
        stripsPerBox: medicine.stripsPerBox ?? 1,
        manufacturer: medicine.manufacturer || '',
        brand: medicine.brand || '',
        hsnCode: medicine.hsnCode || '',
        gstRate: medicine.gstRate ?? 12,
        schedule: medicine.schedule || 'OTC',
        defaultMRP: medicine.defaultMRP ?? '',
        defaultSellingPrice: medicine.defaultSellingPrice ?? '',
        defaultPurchasePrice: medicine.defaultPurchasePrice ?? '',
        reorderLevel: medicine.reorderLevel ?? 10,
        description: medicine.description || '',
        sideEffects: medicine.sideEffects || '',
        storageCondition: medicine.storageCondition || 'ROOM_TEMP',
      })
    }
  }, [medicine])

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name?.trim()) newErrors.name = 'Medicine name is required'
    if (!formData.dosage?.trim()) newErrors.dosage = 'Dosage is required (e.g., 500mg, 10ml)'
    if (!formData.form) newErrors.form = 'Medicine form type is required'
    if (!formData.unitType) newErrors.unitType = 'Unit type is required'
    
    const mrp = parseFloat(formData.defaultMRP)
    if (isNaN(mrp) || mrp <= 0) {
      newErrors.defaultMRP = 'Valid default MRP is required'
    }

    const sellingPrice = parseFloat(formData.defaultSellingPrice)
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      newErrors.defaultSellingPrice = 'Valid selling price is required'
    } else if (sellingPrice > mrp) {
      newErrors.defaultSellingPrice = 'Selling price cannot exceed MRP'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      const dataToSubmit = {
        ...formData,
        unitsPerPack: Number(formData.unitsPerPack) || 1,
        stripsPerBox: Number(formData.stripsPerBox) || 1,
        gstRate: Number(formData.gstRate),
        defaultMRP: Number(formData.defaultMRP),
        defaultSellingPrice: Number(formData.defaultSellingPrice),
        defaultPurchasePrice: formData.defaultPurchasePrice ? Number(formData.defaultPurchasePrice) : undefined,
        reorderLevel: Number(formData.reorderLevel) || 10,
      }
      onSubmit(dataToSubmit)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-brand-600" />
              {medicine ? 'Edit Medicine details' : 'Add New Medicine'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {medicine ? `Modify parameters for ${medicine.name}` : 'Create a master catalog record for medicine inventory'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Identity & Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Package className="h-4 w-4 text-gray-500" />
              1. Identity & Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Medicine Name"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="e.g., Paracetamol"
                />
              </div>
              <Input
                label="Dosage"
                required
                value={formData.dosage}
                onChange={(e) => handleChange('dosage', e.target.value)}
                error={errors.dosage}
                placeholder="e.g., 500mg, 10ml, 100mg/5ml"
              />
              <Input
                label="Generic Name / Active Ingredients"
                value={formData.genericName}
                onChange={(e) => handleChange('genericName', e.target.value)}
                placeholder="e.g., Acetaminophen"
              />
              <Select
                label="Form Factor"
                required
                options={FORM_OPTIONS}
                value={formData.form}
                onChange={(e) => handleChange('form', e.target.value)}
                error={errors.form}
              />
              <Select
                label="Packaging Unit Type"
                required
                options={UNIT_OPTIONS}
                value={formData.unitType}
                onChange={(e) => handleChange('unitType', e.target.value)}
                error={errors.unitType}
              />
              <Input
                label="Units per Pack (Strip/Bottle)"
                type="number"
                min="1"
                value={formData.unitsPerPack}
                onChange={(e) => handleChange('unitsPerPack', e.target.value)}
                placeholder="e.g., 10"
              />
              <Input
                label="Strips per Box"
                type="number"
                min="1"
                value={formData.stripsPerBox}
                onChange={(e) => handleChange('stripsPerBox', e.target.value)}
                placeholder="e.g., 10"
              />
              <Input
                label="Manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                placeholder="e.g., Cipla Ltd"
              />
              <Input
                label="Brand Name"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="e.g., Crocin"
              />
            </div>
          </div>

          {/* Pricing & Reorder */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
              <IndianRupee className="h-4 w-4 text-gray-500" />
              2. Reference Pricing & Reordering
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Default MRP (₹)"
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.defaultMRP}
                onChange={(e) => handleChange('defaultMRP', e.target.value)}
                error={errors.defaultMRP}
                placeholder="0.00"
              />
              <Input
                label="Default Selling Price (₹)"
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.defaultSellingPrice}
                onChange={(e) => handleChange('defaultSellingPrice', e.target.value)}
                error={errors.defaultSellingPrice}
                placeholder="0.00"
              />
              <Input
                label="Default Purchase Price (₹)"
                type="number"
                step="0.01"
                min="0"
                value={formData.defaultPurchasePrice}
                onChange={(e) => handleChange('defaultPurchasePrice', e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Reorder Stock Level"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => handleChange('reorderLevel', e.target.value)}
                placeholder="10"
                hint="Alerts when stock drops below this level"
              />
            </div>
          </div>

          {/* Regulatory & Safety */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Shield className="h-4 w-4 text-gray-500" />
              3. Regulatory & Storage Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="HSN Code"
                value={formData.hsnCode}
                onChange={(e) => handleChange('hsnCode', e.target.value)}
                placeholder="e.g., 3004"
              />
              <Select
                label="GST Rate (%)"
                options={GST_OPTIONS}
                value={String(formData.gstRate)}
                onChange={(e) => handleChange('gstRate', e.target.value)}
              />
              <Select
                label="Drug Schedule"
                options={SCHEDULE_OPTIONS}
                value={formData.schedule}
                onChange={(e) => handleChange('schedule', e.target.value)}
              />
              <Select
                label="Storage Condition"
                options={STORAGE_OPTIONS}
                value={formData.storageCondition}
                onChange={(e) => handleChange('storageCondition', e.target.value)}
              />
            </div>
          </div>

          {/* Extra Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Layers className="h-4 w-4 text-gray-500" />
              4. Description & Side Effects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter therapeutic use cases or dosage instructions..."
                rows={2}
              />
              <Textarea
                label="Side Effects"
                value={formData.sideEffects}
                onChange={(e) => handleChange('sideEffects', e.target.value)}
                placeholder="Common side effects to caution the customer about..."
                rows={2}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {medicine ? 'Update Medicine' : 'Save Medicine'}
          </Button>
        </div>
      </div>
    </div>
  )
}

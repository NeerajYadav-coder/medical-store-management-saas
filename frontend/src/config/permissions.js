/**
 * config/permissions.js
 * 
 * Frontend definition of permissions.
 * MUST match backend constants.
 */

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'VIEW_DASHBOARD',
  VIEW_FULL_DASHBOARD: 'VIEW_FULL_DASHBOARD', // Includes financial widgets

  // Sales / Billing
  CREATE_SALE: 'CREATE_SALE',
  VIEW_SALES: 'VIEW_SALES',
  VIEW_ALL_SALES: 'VIEW_ALL_SALES', // View other's sales
  DELETE_SALE: 'DELETE_SALE', // Void bill
  EDIT_SALE: 'EDIT_SALE', // Rare, mostly for returns processing

  // Inventory
  VIEW_INVENTORY: 'VIEW_INVENTORY',
  MANAGE_INVENTORY: 'MANAGE_INVENTORY', // Create/Edit/Delete medicines & batches
  ADJUST_STOCK: 'ADJUST_STOCK', // Quick stock adjustment
  VIEW_PURCHASE_PRICE: 'VIEW_PURCHASE_PRICE', // See cost price/margin

  // Purchase
  VIEW_PURCHASES: 'VIEW_PURCHASES',
  MANAGE_PURCHASES: 'MANAGE_PURCHASES', // Create/Edit purchase orders

  // Suppliers
  VIEW_SUPPLIERS: 'VIEW_SUPPLIERS',
  MANAGE_SUPPLIERS: 'MANAGE_SUPPLIERS',

  // Customers
  VIEW_CUSTOMERS: 'VIEW_CUSTOMERS',
  MANAGE_CUSTOMERS: 'MANAGE_CUSTOMERS',

  // Staff
  MANAGE_STAFF: 'MANAGE_STAFF', // Create/Edit/Delete staff

  // Reports
  VIEW_REPORTS: 'VIEW_REPORTS', // General non-financial reports
  VIEW_FINANCIAL_REPORTS: 'VIEW_FINANCIAL_REPORTS', // Profit, Tax, Ledgers

  // Settings
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  
  // Audit
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
};

export const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
};

export default PERMISSIONS;

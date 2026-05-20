/**
 * constants/permissions.js
 * 
 * Granular permissions for the application.
 * These drive the RBAC system.
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

/**
 * Default role definitions
 * These act as templates when creating users
 */
export const ROLE_PERMISSIONS = {
  OWNER: Object.values(PERMISSIONS), // All permissions
  
  MANAGER: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FULL_DASHBOARD,
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.VIEW_ALL_SALES,
    PERMISSIONS.DELETE_SALE,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.ADJUST_STOCK,
    PERMISSIONS.VIEW_PURCHASE_PRICE,
    PERMISSIONS.VIEW_PURCHASES,
    PERMISSIONS.MANAGE_PURCHASES,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_REPORTS,
    // No sensitive financial reports by default? Or yes?
    // Let's exclude MANAGE_STAFF, MANAGE_SETTINGS, VIEW_AUDIT_LOGS for Manager by default
    // But include VIEW_FINANCIAL_REPORTS for Manager
    PERMISSIONS.VIEW_FINANCIAL_REPORTS, 
  ],

  STAFF: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES, // Only own, enforced by query logic usually, but general view allowed
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_CUSTOMERS, // Usually staff can add customers
    PERMISSIONS.VIEW_PURCHASES,
    PERMISSIONS.MANAGE_PURCHASES,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    // NO cost price, NO inventory editing, NO reports
  ],
};

export default PERMISSIONS;

/**
 * Centralized route configuration
 */

import { PERMISSIONS } from './permissions'

/**
 * Application routes
 */
export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Dashboard routes
  DASHBOARD: '/dashboard',
  
  // Inventory routes
  INVENTORY: '/dashboard/inventory',
  INVENTORY_ADD: '/dashboard/inventory/add',
  INVENTORY_EDIT: '/dashboard/inventory/:id/edit',
  INVENTORY_VIEW: '/dashboard/inventory/:id',

  // Sales routes
  SALES: '/dashboard/sales',
  SALES_NEW: '/dashboard/billing',
  SALES_VIEW: '/dashboard/sales/:id',
  BILLING: '/dashboard/billing',

  // Customers routes
  CUSTOMERS: '/dashboard/customers',

  // Purchase routes
  PURCHASE: '/dashboard/purchase',
  PURCHASE_NEW: '/dashboard/purchase/new',
  PURCHASE_VIEW: '/dashboard/purchase/:id',

  // Suppliers routes
  SUPPLIERS: '/dashboard/suppliers',
  SUPPLIERS_ADD: '/dashboard/suppliers/add',
  SUPPLIERS_EDIT: '/dashboard/suppliers/:id/edit',
  SUPPLIERS_VIEW: '/dashboard/suppliers/:id',

  // Staff routes (Owner only)
  STAFF: '/dashboard/staff',
  STAFF_ADD: '/dashboard/staff/add',
  STAFF_EDIT: '/dashboard/staff/:id/edit',

  // Reports routes
  REPORTS: '/dashboard/reports',
  REPORTS_SALES: '/dashboard/reports/sales',
  REPORTS_INVENTORY: '/dashboard/reports/inventory',
  REPORTS_PURCHASE: '/dashboard/reports/purchase',
  REPORTS_GST: '/dashboard/reports/gst',
  
  // Audit Logs
  AUDIT_LOGS: '/dashboard/audit-logs',

  // Settings routes
  SETTINGS_STORE: '/dashboard/settings/store',
  SETTINGS_USER: '/dashboard/settings/user',

  // Error routes
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
}



/**
 * Route metadata for navigation
 */
export const ROUTE_META = {
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    breadcrumb: ['Dashboard'],
  },
  [ROUTES.INVENTORY]: {
    title: 'Inventory',
    breadcrumb: ['Dashboard', 'Inventory'],
  },
  [ROUTES.INVENTORY_ADD]: {
    title: 'Add Medicine',
    breadcrumb: ['Dashboard', 'Inventory', 'Add Medicine'],
  },
  [ROUTES.BILLING]: {
    title: 'POS Billing',
    breadcrumb: ['Dashboard', 'Billing'],
  },
  [ROUTES.SALES]: {
    title: 'Sales History',
    breadcrumb: ['Dashboard', 'Sales'],
  },
  [ROUTES.CUSTOMERS]: {
    title: 'Customer Management',
    breadcrumb: ['Dashboard', 'Customers'],
  },
  [ROUTES.PURCHASE]: {
    title: 'Purchase Orders',
    breadcrumb: ['Dashboard', 'Purchase'],
  },
  [ROUTES.SUPPLIERS]: {
    title: 'Suppliers',
    breadcrumb: ['Dashboard', 'Suppliers'],
  },
  [ROUTES.STAFF]: {
    title: 'Staff Management',
    breadcrumb: ['Dashboard', 'Staff'],
  },
  [ROUTES.REPORTS]: {
    title: 'Reports',
    breadcrumb: ['Dashboard', 'Reports'],
  },
  [ROUTES.AUDIT_LOGS]: {
    title: 'Audit Logs',
    breadcrumb: ['Dashboard', 'Audit Logs'],
  },
  [ROUTES.SETTINGS_STORE]: {
    title: 'Store Settings',
    breadcrumb: ['Dashboard', 'Settings', 'Store'],
  },
  [ROUTES.SETTINGS_USER]: {
    title: 'Account Settings',
    breadcrumb: ['Dashboard', 'Settings', 'Account'],
  },
}



/**
 * Sidebar navigation items with role-based access
 */
export const SIDEBAR_NAV_ITEMS = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    path: ROUTES.BILLING,
    label: 'Billing',
    icon: 'ShoppingCart',
    permission: PERMISSIONS.CREATE_SALE,
    badge: false,
  },
  {
    path: ROUTES.SALES,
    label: 'Sales',
    icon: 'BarChart3',
    permission: PERMISSIONS.VIEW_SALES,
  },
  {
    path: ROUTES.INVENTORY,
    label: 'Inventory',
    icon: 'Package',
    permission: PERMISSIONS.VIEW_INVENTORY,
    badge: true,
  },
  {
    path: ROUTES.PURCHASE,
    label: 'Purchases',
    icon: 'Truck',
    permission: PERMISSIONS.VIEW_PURCHASES,
  },
  {
    path: ROUTES.CUSTOMERS,
    label: 'Customers',
    icon: 'Users',
    permission: PERMISSIONS.VIEW_CUSTOMERS,
  },
  {
    path: ROUTES.SUPPLIERS,
    label: 'Suppliers',
    icon: 'Building2',
    permission: PERMISSIONS.VIEW_SUPPLIERS,
  },
  {
    path: ROUTES.STAFF,
    label: 'Staff',
    icon: 'UserCog',
    permission: PERMISSIONS.MANAGE_STAFF,
  },
  {
    path: ROUTES.REPORTS,
    label: 'Reports',
    icon: 'BarChart3',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    path: ROUTES.AUDIT_LOGS,
    label: 'Logs',
    icon: 'FileText',
    permission: PERMISSIONS.VIEW_AUDIT_LOGS,
  },
  {
    path: ROUTES.SETTINGS_STORE,
    label: 'Settings',
    icon: 'Settings',
    permission: PERMISSIONS.MANAGE_SETTINGS,
  },
]

/**
 * Build route with parameters
 * @param {string} route - Route template
 * @param {object} params - Route parameters
 * @returns {string} Built route
 */
export function buildRoute(route, params = {}) {
  let builtRoute = route
  
  Object.entries(params).forEach(([key, value]) => {
    builtRoute = builtRoute.replace(`:${key}`, value)
  })
  
  return builtRoute
}

/**
 * Check if route requires authentication
 * @param {string} path - Route path
 * @returns {boolean}
 */
export function isAuthRoute(path) {
  const authRoutes = [
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
  ]
  return authRoutes.some(route => path.startsWith(route))
}

/**
 * Check if route requires owner role
 * @param {string} path - Route path
 * @returns {boolean}
 */
export function isOwnerRoute(path) {
  const ownerRoutes = [
    ROUTES.STAFF,
    ROUTES.STAFF_ADD,
    ROUTES.SETTINGS_STORE,
  ]
  return ownerRoutes.some(route => path.startsWith(route))
}

export default ROUTES

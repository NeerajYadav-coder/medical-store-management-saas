# RBAC & Audit System Implementation

## Overview
A comprehensive Role-Based Access Control (RBAC) system has been implemented, moving beyond simple role checks to granular permissions. This system is integrated into both the frontend and backend, ensuring secure access control and detailed audit logging.

## Core Components

### 1. Permissions System
- **Granular Permissions**: Defined in `backend/constants/permissions.js` and `frontend/src/config/permissions.js`.
- **Role Mappings**: 
  - **OWNER**: Full access (wildcard).
  - **MANAGER**: Inventory management, staff oversight, but limited financial access.
  - **STAFF**: Sales and basic inventory viewing.
- **Middleware**: `hasPermission` middleware enforces checks at the route level.

### 2. Backend Security
- **User Model**: Updated to store `permissions` array.
- **Authentication**: `auth.controller.js` assigns default permissions on signup/creation.
- **Route Protection**:
  - **Sales**: `CREATE_SALE` for billing, `DELETE_SALE` for voiding.
  - **Inventory**: `MANAGE_INVENTORY` for add/edit/delete.
  - **Audit**: `VIEW_AUDIT_LOGS` for viewing history.
- **Data Sanitization**: Sensitive financial data (cost price, margin) is filtered out for users without `VIEW_FINANCIAL_REPORTS`.

### 3. Frontend Integration
- **Context**: `AuthContext` now provides `hasPermission` helper.
- **Sidebar**: Dynamic navigation based on user permissions.
- **Dashboard**:
  - Financial widgets hidden for unauthorized users.
  - "Add Medicine" / "Purchase" quick actions hidden if no permission.
- **Sales Page**:
  - Discount capped at 10% for non-owners.
  - Financial stats in history hidden.
- **Inventory Page**:
  - Edit/Delete buttons hidden for non-managers.
  - Import/Export restricted.

### 4. Audit Logging
- **Model**: Enhanced `AuditLog` with IP, UserAgent, and flexible `details`.
- **Middleware**: `auditAction` logs critical operations (Create Sale, Update Inventory, etc.).
- **Viewer**: New `ActivityLogs` page (`/dashboard/audit-logs`) allows Owners to view, filter, and track system activity.

## Usage Guide for Developers

### Checking Permissions (Frontend)
```javascript
const { hasPermission } = useAuth();

if (hasPermission('MANAGE_INVENTORY')) {
  // Show edit button
}
```

### Protecting Routes (Backend)
```javascript
router.post('/delete', hasPermission(PERMISSIONS.DELETE_SALE), auditAction('DELETE', 'SALE'), controller.delete);
```

### Adding New Permissions
1. Add to `backend/constants/permissions.js`.
2. Add to `frontend/src/config/permissions.js`.
3. Add to default role mappings in backend constants.

## Next Steps
- **Custom Roles**: UI for owners to create custom roles and mix-match permissions.
- **Advanced Audit**: Geographic location tracking for logins.
- **Two-Factor Auth**: For sensitive actions like bulk deletion.

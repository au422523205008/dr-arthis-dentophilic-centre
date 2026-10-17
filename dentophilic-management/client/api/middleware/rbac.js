/**
 * Role-Based Access Control Middleware
 */

// Default permissions matrix
const DEFAULT_PERMISSIONS = {
  ADMIN: {
    VIEW_FINANCES: true,
    VIEW_EXPENSES: true,
    MANAGE_STAFF: true,
    MANAGE_SETTINGS: true,
    VIEW_AUDIT_LOGS: true,
    MANAGE_BACKUPS: true,
    PERMANENT_DELETE: true,
    MANAGE_SERVICES_PRICING: true,
    EXPORT_DATA: true,
    MANAGE_PATIENTS: true,
    DELETE_PATIENTS: true,
    MANAGE_APPOINTMENTS: true,
    DELETE_APPOINTMENTS: true,
    MANAGE_BILLING: true,
    DELETE_BILLS: true,
    MANAGE_INVENTORY: true
  },
  ATTENDER: {
    VIEW_FINANCES: false,
    VIEW_EXPENSES: false,
    MANAGE_STAFF: false,
    MANAGE_SETTINGS: false,
    VIEW_AUDIT_LOGS: false,
    MANAGE_BACKUPS: false,
    PERMANENT_DELETE: false,
    MANAGE_SERVICES_PRICING: false,
    EXPORT_DATA: false,
    MANAGE_PATIENTS: true,
    DELETE_PATIENTS: false,
    MANAGE_APPOINTMENTS: true,
    DELETE_APPOINTMENTS: false,
    MANAGE_BILLING: true,
    DELETE_BILLS: false,
    MANAGE_INVENTORY: true
  }
};

/**
 * Middleware ensuring current user has one of the allowed roles
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires [${allowedRoles.join(', ')}] privileges. Attender accounts are restricted from accessing this resource.`
      });
    }

    next();
  };
}

/**
 * Middleware requiring strictly ADMIN role
 */
const requireAdmin = requireRole(['ADMIN']);

/**
 * Middleware checking a specific permission key with fallback to role defaults
 */
function requirePermission(permKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Admins always have all permissions
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check user custom permissions override or role default
    const userOverrides = req.user.permissions || {};
    const hasPermission = userOverrides[permKey] !== undefined
      ? userOverrides[permKey]
      : (DEFAULT_PERMISSIONS[req.user.role]?.[permKey] ?? false);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not possess the required permission [${permKey}] to perform this action.`
      });
    }

    next();
  };
}

module.exports = {
  requireRole,
  requireAdmin,
  requirePermission,
  DEFAULT_PERMISSIONS
};

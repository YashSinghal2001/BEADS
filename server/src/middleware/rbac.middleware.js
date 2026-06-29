import { ApiError } from '../utils/ApiError.js'

/* Roles that may access the admin app. */
export const ADMIN_ROLES = ['support', 'warehouse', 'manager', 'admin', 'super_admin']

/* Permission matrix per role. '*' = all. */
const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    'dashboard.view', 'product.read', 'product.write', 'inventory.write',
    'order.read', 'order.write', 'order.refund', 'customer.read', 'customer.write',
    'coupon.read', 'coupon.write', 'content.read', 'content.write', 'analytics.view', 'activity.view',
  ],
  manager: [
    'dashboard.view', 'product.read', 'product.write', 'inventory.write',
    'order.read', 'order.write', 'customer.read', 'coupon.read', 'coupon.write',
    'content.read', 'content.write', 'analytics.view',
  ],
  support: ['dashboard.view', 'order.read', 'order.write', 'customer.read', 'customer.write'],
  warehouse: ['dashboard.view', 'product.read', 'inventory.write', 'order.read', 'order.write'],
  user: [],
}

export function permissionsFor(user) {
  if (!user) return []
  const base = ROLE_PERMISSIONS[user.role] || []
  return [...new Set([...base, ...(user.permissions || [])])]
}

export function hasPermission(user, permission) {
  const perms = permissionsFor(user)
  return perms.includes('*') || perms.includes(permission)
}

export const isAdminRole = (role) => ADMIN_ROLES.includes(role)

/* Middleware: require any admin-capable role. */
export const requireAdmin = (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'))
  if (!isAdminRole(req.user.role)) return next(ApiError.forbidden('Admin access required'))
  next()
}

/* Middleware: require a specific permission. */
export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'))
  if (!hasPermission(req.user, permission)) {
    return next(ApiError.forbidden(`Missing permission: ${permission}`))
  }
  next()
}

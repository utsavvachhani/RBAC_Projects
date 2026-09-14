const { apiError } = require('../utils/helpers');
const { SYSTEM_ROLE_NAMES } = require('../constants/roles');

/**
 * RBAC authorization middleware builder
 * @param {string} permissionKey - required permission string
 * @param {object} options - optional scoping conditions
 */
const authorize = (permissionKey, options = {}) => {
  return (req, res, next) => {
    // Must be called after requireOrganizationContext
    if (!req.organization || !req.membership || !req.role) {
      return apiError(res, 'Organization context is missing for RBAC evaluation', 'INTERNAL_ERROR', 500);
    }

    // Organization owner has full root authorization bypass
    if (req.isOrgOwner) {
      return next();
    }

    // Check if the role permissions include the needed permission
    const permissions = req.userPermissions || [];
    const hasPermission = permissions.includes(permissionKey);

    if (!hasPermission) {
      return apiError(
        res,
        `Access denied: Missing required permission '${permissionKey}'`,
        'FORBIDDEN',
        403
      );
    }

    // If role has department scope restriction, ensure operation targets permitted department
    if (req.role.scope === 'department') {
      const targetDeptId = req.params.departmentId || req.body.departmentId || req.query.departmentId;
      if (targetDeptId) {
        const userDeptIds = (req.membership.departmentIds || []).map((d) =>
          d._id ? d._id.toString() : d.toString()
        );
        if (!userDeptIds.includes(targetDeptId.toString())) {
          return apiError(
            res,
            'Access denied: You are restricted to your assigned department',
            'FORBIDDEN',
            403
          );
        }
      }
    }

    next();
  };
};

/**
 * Validate role assignment hierarchy to prevent privilege escalation
 */
const preventPrivilegeEscalation = (req, res, next) => {
  const actorRoleName = req.role.name;
  const isOwner = req.isOrgOwner;

  // Only Owner can assign the Owner role or modify an Owner
  const targetRoleName = req.targetRole ? req.targetRole.name : null;

  if (targetRoleName === SYSTEM_ROLE_NAMES.OWNER && !isOwner) {
    return apiError(res, 'Only the organization owner can assign the Owner role', 'FORBIDDEN', 403);
  }

  // Admin cannot assign Owner role or Admin role if restricted
  if (actorRoleName === SYSTEM_ROLE_NAMES.ADMIN && targetRoleName === SYSTEM_ROLE_NAMES.OWNER) {
    return apiError(res, 'Admins cannot assign the Owner role', 'FORBIDDEN', 403);
  }

  // Department Managers cannot assign Admin or Owner
  if (actorRoleName === SYSTEM_ROLE_NAMES.DEPARTMENT_MANAGER) {
    if (targetRoleName === SYSTEM_ROLE_NAMES.OWNER || targetRoleName === SYSTEM_ROLE_NAMES.ADMIN) {
      return apiError(res, 'Department Managers cannot assign Admin or Owner roles', 'FORBIDDEN', 403);
    }
  }

  // Members cannot assign any role
  if (actorRoleName === SYSTEM_ROLE_NAMES.MEMBER && !isOwner) {
    return apiError(res, 'Members are not authorized to assign roles', 'FORBIDDEN', 403);
  }

  next();
};

module.exports = {
  authorize,
  preventPrivilegeEscalation
};

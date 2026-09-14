const roleService = require('../services/roleService');
const { SYSTEM_PERMISSIONS } = require('../constants/permissions');
const { apiSuccess } = require('../utils/helpers');

const getRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getOrganizationRoles(req.organization._id);
    return apiSuccess(res, 'Roles retrieved successfully', { roles });
  } catch (error) {
    next(error);
  }
};

const getAvailablePermissions = async (req, res, next) => {
  try {
    return apiSuccess(res, 'System permissions catalogue', { permissions: SYSTEM_PERMISSIONS });
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions, scope } = req.body;
    const role = await roleService.createCustomRole({
      orgId: req.organization._id,
      name,
      description,
      permissions,
      scope,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Custom role created successfully', { role }, 201);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { name, description, permissions, scope } = req.body;
    const updated = await roleService.updateCustomRole({
      orgId: req.organization._id,
      roleId: req.params.roleId,
      name,
      description,
      permissions,
      scope,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Role updated successfully', { role: updated });
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const result = await roleService.deleteCustomRole({
      orgId: req.organization._id,
      roleId: req.params.roleId,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  getAvailablePermissions,
  createRole,
  updateRole,
  deleteRole
};

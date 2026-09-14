const Role = require('../models/Role');
const Membership = require('../models/Membership');
const { SYSTEM_ROLE_NAMES } = require('../constants/roles');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const getOrganizationRoles = async (orgId) => {
  const roles = await Role.find({ organizationId: orgId }).sort({ isSystemRole: -1, createdAt: 1 });

  // Compute members count for each role
  const rolesWithCounts = await Promise.all(
    roles.map(async (role) => {
      const memberCount = await Membership.countDocuments({
        organizationId: orgId,
        roleId: role._id,
        status: 'active'
      });
      return {
        ...role.toObject(),
        memberCount
      };
    })
  );

  return rolesWithCounts;
};

const createCustomRole = async ({
  orgId,
  name,
  description = '',
  permissions = [],
  scope = 'organization',
  actorId,
  req
}) => {
  const existingRole = await Role.findOne({
    organizationId: orgId,
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });

  if (existingRole) {
    const err = new Error('A role with this name already exists in this organization');
    err.statusCode = 409;
    throw err;
  }

  const role = await Role.create({
    name: name.trim(),
    description,
    organizationId: orgId,
    permissions,
    scope,
    isSystemRole: false,
    createdBy: actorId
  });

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.ROLE_CREATED,
    resourceType: 'role',
    resourceId: role._id,
    metadata: { name: role.name, scope: role.scope, permissionsCount: permissions.length },
    req
  });

  return role;
};

const updateCustomRole = async ({
  orgId,
  roleId,
  name,
  description,
  permissions,
  scope,
  actorId,
  req
}) => {
  const role = await Role.findOne({ _id: roleId, organizationId: orgId });
  if (!role) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }

  if (role.isSystemRole) {
    // Only allow editing description of system roles, not renaming or breaking Owner permissions
    if (name && name !== role.name) {
      const err = new Error('Predefined system roles cannot be renamed');
      err.statusCode = 400;
      throw err;
    }
    if (role.name === SYSTEM_ROLE_NAMES.OWNER && permissions) {
      const err = new Error('Owner permissions cannot be altered');
      err.statusCode = 400;
      throw err;
    }
  }

  if (name) role.name = name.trim();
  if (description !== undefined) role.description = description;
  if (permissions && (!role.isSystemRole || role.name !== SYSTEM_ROLE_NAMES.OWNER)) {
    role.permissions = permissions;
  }
  if (scope && !role.isSystemRole) role.scope = scope;

  await role.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.ROLE_UPDATED,
    resourceType: 'role',
    resourceId: role._id,
    metadata: { name: role.name, permissionsCount: role.permissions.length },
    req
  });

  return role;
};

const deleteCustomRole = async ({ orgId, roleId, actorId, req }) => {
  const role = await Role.findOne({ _id: roleId, organizationId: orgId });
  if (!role) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }

  if (role.isSystemRole) {
    const err = new Error('System-defined roles cannot be deleted');
    err.statusCode = 400;
    throw err;
  }

  const assignedCount = await Membership.countDocuments({
    organizationId: orgId,
    roleId: role._id,
    status: 'active'
  });

  if (assignedCount > 0) {
    const err = new Error(
      `Cannot delete role '${role.name}' because it is assigned to ${assignedCount} active member(s). Reassign them first.`
    );
    err.statusCode = 400;
    throw err;
  }

  await Role.deleteOne({ _id: role._id });

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.ROLE_DELETED,
    resourceType: 'role',
    resourceId: role._id,
    metadata: { name: role.name },
    req
  });

  return { message: `Role '${role.name}' deleted successfully` };
};

module.exports = {
  getOrganizationRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole
};

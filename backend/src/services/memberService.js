const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Organization = require('../models/Organization');
const { SYSTEM_ROLE_NAMES } = require('../constants/roles');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const getOrganizationMembers = async (orgId, filters = {}) => {
  const query = { organizationId: orgId };

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.roleId && mongoose.Types.ObjectId.isValid(filters.roleId)) {
    query.roleId = filters.roleId;
  }
  if (filters.departmentId && mongoose.Types.ObjectId.isValid(filters.departmentId)) {
    query.departmentIds = filters.departmentId;
  }

  let memberships = await Membership.find(query)
    .populate('userId', 'name email avatar isActive createdAt')
    .populate('roleId', 'name description scope isSystemRole permissions')
    .populate('departmentIds', 'name description')
    .sort({ createdAt: -1 });

  if (filters.search) {
    const term = filters.search.toLowerCase();
    memberships = memberships.filter((m) => {
      const name = m.userId?.name?.toLowerCase() || '';
      const email = m.userId?.email?.toLowerCase() || '';
      return name.includes(term) || email.includes(term);
    });
  }

  return memberships;
};

const createMember = async ({
  orgId,
  name,
  email,
  password = 'Password123!',
  roleId,
  departmentIds = [],
  actorId,
  req
}) => {
  const organization = await Organization.findById(orgId);
  if (!organization) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  // Verify role belongs to this organization
  const role = await Role.findOne({ _id: roleId, organizationId: orgId });
  if (!role) {
    const err = new Error('Selected role does not exist in this organization');
    err.statusCode = 400;
    throw err;
  }

  // Privilege escalation protection
  const isActorOwner = organization.ownerId.toString() === actorId.toString();
  if (role.name === SYSTEM_ROLE_NAMES.OWNER && !isActorOwner) {
    const err = new Error('Only the organization Owner can assign the Owner role');
    err.statusCode = 403;
    throw err;
  }

  // Verify departments belong to this organization
  if (departmentIds.length > 0) {
    const validCount = await Department.countDocuments({
      _id: { $in: departmentIds },
      organizationId: orgId
    });
    if (validCount !== departmentIds.length) {
      const err = new Error('One or more selected departments do not belong to this organization');
      err.statusCode = 400;
      throw err;
    }
  }

  // Find or create User
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const passwordHash = await User.hashPassword(password);
    user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash
    });
  }

  // Check if membership already exists
  const existingMembership = await Membership.findOne({
    userId: user._id,
    organizationId: orgId
  });

  if (existingMembership) {
    if (existingMembership.status === 'removed') {
      existingMembership.status = 'active';
      existingMembership.roleId = roleId;
      existingMembership.departmentIds = departmentIds;
      await existingMembership.save();
      return existingMembership;
    }
    const err = new Error('User is already a member of this organization');
    err.statusCode = 409;
    throw err;
  }

  const membership = await Membership.create({
    userId: user._id,
    organizationId: orgId,
    roleId,
    departmentIds,
    status: 'active',
    invitedBy: actorId,
    joinedAt: new Date()
  });

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.MEMBER_CREATED,
    resourceType: 'member',
    resourceId: membership._id,
    targetUserId: user._id,
    metadata: { roleName: role.name, email: user.email },
    req
  });

  return Membership.findById(membership._id)
    .populate('userId', 'name email avatar')
    .populate('roleId')
    .populate('departmentIds');
};

const assignRole = async ({ orgId, memberId, newRoleId, actorId, req }) => {
  const organization = await Organization.findById(orgId);
  const membership = await Membership.findOne({
    _id: memberId,
    organizationId: orgId
  }).populate('roleId');

  if (!membership) {
    const err = new Error('Member not found in this organization');
    err.statusCode = 404;
    throw err;
  }

  const targetRole = await Role.findOne({ _id: newRoleId, organizationId: orgId });
  if (!targetRole) {
    const err = new Error('Target role does not exist in this organization');
    err.statusCode = 400;
    throw err;
  }

  const isActorOwner = organization.ownerId.toString() === actorId.toString();

  // Prevent non-owner from assigning Owner role
  if (targetRole.name === SYSTEM_ROLE_NAMES.OWNER && !isActorOwner) {
    const err = new Error('Only the organization Owner can assign the Owner role');
    err.statusCode = 403;
    throw err;
  }

  // Prevent demoting the actual organization owner if there's no other owner
  if (
    membership.userId.toString() === organization.ownerId.toString() &&
    targetRole.name !== SYSTEM_ROLE_NAMES.OWNER
  ) {
    const err = new Error('Cannot demote the primary organization owner');
    err.statusCode = 403;
    throw err;
  }

  const oldRoleName = membership.roleId ? membership.roleId.name : 'None';
  membership.roleId = targetRole._id;
  await membership.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.ROLE_CHANGED,
    resourceType: 'role',
    resourceId: targetRole._id,
    targetUserId: membership.userId,
    metadata: { oldRole: oldRoleName, newRole: targetRole.name },
    req
  });

  return Membership.findById(membership._id)
    .populate('userId', 'name email avatar')
    .populate('roleId')
    .populate('departmentIds');
};

const assignDepartments = async ({ orgId, memberId, departmentIds, actorId, req }) => {
  const membership = await Membership.findOne({
    _id: memberId,
    organizationId: orgId
  });

  if (!membership) {
    const err = new Error('Member not found in this organization');
    err.statusCode = 404;
    throw err;
  }

  if (departmentIds.length > 0) {
    const count = await Department.countDocuments({
      _id: { $in: departmentIds },
      organizationId: orgId
    });
    if (count !== departmentIds.length) {
      const err = new Error('One or more specified departments do not exist in this organization');
      err.statusCode = 400;
      throw err;
    }
  }

  membership.departmentIds = departmentIds;
  await membership.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.MEMBER_UPDATED,
    resourceType: 'member',
    resourceId: membership._id,
    targetUserId: membership.userId,
    metadata: { assignedDepartmentsCount: departmentIds.length },
    req
  });

  return Membership.findById(membership._id)
    .populate('userId', 'name email avatar')
    .populate('roleId')
    .populate('departmentIds');
};

const updateMemberStatus = async ({ orgId, memberId, status, actorId, req }) => {
  const organization = await Organization.findById(orgId);
  const membership = await Membership.findOne({
    _id: memberId,
    organizationId: orgId
  });

  if (!membership) {
    const err = new Error('Member not found in this organization');
    err.statusCode = 404;
    throw err;
  }

  // Prevent suspending or removing organization owner
  if (membership.userId.toString() === organization.ownerId.toString()) {
    const err = new Error('Cannot change the status of the organization owner');
    err.statusCode = 403;
    throw err;
  }

  membership.status = status;
  await membership.save();

  const action = status === 'suspended' ? AUDIT_ACTIONS.MEMBER_SUSPENDED : AUDIT_ACTIONS.MEMBER_UPDATED;

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action,
    resourceType: 'member',
    resourceId: membership._id,
    targetUserId: membership.userId,
    metadata: { newStatus: status },
    req
  });

  return membership;
};

const removeMember = async ({ orgId, memberId, actorId, req }) => {
  const organization = await Organization.findById(orgId);
  const membership = await Membership.findOne({
    _id: memberId,
    organizationId: orgId
  });

  if (!membership) {
    const err = new Error('Member not found in this organization');
    err.statusCode = 404;
    throw err;
  }

  // Prevent removing organization owner
  if (membership.userId.toString() === organization.ownerId.toString()) {
    const err = new Error('The organization Owner cannot be removed from their organization');
    err.statusCode = 403;
    throw err;
  }

  membership.status = 'removed';
  await membership.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.MEMBER_REMOVED,
    resourceType: 'member',
    resourceId: membership._id,
    targetUserId: membership.userId,
    metadata: { removedAt: new Date() },
    req
  });

  return { message: 'Member successfully removed from organization' };
};

module.exports = {
  getOrganizationMembers,
  createMember,
  assignRole,
  assignDepartments,
  updateMemberStatus,
  removeMember
};

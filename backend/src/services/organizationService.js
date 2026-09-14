const Organization = require('../models/Organization');
const Role = require('../models/Role');
const Membership = require('../models/Membership');
const Department = require('../models/Department');
const { DEFAULT_ROLE_DEFINITIONS, SYSTEM_ROLE_NAMES } = require('../constants/roles');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
};

const createOrganization = async ({ name, description = '', ownerId, req }) => {
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (await Organization.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // 1. Create Organization
  const organization = await Organization.create({
    name,
    slug,
    description,
    ownerId
  });

  // 2. Automatically seed predefined roles for this new organization
  const roleDocs = await Promise.all(
    DEFAULT_ROLE_DEFINITIONS.map((def) =>
      Role.create({
        name: def.name,
        description: def.description,
        organizationId: organization._id,
        permissions: def.permissions,
        scope: def.scope,
        isSystemRole: true,
        createdBy: ownerId
      })
    )
  );

  const ownerRole = roleDocs.find((r) => r.name === SYSTEM_ROLE_NAMES.OWNER);

  // 3. Create default departments (General & Operations)
  const defaultDepartments = await Promise.all([
    Department.create({
      organizationId: organization._id,
      name: 'General',
      description: 'Organization-wide general operations',
      managerIds: [ownerId],
      createdBy: ownerId
    }),
    Department.create({
      organizationId: organization._id,
      name: 'Engineering',
      description: 'Product, development and technical infrastructure',
      managerIds: [ownerId],
      createdBy: ownerId
    })
  ]);

  // 4. Create Owner Membership record
  const membership = await Membership.create({
    userId: ownerId,
    organizationId: organization._id,
    roleId: ownerRole._id,
    departmentIds: defaultDepartments.map((d) => d._id),
    status: 'active',
    joinedAt: new Date()
  });

  // 5. Audit Log
  await createAuditLog({
    organizationId: organization._id,
    actorId: ownerId,
    action: AUDIT_ACTIONS.ORGANIZATION_CREATED,
    resourceType: 'organization',
    resourceId: organization._id,
    metadata: { name: organization.name, slug: organization.slug },
    req
  });

  return {
    organization,
    membership,
    roles: roleDocs,
    departments: defaultDepartments
  };
};

const getUserOrganizations = async (userId) => {
  const memberships = await Membership.find({
    userId,
    status: 'active'
  })
    .populate({
      path: 'organizationId',
      match: { isActive: true }
    })
    .populate('roleId')
    .populate('departmentIds');

  return memberships
    .filter((m) => m.organizationId !== null)
    .map((m) => ({
      organization: m.organizationId,
      membershipId: m._id,
      role: m.roleId,
      departments: m.departmentIds,
      joinedAt: m.joinedAt
    }));
};

const getOrganizationContext = async (orgId, userId) => {
  const organization = await Organization.findById(orgId);
  if (!organization || !organization.isActive) {
    const error = new Error('Organization not found or inactive');
    error.statusCode = 404;
    error.code = 'ORGANIZATION_NOT_FOUND';
    throw error;
  }

  const membership = await Membership.findOne({
    userId,
    organizationId: orgId,
    status: 'active'
  })
    .populate('roleId')
    .populate('departmentIds');

  if (!membership) {
    const error = new Error('Access denied: You are not an active member of this organization');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const isOwner = organization.ownerId.toString() === userId.toString() || membership.roleId.name === 'Owner';

  return {
    organization,
    membership,
    role: membership.roleId,
    permissions: membership.roleId ? membership.roleId.permissions : [],
    departments: membership.departmentIds,
    isOwner
  };
};

const updateOrganization = async (orgId, updateData, actorId, req) => {
  const organization = await Organization.findById(orgId);
  if (!organization) {
    const error = new Error('Organization not found');
    error.statusCode = 404;
    error.code = 'ORGANIZATION_NOT_FOUND';
    throw error;
  }

  const allowedUpdates = ['name', 'description', 'logo', 'settings'];
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      organization[field] = updateData[field];
    }
  });

  await organization.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.ORGANIZATION_UPDATED,
    resourceType: 'organization',
    resourceId: orgId,
    metadata: updateData,
    req
  });

  return organization;
};

const deleteOrganization = async (orgId, actorId, req) => {
  const organization = await Organization.findById(orgId);
  if (!organization) {
    const error = new Error('Organization not found');
    error.statusCode = 404;
    error.code = 'ORGANIZATION_NOT_FOUND';
    throw error;
  }

  // Prevent non-owners from deleting organization
  if (organization.ownerId.toString() !== actorId.toString()) {
    const error = new Error('Only the organization Owner can delete this organization');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  organization.isActive = false;
  await organization.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.ORGANIZATION_DELETED,
    resourceType: 'organization',
    resourceId: orgId,
    metadata: { name: organization.name },
    req
  });

  return { message: 'Organization successfully deactivated' };
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganizationContext,
  updateOrganization,
  deleteOrganization
};

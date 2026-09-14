const Department = require('../models/Department');
const Membership = require('../models/Membership');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const getDepartments = async (orgId, userContext = null) => {
  const query = { organizationId: orgId };

  // If user role is department-scoped and not owner/admin, restrict to user's assigned departments
  if (
    userContext &&
    userContext.role?.scope === 'department' &&
    !userContext.isOrgOwner &&
    userContext.role?.name !== 'Admin'
  ) {
    const userDeptIds = (userContext.membership?.departmentIds || []).map((d) =>
      d._id ? d._id.toString() : d.toString()
    );
    query._id = { $in: userDeptIds };
  }

  const departments = await Department.find(query)
    .populate('managerIds', 'name email avatar')
    .sort({ name: 1 });

  const deptWithCounts = await Promise.all(
    departments.map(async (dept) => {
      const memberCount = await Membership.countDocuments({
        organizationId: orgId,
        departmentIds: dept._id,
        status: 'active'
      });
      return {
        ...dept.toObject(),
        memberCount
      };
    })
  );

  return deptWithCounts;
};

const createDepartment = async ({
  orgId,
  name,
  description = '',
  managerIds = [],
  actorId,
  req
}) => {
  const existingDept = await Department.findOne({
    organizationId: orgId,
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });

  if (existingDept) {
    const err = new Error('A department with this name already exists in this organization');
    err.statusCode = 409;
    throw err;
  }

  const department = await Department.create({
    organizationId: orgId,
    name: name.trim(),
    description,
    managerIds,
    createdBy: actorId
  });

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.DEPARTMENT_CREATED,
    resourceType: 'department',
    resourceId: department._id,
    departmentId: department._id,
    metadata: { name: department.name },
    req
  });

  return Department.findById(department._id).populate('managerIds', 'name email avatar');
};

const updateDepartment = async ({
  orgId,
  departmentId,
  name,
  description,
  managerIds,
  actorId,
  req
}) => {
  const department = await Department.findOne({
    _id: departmentId,
    organizationId: orgId
  });

  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }

  if (name) {
    const duplicate = await Department.findOne({
      organizationId: orgId,
      _id: { $ne: departmentId },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (duplicate) {
      const err = new Error('Another department already exists with that name');
      err.statusCode = 409;
      throw err;
    }
    department.name = name.trim();
  }

  if (description !== undefined) department.description = description;
  if (managerIds !== undefined) department.managerIds = managerIds;

  await department.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.DEPARTMENT_UPDATED,
    resourceType: 'department',
    resourceId: department._id,
    departmentId: department._id,
    metadata: { name: department.name },
    req
  });

  return Department.findById(department._id).populate('managerIds', 'name email avatar');
};

const deleteDepartment = async ({ orgId, departmentId, actorId, req }) => {
  const department = await Department.findOne({
    _id: departmentId,
    organizationId: orgId
  });

  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }

  // Remove this department reference from any memberships
  await Membership.updateMany(
    { organizationId: orgId, departmentIds: department._id },
    { $pull: { departmentIds: department._id } }
  );

  await Department.deleteOne({ _id: department._id });

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.DEPARTMENT_DELETED,
    resourceType: 'department',
    resourceId: department._id,
    metadata: { name: department.name },
    req
  });

  return { message: `Department '${department.name}' deleted successfully` };
};

const assignMembersToDepartment = async ({ orgId, departmentId, memberIds = [], actorId, req }) => {
  const department = await Department.findOne({ _id: departmentId, organizationId: orgId });
  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }

  await Membership.updateMany(
    { _id: { $in: memberIds }, organizationId: orgId },
    { $addToSet: { departmentIds: department._id } }
  );

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.MEMBER_UPDATED,
    resourceType: 'department',
    resourceId: department._id,
    departmentId: department._id,
    metadata: { memberCount: memberIds.length },
    req
  });

  return { message: `Added ${memberIds.length} member(s) to ${department.name}` };
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignMembersToDepartment
};

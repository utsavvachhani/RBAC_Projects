const memberService = require('../services/memberService');
const { apiSuccess } = require('../utils/helpers');

const getMembers = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      roleId: req.query.roleId,
      departmentId: req.query.departmentId,
      search: req.query.search
    };
    const members = await memberService.getOrganizationMembers(req.organization._id, filters);
    return apiSuccess(res, 'Members retrieved successfully', { members });
  } catch (error) {
    next(error);
  }
};

const createMember = async (req, res, next) => {
  try {
    const { name, email, password, roleId, departmentIds } = req.body;
    const member = await memberService.createMember({
      orgId: req.organization._id,
      name,
      email,
      password,
      roleId,
      departmentIds,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Member created successfully', { member }, 201);
  } catch (error) {
    next(error);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const { roleId } = req.body;
    const updatedMember = await memberService.assignRole({
      orgId: req.organization._id,
      memberId: req.params.memberId,
      newRoleId: roleId,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Role assigned successfully', { member: updatedMember });
  } catch (error) {
    next(error);
  }
};

const assignDepartments = async (req, res, next) => {
  try {
    const { departmentIds } = req.body;
    const updatedMember = await memberService.assignDepartments({
      orgId: req.organization._id,
      memberId: req.params.memberId,
      departmentIds,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Departments assigned successfully', { member: updatedMember });
  } catch (error) {
    next(error);
  }
};

const updateMemberStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await memberService.updateMemberStatus({
      orgId: req.organization._id,
      memberId: req.params.memberId,
      status,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Member status updated successfully', { member: updated });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const result = await memberService.removeMember({
      orgId: req.organization._id,
      memberId: req.params.memberId,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  createMember,
  assignRole,
  assignDepartments,
  updateMemberStatus,
  removeMember
};

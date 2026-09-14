const departmentService = require('../services/departmentService');
const { apiSuccess } = require('../utils/helpers');

const getDepartments = async (req, res, next) => {
  try {
    const userContext = {
      role: req.role,
      membership: req.membership,
      isOrgOwner: req.isOrgOwner
    };
    const departments = await departmentService.getDepartments(req.organization._id, userContext);
    return apiSuccess(res, 'Departments retrieved successfully', { departments });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, description, managerIds } = req.body;
    const department = await departmentService.createDepartment({
      orgId: req.organization._id,
      name,
      description,
      managerIds,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Department created successfully', { department }, 201);
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { name, description, managerIds } = req.body;
    const updated = await departmentService.updateDepartment({
      orgId: req.organization._id,
      departmentId: req.params.departmentId,
      name,
      description,
      managerIds,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Department updated successfully', { department: updated });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const result = await departmentService.deleteDepartment({
      orgId: req.organization._id,
      departmentId: req.params.departmentId,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

const assignMembers = async (req, res, next) => {
  try {
    const { memberIds } = req.body;
    const result = await departmentService.assignMembersToDepartment({
      orgId: req.organization._id,
      departmentId: req.params.departmentId,
      memberIds,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignMembers
};

const organizationService = require('../services/organizationService');
const { apiSuccess } = require('../utils/helpers');

const createOrganization = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = await organizationService.createOrganization({
      name,
      description,
      ownerId: req.user._id,
      req
    });
    return apiSuccess(res, 'Organization created successfully with default roles', result, 201);
  } catch (error) {
    next(error);
  }
};

const getUserOrganizations = async (req, res, next) => {
  try {
    const organizations = await organizationService.getUserOrganizations(req.user._id);
    return apiSuccess(res, 'Organizations retrieved successfully', { organizations });
  } catch (error) {
    next(error);
  }
};

const getOrganizationContext = async (req, res, next) => {
  try {
    const context = await organizationService.getOrganizationContext(req.params.organizationId, req.user._id);
    return apiSuccess(res, 'Organization context loaded', context);
  } catch (error) {
    next(error);
  }
};

const getOrganizationById = async (req, res, next) => {
  try {
    return apiSuccess(res, 'Organization loaded', { organization: req.organization });
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const updated = await organizationService.updateOrganization(
      req.organization._id,
      req.body,
      req.user._id,
      req
    );
    return apiSuccess(res, 'Organization updated successfully', { organization: updated });
  } catch (error) {
    next(error);
  }
};

const deleteOrganization = async (req, res, next) => {
  try {
    const result = await organizationService.deleteOrganization(
      req.organization._id,
      req.user._id,
      req
    );
    return apiSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganizationContext,
  getOrganizationById,
  updateOrganization,
  deleteOrganization
};

const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const { apiError } = require('../utils/helpers');

const requireOrganizationContext = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId || req.headers['x-organization-id'] || req.body.organizationId;

    if (!orgId) {
      return apiError(res, 'Organization ID is required to access this resource', 'ORGANIZATION_REQUIRED', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      return apiError(res, 'Invalid Organization ID format', 'INVALID_ID', 400);
    }

    const organization = await Organization.findById(orgId);
    if (!organization || !organization.isActive) {
      return apiError(res, 'Organization not found or inactive', 'ORGANIZATION_NOT_FOUND', 404);
    }

    // Look up membership for the authenticated user in this organization
    const membership = await Membership.findOne({
      userId: req.user._id,
      organizationId: organization._id
    }).populate('roleId').populate('departmentIds');

    if (!membership) {
      return apiError(res, 'Access denied: You are not a member of this organization', 'FORBIDDEN', 403);
    }

    if (membership.status !== 'active') {
      return apiError(res, `Access denied: Your membership is currently ${membership.status}`, 'FORBIDDEN', 403);
    }

    if (!membership.roleId) {
      return apiError(res, 'Access denied: No role is assigned to your membership', 'FORBIDDEN', 403);
    }

    req.organization = organization;
    req.membership = membership;
    req.role = membership.roleId;
    req.userPermissions = membership.roleId.permissions || [];
    req.isOrgOwner = organization.ownerId.toString() === req.user._id.toString() || membership.roleId.name === 'Owner';

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireOrganizationContext };

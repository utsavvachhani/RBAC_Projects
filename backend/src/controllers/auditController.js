const { getAuditLogs } = require('../services/auditService');
const { apiSuccess } = require('../utils/helpers');

const getOrganizationAuditLogs = async (req, res, next) => {
  try {
    const filters = {
      action: req.query.action,
      actorId: req.query.actorId,
      resourceType: req.query.resourceType,
      departmentId: req.query.departmentId
    };

    const pagination = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 50
    };

    const result = await getAuditLogs(req.organization._id, filters, pagination);
    return apiSuccess(res, 'Audit logs retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizationAuditLogs
};

const AuditLog = require('../models/AuditLog');
const LoginActivity = require('../models/LoginActivity');
const { parseClientInfo } = require('../utils/helpers');

const createAuditLog = async ({
  organizationId,
  actorId,
  action,
  resourceType,
  resourceId = null,
  targetUserId = null,
  departmentId = null,
  metadata = {},
  req = null
}) => {
  try {
    let ipAddress = '127.0.0.1';
    let userAgent = 'System';

    if (req) {
      const clientInfo = parseClientInfo(req);
      ipAddress = clientInfo.ipAddress;
      userAgent = clientInfo.userAgent;
    }

    const log = await AuditLog.create({
      organizationId,
      actorId,
      action,
      resourceType,
      resourceId,
      targetUserId,
      departmentId,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    return log;
  } catch (error) {
    console.error('[Audit Log Error]', error.message);
    // Audit log failure shouldn't crash the main business flow, but should be logged
    return null;
  }
};

const logLoginActivity = async ({
  userId,
  organizationId = null,
  event,
  success = true,
  req = null
}) => {
  try {
    let clientInfo = {
      ipAddress: '127.0.0.1',
      userAgent: 'System',
      device: 'Desktop',
      browser: 'Unknown',
      operatingSystem: 'Unknown',
      location: 'Local'
    };

    if (req) {
      clientInfo = {
        ...clientInfo,
        ...parseClientInfo(req)
      };
    }

    return await LoginActivity.create({
      userId,
      organizationId,
      event,
      success,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      device: clientInfo.device,
      browser: clientInfo.browser,
      operatingSystem: clientInfo.operatingSystem,
      location: clientInfo.location,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[Login Activity Error]', error.message);
    return null;
  }
};

const getAuditLogs = async (organizationId, filters = {}, pagination = { page: 1, limit: 50 }) => {
  const query = { organizationId };

  if (filters.action) {
    query.action = filters.action;
  }
  if (filters.actorId) {
    query.actorId = filters.actorId;
  }
  if (filters.resourceType) {
    query.resourceType = filters.resourceType;
  }
  if (filters.departmentId) {
    query.departmentId = filters.departmentId;
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pagination.limit)
      .populate('actorId', 'name email avatar')
      .populate('targetUserId', 'name email')
      .populate('departmentId', 'name'),
    AuditLog.countDocuments(query)
  ]);

  return {
    logs,
    total,
    page: pagination.page,
    totalPages: Math.ceil(total / pagination.limit)
  };
};

const getLoginActivities = async (userId, limit = 20) => {
  return LoginActivity.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = {
  createAuditLog,
  logLoginActivity,
  getAuditLogs,
  getLoginActivities
};

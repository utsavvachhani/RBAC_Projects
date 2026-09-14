const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { requireOrganizationContext } = require('../middleware/organization');
const { authorize } = require('../middleware/rbac');
const { PERMISSION_KEYS } = require('../constants/permissions');

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireOrganizationContext);

router.get('/', authorize(PERMISSION_KEYS.AUDIT_READ), auditController.getOrganizationAuditLogs);

module.exports = router;

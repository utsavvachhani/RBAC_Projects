const express = require('express');
const { body } = require('express-validator');
const invitationController = require('../controllers/invitationController');
const { authenticate } = require('../middleware/auth');
const { requireOrganizationContext } = require('../middleware/organization');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const { PERMISSION_KEYS } = require('../constants/permissions');

const router = express.Router({ mergeParams: true });

// Organization-scoped endpoints
router.get(
  '/',
  authenticate,
  requireOrganizationContext,
  authorize(PERMISSION_KEYS.MEMBER_READ),
  invitationController.getInvitations
);

router.post(
  '/',
  authenticate,
  requireOrganizationContext,
  authorize(PERMISSION_KEYS.MEMBER_INVITE),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('roleId').notEmpty().withMessage('Role ID is required'),
    validate
  ],
  invitationController.createInvitation
);

router.post(
  '/:invitationId/revoke',
  authenticate,
  requireOrganizationContext,
  authorize(PERMISSION_KEYS.MEMBER_INVITE),
  invitationController.revokeInvitation
);

router.post(
  '/:invitationId/resend',
  authenticate,
  requireOrganizationContext,
  authorize(PERMISSION_KEYS.MEMBER_INVITE),
  invitationController.resendInvitation
);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const organizationController = require('../controllers/organizationController');
const { authenticate } = require('../middleware/auth');
const { requireOrganizationContext } = require('../middleware/organization');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const { PERMISSION_KEYS } = require('../constants/permissions');

const router = express.Router();

// Organization listing and creation for logged-in user
router.get('/', authenticate, organizationController.getUserOrganizations);

router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Organization name is required'),
    body('description').optional().trim(),
    validate
  ],
  organizationController.createOrganization
);

// Load context for active organization
router.get('/:organizationId/context', authenticate, organizationController.getOrganizationContext);

// Organization specific endpoints
router.get(
  '/:organizationId',
  authenticate,
  requireOrganizationContext,
  authorize(PERMISSION_KEYS.ORGANIZATION_READ),
  organizationController.getOrganizationById
);

router.patch(
  '/:organizationId',
  authenticate,
  requireOrganizationContext,
  authorize(PERMISSION_KEYS.ORGANIZATION_UPDATE),
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'), validate],
  organizationController.updateOrganization
);

router.delete(
  '/:organizationId',
  authenticate,
  requireOrganizationContext,
  authorize(PERMISSION_KEYS.ORGANIZATION_DELETE),
  organizationController.deleteOrganization
);

module.exports = router;

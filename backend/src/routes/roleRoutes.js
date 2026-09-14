const express = require('express');
const { body } = require('express-validator');
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');
const { requireOrganizationContext } = require('../middleware/organization');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const { PERMISSION_KEYS } = require('../constants/permissions');

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireOrganizationContext);

router.get('/permissions', authorize(PERMISSION_KEYS.ROLE_READ), roleController.getAvailablePermissions);
router.get('/', authorize(PERMISSION_KEYS.ROLE_READ), roleController.getRoles);

router.post(
  '/',
  authorize(PERMISSION_KEYS.ROLE_CREATE),
  [
    body('name').trim().notEmpty().withMessage('Role name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array of permission keys'),
    body('scope').optional().isIn(['organization', 'department', 'personal']),
    validate
  ],
  roleController.createRole
);

router.patch(
  '/:roleId',
  authorize(PERMISSION_KEYS.ROLE_UPDATE),
  [
    body('permissions').optional().isArray(),
    body('scope').optional().isIn(['organization', 'department', 'personal']),
    validate
  ],
  roleController.updateRole
);

router.delete('/:roleId', authorize(PERMISSION_KEYS.ROLE_DELETE), roleController.deleteRole);

module.exports = router;

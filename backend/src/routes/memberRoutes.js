const express = require('express');
const { body } = require('express-validator');
const memberController = require('../controllers/memberController');
const { authenticate } = require('../middleware/auth');
const { requireOrganizationContext } = require('../middleware/organization');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const { PERMISSION_KEYS } = require('../constants/permissions');

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireOrganizationContext);

router.get('/', authorize(PERMISSION_KEYS.MEMBER_READ), memberController.getMembers);

router.post(
  '/',
  authorize(PERMISSION_KEYS.MEMBER_CREATE),
  [
    body('name').trim().notEmpty().withMessage('Member name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('roleId').notEmpty().withMessage('Role ID is required'),
    validate
  ],
  memberController.createMember
);

router.patch(
  '/:memberId/role',
  authorize(PERMISSION_KEYS.ROLE_ASSIGN),
  [body('roleId').notEmpty().withMessage('Role ID is required'), validate],
  memberController.assignRole
);

router.patch(
  '/:memberId/departments',
  authorize(PERMISSION_KEYS.MEMBER_UPDATE),
  [body('departmentIds').isArray().withMessage('departmentIds must be an array'), validate],
  memberController.assignDepartments
);

router.patch(
  '/:memberId/status',
  authorize(PERMISSION_KEYS.MEMBER_UPDATE),
  [
    body('status')
      .isIn(['active', 'suspended', 'pending'])
      .withMessage('Status must be active, suspended, or pending'),
    validate
  ],
  memberController.updateMemberStatus
);

router.delete('/:memberId', authorize(PERMISSION_KEYS.MEMBER_REMOVE), memberController.removeMember);

module.exports = router;

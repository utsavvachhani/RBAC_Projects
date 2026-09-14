const express = require('express');
const { body } = require('express-validator');
const departmentController = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');
const { requireOrganizationContext } = require('../middleware/organization');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const { PERMISSION_KEYS } = require('../constants/permissions');

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireOrganizationContext);

router.get('/', authorize(PERMISSION_KEYS.DEPARTMENT_READ), departmentController.getDepartments);

router.post(
  '/',
  authorize(PERMISSION_KEYS.DEPARTMENT_CREATE),
  [
    body('name').trim().notEmpty().withMessage('Department name is required'),
    body('description').optional().trim(),
    validate
  ],
  departmentController.createDepartment
);

router.patch(
  '/:departmentId',
  authorize(PERMISSION_KEYS.DEPARTMENT_UPDATE),
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'), validate],
  departmentController.updateDepartment
);

router.delete(
  '/:departmentId',
  authorize(PERMISSION_KEYS.DEPARTMENT_DELETE),
  departmentController.deleteDepartment
);

router.post(
  '/:departmentId/members',
  authorize(PERMISSION_KEYS.DEPARTMENT_UPDATE),
  [body('memberIds').isArray().withMessage('memberIds must be an array'), validate],
  departmentController.assignMembers
);

module.exports = router;

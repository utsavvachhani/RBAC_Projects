const express = require('express');
const { body } = require('express-validator');
const postController = require('../controllers/postController');
const { authenticate } = require('../middleware/auth');
const { requireOrganizationContext } = require('../middleware/organization');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validation');
const { PERMISSION_KEYS } = require('../constants/permissions');

const router = express.Router({ mergeParams: true });

router.use(authenticate, requireOrganizationContext);

router.get('/', authorize(PERMISSION_KEYS.POST_READ), postController.getPosts);

router.post(
  '/',
  authorize(PERMISSION_KEYS.POST_CREATE),
  [
    body('title').trim().notEmpty().withMessage('Post title is required'),
    body('description').trim().notEmpty().withMessage('Post description is required'),
    body('visibility').isIn(['organization', 'department', 'personal']),
    validate
  ],
  postController.createPost
);

router.patch(
  '/:postId',
  authorize(PERMISSION_KEYS.POST_UPDATE),
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('visibility').optional().isIn(['organization', 'department', 'personal']),
    validate
  ],
  postController.updatePost
);

router.delete('/:postId', authorize(PERMISSION_KEYS.POST_DELETE), postController.deletePost);

module.exports = router;

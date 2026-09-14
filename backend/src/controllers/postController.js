const postService = require('../services/postService');
const { apiSuccess } = require('../utils/helpers');

const getPosts = async (req, res, next) => {
  try {
    const posts = await postService.getPosts({
      orgId: req.organization._id,
      userId: req.user._id,
      membership: req.membership,
      role: req.role,
      isOrgOwner: req.isOrgOwner,
      filter: req.query.filter || 'all'
    });
    return apiSuccess(res, 'Posts retrieved successfully', { posts });
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, description, visibility, departmentId } = req.body;
    const post = await postService.createPost({
      orgId: req.organization._id,
      title,
      description,
      visibility,
      departmentId,
      authorId: req.user._id,
      userDeptIds: req.membership.departmentIds || [],
      isOrgOwner: req.isOrgOwner,
      role: req.role,
      req
    });
    return apiSuccess(res, 'Post published successfully', { post }, 201);
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { title, description, visibility, departmentId } = req.body;
    const updated = await postService.updatePost({
      orgId: req.organization._id,
      postId: req.params.postId,
      title,
      description,
      visibility,
      departmentId,
      userId: req.user._id,
      userDeptIds: req.membership.departmentIds || [],
      role: req.role,
      isOrgOwner: req.isOrgOwner,
      req
    });
    return apiSuccess(res, 'Post updated successfully', { post: updated });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const result = await postService.deletePost({
      orgId: req.organization._id,
      postId: req.params.postId,
      userId: req.user._id,
      userDeptIds: req.membership.departmentIds || [],
      role: req.role,
      isOrgOwner: req.isOrgOwner,
      req
    });
    return apiSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  createPost,
  updatePost,
  deletePost
};

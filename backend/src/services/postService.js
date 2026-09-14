const Post = require('../models/Post');
const Department = require('../models/Department');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const getPosts = async ({ orgId, userId, membership, role, isOrgOwner, filter = 'all' }) => {
  const userDeptIds = (membership?.departmentIds || []).map((d) =>
    d._id ? d._id.toString() : d.toString()
  );

  const isOwnerOrAdmin = isOrgOwner || role?.name === 'Admin';

  // Base visibility filters
  let orConditions = [];

  if (filter === 'organization') {
    orConditions.push({ visibility: 'organization' });
  } else if (filter === 'department') {
    if (isOwnerOrAdmin) {
      orConditions.push({ visibility: 'department' });
    } else {
      orConditions.push({
        visibility: 'department',
        departmentId: { $in: userDeptIds }
      });
    }
  } else if (filter === 'personal') {
    orConditions.push({ visibility: 'personal', authorId: userId });
  } else {
    // 'all' filter
    orConditions.push({ visibility: 'organization' });
    if (isOwnerOrAdmin) {
      orConditions.push({ visibility: 'department' });
    } else {
      orConditions.push({
        visibility: 'department',
        departmentId: { $in: userDeptIds }
      });
    }
    orConditions.push({ visibility: 'personal', authorId: userId });
  }

  const query = {
    organizationId: orgId,
    $or: orConditions
  };

  const posts = await Post.find(query)
    .populate('authorId', 'name email avatar')
    .populate('departmentId', 'name')
    .sort({ createdAt: -1 });

  return posts;
};

const createPost = async ({
  orgId,
  title,
  description,
  visibility = 'organization',
  departmentId = null,
  authorId,
  userDeptIds = [],
  isOrgOwner = false,
  role = null,
  req
}) => {
  if (visibility === 'department') {
    if (!departmentId) {
      const err = new Error('Department must be specified for department-level posts');
      err.statusCode = 400;
      throw err;
    }
    const dept = await Department.findOne({ _id: departmentId, organizationId: orgId });
    if (!dept) {
      const err = new Error('Department not found in this organization');
      err.statusCode = 404;
      throw err;
    }

    // Ensure non-admin users belong to the department they post in
    const isOwnerOrAdmin = isOrgOwner || role?.name === 'Admin';
    if (!isOwnerOrAdmin && !userDeptIds.map((id) => id.toString()).includes(departmentId.toString())) {
      const err = new Error('You can only publish department posts to your assigned department');
      err.statusCode = 403;
      throw err;
    }
  }

  const post = await Post.create({
    organizationId: orgId,
    departmentId: visibility === 'department' ? departmentId : null,
    authorId,
    title: title.trim(),
    description: description.trim(),
    visibility
  });

  await createAuditLog({
    organizationId: orgId,
    actorId: authorId,
    action: AUDIT_ACTIONS.POST_CREATED,
    resourceType: 'post',
    resourceId: post._id,
    departmentId: post.departmentId,
    metadata: { title: post.title, visibility: post.visibility },
    req
  });

  return Post.findById(post._id)
    .populate('authorId', 'name email avatar')
    .populate('departmentId', 'name');
};

const updatePost = async ({
  orgId,
  postId,
  title,
  description,
  visibility,
  departmentId,
  userId,
  userDeptIds = [],
  role = null,
  isOrgOwner = false,
  req
}) => {
  const post = await Post.findOne({ _id: postId, organizationId: orgId });
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }

  // Permission evaluation:
  // 1. Organization Owner can edit any post
  // 2. Author can edit their own post
  // 3. Admin can edit org/department posts
  // 4. Department Manager can edit posts within their department
  const isAuthor = post.authorId.toString() === userId.toString();
  const isOwner = isOrgOwner;
  const isAdmin = role?.name === 'Admin';
  const isDeptManagerInDept =
    role?.name === 'Department Manager' &&
    post.departmentId &&
    userDeptIds.map((id) => id.toString()).includes(post.departmentId.toString());

  if (!isAuthor && !isOwner && !isAdmin && !isDeptManagerInDept) {
    const err = new Error('You do not have permission to edit this post');
    err.statusCode = 403;
    throw err;
  }

  if (title) post.title = title.trim();
  if (description) post.description = description.trim();
  if (visibility) {
    post.visibility = visibility;
    post.departmentId = visibility === 'department' ? departmentId || post.departmentId : null;
  }

  await post.save();

  await createAuditLog({
    organizationId: orgId,
    actorId: userId,
    action: AUDIT_ACTIONS.POST_UPDATED,
    resourceType: 'post',
    resourceId: post._id,
    metadata: { title: post.title },
    req
  });

  return Post.findById(post._id)
    .populate('authorId', 'name email avatar')
    .populate('departmentId', 'name');
};

const deletePost = async ({
  orgId,
  postId,
  userId,
  userDeptIds = [],
  role = null,
  isOrgOwner = false,
  req
}) => {
  const post = await Post.findOne({ _id: postId, organizationId: orgId });
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }

  const isAuthor = post.authorId.toString() === userId.toString();
  const isOwner = isOrgOwner;
  const isAdmin = role?.name === 'Admin';
  const isDeptManagerInDept =
    role?.name === 'Department Manager' &&
    post.departmentId &&
    userDeptIds.map((id) => id.toString()).includes(post.departmentId.toString());

  if (!isAuthor && !isOwner && !isAdmin && !isDeptManagerInDept) {
    const err = new Error('You do not have permission to delete this post');
    err.statusCode = 403;
    throw err;
  }

  await Post.deleteOne({ _id: post._id });

  await createAuditLog({
    organizationId: orgId,
    actorId: userId,
    action: AUDIT_ACTIONS.POST_DELETED,
    resourceType: 'post',
    resourceId: post._id,
    metadata: { title: post.title },
    req
  });

  return { message: 'Post successfully deleted' };
};

module.exports = {
  getPosts,
  createPost,
  updatePost,
  deletePost
};

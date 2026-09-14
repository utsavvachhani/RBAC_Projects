const Invitation = require('../models/Invitation');
const Role = require('../models/Role');
const Membership = require('../models/Membership');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateRandomToken } = require('../utils/helpers');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { SYSTEM_ROLE_NAMES } = require('../constants/roles');
const { generateToken } = require('../utils/jwt');

const createInvitation = async ({
  orgId,
  email,
  roleId,
  departmentIds = [],
  actorId,
  req
}) => {
  const organization = await Organization.findById(orgId);
  if (!organization) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  const role = await Role.findOne({ _id: roleId, organizationId: orgId });
  if (!role) {
    const err = new Error('Selected role does not exist in this organization');
    err.statusCode = 400;
    throw err;
  }

  const isActorOwner = organization.ownerId.toString() === actorId.toString();
  if (role.name === SYSTEM_ROLE_NAMES.OWNER && !isActorOwner) {
    const err = new Error('Only the organization Owner can invite members with the Owner role');
    err.statusCode = 403;
    throw err;
  }

  // Check if existing active member
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const existingMembership = await Membership.findOne({
      userId: existingUser._id,
      organizationId: orgId,
      status: 'active'
    });
    if (existingMembership) {
      const err = new Error('User is already an active member of this organization');
      err.statusCode = 409;
      throw err;
    }
  }

  // Check for pending invitation
  const existingInvite = await Invitation.findOne({
    organizationId: orgId,
    email: email.toLowerCase(),
    status: 'pending',
    expiresAt: { $gt: Date.now() }
  });

  if (existingInvite) {
    const err = new Error('An active invitation for this email address is already pending');
    err.statusCode = 409;
    throw err;
  }

  const token = generateRandomToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await Invitation.create({
    organizationId: orgId,
    email: email.toLowerCase(),
    roleId,
    departmentIds,
    invitedBy: actorId,
    token,
    status: 'pending',
    expiresAt
  });

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.MEMBER_INVITED,
    resourceType: 'invitation',
    resourceId: invitation._id,
    metadata: { email: invitation.email, role: role.name },
    req
  });

  return Invitation.findById(invitation._id)
    .populate('roleId', 'name')
    .populate('departmentIds', 'name')
    .populate('invitedBy', 'name email');
};

const getOrganizationInvitations = async (orgId) => {
  return Invitation.find({ organizationId: orgId })
    .populate('roleId', 'name')
    .populate('departmentIds', 'name')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });
};

const acceptInvitation = async ({ token, name, password, req }) => {
  const invitation = await Invitation.findOne({ token })
    .populate('roleId')
    .populate('organizationId');

  if (!invitation) {
    const err = new Error('Invalid invitation token');
    err.statusCode = 404;
    throw err;
  }

  if (invitation.status !== 'pending') {
    const err = new Error(`This invitation has already been ${invitation.status}`);
    err.statusCode = 400;
    throw err;
  }

  if (new Date() > invitation.expiresAt) {
    invitation.status = 'expired';
    await invitation.save();
    const err = new Error('This invitation has expired');
    err.statusCode = 400;
    throw err;
  }

  // Find or create user
  let user = await User.findOne({ email: invitation.email });
  if (!user) {
    if (!password) {
      const err = new Error('Password is required to register a new account');
      err.statusCode = 400;
      throw err;
    }
    const passwordHash = await User.hashPassword(password);
    user = await User.create({
      name: name || invitation.email.split('@')[0],
      email: invitation.email,
      passwordHash
    });
  }

  // Create membership
  let membership = await Membership.findOne({
    userId: user._id,
    organizationId: invitation.organizationId._id
  });

  if (membership) {
    membership.status = 'active';
    membership.roleId = invitation.roleId._id;
    membership.departmentIds = invitation.departmentIds;
    await membership.save();
  } else {
    membership = await Membership.create({
      userId: user._id,
      organizationId: invitation.organizationId._id,
      roleId: invitation.roleId._id,
      departmentIds: invitation.departmentIds,
      status: 'active',
      invitedBy: invitation.invitedBy,
      joinedAt: new Date()
    });
  }

  invitation.status = 'accepted';
  invitation.acceptedAt = new Date();
  await invitation.save();

  await createAuditLog({
    organizationId: invitation.organizationId._id,
    actorId: user._id,
    action: AUDIT_ACTIONS.MEMBER_JOINED,
    resourceType: 'member',
    resourceId: membership._id,
    targetUserId: user._id,
    metadata: { invitationToken: token },
    req
  });

  const authToken = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email
    },
    organization: invitation.organizationId,
    token: authToken
  };
};

const revokeInvitation = async ({ orgId, invitationId, actorId, req }) => {
  const invitation = await Invitation.findOne({ _id: invitationId, organizationId: orgId });
  if (!invitation) {
    const err = new Error('Invitation not found');
    err.statusCode = 404;
    throw err;
  }

  invitation.status = 'revoked';
  await invitation.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.MEMBER_REMOVED,
    resourceType: 'invitation',
    resourceId: invitation._id,
    metadata: { email: invitation.email, status: 'revoked' },
    req
  });

  return { message: 'Invitation successfully revoked' };
};

const resendInvitation = async ({ orgId, invitationId, actorId, req }) => {
  const invitation = await Invitation.findOne({ _id: invitationId, organizationId: orgId });
  if (!invitation) {
    const err = new Error('Invitation not found');
    err.statusCode = 404;
    throw err;
  }

  invitation.token = generateRandomToken(32);
  invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  invitation.status = 'pending';
  await invitation.save();

  await createAuditLog({
    organizationId: orgId,
    actorId,
    action: AUDIT_ACTIONS.MEMBER_INVITED,
    resourceType: 'invitation',
    resourceId: invitation._id,
    metadata: { email: invitation.email, resent: true },
    req
  });

  return invitation;
};

module.exports = {
  createInvitation,
  getOrganizationInvitations,
  acceptInvitation,
  revokeInvitation,
  resendInvitation
};

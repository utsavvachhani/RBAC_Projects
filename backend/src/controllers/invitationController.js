const invitationService = require('../services/invitationService');
const { apiSuccess } = require('../utils/helpers');
const { setTokenCookie } = require('../utils/jwt');

const getInvitations = async (req, res, next) => {
  try {
    const invitations = await invitationService.getOrganizationInvitations(req.organization._id);
    return apiSuccess(res, 'Invitations retrieved successfully', { invitations });
  } catch (error) {
    next(error);
  }
};

const createInvitation = async (req, res, next) => {
  try {
    const { email, roleId, departmentIds } = req.body;
    const invitation = await invitationService.createInvitation({
      orgId: req.organization._id,
      email,
      roleId,
      departmentIds,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Invitation sent successfully', { invitation }, 201);
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;
    const result = await invitationService.acceptInvitation({
      token,
      name,
      password,
      req
    });
    setTokenCookie(res, result.token);
    return apiSuccess(res, 'Invitation accepted successfully', result);
  } catch (error) {
    next(error);
  }
};

const revokeInvitation = async (req, res, next) => {
  try {
    const result = await invitationService.revokeInvitation({
      orgId: req.organization._id,
      invitationId: req.params.invitationId,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

const resendInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.resendInvitation({
      orgId: req.organization._id,
      invitationId: req.params.invitationId,
      actorId: req.user._id,
      req
    });
    return apiSuccess(res, 'Invitation renewed and resent', { invitation });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvitations,
  createInvitation,
  acceptInvitation,
  revokeInvitation,
  resendInvitation
};

const authService = require('../services/authService');
const { getLoginActivities } = require('../services/auditService');
const { apiSuccess, apiError } = require('../utils/helpers');
const { setTokenCookie, clearTokenCookie } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password, req });
    setTokenCookie(res, result.token);
    return apiSuccess(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password, req });
    setTokenCookie(res, result.token);
    return apiSuccess(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout({ user: req.user, req });
    clearTokenCookie(res);
    return apiSuccess(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return apiSuccess(res, 'Current user loaded', { user: req.user });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return apiSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword({ token, newPassword, req });
    return apiSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

const getMyLoginActivities = async (req, res, next) => {
  try {
    const activities = await getLoginActivities(req.user._id);
    return apiSuccess(res, 'Login activities loaded', { activities });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  getMyLoginActivities
};

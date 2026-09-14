const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { logLoginActivity } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const register = async ({ name, email, password, req }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    error.code = 'USER_EXISTS';
    throw error;
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash
  });

  const token = generateToken(user._id);

  await logLoginActivity({
    userId: user._id,
    event: AUDIT_ACTIONS.LOGIN_SUCCESS,
    success: true,
    req
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt
    },
    token
  };
};

const login = async ({ email, password, req }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    await logLoginActivity({
      userId: null,
      event: AUDIT_ACTIONS.LOGIN_FAILED,
      success: false,
      req
    });
    const error = new Error('Invalid email or password credentials');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated. Please contact an administrator.');
    error.statusCode = 403;
    error.code = 'ACCOUNT_DEACTIVATED';
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await logLoginActivity({
      userId: user._id,
      event: AUDIT_ACTIONS.LOGIN_FAILED,
      success: false,
      req
    });
    const error = new Error('Invalid email or password credentials');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = generateToken(user._id);

  await logLoginActivity({
    userId: user._id,
    event: AUDIT_ACTIONS.LOGIN_SUCCESS,
    success: true,
    req
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt
    },
    token
  };
};

const logout = async ({ user, req }) => {
  if (user) {
    await logLoginActivity({
      userId: user._id,
      event: AUDIT_ACTIONS.LOGOUT,
      success: true,
      req
    });
  }
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const error = new Error('User not found or inactive');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }
  return user;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Return generic success message to prevent user enumeration
    return { message: 'If that email exists in our records, a reset token has been created.' };
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  // In production, send email; in development, return token for testing
  return {
    message: 'Reset instructions have been generated.',
    resetToken
  };
};

const resetPassword = async ({ token, newPassword, req }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+passwordHash +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    const error = new Error('Invalid or expired password reset token');
    error.statusCode = 400;
    error.code = 'INVALID_RESET_TOKEN';
    throw error;
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await logLoginActivity({
    userId: user._id,
    event: AUDIT_ACTIONS.PASSWORD_RESET,
    success: true,
    req
  });

  return { message: 'Password has been successfully updated' };
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword
};

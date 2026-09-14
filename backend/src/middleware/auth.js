const { verifyToken } = require('../utils/jwt');
const { apiError } = require('../utils/helpers');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return apiError(res, 'Authentication token missing or invalid', 'UNAUTHORIZED', 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return apiError(res, 'Token has expired or is invalid', 'UNAUTHORIZED', 401);
    }

    const user = await User.findById(decoded.sub).select('+passwordHash');
    if (!user || !user.isActive) {
      return apiError(res, 'User account is inactive or no longer exists', 'UNAUTHORIZED', 401);
    }

    // Do not leak passwordHash onto req.user
    user.passwordHash = undefined;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };

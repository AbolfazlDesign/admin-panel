// server/src/utils/helpers.js
const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

const formatResponse = (success, data = null, message = "") => {
  return { success, data, message, timestamp: new Date().toISOString() };
};

const paginate = (page = 1, limit = 10) => {
  const offset = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  return { limit: Math.min(100, Math.max(1, limit)), offset };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  formatResponse,
  paginate,
};

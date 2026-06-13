// server/src/middleware/roleCheck.js
const { formatResponse } = require("../utils/helpers");

const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json(formatResponse(false, null, "احراز هویت الزامی است"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json(formatResponse(false, null, "دسترسی غیرمجاز"));
    }

    next();
  };
};

module.exports = roleCheck;

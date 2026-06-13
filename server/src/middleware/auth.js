// server/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");
const { formatResponse } = require("../utils/helpers");

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(formatResponse(false, null, "توکن احراز هویت یافت نشد"));
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      "SELECT id, name, email, role, is_active FROM users WHERE id = $1",
      [decoded.id],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json(formatResponse(false, null, "کاربر یافت نشد"));
    }

    if (!result.rows[0].is_active) {
      return res
        .status(403)
        .json(formatResponse(false, null, "حساب کاربری غیرفعال است"));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json(formatResponse(false, null, "توکن منقضی شده"));
    }
    return res.status(401).json(formatResponse(false, null, "توکن نامعتبر"));
  }
};

module.exports = authenticate;

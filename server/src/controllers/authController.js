// server/src/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
  formatResponse,
} = require("../utils/helpers");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check existing user
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json(formatResponse(false, null, "ایمیل قبلاً ثبت شده"));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (name, email, password) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword],
    );

    const user = result.rows[0];

    // Assign free plan
    const freePlan = await query("SELECT id FROM plans WHERE name = 'free'");
    if (freePlan.rows.length > 0) {
      await query(
        `INSERT INTO subscriptions (user_id, plan_id, expires_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 days')`,
        [user.id, freePlan.rows[0].id],
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')`,
      [user.id, refreshToken],
    );

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, ip_address) VALUES ($1, $2, $3)`,
      [user.id, "register", req.ip],
    );

    res.status(201).json(
      formatResponse(
        true,
        {
          user,
          accessToken,
          refreshToken,
        },
        "ثبت‌نام موفق",
      ),
    );
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query(
      "SELECT id, name, email, password, role, is_active FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json(formatResponse(false, null, "ایمیل یا رمز عبور اشتباه"));
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res
        .status(403)
        .json(formatResponse(false, null, "حساب غیرفعال است"));
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json(formatResponse(false, null, "ایمیل یا رمز عبور اشتباه"));
    }

    // Update last login
    await query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token (remove old ones first)
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [user.id]);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')`,
      [user.id, refreshToken],
    );

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, ip_address) VALUES ($1, $2, $3)`,
      [user.id, "login", req.ip],
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json(
      formatResponse(
        true,
        {
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        },
        "ورود موفق",
      ),
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json(formatResponse(false, null, "توکن الزامی است"));
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Check in database
    const stored = await query(
      "SELECT * FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > CURRENT_TIMESTAMP",
      [decoded.id, token],
    );

    if (stored.rows.length === 0) {
      return res.status(401).json(formatResponse(false, null, "توکن نامعتبر"));
    }

    // Get user
    const userResult = await query(
      "SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true",
      [decoded.id],
    );

    if (userResult.rows.length === 0) {
      return res
        .status(401)
        .json(formatResponse(false, null, "کاربر یافت نشد"));
    }

    const user = userResult.rows[0];
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [user.id]);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')`,
      [user.id, newRefreshToken],
    );

    res.json(
      formatResponse(
        true,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        "توکن تمدید شد",
      ),
    );
  } catch (error) {
    return res.status(401).json(formatResponse(false, null, "توکن نامعتبر"));
  }
};

const logout = async (req, res) => {
  try {
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [req.user.id]);
    await query(
      `INSERT INTO activity_logs (user_id, action, ip_address) VALUES ($1, $2, $3)`,
      [req.user.id, "logout", req.ip],
    );
    res.json(formatResponse(true, null, "خروج موفق"));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at, u.last_login,
              s.status as sub_status, p.display_name as plan_name, s.expires_at as sub_expires
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE u.id = $1`,
      [req.user.id],
    );

    res.json(formatResponse(true, result.rows[0], "پروفایل"));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

module.exports = { register, login, refreshToken, logout, getProfile };

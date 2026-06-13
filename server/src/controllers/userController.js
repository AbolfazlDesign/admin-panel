// server/src/controllers/userController.js
const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const { formatResponse, paginate } = require("../utils/helpers");

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    const { limit: lim, offset } = paginate(page, limit);

    let whereClause = "WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereClause += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // Count
    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params,
    );

    // Users
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.last_login, u.created_at,
              s.status as sub_status, p.display_name as plan_name
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       LEFT JOIN plans p ON s.plan_id = p.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, lim, offset],
    );

    const total = parseInt(countResult.rows[0].count);

    res.json(
      formatResponse(true, {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: lim,
          total,
          pages: Math.ceil(total / lim),
        },
      }),
    );
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const getUser = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.avatar, u.last_login, u.created_at,
              s.status as sub_status, p.display_name as plan_name, s.expires_at
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE u.id = $1`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, null, "کاربر یافت نشد"));
    }

    // Get activity log
    const activities = await query(
      `SELECT action, created_at, ip_address FROM activity_logs 
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [req.params.id],
    );

    res.json(
      formatResponse(true, {
        ...result.rows[0],
        activities: activities.rows,
      }),
    );
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, is_active } = req.body;
    const { id } = req.params;

    // Check if email taken by another user
    if (email) {
      const emailCheck = await query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, id],
      );
      if (emailCheck.rows.length > 0) {
        return res
          .status(409)
          .json(formatResponse(false, null, "ایمیل تکراری"));
      }
    }

    const result = await query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, name, email, role, is_active`,
      [name, email, role, is_active, id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, null, "کاربر یافت نشد"));
    }

    // Log
    await query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [req.user.id, "update_user", JSON.stringify({ target: id }), req.ip],
    );

    res.json(formatResponse(true, result.rows[0], "بروزرسانی موفق"));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res
        .status(400)
        .json(formatResponse(false, null, "نمی‌توانید خودتان را حذف کنید"));
    }

    const result = await query(
      "DELETE FROM users WHERE id = $1 RETURNING id, email",
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, null, "کاربر یافت نشد"));
    }

    await query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [
        req.user.id,
        "delete_user",
        JSON.stringify({ deleted: result.rows[0].email }),
        req.ip,
      ],
    );

    res.json(formatResponse(true, null, "کاربر حذف شد"));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

module.exports = { getUsers, getUser, updateUser, deleteUser };

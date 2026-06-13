// server/src/controllers/subscriptionController.js
const { query } = require("../config/db");
const { formatResponse } = require("../utils/helpers");

const getPlans = async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM plans WHERE is_active = true ORDER BY price ASC",
    );
    res.json(formatResponse(true, result.rows));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const subscribe = async (req, res) => {
  try {
    const { plan_id } = req.body;
    const user_id = req.user.id;

    // Check plan exists
    const plan = await query(
      "SELECT * FROM plans WHERE id = $1 AND is_active = true",
      [plan_id],
    );
    if (plan.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, "پلن یافت نشد"));
    }

    // Deactivate current subscription
    await query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND status = 'active'`,
      [user_id],
    );

    // Create new subscription
    const result = await query(
      `INSERT INTO subscriptions (user_id, plan_id, expires_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '1 day' * $3)
       RETURNING *`,
      [user_id, plan_id, plan.rows[0].duration_days],
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [
        user_id,
        "subscribe",
        JSON.stringify({ plan: plan.rows[0].display_name }),
        req.ip,
      ],
    );

    res.status(201).json(
      formatResponse(
        true,
        {
          subscription: result.rows[0],
          plan: plan.rows[0],
        },
        "اشتراک فعال شد",
      ),
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const getMySubscription = async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, p.display_name, p.price, p.features, p.name as plan_type
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 5`,
      [req.user.id],
    );

    const active = result.rows.find((s) => s.status === "active") || null;

    res.json(formatResponse(true, { active, history: result.rows }));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const result = await query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'active'
       RETURNING *`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, null, "اشتراک فعالی یافت نشد"));
    }

    res.json(formatResponse(true, result.rows[0], "اشتراک لغو شد"));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, u.name as user_name, u.email, p.display_name as plan_name, p.price
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN plans p ON s.plan_id = p.id
       ORDER BY s.created_at DESC
       LIMIT 100`,
    );

    res.json(formatResponse(true, result.rows));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

module.exports = {
  getPlans,
  subscribe,
  getMySubscription,
  cancelSubscription,
  getAllSubscriptions,
};

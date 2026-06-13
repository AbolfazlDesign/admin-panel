// server/src/controllers/dashboardController.js
const { query } = require("../config/db");
const { formatResponse } = require("../utils/helpers");

const getStats = async (req, res) => {
  try {
    // Total users
    const usersCount = await query("SELECT COUNT(*) FROM users");

    // Active subscriptions
    const activeSubs = await query(
      "SELECT COUNT(*) FROM subscriptions WHERE status = 'active'",
    );

    // Revenue (this month)
    const revenue = await query(
      `SELECT COALESCE(SUM(p.price), 0) as total
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
       AND s.status != 'cancelled'`,
    );

    // New users this week
    const newUsers = await query(
      `SELECT COUNT(*) FROM users 
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`,
    );

    // Users by role
    const roleStats = await query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`,
    );

    // Subscription by plan
    const planStats = await query(
      `SELECT p.display_name, COUNT(s.id) as count
       FROM plans p
       LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
       GROUP BY p.id, p.display_name
       ORDER BY count DESC`,
    );

    // Daily registrations (last 30 days)
    const dailyRegs = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
    );

    // Recent activity
    const recentActivity = await query(
      `SELECT al.action, al.created_at, u.name, u.email
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 15`,
    );

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await query(
      `SELECT 
        TO_CHAR(s.created_at, 'YYYY-MM') as month,
        COALESCE(SUM(p.price), 0) as revenue,
        COUNT(s.id) as count
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.created_at >= CURRENT_DATE - INTERVAL '6 months'
       AND s.status != 'cancelled'
       GROUP BY TO_CHAR(s.created_at, 'YYYY-MM')
       ORDER BY month`,
    );

    res.json(
      formatResponse(true, {
        overview: {
          totalUsers: parseInt(usersCount.rows[0].count),
          activeSubscriptions: parseInt(activeSubs.rows[0].count),
          monthlyRevenue: parseFloat(revenue.rows[0].total),
          newUsersThisWeek: parseInt(newUsers.rows[0].count),
        },
        roleStats: roleStats.rows,
        planStats: planStats.rows,
        dailyRegistrations: dailyRegs.rows,
        recentActivity: recentActivity.rows,
        monthlyRevenue: monthlyRevenue.rows,
      }),
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json(formatResponse(false, null, "خطای سرور"));
  }
};

module.exports = { getStats };

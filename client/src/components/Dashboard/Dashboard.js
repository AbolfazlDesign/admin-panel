// client/src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from "react";
import Layout from "../Layout/Layout";
import StatCard from "./StatCard";
import { BarChartComponent, PieChartComponent } from "./Chart";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isManager } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isManager()) {
          const res = await api.get("/dashboard/stats");
          setStats(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isManager]);

  if (loading) {
    return (
      <Layout title="داشبورد">
        <div className="loading">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!isManager()) {
    return (
      <Layout title="داشبورد">
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="icon">👋</div>
              <h4>خوش آمدید!</h4>
              <p>از منوی سمت راست به بخش‌های مختلف دسترسی داشته باشید</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stats) return null;

  const {
    overview,
    planStats,
    dailyRegistrations,
    recentActivity,
    monthlyRevenue,
  } = stats;

  // Format daily registrations for chart
  const chartData = dailyRegistrations.map((d) => ({
    date: new Date(d.date).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    }),
    count: parseInt(d.count),
  }));

  const revenueData = monthlyRevenue.map((m) => ({
    month: m.month,
    revenue: parseFloat(m.revenue) / 1000, // هزار تومان
    count: parseInt(m.count),
  }));

  return (
    <Layout title="داشبورد">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon="👥"
          label="کل کاربران"
          value={overview.totalUsers}
          change={`${overview.newUsersThisWeek} این هفته`}
          changeType="up"
          colorClass="blue"
        />
        <StatCard
          icon="💎"
          label="اشتراک فعال"
          value={overview.activeSubscriptions}
          colorClass="green"
        />
        <StatCard
          icon="💰"
          label="درآمد ماهانه"
          value={`${(overview.monthlyRevenue / 1000).toFixed(0)}K`}
          colorClass="orange"
        />
        <StatCard
          icon="📈"
          label="کاربران جدید هفته"
          value={overview.newUsersThisWeek}
          colorClass="purple"
        />
      </div>

      {/* Charts */}
      <div className="dashboard-grid">
        <BarChartComponent
          data={
            chartData.length > 0 ? chartData : [{ date: "امروز", count: 0 }]
          }
          xKey="date"
          yKey="count"
          title="ثبت‌نام روزانه (۳۰ روز اخیر)"
        />
        <PieChartComponent
          data={planStats.filter((p) => parseInt(p.count) > 0)}
          title="توزیع اشتراک‌ها"
        />
      </div>

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <BarChartComponent
            data={revenueData}
            xKey="month"
            yKey="revenue"
            title="درآمد ماهانه (هزار تومان)"
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3>فعالیت‌های اخیر</h3>
        </div>
        <div className="card-body">
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <p>فعالیتی ثبت نشده</p>
            </div>
          ) : (
            <ul className="activity-list">
              {recentActivity.map((activity, i) => (
                <li key={i} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <div>
                      <strong>{activity.name || "سیستم"}</strong> —{" "}
                      {activity.action}
                    </div>
                    <div className="activity-time">
                      {new Date(activity.created_at).toLocaleString("fa-IR")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

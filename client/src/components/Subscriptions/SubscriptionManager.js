// client/src/components/Subscriptions/SubscriptionManager.js
import React, { useState, useEffect } from "react";
import Layout from "../Layout/Layout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const SubscriptionManager = () => {
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [allSubs, setAllSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("plans"); // plans | history | all
  const { isManager } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, mySubRes] = await Promise.all([
          api.get("/subscriptions/plans"),
          api.get("/subscriptions/my"),
        ]);
        setPlans(plansRes.data.data);
        setMySubscription(mySubRes.data.data);

        if (isManager()) {
          const allRes = await api.get("/subscriptions/all");
          setAllSubs(allRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isManager]);

  const handleSubscribe = async (planId) => {
    try {
      await api.post("/subscriptions/subscribe", { plan_id: planId });
      toast.success("اشتراک فعال شد! 🎉");
      // Refresh
      const mySubRes = await api.get("/subscriptions/my");
      setMySubscription(mySubRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "خطا");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("آیا از لغو اشتراک مطمئن هستید؟")) return;
    try {
      await api.post("/subscriptions/cancel");
      toast.success("اشتراک لغو شد");
      const mySubRes = await api.get("/subscriptions/my");
      setMySubscription(mySubRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "خطا");
    }
  };

  if (loading) {
    return (
      <Layout title="اشتراک‌ها">
        <div className="loading">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  const statusLabels = {
    active: "فعال",
    inactive: "غیرفعال",
    expired: "منقضی",
    cancelled: "لغو شده",
  };

  const statusColors = {
    active: "green",
    inactive: "gray",
    expired: "yellow",
    cancelled: "red",
  };

  return (
    <Layout title="اشتراک‌ها">
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          className={`btn ${tab === "plans" ? "btn-primary" : "btn-outline"} btn-sm`}
          onClick={() => setTab("plans")}
        >
          💎 پلن‌ها
        </button>
        <button
          className={`btn ${tab === "history" ? "btn-primary" : "btn-outline"} btn-sm`}
          onClick={() => setTab("history")}
        >
          📜 تاریخچه من
        </button>
        {isManager() && (
          <button
            className={`btn ${tab === "all" ? "btn-primary" : "btn-outline"} btn-sm`}
            onClick={() => setTab("all")}
          >
            📋 همه اشتراک‌ها
          </button>
        )}
      </div>

      {/* Current Subscription Banner */}
      {mySubscription?.active && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            background: "#f0fdf4",
            borderColor: "#86efac",
          }}
        >
          <div
            className="card-body"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>
                ✅ اشتراک فعال: {mySubscription.active.display_name}
              </h3>
              <p style={{ fontSize: 13, color: "var(--gray)" }}>
                انقضا:{" "}
                {new Date(mySubscription.active.expires_at).toLocaleDateString(
                  "fa-IR",
                )}
              </p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleCancel}>
              لغو اشتراک
            </button>
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {tab === "plans" && (
        <div className="plans-grid">
          {plans.map((plan) => {
            const isActive = mySubscription?.active?.plan_type === plan.name;
            const features =
              typeof plan.features === "string"
                ? JSON.parse(plan.features)
                : plan.features;

            return (
              <div
                key={plan.id}
                className={`plan-card ${plan.name === "premium" ? "popular" : ""} ${isActive ? "active" : ""}`}
              >
                <h3 className="plan-name">{plan.display_name}</h3>
                <div className="plan-price">
                  {plan.price === "0.00" || plan.price === 0
                    ? "رایگان"
                    : `${parseInt(plan.price).toLocaleString("fa-IR")}`}
                  {plan.price > 0 && <span> تومان/ماه</span>}
                </div>

                <ul className="plan-features">
                  {features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>

                {isActive ? (
                  <button
                    className="btn btn-success"
                    style={{ width: "100%" }}
                    disabled
                  >
                    ✅ فعال
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    انتخاب پلن
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="card">
          <div className="table-container">
            {!mySubscription?.history?.length ? (
              <div className="empty-state">
                <div className="icon">📜</div>
                <h4>تاریخچه‌ای ندارید</h4>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>پلن</th>
                    <th>وضعیت</th>
                    <th>شروع</th>
                    <th>انقضا</th>
                  </tr>
                </thead>
                <tbody>
                  {mySubscription.history.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <strong>{sub.display_name}</strong>
                      </td>
                      <td>
                        <span className={`badge ${statusColors[sub.status]}`}>
                          {statusLabels[sub.status]}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {new Date(sub.starts_at).toLocaleDateString("fa-IR")}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {new Date(sub.expires_at).toLocaleDateString("fa-IR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* All Subscriptions Tab (Admin) */}
      {tab === "all" && isManager() && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>ایمیل</th>
                  <th>پلن</th>
                  <th>مبلغ</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {allSubs.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong style={{ fontSize: 13 }}>{sub.user_name}</strong>
                    </td>
                    <td
                      style={{
                        direction: "ltr",
                        textAlign: "right",
                        fontSize: 13,
                      }}
                    >
                      {sub.email}
                    </td>
                    <td>{sub.plan_name}</td>
                    <td style={{ fontSize: 13 }}>
                      {parseInt(sub.price).toLocaleString("fa-IR")} تومان
                    </td>
                    <td>
                      <span className={`badge ${statusColors[sub.status]}`}>
                        {statusLabels[sub.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {new Date(sub.created_at).toLocaleDateString("fa-IR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SubscriptionManager;

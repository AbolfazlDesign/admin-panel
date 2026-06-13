// client/src/components/Layout/Sidebar.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  {
    section: "منو اصلی",
    items: [
      {
        path: "/dashboard",
        label: "داشبورد",
        icon: "📊",
        roles: ["admin", "manager", "user"],
      },
      {
        path: "/users",
        label: "مدیریت کاربران",
        icon: "👥",
        roles: ["admin", "manager"],
      },
      {
        path: "/subscriptions",
        label: "اشتراک‌ها",
        icon: "💎",
        roles: ["admin", "manager", "user"],
      },
    ],
  },
  {
    section: "تنظیمات",
    items: [
      {
        path: "/profile",
        label: "پروفایل",
        icon: "👤",
        roles: ["admin", "manager", "user"],
      },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavigate = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="logo">⚡</div>
        <div>
          <h2>پنل مدیریت</h2>
          <span>نسخه ۱.۰</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((section, i) => (
          <div className="nav-section" key={i}>
            <div className="nav-section-title">{section.section}</div>
            {section.items
              .filter((item) => item.roles.includes(user?.role))
              .map((item) => (
                <button
                  key={item.path}
                  className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-item"
          onClick={logout}
          style={{ color: "#f87171" }}
        >
          <span className="icon">🚪</span>
          خروج
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

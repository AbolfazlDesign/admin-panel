// client/src/components/Layout/Header.js
import React from "react";
import { useAuth } from "../../context/AuthContext";

const roleLabels = {
  admin: "مدیر کل",
  manager: "مدیر",
  user: "کاربر",
};

const Header = ({ title, onMenuToggle }) => {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="btn-icon"
          onClick={onMenuToggle}
          style={{ display: "none" }}
        >
          ☰
        </button>
        <h1>{title}</h1>
      </div>

      <div className="header-right">
        <div className="user-menu">
          <div className="user-avatar">{user?.name?.charAt(0)}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="role">{roleLabels[user?.role] || user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

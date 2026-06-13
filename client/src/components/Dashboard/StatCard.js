// client/src/components/Dashboard/StatCard.js
import React from "react";

const StatCard = ({ icon, label, value, change, changeType, colorClass }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}>{icon}</div>
      <div className="stat-info">
        <h4>
          {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
        </h4>
        <p>{label}</p>
        {change && (
          <div className={`change ${changeType === "up" ? "up" : "down"}`}>
            {changeType === "up" ? "↑" : "↓"} {change}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

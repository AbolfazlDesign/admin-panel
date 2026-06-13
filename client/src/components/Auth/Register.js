// client/src/components/Auth/Register.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیست");
      return;
    }

    if (form.password.length < 6) {
      setError("رمز عبور حداقل ۶ کاراکتر");
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="logo">⚡</div>
          <h1>ثبت‌نام</h1>
          <p>حساب جدید بسازید</p>
        </div>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>نام و نام‌خانوادگی</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="علی احمدی"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>ایمیل</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label>رمز عبور</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="حداقل ۶ کاراکتر"
              value={form.password}
              onChange={handleChange}
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label>تکرار رمز عبور</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "صبر کنید..." : "ثبت‌نام"}
          </button>
        </form>

        <div className="auth-footer">
          حساب دارید؟ <Link to="/login">ورود</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

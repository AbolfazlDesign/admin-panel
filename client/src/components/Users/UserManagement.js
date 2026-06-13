// client/src/components/Users/UserManagement.js
import React, { useState, useEffect, useCallback } from "react";
import Layout from "../Layout/Layout";
import Modal from "../common/Modal";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const roleLabels = { admin: "مدیر کل", manager: "مدیر", user: "کاربر" };
const roleBadgeColors = { admin: "purple", manager: "blue", user: "gray" };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    is_active: true,
  });
  const { isAdmin } = useAuth();

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (roleFilter) params.role = roleFilter;

        const res = await api.get("/users", { params });
        setUsers(res.data.data.users);
        setPagination(res.data.data.pagination);
      } catch (error) {
        toast.error("خطا در دریافت کاربران");
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter],
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/users/${selectedUser.id}`, editForm);
      toast.success("کاربر بروزرسانی شد");
      setEditModal(false);
      fetchUsers(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || "خطا در بروزرسانی");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      toast.success("کاربر حذف شد");
      setDeleteModal(false);
      fetchUsers(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || "خطا در حذف");
    }
  };

  return (
    <Layout title="مدیریت کاربران">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="جستجوی نام یا ایمیل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingRight: 40 }}
          />
        </div>
        <div className="toolbar-right">
          <select
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: "auto", minWidth: 140 }}
          >
            <option value="">همه نقش‌ها</option>
            <option value="admin">مدیر کل</option>
            <option value="manager">مدیر</option>
            <option value="user">کاربر</option>
          </select>
          <span style={{ fontSize: 13, color: "var(--gray)" }}>
            {pagination.total} کاربر
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👥</div>
              <h4>کاربری یافت نشد</h4>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>ایمیل</th>
                  <th>نقش</th>
                  <th>وضعیت</th>
                  <th>اشتراک</th>
                  <th>تاریخ عضویت</th>
                  {isAdmin() && <th>عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          className="user-avatar"
                          style={{ width: 32, height: 32, fontSize: 12 }}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <strong style={{ fontSize: 13 }}>{user.name}</strong>
                      </div>
                    </td>
                    <td
                      style={{
                        direction: "ltr",
                        textAlign: "right",
                        fontSize: 13,
                      }}
                    >
                      {user.email}
                    </td>
                    <td>
                      <span className={`badge ${roleBadgeColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${user.is_active ? "green" : "red"}`}
                      >
                        {user.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${user.plan_name ? "blue" : "gray"}`}
                      >
                        {user.plan_name || "ندارد"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>
                      {new Date(user.created_at).toLocaleDateString("fa-IR")}
                    </td>
                    {isAdmin() && (
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(user)}
                            title="ویرایش"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteModal(true);
                            }}
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination" style={{ padding: 16 }}>
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              ❮
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i + 1}
                className={pagination.page === i + 1 ? "active" : ""}
                onClick={() => fetchUsers(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
            >
              ❯
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="ویرایش کاربر"
        footer={
          <>
            <button className="btn btn-primary" onClick={handleSaveEdit}>
              ذخیره
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setEditModal(false)}
            >
              انصراف
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>نام</label>
          <input
            type="text"
            className="form-control"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>ایمیل</label>
          <input
            type="email"
            className="form-control"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
            dir="ltr"
          />
        </div>
        <div className="form-group">
          <label>نقش</label>
          <select
            className="form-control"
            value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
          >
            <option value="user">کاربر</option>
            <option value="manager">مدیر</option>
            <option value="admin">مدیر کل</option>
          </select>
        </div>
        <div className="form-group">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(e) =>
                setEditForm({ ...editForm, is_active: e.target.checked })
              }
            />
            حساب فعال
          </label>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="حذف کاربر"
        footer={
          <>
            <button className="btn btn-danger" onClick={handleDelete}>
              حذف
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setDeleteModal(false)}
            >
              انصراف
            </button>
          </>
        }
      >
        <p>
          آیا از حذف <strong>{selectedUser?.name}</strong> مطمئن هستید؟
        </p>
        <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 8 }}>
          این عملیات غیرقابل بازگشت است.
        </p>
      </Modal>
    </Layout>
  );
};

export default UserManagement;

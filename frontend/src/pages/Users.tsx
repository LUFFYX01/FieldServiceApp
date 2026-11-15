import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  type User,
  type CreateUserData,
  type UpdateUserData,
  type ChangePasswordData,
} from "../services/userService";

const emptyUserForm: CreateUserData = {
  userName: "",
  email: "",
  role: "TECHNICIAN",
  password: "",
};

export default function Users() {
  const { token, user: currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserData>(emptyUserForm);
  const [editForm, setEditForm] = useState<UpdateUserData>({
    userName: "",
    email: "",
    role: "TECHNICIAN",
    active: true,
  });
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getUsers(token);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.userName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
      );
    }

    if (roleFilter !== "ALL") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!createForm.password || createForm.password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setSubmitting(true);
    try {
      const newUser = await createUser(token, createForm);
      setUsers((prev) => [newUser, ...prev]);
      showToast(`User ${newUser.userName} created successfully`, "success");
      setShowCreateModal(false);
      setCreateForm(emptyUserForm);
    } catch (err: any) {
      showToast(err.message || "Failed to create user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit User
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      userName: user.userName,
      email: user.email,
      role: user.role,
      active: user.active,
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUser) return;
    setSubmitting(true);
    try {
      const updated = await updateUser(token, selectedUser.id, editForm);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)));
      showToast("User updated successfully", "success");
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      showToast(err.message || "Failed to update user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (user: User) => {
    if (!token) return;
    if (user.role === "ADMIN" && user.active) {
      const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.active);
      if (activeAdmins.length <= 1) {
        showToast("Cannot deactivate the last remaining active administrator.", "error");
        return;
      }
    }

    try {
      const updated = await updateUser(token, user.id, {
        userName: user.userName,
        email: user.email,
        role: user.role,
        active: !user.active,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      showToast(
        `User ${user.userName} has been ${updated.active ? "activated" : "deactivated"}`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Change Password
  const handleOpenPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({ currentPassword: "", newPassword: "" });
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUser) return;
    setSubmitting(true);
    try {
      await changePassword(token, selectedUser.id, passwordForm);
      showToast("Password changed successfully", "success");
      setShowPasswordModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: User) => {
    if (!token) return;
    if (user.id === currentUser?.id) {
      showToast("You cannot delete your own account while logged in.", "error");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.userName}"?`)) {
      return;
    }
    try {
      await deleteUser(token, user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast("User deleted successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete user", "error");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <span className="badge badge-primary">ADMIN</span>;
      case "DISPATCHER":
        return <span className="badge badge-info">DISPATCHER</span>;
      case "TECHNICIAN":
        return <span className="badge badge-warning">TECHNICIAN</span>;
      default:
        return <span className="badge badge-secondary">{role}</span>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        <h3 style={{ color: "var(--danger-color)" }}>Access Restricted</h3>
        <p>User Administration is restricted to administrators.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ marginLeft: "1rem" }}>Loading users...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header and Controls */}
      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="card-title" style={{ margin: 0 }}>
              👥 User Management & Permissions
            </h4>
            <span className="badge badge-secondary">{filteredUsers.length} total</span>
          </div>

          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            + New User
          </button>
        </div>

        <div className="card-body">
          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: "250px" }}
            />
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: "180px" }}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="DISPATCHER">Dispatchers</option>
              <option value="TECHNICIAN">Technicians</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.6 }}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{u.userName}</div>
                    {u.id === currentUser?.id && (
                      <span className="badge badge-secondary" style={{ fontSize: "0.65rem" }}>
                        CURRENT USER
                      </span>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td>
                    <span className={`badge badge-${u.active ? "success" : "danger"}`}>
                      {u.active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`btn btn-sm ${u.active ? "btn-secondary" : "btn-success"}`}
                        title={u.active ? "Deactivate User" : "Activate User"}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-secondary btn-sm"
                        title="Edit User"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleOpenPassword(u)}
                        className="btn btn-secondary btn-sm"
                        title="Change Password"
                      >
                        Password
                      </button>

                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn btn-danger btn-sm"
                          title="Delete User"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create User */}
      {showCreateModal && (
        <Modal
          title="Create New User"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Full Name / Username *</label>
            <input
              className="form-input"
              placeholder="e.g. John Doe"
              value={createForm.userName}
              onChange={(e) => setCreateForm({ ...createForm, userName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. tech@keystone.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">System Role *</label>
            <select
              className="form-select"
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
              required
            >
              <option value="TECHNICIAN">Technician (Field service worker)</option>
              <option value="DISPATCHER">Dispatcher (Operations coordinator)</option>
              <option value="ADMIN">Administrator (Full system control)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
        </Modal>
      )}

      {/* MODAL: Edit User */}
      {showEditModal && selectedUser && (
        <Modal
          title={`Edit User: ${selectedUser.userName}`}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleEditUser}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              className="form-input"
              value={editForm.userName}
              onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">System Role *</label>
            <select
              className="form-select"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
              required
            >
              <option value="TECHNICIAN">Technician</option>
              <option value="DISPATCHER">Dispatcher</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
              />
              <span>Account is Active</span>
            </label>
          </div>
        </Modal>
      )}

      {/* MODAL: Change Password */}
      {showPasswordModal && selectedUser && (
        <Modal
          title={`Change Password: ${selectedUser.userName}`}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleChangePassword}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Current Password *</label>
            <input
              type="password"
              className="form-input"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  onSubmit,
  submitting,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div className="card" style={{ maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="card-header flex items-center justify-between">
          <h4 className="card-title" style={{ margin: 0 }}>
            {title}
          </h4>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}>
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="card-body">{children}</div>
          <div className="card-footer flex justify-between">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

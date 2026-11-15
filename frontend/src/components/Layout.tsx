import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ApiHealthIndicator from "./ApiHealthCheck";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin, isDispatcher, isTechnician } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/workorders"
      ? location.pathname.startsWith("/workorders")
      : location.pathname === path;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleForbidden = (e: any) => {
      showToast(e.detail?.message || "You do not have permission for this operation.", "error");
    };

    window.addEventListener("auth:forbidden", handleForbidden);
    return () => {
      window.removeEventListener("auth:forbidden", handleForbidden);
    };
  }, [showToast]);

  const getRoleBadgeClass = () => {
    if (isAdmin) return "badge badge-primary";
    if (isDispatcher) return "badge badge-info";
    return "badge badge-warning";
  };

  return (
    <div className="layout">
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 1000,
          display: "none",
          padding: "0.5rem",
          background: "var(--primary-color)",
          color: "white",
          border: "none",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="nav-brand" style={{ color: "#1a1a1a", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "1.25rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-2a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            KeyStone Field
          </div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
              <span className={getRoleBadgeClass()}>{user.role}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </span>
            </div>
          )}
        </div>

        <nav className="nav">
          <Link
            to="/dashboard"
            className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>

          <Link
            to="/workorders"
            className={`nav-item ${isActive("/workorders") ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {isTechnician ? "My Work Orders" : "Work Orders"}
          </Link>

          {(isAdmin || isDispatcher) && (
            <>
              <Link
                to="/parts"
                className={`nav-item ${isActive("/parts") ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                Parts & Inventory
              </Link>

              <Link
                to="/customers"
                className={`nav-item ${isActive("/customers") ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
                Customers
              </Link>

              <Link
                to="/sites"
                className={`nav-item ${isActive("/sites") ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Sites
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/users"
              className={`nav-item ${isActive("/users") ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              Users
            </Link>
          )}

          <div className="nav-section">
            <div className="nav-section-title">Account</div>
            <button
              onClick={handleLogout}
              className="nav-item"
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="flex items-center gap-3">
            <button
              className="mobile-menu-toggle"
              onClick={toggleSidebar}
              style={{
                padding: "0.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-primary)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
              {location.pathname === "/dashboard" && `${user?.role || ""} Dashboard`}
              {location.pathname.startsWith("/workorders") && "Work Orders"}
              {location.pathname === "/parts" && "Parts & Inventory"}
              {location.pathname === "/customers" && "Customers"}
              {location.pathname === "/sites" && "Service Sites"}
              {location.pathname === "/users" && "User Management"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ApiHealthIndicator />
            {user && (
              <span className={getRoleBadgeClass()}>
                {user.role} ({user.email})
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="content">{children}</main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: block !important;
          }
          .sidebar-overlay {
            display: block !important;
          }
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;

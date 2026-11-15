import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCustomers } from "../services/customerService";
import { getSites } from "../services/siteService";
import { getWorkOrders, type WorkOrder } from "../services/workOrderService";
import { getUsers } from "../services/userService";
import { getParts, type Part } from "../services/partService";

function Dashboard() {
  const { token, user, isAdmin, isDispatcher, isTechnician } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [siteCount, setSiteCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const promises: Promise<any>[] = [getWorkOrders(token)];

        if (isAdmin || isDispatcher) {
          promises.push(getCustomers(token));
          promises.push(getSites(token));
          promises.push(getParts(token));
        }

        if (isAdmin) {
          promises.push(getUsers(token));
        }

        const results = await Promise.all(promises);

        const woData: WorkOrder[] = results[0] || [];
        setWorkOrders(woData);

        if (isAdmin || isDispatcher) {
          setCustomerCount(results[1]?.length || 0);
          setSiteCount(results[2]?.length || 0);
          setParts(results[3] || []);
        }

        if (isAdmin) {
          setUserCount(results[4]?.length || 0);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, isAdmin, isDispatcher]);

  const activeWorkOrders = workOrders.filter(
    (wo) => wo.status === "IN_PROGRESS" || wo.status === "ASSIGNED"
  );
  const pendingWorkOrders = workOrders.filter((wo) => wo.status === "OPEN");
  const completedWorkOrders = workOrders.filter((wo) => wo.status === "COMPLETED");
  const overdueWorkOrders = workOrders.filter((wo) => Boolean(wo.isOverdue));
  const lowStockParts = parts.filter((p) => p.isLowStock && p.active);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      OPEN: { color: "info", label: "Open" },
      ASSIGNED: { color: "warning", label: "Assigned" },
      IN_PROGRESS: { color: "primary", label: "In Progress" },
      COMPLETED: { color: "success", label: "Completed" },
      CANCELLED: { color: "danger", label: "Cancelled" },
    };
    const s = statusMap[status] || { color: "secondary", label: status };
    return <span className={`badge badge-${s.color}`}>{s.label}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { color: string; label: string }> = {
      LOW: { color: "secondary", label: "Low" },
      MEDIUM: { color: "info", label: "Medium" },
      HIGH: { color: "warning", label: "High" },
      URGENT: { color: "danger", label: "Urgent" },
    };
    const p = priorityMap[priority] || { color: "secondary", label: priority };
    return <span className={`badge badge-${p.color}`}>{p.label}</span>;
  };

  const StatCard = ({
    title,
    value,
    icon,
    link,
    alert,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    link?: string;
    alert?: boolean;
  }) => (
    <Link
      to={link || "#"}
      className="card"
      style={{
        textDecoration: "none",
        color: "inherit",
        borderLeft: alert ? "4px solid var(--danger-color)" : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            {title}
          </p>
          <h3
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              margin: 0,
              color: alert ? "var(--danger-color)" : "#1a1a1a",
            }}
          >
            {value}
          </h3>
        </div>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "8px",
            backgroundColor: alert ? "#fee2e2" : "#f0f0f0",
            border: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: alert ? "var(--danger-color)" : "#1a1a1a",
          }}
        >
          {icon}
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ marginLeft: "1rem" }}>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        <h3 style={{ color: "var(--danger-color)" }}>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Technician specific banner */}
      {isTechnician && (
        <div className="card mb-4" style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
          <div className="card-body flex items-center justify-between">
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e3a8a" }}>
                Welcome, {user?.email}
              </h3>
              <p style={{ margin: 0, color: "#1e40af" }}>
                You have <strong>{activeWorkOrders.length}</strong> active job(s) assigned to you. Review your assigned work orders and record parts usage below.
              </p>
            </div>
            <Link to="/workorders" className="btn btn-primary">
              View My Jobs
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-4 mb-6">
        <StatCard
          title={isTechnician ? "Assigned To Me" : "Total Work Orders"}
          value={workOrders.length}
          link="/workorders"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
          }
        />

        <StatCard
          title="In Progress / Active"
          value={activeWorkOrders.length}
          link="/workorders"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <StatCard
          title={isTechnician ? "Completed By Me" : "Completed Jobs"}
          value={completedWorkOrders.length}
          link="/workorders"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <StatCard
          title="Overdue / Urgent"
          value={overdueWorkOrders.length}
          link="/workorders"
          alert={overdueWorkOrders.length > 0}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
      </div>

      {/* Admin / Dispatcher Operational Counters */}
      {(isAdmin || isDispatcher) && (
        <div className="grid grid-4 mb-6">
          <StatCard
            title="Customers"
            value={customerCount}
            link="/customers"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            }
          />
          <StatCard
            title="Service Sites"
            value={siteCount}
            link="/sites"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
          />
          <StatCard
            title="Parts In Catalog"
            value={parts.length}
            link="/parts"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            }
          />
          {isAdmin ? (
            <StatCard
              title="System Users"
              value={userCount}
              link="/users"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
            />
          ) : (
            <StatCard
              title="Unassigned (Open)"
              value={pendingWorkOrders.length}
              link="/workorders"
              alert={pendingWorkOrders.length > 0}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                </svg>
              }
            />
          )}
        </div>
      )}

      {/* Low Stock Warning Banner for Admin/Dispatcher */}
      {(isAdmin || isDispatcher) && lowStockParts.length > 0 && (
        <div className="card mb-6" style={{ borderLeft: "4px solid var(--warning-color)" }}>
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: "1.25rem" }}>⚠️</span>
              <h4 className="card-title" style={{ margin: 0 }}>
                Inventory Alert: {lowStockParts.length} Part(s) Low on Stock
              </h4>
            </div>
            <Link to="/parts" className="btn btn-secondary btn-sm">
              Manage Inventory
            </Link>
          </div>
          <div className="card-body">
            <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
              {lowStockParts.map((p) => (
                <span key={p.id} className="badge badge-warning" style={{ padding: "0.5rem 0.75rem" }}>
                  {p.name} ({p.partNumber}): {p.quantity} left (threshold: {p.lowStockThreshold})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent / Active Work Orders Table */}
      <div className="card mb-6">
        <div className="card-header flex items-center justify-between">
          <h4 className="card-title">
            {isTechnician ? "My Active Tasks" : isDispatcher ? "Pending & Active Work Orders" : "Recent Work Orders"}
          </h4>
          <Link to="/workorders" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        <div className="card-body">
          {workOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h4 className="empty-state-title">No work orders found</h4>
              <p className="empty-state-description">
                {isTechnician
                  ? "You have no work orders assigned right now."
                  : "Create a work order to begin dispatching."}
              </p>
              {!isTechnician && (
                <Link to="/workorders" className="btn btn-primary">
                  Create Work Order
                </Link>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Site</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Technician</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.slice(0, 6).map((wo) => (
                    <tr key={wo.id}>
                      <td>
                        <Link
                          to={`/workorders/${wo.id}`}
                          style={{ fontWeight: 600, color: "#2563eb", textDecoration: "none" }}
                        >
                          {wo.title}
                        </Link>
                        {wo.isOverdue && (
                          <span className="badge badge-danger ml-2" style={{ fontSize: "0.7rem" }}>
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td>{wo.customerName}</td>
                      <td>{wo.siteName}</td>
                      <td>{getStatusBadge(wo.status)}</td>
                      <td>{getPriorityBadge(wo.priority)}</td>
                      <td>
                        {wo.technicianName ? (
                          <span className="badge badge-secondary">{wo.technicianName}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/workorders/${wo.id}`} className="btn btn-secondary btn-sm">
                          {isTechnician ? "Open Job" : "Details"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Quick Operations</h4>
        </div>
        <div className="card-body">
          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <Link to="/workorders" className="btn btn-primary">
              📋 {isTechnician ? "View My Work Orders" : "Manage Work Orders"}
            </Link>

            {(isAdmin || isDispatcher) && (
              <>
                <Link to="/parts" className="btn btn-secondary">
                  🔩 Parts Catalog & Stock
                </Link>
                <Link to="/customers" className="btn btn-secondary">
                  🏢 Customers
                </Link>
                <Link to="/sites" className="btn btn-secondary">
                  📍 Service Sites
                </Link>
              </>
            )}

            {isAdmin && (
              <Link to="/users" className="btn btn-secondary">
                👥 System Users
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

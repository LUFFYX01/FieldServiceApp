import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomers } from "../services/customerService";
import { getSites } from "../services/siteService";
import { getWorkOrders } from "../services/workOrderService";
import { getUsers } from "../services/userService";
import { Link } from "react-router-dom";

type DashboardStats = {
  totalCustomers: number;
  totalSites: number;
  totalWorkOrders: number;
  totalUsers: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  pendingWorkOrders: number;
};

type RecentWorkOrder = {
  id: number;
  title: string;
  status: string;
  priority: string;
  customerName: string;
  createdAt: string;
};

function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalSites: 0,
    totalWorkOrders: 0,
    totalUsers: 0,
    activeWorkOrders: 0,
    completedWorkOrders: 0,
    pendingWorkOrders: 0,
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState<RecentWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadDashboardData = async () => {
      try {
        const [customers, sites, workOrders, users] = await Promise.all([
          getCustomers(token),
          getSites(token),
          getWorkOrders(token),
          getUsers(token),
        ]);

        const activeWorkOrders = workOrders.filter(
          (wo: any) => wo.status === "IN_PROGRESS" || wo.status === "ASSIGNED"
        ).length;
        const completedWorkOrders = workOrders.filter(
          (wo: any) => wo.status === "COMPLETED"
        ).length;
        const pendingWorkOrders = workOrders.filter(
          (wo: any) => wo.status === "OPEN"
        ).length;

        setStats({
          totalCustomers: customers.length,
          totalSites: sites.length,
          totalWorkOrders: workOrders.length,
          totalUsers: users.length,
          activeWorkOrders,
          completedWorkOrders,
          pendingWorkOrders,
        });

        // Get recent work orders (last 5)
        const recent = workOrders
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentWorkOrders(recent);

      } catch (error) {
        console.error(error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [token]);

  const StatCard = ({ title, value, icon, color, link }: any) => (
    <Link to={link || "#"} className="card" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            {title}
          </p>
          <h3 style={{ fontSize: "2rem", fontWeight: "700", margin: 0, color: "#1a1a1a" }}>
            {value}
          </h3>
        </div>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "8px",
          backgroundColor: "#f0f0f0",
          border: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1a1a1a"
        }}>
          {icon}
        </div>
      </div>
    </Link>
  );

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      OPEN: { color: "info", label: "Open" },
      ASSIGNED: { color: "warning", label: "Assigned" },
      IN_PROGRESS: { color: "primary", label: "In Progress" },
      COMPLETED: { color: "success", label: "Completed" },
      CANCELLED: { color: "danger", label: "Cancelled" },
    };
    const statusInfo = statusMap[status] || { color: "secondary", label: status };
    return <span className={`badge badge-${statusInfo.color}`}>{statusInfo.label}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { color: string; label: string }> = {
      LOW: { color: "secondary", label: "Low" },
      MEDIUM: { color: "info", label: "Medium" },
      HIGH: { color: "warning", label: "High" },
      URGENT: { color: "danger", label: "Urgent" },
    };
    const priorityInfo = priorityMap[priority] || { color: "secondary", label: priority };
    return <span className={`badge badge-${priorityInfo.color}`}>{priorityInfo.label}</span>;
  };

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
      {/* Stats Grid */}
      <div className="grid grid-4 mb-6">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          link="/customers"
          color="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          }
        />
        <StatCard
          title="Total Sites"
          value={stats.totalSites}
          link="/sites"
          color="success"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          }
        />
        <StatCard
          title="Total Work Orders"
          value={stats.totalWorkOrders}
          link="/workorders"
          color="warning"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          }
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          color="secondary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          }
        />
      </div>

      {/* Work Order Status */}
      <div className="grid grid-3 mb-6">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Active Work Orders</h4>
          </div>
          <div className="card-body">
            <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
              {stats.activeWorkOrders}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Currently in progress or assigned
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Pending Work Orders</h4>
          </div>
          <div className="card-body">
            <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
              {stats.pendingWorkOrders}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Awaiting assignment
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Completed Work Orders</h4>
          </div>
          <div className="card-body">
            <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
              {stats.completedWorkOrders}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Successfully completed
            </p>
          </div>
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Recent Work Orders</h4>
          <Link to="/workorders" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>
        <div className="card-body">
          {recentWorkOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h4 className="empty-state-title">No work orders yet</h4>
              <p className="empty-state-description">
                Create your first work order to get started
              </p>
              <Link to="/workorders" className="btn btn-primary">
                Create Work Order
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentWorkOrders.map((workOrder) => (
                    <tr key={workOrder.id}>
                      <td>
                        <Link
                          to="/workorders"
                          style={{ fontWeight: "500", color: "#1a1a1a", textDecoration: "none" }}
                        >
                          {workOrder.title}
                        </Link>
                      </td>
                      <td>{workOrder.customerName}</td>
                      <td>{getStatusBadge(workOrder.status)}</td>
                      <td>{getPriorityBadge(workOrder.priority)}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        {new Date(workOrder.createdAt).toLocaleDateString()}
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
      <div className="card mt-4">
        <div className="card-header">
          <h4 className="card-title">Quick Actions</h4>
        </div>
        <div className="card-body">
          <div className="flex gap-3">
            <Link to="/customers" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Add Customer
            </Link>
            <Link to="/sites" className="btn btn-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
                <line x1="12" y1="21" x2="12" y2="21"/>
              </svg>
              Add Site
            </Link>
            <Link to="/workorders" className="btn btn-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              Create Work Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
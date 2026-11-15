import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getWorkOrders,
  createWorkOrder,
  deleteWorkOrder,
  assignTechnician,
  type WorkOrder,
} from "../services/workOrderService";
import { getCustomers, type Customer } from "../services/customerService";
import { getSites, type Site } from "../services/siteService";
import { getUsers, type User } from "../services/userService";

const emptyForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  customerId: 0,
  siteId: 0,
};

function WorkOrders() {
  const { token, isAdmin, isDispatcher, isTechnician } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const promises: Promise<any>[] = [getWorkOrders(token)];

        if (isAdmin || isDispatcher) {
          promises.push(getCustomers(token));
          promises.push(getSites(token));
          promises.push(getUsers(token, "TECHNICIAN"));
        }

        const [workOrderData, customerData, siteData, userData] = await Promise.all(promises);

        setWorkOrders(workOrderData);
        setFilteredWorkOrders(workOrderData);

        if (isAdmin || isDispatcher) {
          setCustomers(customerData || []);
          setSites(siteData || []);
          setTechnicians((userData || []).filter((u: User) => u.active));
        }
      } catch (error: any) {
        console.error(error);
        showToast(error.message || "Failed to load work orders", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, isAdmin, isDispatcher, showToast]);

  useEffect(() => {
    let filtered = workOrders;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (wo) =>
          wo.title.toLowerCase().includes(lower) ||
          wo.customerName.toLowerCase().includes(lower) ||
          wo.siteName.toLowerCase().includes(lower) ||
          (wo.technicianName && wo.technicianName.toLowerCase().includes(lower))
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((wo) => wo.status === statusFilter);
    }

    if (priorityFilter !== "ALL") {
      filtered = filtered.filter((wo) => wo.priority === priorityFilter);
    }

    setFilteredWorkOrders(filtered);
  }, [searchTerm, statusFilter, priorityFilter, workOrders]);

  const filteredSites = sites.filter((site) => site.customerId === form.customerId);

  const handleCreateChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === "customerId" || name === "siteId" ? Number(value) : value,
    }));
  };

  const handleOpenCreateModal = () => {
    setForm(emptyForm);
    setShowCreateModal(true);
  };

  const handleCreateWorkOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.customerId === 0) {
      showToast("Please select a customer", "error");
      return;
    }
    if (form.siteId === 0) {
      showToast("Please select a service site", "error");
      return;
    }

    setSubmitting(true);
    try {
      const newWorkOrder = await createWorkOrder(token!, form);
      setWorkOrders((previous) => [newWorkOrder, ...previous]);
      showToast("Work order created successfully", "success");
      setShowCreateModal(false);
      setForm(emptyForm);
      navigate(`/workorders/${newWorkOrder.id}`);
    } catch (error: any) {
      showToast(error.message || "Failed to create work order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAssignModal = (workOrder: WorkOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkOrder(workOrder);
    setSelectedTechnician(workOrder.technicianId);
    setShowAssignModal(true);
  };

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder || !selectedTechnician) return;
    setSubmitting(true);

    try {
      const updated = await assignTechnician(token!, selectedWorkOrder.id, selectedTechnician);
      setWorkOrders((previous) =>
        previous.map((wo) => (wo.id === selectedWorkOrder.id ? updated : wo))
      );
      showToast("Technician assigned successfully", "success");
      setShowAssignModal(false);
    } catch (error: any) {
      showToast(error.message || "Failed to assign technician", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkOrder = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this work order?")) return;

    try {
      await deleteWorkOrder(token!, id);
      setWorkOrders((previous) => previous.filter((wo) => wo.id !== id));
      showToast("Work order deleted successfully", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to delete work order", "error");
    }
  };

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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ marginLeft: "1rem" }}>Loading work orders...</span>
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
              {isTechnician ? "My Assigned Work Orders" : "Field Work Orders"}
            </h4>
            <span className="badge badge-secondary">{filteredWorkOrders.length} total</span>
          </div>

          {(isAdmin || isDispatcher) && (
            <button onClick={handleOpenCreateModal} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Work Order
            </button>
          )}
        </div>

        <div className="card-body">
          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by title, customer, site, technician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: "220px" }}
            />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "170px" }}
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: "160px" }}
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      {filteredWorkOrders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h4 className="empty-state-title">
              {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
                ? "No matching work orders found"
                : isTechnician
                ? "No work orders assigned to you yet"
                : "No work orders in system"}
            </h4>
            <p className="empty-state-description">
              {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
                ? "Try clearing filters to see all work orders."
                : (isAdmin || isDispatcher)
                ? "Create a work order to begin operations."
                : "Check back later when dispatchers assign jobs to you."}
            </p>
            {(isAdmin || isDispatcher) && !searchTerm && statusFilter === "ALL" && (
              <button onClick={handleOpenCreateModal} className="btn btn-primary">
                Create Work Order
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
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
                  <th>Scheduled / Visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.map((wo) => (
                  <tr
                    key={wo.id}
                    onClick={() => navigate(`/workorders/${wo.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: "#2563eb" }}>{wo.title}</div>
                      {wo.isOverdue && (
                        <span className="badge badge-danger" style={{ fontSize: "0.65rem", marginTop: "2px" }}>
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
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {wo.scheduledDate
                        ? new Date(wo.scheduledDate).toLocaleDateString()
                        : "Not scheduled"}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          to={`/workorders/${wo.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn btn-primary btn-sm"
                        >
                          {isTechnician ? "Open Job" : "Details"}
                        </Link>

                        {(isAdmin || isDispatcher) && (
                          <>
                            <button
                              onClick={(e) => handleOpenAssignModal(wo, e)}
                              className="btn btn-secondary btn-sm"
                              title="Assign Technician"
                            >
                              Assign
                            </button>
                            <button
                              onClick={(e) => handleDeleteWorkOrder(wo.id, e)}
                              className="btn btn-danger btn-sm"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <Modal
          title="Create New Work Order"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateWorkOrder}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select
              name="customerId"
              className="form-select"
              value={form.customerId}
              onChange={handleCreateChange}
              required
            >
              <option value={0}>Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Service Site *</label>
            <select
              name="siteId"
              className="form-select"
              value={form.siteId}
              onChange={handleCreateChange}
              required
              disabled={form.customerId === 0}
            >
              <option value={0}>Select Site</option>
              {filteredSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName} ({s.address})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              name="title"
              className="form-input"
              placeholder="e.g. Pump seal leak repair"
              value={form.title}
              onChange={handleCreateChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe issue reported by customer..."
              value={form.description}
              onChange={handleCreateChange}
              required
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Priority *</label>
            <select
              name="priority"
              className="form-select"
              value={form.priority}
              onChange={handleCreateChange}
              required
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Assign Technician Modal */}
      {showAssignModal && selectedWorkOrder && (
        <Modal
          title={`Assign Technician: ${selectedWorkOrder.title}`}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedWorkOrder(null);
          }}
          onSubmit={handleAssignTechnician}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Select Field Technician *</label>
            <select
              className="form-select"
              value={selectedTechnician || ""}
              onChange={(e) => setSelectedTechnician(Number(e.target.value) || null)}
              required
            >
              <option value="">Choose technician...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.userName} ({t.email})
                </option>
              ))}
            </select>
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

export default WorkOrders;

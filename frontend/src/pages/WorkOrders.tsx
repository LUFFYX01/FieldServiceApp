import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  assignTechnician,
} from "../services/workOrderService";
import { getCustomers } from "../services/customerService";
import { getSites } from "../services/siteService";
import { getUsers } from "../services/userService";
import { getWorkOrderHistory } from "../services/workOrderHistoryService";

type Customer = {
  id: number;
  companyName: string;
};

type Site = {
  id: number;
  siteName: string;
  customerId: number;
};

type User = {
  id: number;
  userName: string;
  email: string;
  role: string;
  active: boolean;
};

type WorkOrder = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  siteAddress: string;
  technicianId: number | null;
  technicianName: string | null;
  createdAt: string;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
};

type WorkOrderHistory = {
  id: number;
  workOrderId: number;
  status: string;
  description: string;
  createdAt: string;
};

const emptyForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  customerId: 0,
  siteId: 0,
};

const emptyUpdateForm = {
  status: "OPEN",
  priority: "MEDIUM",
  scheduledDate: "",
  completedDate: "",
  notes: "",
};

function WorkOrders() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [updateForm, setUpdateForm] = useState(emptyUpdateForm);
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<WorkOrderHistory[]>([]);

  useEffect(() => {
    if (!token) return;

    Promise.all([getWorkOrders(token), getCustomers(token), getSites(token), getUsers(token)])
      .then(([workOrderData, customerData, siteData, userData]) => {
        setWorkOrders(workOrderData);
        setFilteredWorkOrders(workOrderData);
        setCustomers(customerData);
        setSites(siteData);
        const technicianUsers = userData.filter(
          (user: User) => user.role === "TECHNICIAN" && user.active === true
        );
        setTechnicians(technicianUsers);
      })
      .catch((error) => {
        console.error(error);
        showToast("Failed to load work orders", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, showToast]);

  useEffect(() => {
    let filtered = workOrders;

    if (searchTerm) {
      filtered = filtered.filter(
        (wo) =>
          wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wo.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wo.siteName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((wo) => wo.status === statusFilter);
    }

    setFilteredWorkOrders(filtered);
  }, [searchTerm, statusFilter, workOrders]);

  const filteredSites = sites.filter((site) => site.customerId === form.customerId);

  const handleCreateChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === "customerId" || name === "siteId" ? Number(value) : value,
    }));
  };

  const handleUpdateChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setUpdateForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOpenCreateModal = () => {
    setForm(emptyForm);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setForm(emptyForm);
  };

  const handleOpenUpdateModal = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setUpdateForm({
      status: workOrder.status,
      priority: workOrder.priority,
      scheduledDate: workOrder.scheduledDate ? workOrder.scheduledDate.slice(0, 16) : "",
      completedDate: workOrder.completedDate ? workOrder.completedDate.slice(0, 16) : "",
      notes: workOrder.notes || "",
    });
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedWorkOrder(null);
    setUpdateForm(emptyUpdateForm);
  };

  const handleOpenAssignModal = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setSelectedTechnician(workOrder.technicianId);
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedWorkOrder(null);
    setSelectedTechnician(null);
  };

  const handleOpenHistoryModal = async (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowHistoryModal(true);
    try {
      const historyData = await getWorkOrderHistory(token, workOrder.id);
      setHistory(historyData);
    } catch (error) {
      console.error(error);
      showToast("Failed to load work order history", "error");
    }
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedWorkOrder(null);
    setHistory([]);
  };

  const handleCreateWorkOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (form.customerId === 0) {
        showToast("Please select a customer", "error");
        setSubmitting(false);
        return;
      }
      if (form.siteId === 0) {
        showToast("Please select a site", "error");
        setSubmitting(false);
        return;
      }

      const newWorkOrder = await createWorkOrder(token, form);
      setWorkOrders((previous) => [...previous, newWorkOrder]);
      showToast("Work order created successfully", "success");
      handleCloseCreateModal();
    } catch (error) {
      console.error(error);
      showToast("Failed to create work order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateWorkOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    if (!selectedWorkOrder) return;

    try {
      const updatedWorkOrder = await updateWorkOrder(token, selectedWorkOrder.id, updateForm);
      setWorkOrders((previous) =>
        previous.map((wo) => (wo.id === selectedWorkOrder.id ? updatedWorkOrder : wo))
      );
      showToast("Work order updated successfully", "success");
      handleCloseUpdateModal();
    } catch (error) {
      console.error(error);
      showToast("Failed to update work order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedWorkOrder) return;
    setSubmitting(true);

    try {
      await assignTechnician(token, selectedWorkOrder.id, { technicianId: selectedTechnician });
      setWorkOrders((previous) =>
        previous.map((wo) =>
          wo.id === selectedWorkOrder.id
            ? {
                ...wo,
                technicianId: selectedTechnician,
                technicianName: technicians.find((t) => t.id === selectedTechnician)?.userName || null,
              }
            : wo
        )
      );
      showToast("Technician assigned successfully", "success");
      handleCloseAssignModal();
    } catch (error) {
      console.error(error);
      showToast("Failed to assign technician", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkOrder = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this work order?")) return;

    try {
      await deleteWorkOrder(token, id);
      setWorkOrders((previous) => previous.filter((wo) => wo.id !== id));
      showToast("Work order deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to delete work order", "error");
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
        <span style={{ marginLeft: "1rem" }}>Loading work orders...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <h4 className="card-title">Work Orders</h4>
            <span className="badge badge-secondary">{filteredWorkOrders.length} total</span>
          </div>
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Work Order
          </button>
        </div>
        <div className="card-body">
          <div className="flex gap-3">
            <input
              type="text"
              className="form-input"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
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
              {searchTerm || statusFilter !== "ALL" ? "No work orders found" : "No work orders yet"}
            </h4>
            <p className="empty-state-description">
              {searchTerm || statusFilter !== "ALL"
                ? "Try different filters or search terms"
                : "Create your first work order to get started"}
            </p>
            {!searchTerm && statusFilter === "ALL" && (
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
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.map((workOrder) => (
                  <tr key={workOrder.id}>
                    <td>
                      <div style={{ fontWeight: "500", color: "#1a1a1a" }}>{workOrder.title}</div>
                    </td>
                    <td>{workOrder.customerName}</td>
                    <td>{workOrder.siteName}</td>
                    <td>{getStatusBadge(workOrder.status)}</td>
                    <td>{getPriorityBadge(workOrder.priority)}</td>
                    <td>
                      {workOrder.technicianName ? (
                        <span className="badge badge-secondary">{workOrder.technicianName}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      {new Date(workOrder.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenUpdateModal(workOrder)}
                          className="btn btn-secondary btn-sm"
                          title="Update"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleOpenAssignModal(workOrder)}
                          className="btn btn-secondary btn-sm"
                          title="Assign Technician"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleOpenHistoryModal(workOrder)}
                          className="btn btn-secondary btn-sm"
                          title="History"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteWorkOrder(workOrder.id)}
                          className="btn btn-danger btn-sm"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
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
          title="Create Work Order"
          onClose={handleCloseCreateModal}
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
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Site *</label>
            <select
              name="siteId"
              className="form-select"
              value={form.siteId}
              onChange={handleCreateChange}
              required
              disabled={form.customerId === 0}
            >
              <option value={0}>Select Site</option>
              {filteredSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              name="title"
              className="form-input"
              placeholder="Enter work order title"
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
              placeholder="Enter work order description"
              value={form.description}
              onChange={handleCreateChange}
              required
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

      {/* Update Work Order Modal */}
      {showUpdateModal && selectedWorkOrder && (
        <Modal
          title="Update Work Order"
          onClose={handleCloseUpdateModal}
          onSubmit={handleUpdateWorkOrder}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Status *</label>
            <select
              name="status"
              className="form-select"
              value={updateForm.status}
              onChange={handleUpdateChange}
              required
            >
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority *</label>
            <select
              name="priority"
              className="form-select"
              value={updateForm.priority}
              onChange={handleUpdateChange}
              required
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Scheduled Date</label>
            <input
              name="scheduledDate"
              type="datetime-local"
              className="form-input"
              value={updateForm.scheduledDate}
              onChange={handleUpdateChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Completed Date</label>
            <input
              name="completedDate"
              type="datetime-local"
              className="form-input"
              value={updateForm.completedDate}
              onChange={handleUpdateChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              className="form-textarea"
              placeholder="Enter notes"
              value={updateForm.notes}
              onChange={handleUpdateChange}
            />
          </div>
        </Modal>
      )}

      {/* Assign Technician Modal */}
      {showAssignModal && selectedWorkOrder && (
        <Modal
          title="Assign Technician"
          onClose={handleCloseAssignModal}
          onSubmit={handleAssignTechnician}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Select Technician *</label>
            <select
              className="form-select"
              value={selectedTechnician || ""}
              onChange={(e) => setSelectedTechnician(Number(e.target.value) || null)}
              required
            >
              <option value="">Unassigned</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.userName} ({technician.email})
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedWorkOrder && (
        <Modal
          title={`Work Order History - ${selectedWorkOrder.title}`}
          onClose={handleCloseHistoryModal}
          onSubmit={handleCloseHistoryModal}
          submitting={false}
          showSubmit={false}
        >
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <h4 className="empty-state-title">No history yet</h4>
              <p className="empty-state-description">
                This work order has no history records.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id}>
                      <td>{getStatusBadge(record.status)}</td>
                      <td>{record.description}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  showSubmit = true,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  children: React.ReactNode;
  showSubmit?: boolean;
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
      <div
        className="card"
        style={{
          maxWidth: "500px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="card-header">
          <h4 className="card-title">{title}</h4>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="card-body">{children}</div>
          <div className="card-footer flex justify-between">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            {showSubmit && (
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="spinner" style={{ width: "14px", height: "14px" }}></div>
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default WorkOrders;
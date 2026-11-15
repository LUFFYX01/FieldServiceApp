import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getWorkOrderById,
  updateWorkOrder,
  updateTechnicianStatus,
  assignTechnician,
  deleteWorkOrder,
  type WorkOrder,
} from "../services/workOrderService";
import {
  getWorkOrderParts,
  addPartToWorkOrder,
  updateUsedQuantity,
  updateRequiredQuantity,
  removePartFromWorkOrder,
  type WorkOrderPart,
} from "../services/workOrderPartService";
import { getParts, type Part } from "../services/partService";
import { getUsers, type User } from "../services/userService";
import { getWorkOrderHistory, type WorkOrderHistory } from "../services/workOrderHistoryService";

type HistoryRecord = WorkOrderHistory;

export default function WorkOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user, isAdmin, isDispatcher, isTechnician } = useAuth();
  const { showToast } = useToast();

  const workOrderId = Number(id);

  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [parts, setWorkOrderParts] = useState<WorkOrderPart[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Parts Catalog for adding parts
  const [availableCatalogParts, setAvailableCatalogParts] = useState<Part[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  // Modals state
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showUpdateUsageModal, setShowUpdateUsageModal] = useState(false);
  const [showEditRequiredModal, setShowEditRequiredModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [selectedPart, setSelectedPart] = useState<WorkOrderPart | null>(null);
  const [addPartForm, setAddPartForm] = useState({ partId: 0, requiredQuantity: 1 });
  const [usageForm, setUsageForm] = useState({ usedQuantity: 0 });
  const [requiredForm, setRequiredForm] = useState({ requiredQuantity: 1 });
  const [assignForm, setAssignForm] = useState<number | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [statusForm, setStatusForm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!token || !workOrderId) return;
    try {
      setLoading(true);
      const [woData, partsData, historyData] = await Promise.all([
        getWorkOrderById(token, workOrderId),
        getWorkOrderParts(token, workOrderId),
        getWorkOrderHistory(token, workOrderId),
      ]);

      setWorkOrder(woData);
      setWorkOrderParts(partsData);
      setHistory(historyData);

      if (isAdmin || isDispatcher) {
        const [catalog, allUsers] = await Promise.all([
          getParts(token, undefined, true),
          getUsers(token, "TECHNICIAN"),
        ]);
        setAvailableCatalogParts(catalog);
        setTechnicians(allUsers.filter((u) => u.active));
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load work order details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, workOrderId]);

  // Status transitions
  const handleStartWork = async () => {
    if (!token || !workOrder) return;
    setSubmitting(true);
    try {
      const updated = await updateTechnicianStatus(token, workOrder.id, {
        status: "IN_PROGRESS",
        notes: "Started work order service",
      });
      setWorkOrder(updated);
      showToast("Work order status changed to IN_PROGRESS", "success");
      const historyData = await getWorkOrderHistory(token, workOrder.id);
      setHistory(historyData);
    } catch (err: any) {
      showToast(err.message || "Failed to start work order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workOrder) return;
    setSubmitting(true);
    try {
      const updated = await updateTechnicianStatus(token, workOrder.id, {
        status: "COMPLETED",
        notes: completeNotes || "Completed service successfully",
      });
      setWorkOrder(updated);
      showToast("Work order marked as COMPLETED!", "success");
      setShowCompleteModal(false);
      setCompleteNotes("");
      const historyData = await getWorkOrderHistory(token, workOrder.id);
      setHistory(historyData);
    } catch (err: any) {
      showToast(err.message || "Failed to complete work order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workOrder) return;
    setSubmitting(true);
    try {
      const updated = await updateWorkOrder(token, workOrder.id, {
        status: statusForm,
      });
      setWorkOrder(updated);
      showToast(`Work order status updated to ${statusForm}`, "success");
      setShowStatusModal(false);
      const historyData = await getWorkOrderHistory(token, workOrder.id);
      setHistory(historyData);
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workOrder || !assignForm) return;
    setSubmitting(true);
    try {
      const updated = await assignTechnician(token, workOrder.id, assignForm);
      setWorkOrder(updated);
      showToast("Technician assigned successfully", "success");
      setShowAssignModal(false);
      const historyData = await getWorkOrderHistory(token, workOrder.id);
      setHistory(historyData);
    } catch (err: any) {
      showToast(err.message || "Failed to assign technician", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Parts management
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workOrder) return;
    if (addPartForm.partId === 0) {
      showToast("Please select a spare part", "error");
      return;
    }
    setSubmitting(true);
    try {
      const added = await addPartToWorkOrder(token, workOrder.id, addPartForm);
      setWorkOrderParts((prev) => [...prev, added]);
      showToast("Required part added to work order", "success");
      setShowAddPartModal(false);
      setAddPartForm({ partId: 0, requiredQuantity: 1 });
      const historyData = await getWorkOrderHistory(token, workOrder.id);
      setHistory(historyData);
    } catch (err: any) {
      showToast(err.message || "Failed to add part", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workOrder || !selectedPart) return;
    setSubmitting(true);
    try {
      const updated = await updateUsedQuantity(token, workOrder.id, selectedPart.id, usageForm);
      setWorkOrderParts((prev) =>
        prev.map((p) => (p.id === selectedPart.id ? updated : p))
      );
      showToast(
        `Parts usage updated to ${usageForm.usedQuantity}. Inventory adjusted automatically.`,
        "success"
      );
      setShowUpdateUsageModal(false);
      setSelectedPart(null);
    } catch (err: any) {
      showToast(err.message || "Failed to update used quantity", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRequired = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workOrder || !selectedPart) return;
    setSubmitting(true);
    try {
      const updated = await updateRequiredQuantity(token, workOrder.id, selectedPart.id, requiredForm);
      setWorkOrderParts((prev) =>
        prev.map((p) => (p.id === selectedPart.id ? updated : p))
      );
      showToast("Required quantity updated", "success");
      setShowEditRequiredModal(false);
      setSelectedPart(null);
      const historyData = await getWorkOrderHistory(token, workOrder.id);
      setHistory(historyData);
    } catch (err: any) {
      showToast(err.message || "Failed to update required quantity", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePart = async (partId: number) => {
    if (!token || !workOrder) return;
    if (!window.confirm("Are you sure you want to remove this part from the work order? Any used stock will be restored to inventory.")) {
      return;
    }
    try {
      await removePartFromWorkOrder(token, workOrder.id, partId);
      setWorkOrderParts((prev) => prev.filter((p) => p.id !== partId));
      showToast("Part removed and unused inventory restored", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to remove part", "error");
    }
  };

  const handleDeleteWorkOrder = async () => {
    if (!token || !workOrder) return;
    if (!window.confirm("Are you sure you want to delete this work order?")) return;
    try {
      await deleteWorkOrder(token, workOrder.id);
      showToast("Work order deleted successfully", "success");
      navigate("/workorders");
    } catch (err: any) {
      showToast(err.message || "Failed to delete work order", "error");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ marginLeft: "1rem" }}>Loading work order details...</span>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        <h3>Work Order Not Found</h3>
        <p>The requested work order could not be loaded or you do not have permission to view it.</p>
        <Link to="/workorders" className="btn btn-primary">
          Back to Work Orders
        </Link>
      </div>
    );
  }

  const isAssignedToCurrentTech =
    isTechnician && user && workOrder.technicianId === user.id;

  const totalPartsCost = parts.reduce((sum, p) => sum + (p.lineTotal || 0), 0);

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

  return (
    <div className="fade-in">
      {/* Top Navigation & Actions Bar */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/workorders" className="btn btn-secondary btn-sm flex items-center gap-2">
          ← Back to List
        </Link>
        <div className="flex gap-2">
          {/* Technician Action Buttons */}
          {isTechnician && isAssignedToCurrentTech && (
            <>
              {workOrder.status === "ASSIGNED" && (
                <button onClick={handleStartWork} className="btn btn-primary" disabled={submitting}>
                  ▶ Start Service (In Progress)
                </button>
              )}
              {workOrder.status === "IN_PROGRESS" && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="btn btn-success"
                  disabled={submitting}
                >
                  ✓ Complete Work Order
                </button>
              )}
            </>
          )}

          {/* Dispatcher/Admin Actions */}
          {(isAdmin || isDispatcher) && (
            <>
              <button
                onClick={() => {
                  setAssignForm(workOrder.technicianId);
                  setShowAssignModal(true);
                }}
                className="btn btn-secondary btn-sm"
              >
                Assign / Reassign
              </button>
              <button
                onClick={() => {
                  setStatusForm(workOrder.status);
                  setShowStatusModal(true);
                }}
                className="btn btn-secondary btn-sm"
              >
                Change Status
              </button>
              <button onClick={handleDeleteWorkOrder} className="btn btn-danger btn-sm">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Details Banner */}
      <div className="card mb-6">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 style={{ margin: 0, color: "#1a1a1a" }}>{workOrder.title}</h3>
            {getStatusBadge(workOrder.status)}
            {getPriorityBadge(workOrder.priority)}
            {workOrder.isOverdue && <span className="badge badge-danger">OVERDUE</span>}
          </div>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            ID #{workOrder.id} • Created {new Date(workOrder.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="card-body">
          <p style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1.5rem" }}>
            {workOrder.description}
          </p>

          <div className="grid grid-3">
            {/* Customer & Site */}
            <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600 }}>
                Customer & Site
              </div>
              <div style={{ fontWeight: 600, fontSize: "1.1rem", marginTop: "0.25rem" }}>
                {workOrder.customerName}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                📍 {workOrder.siteName}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                {workOrder.siteAddress}
              </div>
            </div>

            {/* Assigned Technician */}
            <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600 }}>
                Technician
              </div>
              <div style={{ fontWeight: 600, fontSize: "1.1rem", marginTop: "0.25rem" }}>
                {workOrder.technicianName ? (
                  <span className="badge badge-secondary" style={{ fontSize: "0.95rem" }}>
                    👤 {workOrder.technicianName}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Not Assigned</span>
                )}
              </div>
              {workOrder.scheduledDate && (
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                  Scheduled: {new Date(workOrder.scheduledDate).toLocaleString()}
                </div>
              )}
              {workOrder.completedDate && (
                <div style={{ fontSize: "0.85rem", color: "var(--success-color)", marginTop: "0.25rem" }}>
                  Completed: {new Date(workOrder.completedDate).toLocaleString()}
                </div>
              )}
            </div>

            {/* Service Notes */}
            <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600 }}>
                Service Notes
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: workOrder.notes ? "var(--text-primary)" : "var(--text-muted)",
                  marginTop: "0.25rem",
                  whiteSpace: "pre-wrap",
                }}
              >
                {workOrder.notes || "No service notes added yet."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spare Parts Section */}
      <div className="card mb-6">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="card-title" style={{ margin: 0 }}>
              🔩 Work Order Spare Parts & Inventory
            </h4>
            <span className="badge badge-secondary">{parts.length} part(s)</span>
          </div>

          {(isAdmin || isDispatcher) && workOrder.status !== "COMPLETED" && (
            <button onClick={() => setShowAddPartModal(true)} className="btn btn-primary btn-sm">
              + Add Required Part
            </button>
          )}
        </div>

        <div className="card-body">
          {parts.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <div className="empty-state-icon">🔧</div>
              <h4 className="empty-state-title">No spare parts added to this work order</h4>
              <p className="empty-state-description">
                {(isAdmin || isDispatcher)
                  ? "Specify required replacement parts from catalog for the technician."
                  : "No parts are required for this job."}
              </p>
              {(isAdmin || isDispatcher) && (
                <button onClick={() => setShowAddPartModal(true)} className="btn btn-primary btn-sm">
                  Add Part
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Part Name</th>
                      <th>Part Number</th>
                      <th>Required Qty</th>
                      <th>Used Qty</th>
                      <th>Available Stock</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => {
                      const isFullyConsumed = p.usedQuantity >= p.requiredQuantity;
                      const hasShortage = p.availableStock < p.requiredQuantity - p.usedQuantity;

                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{p.partName}</div>
                          </td>
                          <td>
                            <code>{p.partNumber}</code>
                          </td>
                          <td>
                            <strong>{p.requiredQuantity}</strong>
                          </td>
                          <td>
                            <span
                              className={`badge badge-${
                                isFullyConsumed ? "success" : p.usedQuantity > 0 ? "warning" : "secondary"
                              }`}
                            >
                              {p.usedQuantity} used
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                color: hasShortage ? "var(--danger-color)" : "var(--text-primary)",
                                fontWeight: hasShortage ? 700 : 500,
                              }}
                            >
                              {p.availableStock} in stock {hasShortage && "⚠️ (Shortage)"}
                            </span>
                          </td>
                          <td>${p.unitPrice?.toFixed(2)}</td>
                          <td>
                            <strong>${p.lineTotal?.toFixed(2)}</strong>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              {/* Record Actual Usage (Technician or Admin) */}
                              {(isTechnician || isAdmin) && workOrder.status !== "COMPLETED" && (
                                <button
                                  onClick={() => {
                                    setSelectedPart(p);
                                    setUsageForm({ usedQuantity: p.usedQuantity });
                                    setShowUpdateUsageModal(true);
                                  }}
                                  className="btn btn-primary btn-sm"
                                  title="Record Actual Usage"
                                >
                                  Record Usage
                                </button>
                              )}

                              {/* Edit Required Qty (Dispatcher or Admin) */}
                              {(isAdmin || isDispatcher) && workOrder.status !== "COMPLETED" && (
                                <button
                                  onClick={() => {
                                    setSelectedPart(p);
                                    setRequiredForm({ requiredQuantity: p.requiredQuantity });
                                    setShowEditRequiredModal(true);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  title="Edit Required Quantity"
                                >
                                  Edit Qty
                                </button>
                              )}

                              {/* Remove part (Dispatcher or Admin) */}
                              {(isAdmin || isDispatcher) && workOrder.status !== "COMPLETED" && (
                                <button
                                  onClick={() => handleRemovePart(p.id)}
                                  className="btn btn-danger btn-sm"
                                  title="Remove Part"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total parts cost summary */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "2rem",
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  marginTop: "1rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Total Parts Required: </span>
                  <strong>{parts.reduce((sum, p) => sum + p.requiredQuantity, 0)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Total Parts Consumed: </span>
                  <strong>{parts.reduce((sum, p) => sum + p.usedQuantity, 0)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Total Spare Parts Cost: </span>
                  <strong style={{ fontSize: "1.1rem", color: "#2563eb" }}>${totalPartsCost.toFixed(2)}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* History Timeline */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">📜 Work Order History Timeline</h4>
        </div>
        <div className="card-body">
          {history.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No history records yet.</p>
          ) : (
            <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
              <div
                style={{
                  position: "absolute",
                  left: "7px",
                  top: "10px",
                  bottom: "10px",
                  width: "2px",
                  backgroundColor: "#e5e7eb",
                }}
              />
              {history.map((record) => (
                <div key={record.id} style={{ position: "relative", marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "-1.5rem",
                      top: "4px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: "#2563eb",
                      border: "2px solid #fff",
                    }}
                  />
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ marginTop: "0.25rem", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                    {record.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Add Required Part */}
      {showAddPartModal && (
        <Modal
          title="Add Required Spare Part"
          onClose={() => setShowAddPartModal(false)}
          onSubmit={handleAddPart}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Select Part *</label>
            <select
              className="form-select"
              value={addPartForm.partId}
              onChange={(e) => setAddPartForm({ ...addPartForm, partId: Number(e.target.value) })}
              required
            >
              <option value={0}>Choose a spare part...</option>
              {availableCatalogParts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.partNumber}) - In Stock: {p.quantity} - ${p.price?.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Required Quantity *</label>
            <input
              type="number"
              min={1}
              className="form-input"
              value={addPartForm.requiredQuantity}
              onChange={(e) =>
                setAddPartForm({ ...addPartForm, requiredQuantity: Math.max(1, Number(e.target.value)) })
              }
              required
            />
          </div>
        </Modal>
      )}

      {/* MODAL: Update Used Quantity */}
      {showUpdateUsageModal && selectedPart && (
        <Modal
          title={`Record Parts Usage: ${selectedPart.partName}`}
          onClose={() => {
            setShowUpdateUsageModal(false);
            setSelectedPart(null);
          }}
          onSubmit={handleUpdateUsage}
          submitting={submitting}
        >
          <div style={{ backgroundColor: "#f9fafb", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            <div>
              <strong>Required Quantity: </strong> {selectedPart.requiredQuantity}
            </div>
            <div>
              <strong>Currently Recorded Used: </strong> {selectedPart.usedQuantity}
            </div>
            <div>
              <strong>Stock Available in Warehouse: </strong> {selectedPart.availableStock}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Actual Used Quantity *</label>
            <input
              type="number"
              min={0}
              max={selectedPart.requiredQuantity}
              className="form-input"
              value={usageForm.usedQuantity}
              onChange={(e) =>
                setUsageForm({ usedQuantity: Math.max(0, Number(e.target.value)) })
              }
              required
            />
            <small style={{ color: "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>
              Usage cannot exceed required quantity ({selectedPart.requiredQuantity}). Inventory will be deducted or restored automatically.
            </small>
          </div>
        </Modal>
      )}

      {/* MODAL: Edit Required Quantity */}
      {showEditRequiredModal && selectedPart && (
        <Modal
          title={`Change Required Quantity: ${selectedPart.partName}`}
          onClose={() => {
            setShowEditRequiredModal(false);
            setSelectedPart(null);
          }}
          onSubmit={handleUpdateRequired}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">New Required Quantity *</label>
            <input
              type="number"
              min={selectedPart.usedQuantity || 1}
              className="form-input"
              value={requiredForm.requiredQuantity}
              onChange={(e) =>
                setRequiredForm({ requiredQuantity: Math.max(1, Number(e.target.value)) })
              }
              required
            />
            <small style={{ color: "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>
              Required quantity cannot be less than already used quantity ({selectedPart.usedQuantity}).
            </small>
          </div>
        </Modal>
      )}

      {/* MODAL: Assign Technician */}
      {showAssignModal && (
        <Modal
          title="Assign / Reassign Technician"
          onClose={() => setShowAssignModal(false)}
          onSubmit={handleAssignTechnician}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Select Field Technician *</label>
            <select
              className="form-select"
              value={assignForm || ""}
              onChange={(e) => setAssignForm(Number(e.target.value) || null)}
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

      {/* MODAL: Complete Work Order */}
      {showCompleteModal && (
        <Modal
          title="Complete Work Order"
          onClose={() => setShowCompleteModal(false)}
          onSubmit={handleCompleteWorkOrder}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Technician Completion Notes *</label>
            <textarea
              className="form-textarea"
              placeholder="Detail actions taken, repairs made, equipment tested..."
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              required
              rows={4}
            />
          </div>
        </Modal>
      )}

      {/* MODAL: Dispatcher Change Status */}
      {showStatusModal && (
        <Modal
          title="Update Work Order Status"
          onClose={() => setShowStatusModal(false)}
          onSubmit={handleStatusChange}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Status *</label>
            <select
              className="form-select"
              value={statusForm}
              onChange={(e) => setStatusForm(e.target.value)}
              required
            >
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
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

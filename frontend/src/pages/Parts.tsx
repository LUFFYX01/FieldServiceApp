import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getParts,
  createPart,
  updatePart,
  adjustStock,
  getPartTransactions,
  deletePart,
  type Part,
  type InventoryTransaction,
  type CreatePartData,
  type UpdatePartData,
} from "../services/partService";

const emptyPartForm: CreatePartData = {
  name: "",
  partNumber: "",
  description: "",
  quantity: 0,
  price: 0,
  lowStockThreshold: 5,
};

export default function Parts() {
  const { token, isAdmin, isDispatcher } = useAuth();
  const { showToast } = useToast();

  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "INACTIVE">("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [createForm, setCreateForm] = useState<CreatePartData>(emptyPartForm);
  const [editForm, setEditForm] = useState<UpdatePartData>({
    name: "",
    partNumber: "",
    description: "",
    quantity: 0,
    price: 0,
    active: true,
    lowStockThreshold: 5,
  });
  const [adjustForm, setAdjustForm] = useState({ quantity: 10, reason: "" });
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadParts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getParts(token);
      setParts(data);
      setFilteredParts(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load parts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, [token]);

  useEffect(() => {
    let filtered = parts;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.partNumber.toLowerCase().includes(lower) ||
          (p.description && p.description.toLowerCase().includes(lower))
      );
    }

    if (filterType === "IN_STOCK") {
      filtered = filtered.filter((p) => p.quantity > 0 && p.active);
    } else if (filterType === "LOW_STOCK") {
      filtered = filtered.filter((p) => p.isLowStock && p.active);
    } else if (filterType === "INACTIVE") {
      filtered = filtered.filter((p) => !p.active);
    }

    setFilteredParts(filtered);
  }, [searchTerm, filterType, parts]);

  // Create part
  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const newPart = await createPart(token, createForm);
      setParts((prev) => [newPart, ...prev]);
      showToast("Part created successfully", "success");
      setShowCreateModal(false);
      setCreateForm(emptyPartForm);
    } catch (err: any) {
      showToast(err.message || "Failed to create part", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit part
  const handleOpenEdit = (part: Part) => {
    setSelectedPart(part);
    setEditForm({
      name: part.name,
      partNumber: part.partNumber,
      description: part.description || "",
      quantity: part.quantity,
      price: part.price,
      active: part.active,
      lowStockThreshold: part.lowStockThreshold || 5,
    });
    setShowEditModal(true);
  };

  const handleEditPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPart) return;
    setSubmitting(true);
    try {
      const updated = await updatePart(token, selectedPart.id, editForm);
      setParts((prev) => prev.map((p) => (p.id === selectedPart.id ? updated : p)));
      showToast("Part updated successfully", "success");
      setShowEditModal(false);
      setSelectedPart(null);
    } catch (err: any) {
      showToast(err.message || "Failed to update part", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Adjust Stock / Restock
  const handleOpenAdjust = (part: Part) => {
    setSelectedPart(part);
    setAdjustForm({ quantity: 10, reason: "Restocked from vendor shipment" });
    setShowAdjustModal(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPart) return;
    if (adjustForm.quantity === 0) {
      showToast("Adjustment quantity cannot be zero", "error");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await adjustStock(token, selectedPart.id, adjustForm);
      setParts((prev) => prev.map((p) => (p.id === selectedPart.id ? updated : p)));
      showToast(
        `Inventory ${adjustForm.quantity > 0 ? "restocked" : "adjusted"} successfully. New stock: ${updated.quantity}`,
        "success"
      );
      setShowAdjustModal(false);
      setSelectedPart(null);
    } catch (err: any) {
      showToast(err.message || "Failed to adjust stock", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // History
  const handleOpenHistory = async (part: Part) => {
    setSelectedPart(part);
    setShowHistoryModal(true);
    try {
      const txs = await getPartTransactions(token!, part.id);
      setTransactions(txs);
    } catch (err: any) {
      showToast(err.message || "Failed to load inventory transactions", "error");
    }
  };

  // Delete / Deactivate
  const handleDeletePart = async (part: Part) => {
    if (!token) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${part.name}"? If it has been used in work orders, it will be deactivated instead of deleted.`
      )
    ) {
      return;
    }
    try {
      await deletePart(token, part.id);
      showToast("Part deleted or deactivated successfully", "success");
      loadParts();
    } catch (err: any) {
      showToast(err.message || "Failed to delete part", "error");
    }
  };

  const getStockBadge = (part: Part) => {
    if (!part.active) {
      return <span className="badge badge-secondary">Inactive</span>;
    }
    if (part.quantity === 0) {
      return <span className="badge badge-danger">Out of Stock</span>;
    }
    if (part.isLowStock) {
      return <span className="badge badge-warning">Low Stock ({part.quantity})</span>;
    }
    return <span className="badge badge-success">{part.quantity} in stock</span>;
  };

  const getTxBadge = (type: string) => {
    switch (type) {
      case "RESTOCK":
        return <span className="badge badge-success">RESTOCK</span>;
      case "USAGE":
        return <span className="badge badge-warning">USAGE</span>;
      case "USAGE_RETURN":
        return <span className="badge badge-info">RETURN</span>;
      case "ADJUSTMENT":
        return <span className="badge badge-secondary">ADJUSTMENT</span>;
      default:
        return <span className="badge badge-secondary">{type}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ marginLeft: "1rem" }}>Loading parts inventory...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header & Controls */}
      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="card-title" style={{ margin: 0 }}>
              🔩 Master Parts Catalog & Inventory
            </h4>
            <span className="badge badge-secondary">{filteredParts.length} item(s)</span>
          </div>

          {(isAdmin || isDispatcher) && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              + New Part
            </button>
          )}
        </div>

        <div className="card-body">
          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by part name, part number, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: "250px" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("ALL")}
                className={`btn btn-sm ${filterType === "ALL" ? "btn-primary" : "btn-secondary"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("IN_STOCK")}
                className={`btn btn-sm ${filterType === "IN_STOCK" ? "btn-primary" : "btn-secondary"}`}
              >
                In Stock
              </button>
              <button
                onClick={() => setFilterType("LOW_STOCK")}
                className={`btn btn-sm ${filterType === "LOW_STOCK" ? "btn-warning" : "btn-secondary"}`}
              >
                ⚠️ Low Stock
              </button>
              <button
                onClick={() => setFilterType("INACTIVE")}
                className={`btn btn-sm ${filterType === "INACTIVE" ? "btn-primary" : "btn-secondary"}`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Parts Table */}
      {filteredParts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔩</div>
            <h4 className="empty-state-title">No spare parts found</h4>
            <p className="empty-state-description">
              {searchTerm || filterType !== "ALL"
                ? "Try adjusting your search query or filters."
                : "Add your first spare part to the inventory catalog."}
            </p>
            {(isAdmin || isDispatcher) && (
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                Add Part
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
                  <th>Part Details</th>
                  <th>Part Number</th>
                  <th>Available Stock</th>
                  <th>Unit Price</th>
                  <th>Min Threshold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((p) => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{p.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {p.description || "No description"}
                      </div>
                    </td>
                    <td>
                      <code>{p.partNumber}</code>
                    </td>
                    <td>
                      <strong style={{ fontSize: "1.05rem" }}>{p.quantity}</strong>
                    </td>
                    <td>${p.price?.toFixed(2)}</td>
                    <td>{p.lowStockThreshold} units</td>
                    <td>{getStockBadge(p)}</td>
                    <td>
                      <div className="flex gap-2">
                        {/* Adjust Stock / Restock */}
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="btn btn-success btn-sm"
                          title="Restock or Adjust Inventory"
                        >
                          Restock
                        </button>

                        {/* Movement History */}
                        <button
                          onClick={() => handleOpenHistory(p)}
                          className="btn btn-secondary btn-sm"
                          title="View Inventory Movement Log"
                        >
                          History
                        </button>

                        {/* Edit details */}
                        {(isAdmin || isDispatcher) && (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Part Details"
                          >
                            Edit
                          </button>
                        )}

                        {/* Delete / Deactivate */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeletePart(p)}
                            className="btn btn-danger btn-sm"
                            title="Deactivate or Delete Part"
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
      )}

      {/* MODAL: Create Part */}
      {showCreateModal && (
        <Modal
          title="Add New Spare Part to Catalog"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePart}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Part Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Hydraulic Pump Motor"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Part Number (Unique Identifier) *</label>
            <input
              className="form-input"
              placeholder="e.g. HPM-101"
              value={createForm.partNumber}
              onChange={(e) => setCreateForm({ ...createForm, partNumber: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Technical specifications, model compatibility..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Initial Quantity *</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={createForm.quantity}
                onChange={(e) =>
                  setCreateForm({ ...createForm, quantity: Math.max(0, Number(e.target.value)) })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="form-input"
                value={createForm.price}
                onChange={(e) =>
                  setCreateForm({ ...createForm, price: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Low Stock Alert *</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={createForm.lowStockThreshold}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    lowStockThreshold: Math.max(0, Number(e.target.value)),
                  })
                }
                required
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Edit Part */}
      {showEditModal && selectedPart && (
        <Modal
          title={`Edit Part: ${selectedPart.name}`}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPart(null);
          }}
          onSubmit={handleEditPart}
          submitting={submitting}
        >
          <div className="form-group">
            <label className="form-label">Part Name *</label>
            <input
              className="form-input"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Part Number *</label>
            <input
              className="form-input"
              value={editForm.partNumber}
              onChange={(e) => setEditForm({ ...editForm, partNumber: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Current Stock *</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={editForm.quantity}
                onChange={(e) =>
                  setEditForm({ ...editForm, quantity: Math.max(0, Number(e.target.value)) })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="form-input"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm({ ...editForm, price: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Low Stock Alert *</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={editForm.lowStockThreshold}
                onChange={(e) =>
                  setEditForm({ ...editForm, lowStockThreshold: Math.max(0, Number(e.target.value)) })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
              />
              <span>Part is Active (available for work orders)</span>
            </label>
          </div>
        </Modal>
      )}

      {/* MODAL: Adjust Stock / Restock */}
      {showAdjustModal && selectedPart && (
        <Modal
          title={`Adjust Inventory: ${selectedPart.name}`}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedPart(null);
          }}
          onSubmit={handleAdjustStock}
          submitting={submitting}
        >
          <div style={{ backgroundColor: "#f9fafb", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            <div>
              <strong>Part Number: </strong> <code>{selectedPart.partNumber}</code>
            </div>
            <div>
              <strong>Current Warehouse Stock: </strong> {selectedPart.quantity} units
            </div>
            <div>
              <strong>Projected Stock After Adjustment: </strong>
              <span
                style={{
                  color: selectedPart.quantity + adjustForm.quantity < 0 ? "var(--danger-color)" : "inherit",
                  fontWeight: 700,
                }}
              >
                {selectedPart.quantity + adjustForm.quantity} units
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Adjustment Quantity (+ for Restock, - for Reduction/Damage) *
            </label>
            <input
              type="number"
              className="form-input"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Notes *</label>
            <input
              className="form-input"
              placeholder="e.g. Received shipment PO-4091, or Damaged in transit"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              required
            />
          </div>
        </Modal>
      )}

      {/* MODAL: Inventory Movement History */}
      {showHistoryModal && selectedPart && (
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
          <div className="card" style={{ maxWidth: "750px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div className="card-header flex items-center justify-between">
              <div>
                <h4 className="card-title" style={{ margin: 0 }}>
                  Inventory Movement Log: {selectedPart.name}
                </h4>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Current stock: {selectedPart.quantity} units • Part #{selectedPart.partNumber}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedPart(null);
                  setTransactions([]);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}
              >
                ✕
              </button>
            </div>

            <div className="card-body">
              {transactions.length === 0 ? (
                <div className="empty-state" style={{ padding: "2rem" }}>
                  <p>No inventory movements recorded for this part yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Change</th>
                        <th>Before → After</th>
                        <th>User</th>
                        <th>Reason / Work Order</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id}>
                          <td>{getTxBadge(t.transactionType)}</td>
                          <td>
                            <strong style={{ color: t.quantityChanged > 0 ? "var(--success-color)" : "var(--danger-color)" }}>
                              {t.quantityChanged > 0 ? `+${t.quantityChanged}` : t.quantityChanged}
                            </strong>
                          </td>
                          <td style={{ fontSize: "0.9rem" }}>
                            {t.previousQuantity} → <strong>{t.newQuantity}</strong>
                          </td>
                          <td>{t.userName || "System"}</td>
                          <td>
                            <div>{t.reason || "Stock update"}</div>
                            {t.workOrderId && (
                              <small style={{ color: "#2563eb" }}>
                                Work Order #{t.workOrderId}
                              </small>
                            )}
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                            {new Date(t.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card-footer flex justify-between">
              <span />
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedPart(null);
                  setTransactions([]);
                }}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
      <div className="card" style={{ maxWidth: "550px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
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

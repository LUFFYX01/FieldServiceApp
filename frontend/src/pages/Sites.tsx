import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getSites,
  createSite,
  updateSite,
  deleteSite,
  type Site,
} from "../services/siteService";
import { getCustomers } from "../services/customerService";

type Customer = {
  id: number;
  companyName: string;
};

const emptyForm = {
  siteName: "",
  address: "",
  contactPerson: "",
  phone: "",
  customerId: 0,
};

function Sites() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    Promise.all([getSites(token), getCustomers(token)])
      .then(([siteData, customerData]) => {
        setSites(siteData);
        setFilteredSites(siteData);
        setCustomers(customerData);
      })
      .catch((error) => {
        console.error(error);
        showToast("Failed to load sites", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, showToast]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = sites.filter(
        (site) =>
          site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (site.customerName && site.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSites(filtered);
    } else {
      setFilteredSites(sites);
    }
  }, [searchTerm, sites]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === "customerId" ? Number(value) : value,
    }));
  };

  const handleOpenModal = (site?: Site) => {
    if (site) {
      setEditingId(site.id);
      setForm({
        siteName: site.siteName,
        address: site.address,
        contactPerson: site.contactPerson,
        phone: site.phone,
        customerId: site.customerId,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);

    try {
      if (editingId !== null) {
        const updatedSite = await updateSite(token, editingId, {
          siteName: form.siteName,
          address: form.address,
          contactPerson: form.contactPerson,
          phone: form.phone,
          active: true,
        });
        setSites((previous) =>
          previous.map((site) => (site.id === editingId ? updatedSite : site))
        );
        showToast("Site updated successfully", "success");
      } else {
        if (form.customerId === 0) {
          showToast("Please select a customer", "error");
          setSubmitting(false);
          return;
        }
        const newSite = await createSite(token, form);
        setSites((previous) => [...previous, newSite]);
        showToast("Site created successfully", "success");
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      showToast(
        editingId !== null ? "Failed to update site" : "Failed to create site",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this site?")) return;

    try {
      await deleteSite(token, id);
      setSites((previous) => previous.filter((site) => site.id !== id));
      showToast("Site deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to delete site", "error");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ marginLeft: "1rem" }}>Loading sites...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <h4 className="card-title">Sites</h4>
            <span className="badge badge-secondary">{filteredSites.length} total</span>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
            disabled={customers.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Site
          </button>
        </div>
        <div className="card-body">
          <input
            type="text"
            className="form-input"
            placeholder="Search sites by name, address, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: "400px" }}
          />
        </div>
      </div>

      {/* Sites Table */}
      {filteredSites.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📍</div>
            <h4 className="empty-state-title">
              {searchTerm ? "No sites found" : customers.length === 0 ? "No customers available" : "No sites yet"}
            </h4>
            <p className="empty-state-description">
              {searchTerm
                ? "Try a different search term"
                : customers.length === 0
                ? "Create a customer first to add sites"
                : "Add your first site to get started"}
            </p>
            {!searchTerm && customers.length > 0 && (
              <button onClick={() => handleOpenModal()} className="btn btn-primary">
                Add Site
              </button>
            )}
            {!searchTerm && customers.length === 0 && (
              <button
                onClick={() => (window.location.href = "/customers")}
                className="btn btn-primary"
              >
                Add Customer First
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
                  <th>Site Name</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <tr key={site.id}>
                    <td>
                      <div style={{ fontWeight: "500" }}>{site.siteName}</div>
                    </td>
                    <td>{site.customerName}</td>
                    <td>{site.address}</td>
                    <td>{site.contactPerson}</td>
                    <td>{site.phone || "-"}</td>
                    <td>
                      <span className={`badge ${site.active ? "badge-success" : "badge-secondary"}`}>
                        {site.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(site)}
                          className="btn btn-secondary btn-sm"
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(site.id)}
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

      {/* Modal */}
      {showModal && (
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
              <h4 className="card-title">
                {editingId !== null ? "Edit Site" : "Add Site"}
              </h4>
              <button
                onClick={handleCloseModal}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card-body">
                {editingId === null && (
                  <div className="form-group">
                    <label className="form-label">Customer *</label>
                    <select
                      name="customerId"
                      className="form-select"
                      value={form.customerId}
                      onChange={handleChange}
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
                )}

                <div className="form-group">
                  <label className="form-label">Site Name *</label>
                  <input
                    name="siteName"
                    className="form-input"
                    placeholder="Enter site name"
                    value={form.siteName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <input
                    name="address"
                    className="form-input"
                    placeholder="Enter site address"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person *</label>
                  <input
                    name="contactPerson"
                    className="form-input"
                    placeholder="Enter contact person name"
                    value={form.contactPerson}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    name="phone"
                    className="form-input"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="card-footer flex justify-between">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner" style={{ width: "14px", height: "14px" }}></div>
                      Saving...
                    </span>
                  ) : (
                    editingId !== null ? "Update Site" : "Create Site"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sites;
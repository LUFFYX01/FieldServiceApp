import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from "../services/customerService";

const emptyForm = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  active: true,
};

function Customers() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    getCustomers(token)
      .then((data) => {
        setCustomers(data);
        setFilteredCustomers(data);
      })
      .catch((error) => {
        console.error(error);
        showToast("Failed to load customers", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, showToast]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(
        (customer) =>
          customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setForm({
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        active: customer.active,
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
        const updatedCustomer = await updateCustomer(token, editingId, form);
        setCustomers((previous) =>
          previous.map((customer) =>
            customer.id === editingId ? updatedCustomer : customer
          )
        );
        showToast("Customer updated successfully", "success");
      } else {
        const newCustomer = await createCustomer(token, form);
        setCustomers((previous) => [...previous, newCustomer]);
        showToast("Customer created successfully", "success");
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      showToast(
        editingId !== null ? "Failed to update customer" : "Failed to create customer",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      await deleteCustomer(token, id);
      setCustomers((previous) => previous.filter((customer) => customer.id !== id));
      showToast("Customer deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to delete customer", "error");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ marginLeft: "1rem" }}>Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <h4 className="card-title">Customers</h4>
            <span className="badge badge-secondary">{filteredCustomers.length} total</span>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Customer
          </button>
        </div>
        <div className="card-body">
          <input
            type="text"
            className="form-input"
            placeholder="Search customers by name, contact, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: "400px" }}
          />
        </div>
      </div>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h4 className="empty-state-title">
              {searchTerm ? "No customers found" : "No customers yet"}
            </h4>
            <p className="empty-state-description">
              {searchTerm
                ? "Try a different search term"
                : "Add your first customer to get started"}
            </p>
            {!searchTerm && (
              <button onClick={() => handleOpenModal()} className="btn btn-primary">
                Add Customer
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
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ fontWeight: "500" }}>{customer.companyName}</div>
                    </td>
                    <td>{customer.contactPerson}</td>
                    <td>
                      <a href={`mailto:${customer.email}`} style={{ color: "#1a1a1a", textDecoration: "none" }}>
                        {customer.email}
                      </a>
                    </td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.address || "-"}</td>
                    <td>
                      <span className={`badge ${customer.active ? "badge-success" : "badge-secondary"}`}>
                        {customer.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="btn btn-secondary btn-sm"
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
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
        <div style={{
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
          padding: "1rem"
        }}>
          <div className="card" style={{
            maxWidth: "500px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div className="card-header">
              <h4 className="card-title">
                {editingId !== null ? "Edit Customer" : "Add Customer"}
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
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    name="companyName"
                    className="form-input"
                    placeholder="Enter company name"
                    value={form.companyName}
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
                  <label className="form-label">Email *</label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    value={form.email}
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

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    name="address"
                    className="form-input"
                    placeholder="Enter address"
                    value={form.address}
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
                    editingId !== null ? "Update Customer" : "Create Customer"
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

export default Customers;
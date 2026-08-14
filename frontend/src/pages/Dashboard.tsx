import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCustomers } from "../services/customerService";

type Customer = {
    id: number;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    active: boolean;
};

function Dashboard() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) return;

        getCustomers(token)
            .then((data) => setCustomers(data))
            .catch((error) => {
                console.error(error);
                setError("Failed to load customers");
            });
    }, [token]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div>
            <header>
                <h1>Keystone Field Service</h1>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <nav>
                <button>Customers</button>
                <button>Sites</button>
                <button>Work Orders</button>
            </nav>

            <main>
                <h2>Customers</h2>

                {error && <p>{error}</p>}

                {customers.length === 0 && !error && (
                    <p>No customers found.</p>
                )}

                {customers.map((customer) => (
                    <div key={customer.id}>
                        <h3>{customer.companyName}</h3>
                        <p>Contact: {customer.contactPerson}</p>
                        <p>Email: {customer.email}</p>
                    </div>
                ))}
            </main>
        </div>
    );
}

export default Dashboard;
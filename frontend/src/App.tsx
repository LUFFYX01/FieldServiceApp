import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Sites from "./pages/Sites";
import WorkOrders from "./pages/WorkOrders";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/login" element={<Login />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Layout><Dashboard /></Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute>
                            <Layout><Customers /></Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/sites"
                    element={
                        <ProtectedRoute>
                            <Layout><Sites /></Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/workorders"
                    element={
                        <ProtectedRoute>
                            <Layout><WorkOrders /></Layout>
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
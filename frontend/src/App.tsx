import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Sites from "./pages/Sites";
import WorkOrders from "./pages/WorkOrders";
import WorkOrderDetails from "./pages/WorkOrderDetails";
import Parts from "./pages/Parts";
import Users from "./pages/Users";
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
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "DISPATCHER"]}>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sites"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "DISPATCHER"]}>
              <Layout>
                <Sites />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/workorders"
          element={
            <ProtectedRoute>
              <Layout>
                <WorkOrders />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/workorders/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <WorkOrderDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/parts"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "DISPATCHER"]}>
              <Layout>
                <Parts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

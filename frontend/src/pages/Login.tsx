import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { login } from "../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await login({ email, password });
      authLogin(response.token);
      showToast("Login successful!", "success");
      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        padding: "1rem",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div className="text-center mb-6">
          <div
            style={{
              width: "60px",
              height: "60px",
              margin: "0 auto 1rem",
              backgroundColor: "#2563eb",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-2a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem", color: "#111827" }}>
            KeyStone Field Service
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Full-Stack Field Operations & Inventory
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="user@keystone.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner" style={{ width: "16px", height: "16px" }} />
                Authenticating...
              </span>
            ) : (
              "Sign In to KeyStone"
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: "0.5rem" }}>
            Quick Demo Login (Click to fill):
          </p>
          <div className="flex gap-2 justify-center" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleFillDemo("admin@keystone.com", "admin123")}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.75rem" }}
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("dispatcher@keystone.com", "dispatcher123")}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.75rem" }}
            >
              📋 Dispatcher
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("tech1@keystone.com", "tech123")}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.75rem" }}
            >
              🔧 Technician
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

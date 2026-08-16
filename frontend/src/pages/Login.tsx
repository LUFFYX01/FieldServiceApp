import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid email or password");
      }

      const data = await response.json();
      login(data.token);
      showToast("Login successful!", "success");
      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8f8f8",
      padding: "1rem"
    }}>
      <div className="card" style={{
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.08)",
        border: "1px solid #e0e0e0"
      }}>
        <div className="text-center mb-6">
          <div style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 1rem",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-2a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#1a1a1a" }}>
            Field Service Management
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "0" }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner" style={{ width: "16px", height: "16px" }}></div>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Demo: Use your registered credentials
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
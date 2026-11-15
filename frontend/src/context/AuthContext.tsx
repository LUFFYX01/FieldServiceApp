import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { parseJwt, type DecodedToken } from "../config/api";

export interface AuthUser {
  id: number;
  email: string;
  role: "ADMIN" | "DISPATCHER" | "TECHNICIAN";
}

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isDispatcher: boolean;
  isTechnician: boolean;
  hasRole: (...roles: Array<"ADMIN" | "DISPATCHER" | "TECHNICIAN">) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  const user = useMemo<AuthUser | null>(() => {
    if (!token) return null;
    const decoded: DecodedToken | null = parseJwt(token);
    if (!decoded) return null;

    // Check if token expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.sub,
      role: decoded.role,
    };
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
      window.location.href = "/login";
    };

    window.addEventListener("auth:expired", handleAuthExpired);

    return () => {
      window.removeEventListener("auth:expired", handleAuthExpired);
    };
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isDispatcher = user?.role === "DISPATCHER";
  const isTechnician = user?.role === "TECHNICIAN";

  const hasRole = (...roles: Array<"ADMIN" | "DISPATCHER" | "TECHNICIAN">) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAdmin,
        isDispatcher,
        isTechnician,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

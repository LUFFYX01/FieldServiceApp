// Centralized API Configuration
export const API_BASE_URL = import.meta.env.DEV ? "" : "http://localhost:8080";

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
  },

  // Customers
  CUSTOMERS: {
    BASE: `${API_BASE_URL}/api/customers`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/customers/${id}`,
  },

  // Sites
  SITES: {
    BASE: `${API_BASE_URL}/api/sites`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/sites/${id}`,
  },

  // Work Orders
  WORK_ORDERS: {
    BASE: `${API_BASE_URL}/api/workorders`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/workorders/${id}`,
    ASSIGN: (id: number) => `${API_BASE_URL}/api/workorders/${id}/assign`,
    TECHNICIAN_STATUS: (id: number) => `${API_BASE_URL}/api/workorders/${id}/technician-status`,
    HISTORY: (id: number) => `${API_BASE_URL}/api/workorders/${id}/history`,
  },

  // Work Order Parts
  WORK_ORDER_PARTS: {
    BASE: (workOrderId: number) => `${API_BASE_URL}/api/workorders/${workOrderId}/parts`,
    BY_ID: (workOrderId: number, partId: number) => `${API_BASE_URL}/api/workorders/${workOrderId}/parts/${partId}`,
    REQUIRED_QUANTITY: (workOrderId: number, partId: number) =>
      `${API_BASE_URL}/api/workorders/${workOrderId}/parts/${partId}/required-quantity`,
  },

  // Parts Catalog & Master Inventory
  PARTS: {
    BASE: `${API_BASE_URL}/api/parts`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/parts/${id}`,
    ADJUST_STOCK: (id: number) => `${API_BASE_URL}/api/parts/${id}/adjust-stock`,
    TRANSACTIONS: (id: number) => `${API_BASE_URL}/api/parts/${id}/transactions`,
  },

  // Users
  USERS: {
    BASE: `${API_BASE_URL}/api/users`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/users/${id}`,
    CHANGE_PASSWORD: (id: number) => `${API_BASE_URL}/api/users/${id}/change-password`,
  },

  // Health Check
  HEALTH: `${API_BASE_URL}/api/ping`,
} as const;

export interface DecodedToken {
  sub: string;
  role: "ADMIN" | "DISPATCHER" | "TECHNICIAN";
  id: number;
  exp: number;
}

export function parseJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// API Error Types
export class ApiError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// Helper function to handle API responses
export async function handleApiResponse<T>(response: Response): Promise<T> {
  // JWT expired / unauthorized
  if (response.status === 401) {
    window.dispatchEvent(new Event("auth:expired"));
  }

  if (response.status === 403) {
    window.dispatchEvent(
      new CustomEvent("auth:forbidden", {
        detail: { message: "You do not have permission to perform this action." },
      })
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status}`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, errorText);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text() as unknown as T;
}

// Generic API request function
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  return handleApiResponse<T>(response);
}

// Authenticated API request function
export async function authenticatedApiRequest<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const authOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  return apiRequest<T>(url, authOptions);
}

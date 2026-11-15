import { API_ENDPOINTS, apiRequest, ApiError } from '../config/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: {
    id: number;
    email: string;
    userName: string;
    role: string;
  };
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  role: string;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    return await apiRequest<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`Login failed: ${error.message}`);
    }
    throw new Error('Login failed');
  }
}

export async function register(userData: RegisterRequest) {
  try {
    return await apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`Registration failed: ${error.message}`);
    }
    throw new Error('Registration failed');
  }
}
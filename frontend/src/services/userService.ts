import { API_ENDPOINTS, authenticatedApiRequest } from "../config/api";

export interface User {
  id: number;
  userName: string;
  email: string;
  role: "ADMIN" | "DISPATCHER" | "TECHNICIAN";
  active: boolean;
}

export interface CreateUserData {
  userName: string;
  email: string;
  role: "ADMIN" | "DISPATCHER" | "TECHNICIAN";
  password?: string;
}

export interface UpdateUserData {
  userName: string;
  email: string;
  role: "ADMIN" | "DISPATCHER" | "TECHNICIAN";
  active?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export async function getUsers(token: string, role?: string): Promise<User[]> {
  let url = API_ENDPOINTS.USERS.BASE;
  if (role) {
    url += `?role=${role}`;
  }
  return authenticatedApiRequest<User[]>(url, token);
}

export async function getUserById(token: string, id: number): Promise<User> {
  return authenticatedApiRequest<User>(API_ENDPOINTS.USERS.BY_ID(id), token);
}

export async function createUser(token: string, data: CreateUserData): Promise<User> {
  return authenticatedApiRequest<User>(API_ENDPOINTS.USERS.BASE, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(token: string, id: number, data: UpdateUserData): Promise<User> {
  return authenticatedApiRequest<User>(API_ENDPOINTS.USERS.BY_ID(id), token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changePassword(
  token: string,
  id: number,
  data: ChangePasswordData
): Promise<void> {
  return authenticatedApiRequest<void>(API_ENDPOINTS.USERS.CHANGE_PASSWORD(id), token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(token: string, id: number): Promise<void> {
  return authenticatedApiRequest<void>(API_ENDPOINTS.USERS.BY_ID(id), token, {
    method: "DELETE",
  });
}

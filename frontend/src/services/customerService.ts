import { API_ENDPOINTS, authenticatedApiRequest } from "../config/api";

export interface Customer {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateCustomerData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
}

export interface UpdateCustomerData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
}

export async function getCustomers(token: string, search?: string): Promise<Customer[]> {
  let url = API_ENDPOINTS.CUSTOMERS.BASE;
  if (search) {
    url += `?search=${encodeURIComponent(search)}`;
  }
  return authenticatedApiRequest<Customer[]>(url, token);
}

export async function getCustomerById(token: string, id: number): Promise<Customer> {
  return authenticatedApiRequest<Customer>(API_ENDPOINTS.CUSTOMERS.BY_ID(id), token);
}

export async function createCustomer(token: string, customer: CreateCustomerData): Promise<Customer> {
  return authenticatedApiRequest<Customer>(API_ENDPOINTS.CUSTOMERS.BASE, token, {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(
  token: string,
  id: number,
  customer: UpdateCustomerData
): Promise<Customer> {
  return authenticatedApiRequest<Customer>(API_ENDPOINTS.CUSTOMERS.BY_ID(id), token, {
    method: "PUT",
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(token: string, id: number): Promise<void> {
  return authenticatedApiRequest<void>(API_ENDPOINTS.CUSTOMERS.BY_ID(id), token, {
    method: "DELETE",
  });
}

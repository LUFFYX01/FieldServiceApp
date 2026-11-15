import { API_ENDPOINTS, authenticatedApiRequest } from "../config/api";

export interface Site {
  id: number;
  siteName: string;
  address: string;
  contactPerson: string;
  phone: string;
  customerId: number;
  customerName?: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateSiteData {
  siteName: string;
  address: string;
  contactPerson: string;
  phone: string;
  customerId: number;
}

export interface UpdateSiteData {
  siteName: string;
  address: string;
  contactPerson: string;
  phone: string;
  active: boolean;
}

export async function getSites(token: string, customerId?: number): Promise<Site[]> {
  let url = API_ENDPOINTS.SITES.BASE;
  if (customerId) {
    url += `?customerId=${customerId}`;
  }
  return authenticatedApiRequest<Site[]>(url, token);
}

export async function getSiteById(token: string, id: number): Promise<Site> {
  return authenticatedApiRequest<Site>(API_ENDPOINTS.SITES.BY_ID(id), token);
}

export async function createSite(token: string, site: CreateSiteData): Promise<Site> {
  return authenticatedApiRequest<Site>(API_ENDPOINTS.SITES.BASE, token, {
    method: "POST",
    body: JSON.stringify(site),
  });
}

export async function updateSite(
  token: string,
  id: number,
  site: UpdateSiteData
): Promise<Site> {
  return authenticatedApiRequest<Site>(API_ENDPOINTS.SITES.BY_ID(id), token, {
    method: "PUT",
    body: JSON.stringify(site),
  });
}

export async function deleteSite(token: string, id: number): Promise<void> {
  return authenticatedApiRequest<void>(API_ENDPOINTS.SITES.BY_ID(id), token, {
    method: "DELETE",
  });
}

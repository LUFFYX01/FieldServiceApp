import { API_ENDPOINTS, authenticatedApiRequest } from "../config/api";

export interface Part {
  id: number;
  name: string;
  partNumber: string;
  description: string;
  quantity: number;
  price: number;
  active: boolean;
  lowStockThreshold: number;
  isLowStock: boolean;
  createdAt: string;
}

export interface CreatePartData {
  name: string;
  partNumber: string;
  description?: string;
  quantity: number;
  price: number;
  lowStockThreshold?: number;
}

export interface UpdatePartData {
  name: string;
  partNumber: string;
  description?: string;
  quantity: number;
  price: number;
  active: boolean;
  lowStockThreshold?: number;
}

export interface StockAdjustmentData {
  quantity: number;
  reason: string;
}

export interface InventoryTransaction {
  id: number;
  partId: number;
  partName: string;
  partNumber: string;
  transactionType: "USAGE" | "USAGE_RETURN" | "RESTOCK" | "ADJUSTMENT";
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  workOrderId: number | null;
  workOrderTitle: string | null;
  userId: number | null;
  userName: string | null;
  reason: string;
  createdAt: string;
}

export async function getParts(
  token: string,
  query?: string,
  activeOnly?: boolean
): Promise<Part[]> {
  let url = API_ENDPOINTS.PARTS.BASE;
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (activeOnly) params.append("activeOnly", "true");
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  return authenticatedApiRequest<Part[]>(url, token);
}

export async function getPartById(token: string, id: number): Promise<Part> {
  return authenticatedApiRequest<Part>(API_ENDPOINTS.PARTS.BY_ID(id), token);
}

export async function createPart(token: string, data: CreatePartData): Promise<Part> {
  return authenticatedApiRequest<Part>(API_ENDPOINTS.PARTS.BASE, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePart(token: string, id: number, data: UpdatePartData): Promise<Part> {
  return authenticatedApiRequest<Part>(API_ENDPOINTS.PARTS.BY_ID(id), token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adjustStock(
  token: string,
  id: number,
  data: StockAdjustmentData
): Promise<Part> {
  return authenticatedApiRequest<Part>(API_ENDPOINTS.PARTS.ADJUST_STOCK(id), token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPartTransactions(
  token: string,
  id: number
): Promise<InventoryTransaction[]> {
  return authenticatedApiRequest<InventoryTransaction[]>(
    API_ENDPOINTS.PARTS.TRANSACTIONS(id),
    token
  );
}

export async function deletePart(token: string, id: number): Promise<void> {
  return authenticatedApiRequest<void>(API_ENDPOINTS.PARTS.BY_ID(id), token, {
    method: "DELETE",
  });
}

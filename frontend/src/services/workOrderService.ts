import { API_ENDPOINTS, authenticatedApiRequest } from "../config/api";

export interface WorkOrder {
  id: number;
  title: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  siteAddress: string;
  technicianId: number | null;
  technicianName: string | null;
  createdAt: string;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
  isOverdue?: boolean;
}

export interface CreateWorkOrderData {
  title: string;
  description: string;
  priority: string;
  customerId: number;
  siteId: number;
}

export interface UpdateWorkOrderData {
  status?: string;
  priority?: string;
  scheduledDate?: string | null;
  completedDate?: string | null;
  notes?: string;
}

export interface TechnicianStatusData {
  status: "IN_PROGRESS" | "COMPLETED";
  notes?: string;
}

export async function getWorkOrders(token: string): Promise<WorkOrder[]> {
  return authenticatedApiRequest<WorkOrder[]>(API_ENDPOINTS.WORK_ORDERS.BASE, token);
}

export async function getWorkOrderById(token: string, id: number): Promise<WorkOrder> {
  return authenticatedApiRequest<WorkOrder>(API_ENDPOINTS.WORK_ORDERS.BY_ID(id), token);
}

export async function createWorkOrder(
  token: string,
  workOrder: CreateWorkOrderData
): Promise<WorkOrder> {
  return authenticatedApiRequest<WorkOrder>(API_ENDPOINTS.WORK_ORDERS.BASE, token, {
    method: "POST",
    body: JSON.stringify(workOrder),
  });
}

export async function updateWorkOrder(
  token: string,
  id: number,
  workOrder: UpdateWorkOrderData
): Promise<WorkOrder> {
  return authenticatedApiRequest<WorkOrder>(API_ENDPOINTS.WORK_ORDERS.BY_ID(id), token, {
    method: "PUT",
    body: JSON.stringify(workOrder),
  });
}

export async function updateTechnicianStatus(
  token: string,
  id: number,
  data: TechnicianStatusData
): Promise<WorkOrder> {
  return authenticatedApiRequest<WorkOrder>(
    API_ENDPOINTS.WORK_ORDERS.TECHNICIAN_STATUS(id),
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function assignTechnician(
  token: string,
  workOrderId: number,
  technicianIdOrPayload: number | { technicianId: number | null }
): Promise<WorkOrder> {
  const payload =
    typeof technicianIdOrPayload === "object"
      ? technicianIdOrPayload
      : { technicianId: technicianIdOrPayload };

  return authenticatedApiRequest<WorkOrder>(
    API_ENDPOINTS.WORK_ORDERS.ASSIGN(workOrderId),
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteWorkOrder(token: string, id: number): Promise<void> {
  return authenticatedApiRequest<void>(API_ENDPOINTS.WORK_ORDERS.BY_ID(id), token, {
    method: "DELETE",
  });
}

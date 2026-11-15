import { API_ENDPOINTS, authenticatedApiRequest } from "../config/api";

export interface WorkOrderPart {
  id: number;
  partId: number;
  partName: string;
  partNumber: string;
  requiredQuantity: number;
  usedQuantity: number;
  unitPrice: number;
  availableStock: number;
  lineTotal: number;
}

export interface AddWorkOrderPartData {
  partId: number;
  requiredQuantity: number;
}

export interface UpdateUsedQuantityData {
  usedQuantity: number;
}

export interface UpdateRequiredQuantityData {
  requiredQuantity: number;
}

export async function getWorkOrderParts(
  token: string,
  workOrderId: number
): Promise<WorkOrderPart[]> {
  return authenticatedApiRequest<WorkOrderPart[]>(
    API_ENDPOINTS.WORK_ORDER_PARTS.BASE(workOrderId),
    token
  );
}

export async function addPartToWorkOrder(
  token: string,
  workOrderId: number,
  data: AddWorkOrderPartData
): Promise<WorkOrderPart> {
  return authenticatedApiRequest<WorkOrderPart>(
    API_ENDPOINTS.WORK_ORDER_PARTS.BASE(workOrderId),
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateUsedQuantity(
  token: string,
  workOrderId: number,
  partId: number,
  data: UpdateUsedQuantityData
): Promise<WorkOrderPart> {
  return authenticatedApiRequest<WorkOrderPart>(
    API_ENDPOINTS.WORK_ORDER_PARTS.BY_ID(workOrderId, partId),
    token,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function updateRequiredQuantity(
  token: string,
  workOrderId: number,
  partId: number,
  data: UpdateRequiredQuantityData
): Promise<WorkOrderPart> {
  return authenticatedApiRequest<WorkOrderPart>(
    API_ENDPOINTS.WORK_ORDER_PARTS.REQUIRED_QUANTITY(workOrderId, partId),
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function removePartFromWorkOrder(
  token: string,
  workOrderId: number,
  partId: number
): Promise<void> {
  return authenticatedApiRequest<void>(
    API_ENDPOINTS.WORK_ORDER_PARTS.BY_ID(workOrderId, partId),
    token,
    {
      method: "DELETE",
    }
  );
}

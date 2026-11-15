import { API_ENDPOINTS, authenticatedApiRequest, ApiError } from '../config/api';

export interface WorkOrderHistory {
  id: number;
  workOrderId: number;
  status: string;
  description: string;
  createdAt: string;
}

export async function getWorkOrderHistory(token: string, workOrderId: number): Promise<WorkOrderHistory[]> {
  try {
    return await authenticatedApiRequest<WorkOrderHistory[]>(
      API_ENDPOINTS.WORK_ORDERS.HISTORY(workOrderId),
      token
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`Failed to fetch work order history: ${error.message}`);
    }
    throw new Error('Failed to fetch work order history');
  }
}

export async function getWorkOrders(token: string) {
    const response = await fetch(
        "http://localhost:8080/api/workorders",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch work orders");
    }

    return response.json();
}

export async function createWorkOrder(
    token: string,
    workOrder: {
        title: string;
        description: string;
        priority: string;
        customerId: number;
        siteId: number;
    }
) {
    const response = await fetch(
        "http://localhost:8080/api/workorders",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(workOrder),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to create work order");
    }

    return response.json();
}

export async function updateWorkOrder(
    token: string,
    id: number,
    workOrder: {
        status: string;
        priority: string;
        scheduledDate: string | null;
        completedDate: string | null;
        notes: string;
    }
) {
    const response = await fetch(
        `http://localhost:8080/api/workorders/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(workOrder),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update work order");
    }

    return response.json();
}

export async function deleteWorkOrder(
    token: string,
    id: number
) {
    const response = await fetch(
        `http://localhost:8080/api/workorders/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to delete work order");
    }
}

export async function assignTechnician(
    token: string,
    workOrderId: number,
    technicianId: number
) {
    const response = await fetch(
        `http://localhost:8080/api/workorders/${workOrderId}/assign`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                technicianId,
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error(
            "Assign technician failed:",
            response.status,
            errorText
        );

        throw new Error(
            `Failed to assign technician: ${response.status}`
        );
    }

    return response.json();
}
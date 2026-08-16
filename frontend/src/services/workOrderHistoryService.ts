export async function getWorkOrderHistory(
    token: string,
    workOrderId: number
) {
    const response = await fetch(
        `http://localhost:8080/api/workorders/${workOrderId}/history`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error(
            "Get work order history failed:",
            response.status,
            errorText
        );

        throw new Error(
            "Failed to fetch work order history"
        );
    }

    return response.json();
}
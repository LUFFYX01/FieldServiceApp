export async function getCustomers(token: string) {
    const response = await fetch("http://localhost:8080/api/customers", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch customers");
    }

    return response.json();
}
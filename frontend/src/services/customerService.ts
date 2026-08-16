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
export async function createCustomer(
    token: string,
    customer: {
        companyName: string;
        contactPerson: string;
        email: string;
        phone: string;
        address: string;
        active: boolean;
    }
) {
    const response = await fetch("http://localhost:8080/api/customers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(customer),
    });

    if (!response.ok) {
        throw new Error("Failed to create customer");
    }

    return response.json();
}
export async function updateCustomer(
    token: string,
    id: number,
    customer: {
        companyName: string;
        contactPerson: string;
        email: string;
        phone: string;
        address: string;
        active: boolean;
    }
) {
    const response = await fetch(
        `http://localhost:8080/api/customers/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(customer),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update customer");
    }

    return response.json();
}

export async function deleteCustomer(
    token: string,
    id: number
) {
    const response = await fetch(
        `http://localhost:8080/api/customers/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to delete customer");
    }
}
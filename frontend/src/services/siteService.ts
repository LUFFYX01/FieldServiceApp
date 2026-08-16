export async function getSites(token: string) {
    const response = await fetch(
        "http://localhost:8080/api/sites",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch sites");
    }

    return response.json();
}

export async function createSite(
    token: string,
    site: {
        siteName: string;
        address: string;
        contactPerson: string;
        phone: string;
        customerId: number;
    }
) {
    const response = await fetch(
        "http://localhost:8080/api/sites",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(site),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to create site");
    }

    return response.json();
}

export async function updateSite(
    token: string,
    id: number,
    site: {
        siteName: string;
        address: string;
        contactPerson: string;
        phone: string;
        active: boolean;
    }
) {
    const response = await fetch(
        `http://localhost:8080/api/sites/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(site),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update site");
    }

    return response.json();
}

export async function deleteSite(
    token: string,
    id: number
) {
    const response = await fetch(
        `http://localhost:8080/api/sites/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to delete site");
    }
}
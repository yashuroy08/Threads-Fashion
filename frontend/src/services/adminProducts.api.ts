const BASE_URL = '/api/v1/products/admin';

function authHeader() {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export async function fetchAdminProducts() {
    const res = await fetch(`${BASE_URL}/products`, {
        headers: authHeader(),
    });
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
}

export async function createProduct(payload: any) {
    const res = await fetch(`${BASE_URL}/create`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Create failed');
    return res.json();
}

export async function updateProduct(id: string, payload: any) {
    const res = await fetch(`${BASE_URL}/update/${id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
}

export async function toggleProduct(id: string, active: boolean) {
    const endpoint = active ? `deactivate/${id}` : `reactivate/${id}`;
    const method = active ? 'DELETE' : 'PATCH';

    const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method,
        headers: authHeader(),
    });

    if (!res.ok) throw new Error('Toggle failed');
}

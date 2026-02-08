import { API_BASE } from '../config/api.config';
const BASE_URL = `${API_BASE}/wishlist`;

function authHeader() {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export async function fetchWishlist() {
    const res = await fetch(`${BASE_URL}`, {
        headers: authHeader(),
    });
    if (!res.ok) throw new Error('Failed to load wishlist');
    return res.json();
}

export async function addToWishlistApi(productId: string) {
    const res = await fetch(`${BASE_URL}/add`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ productId }),
    });
    if (!res.ok) throw new Error('Failed to add to wishlist');
    return res.json();
}

export async function removeFromWishlistApi(productId: string) {
    const res = await fetch(`${BASE_URL}/${productId}`, {
        method: 'DELETE',
        headers: authHeader(),
    });
    if (!res.ok) throw new Error('Failed to remove from wishlist');
    return res.json();
}

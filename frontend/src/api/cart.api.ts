const BASE_URL = '/api/v1';

export type CartItem = {
    productId: string | { _id: string; title: string; price: { amount: number }; images: { url: string }[] };
    quantity: number;
    price: number;
    size?: string;  // Variant: selected size
    color?: string; // Variant: selected color
    title?: string;
    image?: string;
};

export type Cart = {
    items: CartItem[];
    total: number;
};

export const CartApi = {
    getCart: async (token: string): Promise<Cart | null> => {
        const res = await fetch(`${BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch cart');
        return res.json();
    },

    addToCart: async (token: string, productId: string, quantity: number = 1, size?: string, color?: string): Promise<Cart> => {
        const res = await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity, size, color })
        });
        if (!res.ok) {
            let errorMessage = 'Failed to add to cart';
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Ignore parsing error
            }
            throw new Error(errorMessage);
        }
        return res.json();
    },

    updateQuantity: async (token: string, productId: string, quantity: number, size?: string, color?: string): Promise<Cart> => {
        const res = await fetch(`${BASE_URL}/cart/items/${productId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity, size, color })
        });
        if (!res.ok) throw new Error('Failed to update cart');
        return res.json();
    },

    removeItem: async (token: string, productId: string, size?: string, color?: string): Promise<Cart> => {
        const queryParams = new URLSearchParams();
        if (size) queryParams.append('size', size);
        if (color) queryParams.append('color', color);
        const queryString = queryParams.toString();

        const res = await fetch(`${BASE_URL}/cart/items/${productId}${queryString ? `?${queryString}` : ''}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to remove item');
        return res.json();
    },

    clearCart: async (token: string): Promise<void> => {
        const res = await fetch(`${BASE_URL}/cart`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to clear cart');
    }
};

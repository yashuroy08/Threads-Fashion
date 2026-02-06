const BASE_URL = '/api/v1';

export interface Order {
    orderId: string;
    items: any[];
    total: number;
    status: string;
    createdAt: string;
    shippingAddress: any;
    cancellationReason?: string;
    returnReason?: string;
    exchangeReason?: string;
}

export const OrderApi = {
    getMyOrders: async (token: string): Promise<Order[]> => {
        const res = await fetch(`${BASE_URL}/orders/my-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    },

    getOrderDetails: async (orderId: string, token: string): Promise<Order> => {
        const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Order not found');
        return res.json();
    },

    cancelOrder: async (orderId: string, reason: string, token: string): Promise<Order> => {
        const res = await fetch(`${BASE_URL}/orders/cancel/${orderId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Failed to cancel order');
        }
        return data.order;
    },

    requestReturn: async (orderId: string, reason: string, token: string): Promise<Order> => {
        const res = await fetch(`${BASE_URL}/orders/return/${orderId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Failed to submit return request');
        }
        return data.order;
    },

    requestExchange: async (orderId: string, reason: string, token: string): Promise<Order> => {
        const res = await fetch(`${BASE_URL}/orders/exchange/${orderId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Failed to submit exchange request');
        }
        return data.order;
    },

    createOrder: async (orderData: any, token: string) => {
        // Extract only needed fields if passing items directly
        const payload = {
            ...orderData,
            items: orderData.items?.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,      // 🔥 CRITICAL: Include variant info
                color: item.color,    // 🔥 CRITICAL: Include variant info
            }))
        };

        const res = await fetch(`${BASE_URL}/orders/checkout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Checkout failed');
        }
        return res.json();
    }
};

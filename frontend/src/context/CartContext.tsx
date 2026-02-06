import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './AuthContext';
import { CartApi, type Cart } from '../api/cart.api';
import { useNotification } from './NotificationContext';

type CartContextType = {
    cart: Cart | null;
    loading: boolean;
    addToCart: (productId: string, quantity?: number, size?: string, color?: string, showNotification?: boolean) => Promise<boolean>;
    updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
    removeItem: (productId: string, size?: string, color?: string) => Promise<void>;
    refreshCart: () => Promise<void>;
    clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuthContext();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(false);
    const { notify } = useNotification();

    useEffect(() => {
        if (user) {
            refreshCart();
        } else {
            setCart(null);
        }
    }, [user]);

    async function refreshCart() {
        if (!user) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const data = await CartApi.getCart(token);
                setCart(data);
            }
        } catch (error) {
            console.error('Failed to load cart', error);
        } finally {
            setLoading(false);
        }
    }

    async function addToCart(productId: string, quantity: number = 1, size?: string, color?: string, showNotification: boolean = true): Promise<boolean> {
        if (!user) {
            notify('Please login to add items to cart', 'error');
            return false;
        }
        try {
            const token = localStorage.getItem('token')!;
            const newCart = await CartApi.addToCart(token, productId, quantity, size, color);
            setCart(newCart);
            if (showNotification) {
                notify('Added to cart!', 'success');
            }
            return true;
        } catch (error: any) {
            console.error(error);
            // Extract error message if available
            const message = error.message || error.error || 'Failed to add to cart';
            notify(message, 'error');
            return false;
        }
    }

    async function updateQuantity(productId: string, quantity: number, size?: string, color?: string) {
        try {
            const token = localStorage.getItem('token')!;
            const newCart = await CartApi.updateQuantity(token, productId, quantity, size, color);
            setCart(newCart);
        } catch (error) {
            console.error(error);
        }
    }

    async function removeItem(productId: string, size?: string, color?: string) {
        try {
            const token = localStorage.getItem('token')!;
            const newCart = await CartApi.removeItem(token, productId, size, color);
            setCart(newCart);
        } catch (error) {
            console.error(error);
        }
    }

    async function clearCart() {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await CartApi.clearCart(token);
                setCart({ items: [], total: 0 });
            }
        } catch (error) {
            console.error('Failed to clear cart', error);
        }
    }

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeItem, refreshCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCartContext must be used within CartProvider');
    return context;
};

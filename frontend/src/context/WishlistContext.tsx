import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchWishlist, addToWishlistApi, removeFromWishlistApi } from '../api/wishlist.api';
import { useAuthContext } from './AuthContext';
import { useNotification } from './NotificationContext';

interface WishlistItem {
    product: {
        sizes: boolean;
        colors: boolean;
        _id: string;
        title: string;
        price: { amount: number; currency: string };
        images: { url: string; altText: string }[];
        slug: string;
    };
    addedAt: string;
}

interface WishlistContextType {
    wishlist: WishlistItem[];
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthContext();
    const isAuthenticated = !!user;
    const { notify } = useNotification();

    const loadWishlist = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            setWishlist([]);
            return;
        }
        setLoading(true);
        try {
            const data = await fetchWishlist();
            setWishlist(data);
        } catch (error) {
            console.error('Failed to load wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWishlist();
    }, [isAuthenticated]);

    const addToWishlist = async (productId: string) => {
        if (!isAuthenticated) {
            notify('Please login to use wishlist', 'error');
            return;
        }

        if (isInWishlist(productId)) {
            notify('Product already in wishlist', 'info');
            return;
        }

        try {
            await addToWishlistApi(productId);
            await loadWishlist();
            notify('Added to wishlist', 'success');
        } catch (error) {
            notify('Failed to add to wishlist', 'error');
        }
    };

    const removeFromWishlist = async (productId: string) => {
        try {
            await removeFromWishlistApi(productId);
            setWishlist(prev => prev.filter(item => item.product._id !== productId));
            notify('Removed from wishlist', 'success');
        } catch (error) {
            notify('Failed to remove from wishlist', 'error');
        }
    };

    const isInWishlist = (productId: string) => {
        return wishlist.some(item => item.product._id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, loading }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}

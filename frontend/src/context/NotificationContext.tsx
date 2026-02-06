import { createContext, useContext, useState, type ReactNode, useCallback, useEffect } from 'react';

type NotificationType = 'success' | 'error' | 'info';

type Notification = {
    id: number;
    message: string;
    type: NotificationType;
};

type NotificationContextType = {
    notify: (message: string, type?: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = useCallback((message: string, type: NotificationType = 'info') => {
        setNotifications((prev) => [...prev, { id: Date.now(), message, type }]);
    }, []);

    useEffect(() => {
        if (!notifications.length) return;

        const timers = notifications.map((n) =>
            setTimeout(
                () =>
                    setNotifications((current) =>
                        current.filter((item) => item.id !== n.id)
                    ),
                4000
            )
        );

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [notifications]);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            {/* Simple toast stack */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 3000,
                    display: 'flex',
                    flexDirection: 'column-reverse', // Newest at bottom
                    gap: '0.5rem',
                    alignItems: 'center',
                }}
            >
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        style={{
                            minWidth: '240px',
                            maxWidth: '320px',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                            color: n.type === 'error' ? '#991b1b' : n.type === 'success' ? '#166534' : '#0f172a',
                            background:
                                n.type === 'error'
                                    ? '#fef2f2'
                                    : n.type === 'success'
                                        ? '#f0fdf4'
                                        : '#eff6ff',
                            border:
                                n.type === 'error'
                                    ? '1px solid #fecaca'
                                    : n.type === 'success'
                                        ? '1px solid #bbf7d0'
                                        : '1px solid #bfdbfe',
                        }}
                    >
                        {n.message}
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return ctx;
}



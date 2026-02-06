import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import React from 'react';
export function ProtectedRoute({
    children,
    role,
}: {
    children: React.ReactNode;
    role?: 'admin';
}) {
    const { user, loading } = useAuthContext();

    if (loading) return <div>Loading...</div>;

    if (!user) return <Navigate to="/login" />;

    if (role && user.role !== role) return <Navigate to="/" />;

    return children;
}

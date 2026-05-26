import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-50"><p className="text-gray-500 font-medium">Verifying access...</p></div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles.includes(role)) {
        return children;
    }

    // User is logged in but trying to access a different portal
    if (role === 'admin') {
        return <Navigate to="/dashboard" replace />;
    } else if (role === 'staff') {
        return <Navigate to="/staff-dashboard" replace />;
    } else if (role === 'sysadmin') {
        return <Navigate to="/sysadmin-dashboard" replace />;
    }

    return <Navigate to="/" replace />;
}
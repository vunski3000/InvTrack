import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles, redirectTo = '/' }) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="ml-3 text-gray-500 font-medium">Verifying access...</span>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // User is logged in but doesn't have the right role, send them to their specific dashboard
        if (role === 'admin') return <Navigate to="/dashboard" replace />;
        if (role === 'staff') return <Navigate to="/staff-dashboard" replace />;
        if (role === 'sysadmin') return <Navigate to="/sysadmin-dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
}
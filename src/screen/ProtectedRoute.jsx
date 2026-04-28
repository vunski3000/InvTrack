import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute({ children, allowedRoles, redirectTo = '/' }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error || !session) {
                    setIsAuthorized(false);
                    return;
                }

                const userRole = session.user?.user_metadata?.role;

                // Check if the user's role matches the allowed roles for this route
                if (allowedRoles && allowedRoles.length > 0) {
                    setIsAuthorized(allowedRoles.includes(userRole));
                } else {
                    // If no specific roles are required, just being authenticated is enough
                    setIsAuthorized(true);
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                setIsAuthorized(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [allowedRoles]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-indigo-600 font-medium">Verifying access...</div></div>;

    // If not authorized, kick them back to the specific login page
    return isAuthorized ? children : <Navigate to={redirectTo} replace />;
}
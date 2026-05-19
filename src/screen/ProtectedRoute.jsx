import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute({ children, allowedRoles, redirectTo = '/' }) {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // 1. Get the current active session from Supabase
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error || !session) {
                setIsAuthorized(false);
                return;
            }

            // 2. Extract the role we saved in the user's metadata
            const userRole = session.user?.user_metadata?.role;
            
            // 3. Verify if the user has one of the allowed roles for this route
            if (allowedRoles && allowedRoles.length > 0) {
                setIsAuthorized(allowedRoles.includes(userRole));
            } else {
                // If no specific roles were requested, just being logged in is enough
                setIsAuthorized(true);
            }
        } catch (err) {
            console.error("Auth check error:", err);
            setIsAuthorized(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="ml-3 text-gray-500 font-medium">Verifying access...</span>
            </div>
        );
    }

    // 4. Render the component if authorized, otherwise navigate back to the fallback route
    return isAuthorized ? children : <Navigate to={redirectTo} replace />;
}
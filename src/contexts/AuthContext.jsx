import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Fetch the initial session on load
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            setRole(currentUser?.user_metadata?.role || null);
            setLoading(false);
        });

        // 2. Listen to ongoing auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const currentUser = session?.user || null;
                setUser(currentUser);
                setRole(currentUser?.user_metadata?.role || null);
                setLoading(false);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
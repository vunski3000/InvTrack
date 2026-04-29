import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function AdminLoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (!username || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: `${username.toLowerCase()}@invtrack.local`,
                password,
            });

            if (signInError) throw signInError;

            const userRole = data.user?.user_metadata?.role;

            if (userRole !== 'admin') {
                await supabase.auth.signOut(); // Immediately sign them out
                throw new Error('Access denied. Admin privileges required.');
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
            
            {/* Back Button */}
            <button 
                onClick={() => navigate('/')} 
                className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-indigo-600 transition-colors font-medium"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Home
            </button>

            <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white shadow-xl rounded-2xl overflow-hidden">
                
                {/* Branding Section */}
                <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-center items-center text-center">
                    <h1 className="text-white text-4xl font-bold tracking-tight">InvTrack</h1>
                    <p className="text-indigo-100 mt-3">Your Inventory, Simplified.</p>
                </div>

                {/* Form Section */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
                    <div className="mb-8 text-center md:hidden">
                        <h1 className="text-blue-600 text-3xl font-bold tracking-tight">InvTrack</h1>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h2>
                    <p className="text-gray-500 mb-6">Please enter your details to sign in.</p>
                    
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username / Staff Number</label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    placeholder="e.g. admin123"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-center font-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-8">
                        Don't have an account?{' '}
                        <span onClick={() => navigate('/signup')} className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer hover:underline">
                            Sign up now
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
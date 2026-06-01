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

            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-indigo-50/30 to-purple-50/40 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
            {/* Animated Pastel Glowing Orbs in the background */}
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-200/40 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-200/30 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: '12s' }}></div>

            {/* Subtle Tech Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f105_1px,transparent_1px),linear-gradient(to_bottom,#6366f105_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Back Button */}
            <button 
                onClick={() => navigate('/')} 
                className="absolute top-6 left-6 flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-semibold text-sm z-20 group"
            >
                <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
            </button>

            {/* Login Card */}
            <div className="w-full max-w-md bg-white/75 border border-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_-15px_rgba(99,102,241,0.12)] relative z-10 transition-all duration-300 hover:shadow-[0_25px_60px_-12px_rgba(168,85,247,0.18)]">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold tracking-wider uppercase text-indigo-600 mb-4 shadow-sm">
                        Supply Management Portal
                    </div>
                    <h1 className="text-3xl font-black tracking-tight select-none">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900">
                            Admin Login
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-2">Please enter your credentials to authenticate.</p>
                </div>
                
                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="username" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Username</label>
                        <div className="mt-1.5">
                            <input
                                id="username"
                                type="text"
                                required
                                className="block w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition duration-150 ease-in-out text-slate-800"
                                placeholder="e.g. admin123"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                        <div className="mt-1.5">
                            <input
                                id="password"
                                type="password"
                                required
                                className="block w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition duration-150 ease-in-out text-slate-800"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-xs text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100 text-center font-semibold">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 shadow-indigo-600/10"
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-500 mt-8 select-none border-t border-slate-100/80 pt-6">
                    Don't have an account?{' '}
                    <span onClick={() => navigate('/signup')} className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline">
                        Sign up now
                    </span>
                </p>
            </div>
        </div>
    );
}
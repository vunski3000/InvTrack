import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email');
            return;
        }

        setError('');
        // TODO: Add authentication logic here
        console.log('Login attempt:', { email, password });
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                    <p className="text-gray-500 mb-6">Please enter your details to sign in.</p>
                    
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                            <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                                Sign In
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-8">
                        Don't have an account?{' '}
                        <span onClick={() => navigate('/register')} className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer hover:underline">
                            Sign up now
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
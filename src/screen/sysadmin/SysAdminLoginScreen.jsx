import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SysadminLoginScreen() {
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
            
            // Assuming sysadmins also log in with @invtrack.local or their direct email
            const emailToUse = username.includes('@') ? username : `${username.toLowerCase()}@invtrack.local`;
            
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password,
            });

            if (signInError) throw signInError;

            const userRole = data.user?.user_metadata?.role;

            // Smart routing: Send user to their appropriate dashboard regardless of which login screen they used
            switch (userRole) {
                case 'sysadmin':
                    navigate('/sysadmin-dashboard', { replace: true });
                    break;
                case 'admin':
                    navigate('/dashboard', { replace: true });
                    break;
                case 'staff':
                    navigate('/staff-dashboard', { replace: true });
                    break;
                default:
                    await supabase.auth.signOut();
                    throw new Error('Access denied. Unknown role.');
            }
        } catch (err) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative">
            
            {/* Back Button */}
            <button 
                onClick={() => navigate('/')} 
                className="absolute top-6 left-6 flex items-center text-gray-400 hover:text-white transition-colors font-medium"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Home
            </button>

            <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden p-8 sm:p-12">
                <div className="mb-8 text-center">
                    <h1 className="text-gray-900 text-3xl font-bold tracking-tight">InvTrack SysAdmin</h1>
                    <p className="text-gray-500 mt-2">Authorized Personnel Only</p>
                </div>
                
                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">SysAdmin ID / Email</label>
                        <input
                            id="username"
                            type="text"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-800 focus:border-gray-800 sm:text-sm"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-800 focus:border-gray-800 sm:text-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-center font-medium">{error}</div>}

                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50">
                        {isLoading ? 'Authenticating...' : 'Secure Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
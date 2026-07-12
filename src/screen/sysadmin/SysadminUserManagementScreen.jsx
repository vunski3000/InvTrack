import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';

export default function SysadminUserManagementScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for resetting passwords
    const [selectedUserForReset, setSelectedUserForReset] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch users via local proxy server to avoid browser CORS and library safeguards
            const response = await fetch(`${PROXY_URL}/api/users`);

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch users");
            }

            const data = await response.json();
            const mappedUsers = data?.users.map(u => ({
                id: u.id,
                email: u.email,
                role: u.user_metadata?.role || 'staff',
                created_at: u.created_at
            })) || [];
            
            // Filter out system administrator accounts to prevent exposure, breach, or accidental tampering
            const filteredUsers = mappedUsers.filter(u => u.role !== 'sysadmin');
            setUsers(filteredUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            window.showAlert("Failed to fetch registered users: " + error.message, "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        window.showConfirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`, 'Change Role', async () => {
            // Optimistic UI Update
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

            try {
                const response = await fetch(`${PROXY_URL}/api/users/update-role`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId, newRole })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to update role");
                }
                
                console.log(`Role for user ${userId} updated to ${newRole}`);
            } catch (error) {
                console.error("Error updating role:", error);
                window.showAlert("Failed to update role: " + error.message, "Error");
                fetchUsers(); // Revert changes on failure
            }
        });
    };

    const handleResetPasswordSubmit = async (e) => {
        if (e) e.preventDefault();
        setResetError('');
        setResetSuccess('');

        if (newPassword.length < 6) {
            setResetError("Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setResetError("Passwords do not match.");
            return;
        }

        setResetLoading(true);
        try {
            const response = await fetch(`${PROXY_URL}/api/users/update-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: selectedUserForReset.id,
                    newPassword
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to reset password");
            }
            
            setResetSuccess(`Password for ${selectedUserForReset.email} updated successfully!`);
            setTimeout(() => {
                setSelectedUserForReset(null);
            }, 1500);
        } catch (error) {
            console.error("Error resetting password:", error);
            setResetError("Failed to reset password: " + error.message);
        } finally {
            setResetLoading(false);
        }
    };

    const handleDeleteUser = async (user) => {
        window.showConfirm(`Are you sure you want to permanently delete user ${user.email}?`, 'Delete User', async () => {
            try {
                const response = await fetch(`${PROXY_URL}/api/users/delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: user.id
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to delete user");
                }
                
                setUsers(users.filter(u => u.id !== user.id));
                window.showAlert(`User ${user.email} deleted successfully.`, "Success");
            } catch (error) {
                console.error("Error deleting user:", error);
                window.showAlert("Failed to delete user: " + error.message, "Error");
            }
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Helper to dynamically highlight top-level tabs based on current route
    const isActiveTab = (paths) => paths.includes(location.pathname)
        ? "px-4 py-2 rounded-xl text-sm font-bold bg-pink-50 border border-pink-100/80 text-pink-600 shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5"
        : "px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer flex items-center gap-1.5";

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-pink-200/40 via-rose-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/30 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Simple Top Navigation for Sysadmin */}
            <nav className="bg-white/80 border-b border-slate-200/80 backdrop-blur-xl shadow-sm z-20 relative shrink-0">
                <div className="flex items-center justify-between px-6 lg:px-8 h-16">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-black tracking-tight mr-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-700 via-rose-700 to-indigo-800 select-none">
                            InvTrack
                        </h1>
                        <div className="hidden md:block">
                            <div className="flex items-center space-x-1">
                                <span onClick={() => navigate('/sysadmin-dashboard')} className={isActiveTab(['/sysadmin-dashboard'])}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
                                    Dashboard
                                </span>
                                <span onClick={() => navigate('/sysadmin-user-management')} className={isActiveTab(['/sysadmin-user-management'])}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    Users
                                </span>
                                <span onClick={() => navigate('/sysadmin-config')} className={isActiveTab(['/sysadmin-config'])}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Configurations
                                </span>
                                <span onClick={() => navigate('/sysadmin-backups')} className={isActiveTab(['/sysadmin-backups'])}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                    Backups
                                </span>
                                <span onClick={() => navigate('/sysadmin-audit-logs')} className={isActiveTab(['/sysadmin-audit-logs'])}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Audit Logs
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-pink-700 bg-pink-50 border border-pink-100/80 px-4 py-2 rounded-xl shadow-sm tracking-wide">
                            Super User
                        </span>
                        <button onClick={handleLogout} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Log out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 z-10">
                <header className="mb-8">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-pink-500 to-rose-600"></span>
                        User Management Directory
                    </h2>
                    <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider">Control and view all system personnel accounts</p>
                </header>

                <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden w-full max-w-6xl mx-auto">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User ID / Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date Joined</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">System Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white/40">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm font-semibold text-slate-500">Retrieving system users directory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                                            No registered users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-800">{user.email}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 select-all">{user.id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                                                {new Date(user.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={user.role || 'staff'}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className={`text-xs rounded-xl border border-slate-200/60 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200/50 p-2 font-bold cursor-pointer transition-all duration-200 ${
                                                        user.role === 'sysadmin'
                                                            ? 'bg-pink-50 text-pink-700 border-pink-200'
                                                            : user.role === 'admin'
                                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                                : 'bg-slate-50 text-slate-700 border-slate-200/80'
                                                    }`}
                                                >
                                                    <option value="staff">Staff</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="sysadmin">System Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUserForReset(user);
                                                            setNewPassword('');
                                                            setConfirmPassword('');
                                                            setResetError('');
                                                            setResetSuccess('');
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100/70 border border-pink-200 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                        </svg>
                                                        Reset Password
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Reset Password Modal Overlay */}
            {selectedUserForReset && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/95 border border-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_-15px_rgba(219,39,119,0.15)] max-w-md w-full relative z-10 transition-all duration-300 transform scale-100 animate-in fade-in zoom-in-95">
                        {/* Close button */}
                        <button 
                            type="button" 
                            onClick={() => setSelectedUserForReset(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 border border-pink-100 rounded-full text-[10px] font-bold tracking-wider uppercase text-pink-600 mb-3 shadow-sm">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                Password Override Console
                            </div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Reset User Password</h3>
                            <p className="text-slate-400 text-xs font-semibold mt-1">
                                Updating credentials for <span className="text-pink-600 font-bold select-all">{selectedUserForReset.email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                            {resetError && (
                                <div className="text-xs text-red-700 bg-red-50/80 p-3 rounded-xl border border-red-100 text-center font-bold animate-pulse">
                                    {resetError}
                                </div>
                            )}

                            {resetSuccess && (
                                <div className="text-xs text-emerald-700 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 text-center font-bold">
                                    {resetSuccess}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="block w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm font-semibold text-slate-800"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={resetLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="block w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm font-semibold text-slate-800"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={resetLoading}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100/80 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setSelectedUserForReset(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/80 transition-all duration-200 cursor-pointer"
                                    disabled={resetLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-md shadow-pink-600/10 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Confirm Reset
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
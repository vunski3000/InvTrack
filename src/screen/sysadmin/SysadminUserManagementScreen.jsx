import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SysadminUserManagementScreen() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // NOTE: Normal frontend clients cannot list all users from auth.users.
            // You must use a Supabase Edge Function to fetch this securely using the SERVICE_ROLE key.
            // Example:
            // const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'list' } });
            // if (error) throw error;
            // setUsers(data.users);

            // --- Mock Data for UI Demonstration ---
            setTimeout(() => {
                setUsers([
                    { id: '1', email: 'tesdatalisay@invtrack.local', role: 'sysadmin', created_at: new Date().toISOString() },
                    { id: '2', email: 'admin1@invtrack.local', role: 'admin', created_at: new Date(Date.now() - 86400000).toISOString() },
                    { id: '3', email: '2026-0501@invtrack.local', role: 'staff', created_at: new Date(Date.now() - 172800000).toISOString() },
                ]);
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error("Error fetching users:", error);
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
        
        // Optimistic UI Update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

        try {
            // NOTE: Updating another user's metadata requires an Edge Function.
            // Example:
            // const { error } = await supabase.functions.invoke('manage-users', {
            //     body: { action: 'update_role', userId, newRole }
            // });
            // if (error) throw error;
            
            console.log(`Role for user ${userId} updated to ${newRole}`);
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role. See console for details.");
            fetchUsers(); // Revert changes on failure
        }
    };

    const handleResetPassword = async (user) => {
        const newPassword = window.prompt(`Enter new password for ${user.email}:`);
        if (!newPassword) return;
        
        try {
            const { error } = await supabase.functions.invoke('manage-users', {
                body: { action: 'update_password', userId: user.id, newPassword }
            });
            if (error) throw error;
            
            alert(`Password for ${user.email} updated successfully.`);
        } catch (error) {
            console.error("Error resetting password:", error);
            alert("Failed to reset password. See console for details.");
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to permanently delete user ${user.email}?`)) return;
        
        try {
            const { error } = await supabase.functions.invoke('manage-users', {
                body: { action: 'delete_user', userId: user.id }
            });
            if (error) throw error;
            
            setUsers(users.filter(u => u.id !== user.id));
            alert(`User ${user.email} deleted successfully.`);
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user. See console for details.");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Top Navigation */}
            <header className="h-16 bg-white shadow-sm flex items-center px-6 lg:px-8 shrink-0 relative">
                <button onClick={() => navigate('/sysadmin-dashboard')} className="text-gray-500 hover:text-gray-900 transition-colors mr-4 flex items-center text-sm font-medium">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
                <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden w-full max-w-6xl mx-auto">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID / Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Loading system users...</td></tr>
                                ) : users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{user.id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={user.role || 'staff'}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className={`text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1.5 font-medium ${user.role === 'sysadmin' ? 'bg-purple-50 text-purple-700' : user.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}
                                            >
                                                <option value="staff">Staff</option>
                                                <option value="admin">Admin</option>
                                                <option value="sysadmin">System Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => handleResetPassword(user)} className="text-indigo-600 hover:text-indigo-900 mr-4">Reset Password</button>
                                            <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
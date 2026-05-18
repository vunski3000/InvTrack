import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SysadminDashboardScreen() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            {/* Simple Top Navigation for Sysadmin */}
            <nav className="bg-gray-900 text-white shadow-md z-20 relative shrink-0">
                <div className="flex items-center justify-between px-6 lg:px-8 h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold tracking-tight">InvTrack | System Admin</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-300">Super User</span>
                        <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer">
                            Log out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">System Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800">User Management</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">Manage staff and admin accounts, reset passwords, and assign roles.</p>
                        <button
                            onClick={() => navigate('/sysadmin-user-management')}
                            className="w-full py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 font-medium text-sm transition"
                        >
                            Manage Users
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800">System Backups</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">Export full database records, tables, and system configurations.</p>
                        <button
                            onClick={() => navigate('/sysadmin-backups')}
                            className="w-full py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 font-medium text-sm transition"
                        >
                            Export Data
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800">Audit & Logs</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">View global system activities, security events, and error logs.</p>
                        <button
                            onClick={() => navigate('/sysadmin-audit-logs')}
                            className="w-full py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 font-medium text-sm transition"
                        >
                            View Logs
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
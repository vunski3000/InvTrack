import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SysadminDashboardScreen() {
    const navigate = useNavigate();
    const location = useLocation();

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
                        System Overview Dashboard
                    </h2>
                    <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider">InvTrack Core Configurations</p>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* User Management */}
                    <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-pink-300/40 transition-all duration-300 flex flex-col justify-between group">
                        <div>
                            <div className="p-3 w-fit rounded-xl bg-pink-50 border border-pink-100 text-pink-600 mb-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">User Management</h3>
                            <p className="text-sm font-semibold text-slate-400 mt-2 mb-6 leading-relaxed">Manage personnel directories, edit roles, disable accounts, and perform system password resets securely.</p>
                        </div>
                        <button
                            onClick={() => navigate('/sysadmin-user-management')}
                            className="w-full py-2.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl hover:bg-pink-100/70 font-bold text-xs shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            Manage Users
                        </button>
                    </div>

                    {/* System Configurations */}
                    <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-pink-300/40 transition-all duration-300 flex flex-col justify-between group">
                        <div>
                            <div className="p-3 w-fit rounded-xl bg-pink-50 border border-pink-100 text-pink-600 mb-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">System Configurations</h3>
                            <p className="text-sm font-semibold text-slate-400 mt-2 mb-6 leading-relaxed">Tweak global settings, security policies, Low Stock warning limits, double-approval thresholds, and Maintenance Mode.</p>
                        </div>
                        <button
                            onClick={() => navigate('/sysadmin-config')}
                            className="w-full py-2.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl hover:bg-pink-100/70 font-bold text-xs shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            Configure Settings
                        </button>
                    </div>

                    {/* System Backups */}
                    <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-pink-300/40 transition-all duration-300 flex flex-col justify-between group">
                        <div>
                            <div className="p-3 w-fit rounded-xl bg-pink-50 border border-pink-100 text-pink-600 mb-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">System Backups</h3>
                            <p className="text-sm font-semibold text-slate-400 mt-2 mb-6 leading-relaxed">Generate complete database tables snapshot export, keep critical logs, and retrieve system data backup securely.</p>
                        </div>
                        <button
                            onClick={() => navigate('/sysadmin-backups')}
                            className="w-full py-2.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl hover:bg-pink-100/70 font-bold text-xs shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            Export Data
                        </button>
                    </div>

                    {/* Audit Logs */}
                    <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-pink-300/40 transition-all duration-300 flex flex-col justify-between group">
                        <div>
                            <div className="p-3 w-fit rounded-xl bg-pink-50 border border-pink-100 text-pink-600 mb-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Audit & Logs</h3>
                            <p className="text-sm font-semibold text-slate-400 mt-2 mb-6 leading-relaxed">View all global operations, security changes, updates done by admins, and audit files inside this interface.</p>
                        </div>
                        <button
                            onClick={() => navigate('/sysadmin-audit-logs')}
                            className="w-full py-2.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl hover:bg-pink-100/70 font-bold text-xs shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            View Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
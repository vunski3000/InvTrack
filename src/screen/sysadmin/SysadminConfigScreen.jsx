import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';

export default function SysadminConfigScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [config, setConfig] = useState({
        lowStockThreshold: 15,
        doubleApprovalThreshold: 5000,
        maintenanceMode: false,
        sessionTimeoutMinutes: 30,
        allowSignup: true
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${PROXY_URL}/api/config`);
            if (!response.ok) throw new Error("Failed to retrieve system configurations");
            const data = await response.json();
            setConfig(data);
        } catch (error) {
            console.error("Error fetching system configuration:", error);
            setIsError(true);
            setMessage("Failed to retrieve system configurations from proxy server.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setIsError(false);
        
        try {
            const response = await fetch(`${PROXY_URL}/api/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) throw new Error("Failed to persist configurations");
            
            const resData = await response.json();
            if (resData.success) {
                setConfig(resData.config);
                setIsError(false);
                setMessage('System configurations saved successfully!');
                setTimeout(() => setMessage(''), 4000);
            } else {
                throw new Error(resData.error || "Unknown server response");
            }
        } catch (error) {
            console.error("Error saving configurations:", error);
            setIsError(true);
            setMessage("Error: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (key) => {
        setConfig(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleNumberChange = (key, val) => {
        setConfig(prev => ({
            ...prev,
            [key]: Math.max(0, parseInt(val) || 0)
        }));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

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
                        Live System Configurations
                    </h2>
                    <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider">Tweak global settings, security policies, and stock triggers</p>
                </header>

                <div className="max-w-3xl mx-auto">
                    {loading ? (
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-12 shadow-sm text-center">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-semibold text-slate-500">Loading system parameters...</span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Message Panel */}
                            {message && (
                                <div className={`p-4 rounded-xl border font-bold text-xs text-center shadow-sm ${
                                    isError ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                }`}>
                                    {message}
                                </div>
                            )}

                            {/* Section: Stock & Financial Thresholds */}
                            <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-5 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                                    Thresholds & Limits
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                            Low Stock Trigger Count
                                        </label>
                                        <input
                                            type="number"
                                            value={config.lowStockThreshold}
                                            onChange={(e) => handleNumberChange('lowStockThreshold', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm text-slate-800 font-bold"
                                            placeholder="e.g. 15"
                                            min="0"
                                        />
                                        <p className="text-[10px] font-semibold text-slate-400 mt-1.5 leading-relaxed">
                                            Item items remaining count below which a "Low Stock" indicator lights up.
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                            Double Sign-Off Limit ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={config.doubleApprovalThreshold}
                                            onChange={(e) => handleNumberChange('doubleApprovalThreshold', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm text-slate-800 font-bold"
                                            placeholder="e.g. 5000"
                                            min="0"
                                        />
                                        <p className="text-[10px] font-semibold text-slate-400 mt-1.5 leading-relaxed">
                                            Procurement requests exceeding this amount trigger multi-admin reviews.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Platform Policies */}
                            <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-5 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Security & Policies
                                </h3>

                                <div className="space-y-6">
                                    {/* Session Duration */}
                                    <div className="w-1/2">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                            Idle Logout Timeout (Minutes)
                                        </label>
                                        <input
                                            type="number"
                                            value={config.sessionTimeoutMinutes}
                                            onChange={(e) => handleNumberChange('sessionTimeoutMinutes', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm text-slate-800 font-bold"
                                            placeholder="e.g. 30"
                                            min="5"
                                        />
                                        <p className="text-[10px] font-semibold text-slate-400 mt-1.5 leading-relaxed">
                                            Inactive period before client browser automatically redirects to the sign-in screen.
                                        </p>
                                    </div>

                                    {/* Toggles */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                        {/* Toggle: Signups */}
                                        <div className="flex items-start gap-3 p-3 hover:bg-slate-50/50 rounded-xl transition-colors">
                                            <input
                                                id="allowSignup"
                                                type="checkbox"
                                                checked={config.allowSignup}
                                                onChange={() => handleToggle('allowSignup')}
                                                className="mt-1 w-4.5 h-4.5 rounded text-pink-600 focus:ring-pink-500 border-slate-300 cursor-pointer"
                                            />
                                            <label htmlFor="allowSignup" className="cursor-pointer">
                                                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                                    Allow Public Personnel Registration
                                                </span>
                                                <span className="block text-[10px] font-semibold text-slate-400 mt-0.5 leading-relaxed">
                                                    Enable normal personnel staff to self-register from the portal login.
                                                </span>
                                            </label>
                                        </div>

                                        {/* Toggle: Maintenance */}
                                        <div className="flex items-start gap-3 p-3 hover:bg-rose-50/30 rounded-xl border border-transparent hover:border-rose-100/50 transition-colors">
                                            <input
                                                id="maintenanceMode"
                                                type="checkbox"
                                                checked={config.maintenanceMode}
                                                onChange={() => handleToggle('maintenanceMode')}
                                                className="mt-1 w-4.5 h-4.5 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                                            />
                                            <label htmlFor="maintenanceMode" className="cursor-pointer">
                                                <span className="block text-xs font-bold text-red-700 uppercase tracking-wide">
                                                    System Maintenance Lockout
                                                </span>
                                                <span className="block text-[10px] font-semibold text-slate-400 mt-0.5 leading-relaxed">
                                                    Redirect non-superuser staff/admins to a Scheduled Upkeep warning screen.
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={fetchConfig}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/80 transition-all duration-200 cursor-pointer"
                                    disabled={saving}
                                >
                                    Cancel & Reset
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-md shadow-pink-600/10 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Save Settings
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

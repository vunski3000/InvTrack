import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const [procurementOpen, setProcurementOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activeHighlights, setActiveHighlights] = useState(new Set());
    const [username, setUsername] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                // Ensure only admin users are displayed on the admin navigation
                if (user.user_metadata?.role !== 'admin') {
                    return;
                }

                // Extract the username from "username@invtrack.local"
                const extractedUsername = user.email.split('@')[0];
                
                // Check for specific admin assignments
                if (extractedUsername === '19987975') {
                    setUsername('Admin1');
                } else if (extractedUsername === '19987941') {
                    setUsername('Admin2');
                } else {
                    setUsername(extractedUsername); // Fallback to raw username
                }
            }
        };

        fetchUser();

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('target_user', 'admin')
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) {
                console.error("Error fetching admin notifications:", error.message);
            }
            if (data) {
                // Re-read localStorage on every fetch to sync across tabs and prevent the dot from returning
                const localLastRead = parseInt(localStorage.getItem('adminLastReadNotif') || '0', 10);
                
                setNotifications(data.map(n => ({
                    ...n,
                    is_read: n.is_read || (new Date(n.created_at).getTime() <= localLastRead)
                })));
            }
        };
        
        fetchNotifications();

        // Polling fallback: Fetch notifications every 3 seconds to guarantee they appear.
        // This completely bypasses any WebSocket/Realtime connection issues.
        const intervalId = setInterval(fetchNotifications, 3000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const handleNotificationClick = async () => {
        const isOpening = !notificationOpen;
        setNotificationOpen(isOpening);

        if (isOpening) {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            setActiveHighlights(new Set(unreadIds));

            if (notifications.length > 0) {
                // Save the exact timestamp of the newest loaded notification
                const maxTimestamp = Math.max(...notifications.map(n => new Date(n.created_at).getTime()));
                localStorage.setItem('adminLastReadNotif', maxTimestamp.toString());
            }

            if (unreadIds.length > 0) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
                if (error) {
                    console.error("Database update failed, but localStorage will hide the red dot:", error.message);
                }
            }
        } else {
            setActiveHighlights(new Set());
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Helper to dynamically highlight top-level tabs based on current route
    const isActiveTab = (paths) => paths.includes(location.pathname)
        ? "px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 border border-indigo-100/80 text-indigo-600 shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5"
        : "px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer flex items-center gap-1.5";

    // Helper to dynamically highlight procurement dropdown items based on current route
    const isDropdownItemActive = (path) => location.pathname === path
        ? "block px-4 py-2 text-sm text-indigo-600 font-bold bg-indigo-50/50 cursor-pointer border-l-2 border-indigo-600"
        : "block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors";

    return (
        <nav className="bg-white/80 border-b border-slate-200/80 backdrop-blur-xl shadow-sm z-20 relative shrink-0">
            <div className="flex items-center justify-between px-6 lg:px-8 h-16">
                <div className="flex items-center">
                    <h1 className="text-2xl font-black tracking-tight mr-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 select-none">
                        InvTrack
                    </h1>
                    <div className="hidden md:block">
                        <div className="flex items-center space-x-1">
                            <span onClick={() => navigate('/dashboard')} className={isActiveTab(['/dashboard'])}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
                                Dashboard
                            </span>
                            <span onClick={() => navigate('/inventory')} className={isActiveTab(['/inventory'])}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                Inventory
                            </span>
                            <div className="relative">
                                <button 
                                    onClick={() => setProcurementOpen(!procurementOpen)} 
                                    onBlur={() => setTimeout(() => setProcurementOpen(false), 150)} 
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${['/admin-requests', '/purchase-requests', '/purchase-orders', '/ppmp'].includes(location.pathname) ? 'bg-indigo-50 border border-indigo-100/80 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    Procurement
                                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {procurementOpen && (
                                    <div className="absolute mt-2 w-64 rounded-2xl shadow-xl bg-white/95 border border-slate-200/60 backdrop-blur-xl py-2 z-50 transform transition-all duration-200 ring-1 ring-black/5">
                                        <span onMouseDown={() => navigate('/admin-requests')} className={isDropdownItemActive('/admin-requests')}>Requests</span>
                                        <span onMouseDown={() => navigate('/purchase-requests')} className={isDropdownItemActive('/purchase-requests')}>Purchase Requests</span>
                                        <span onMouseDown={() => navigate('/purchase-orders')} className={isDropdownItemActive('/purchase-orders')}>Purchase Orders</span>
                                        <span onMouseDown={() => navigate('/ppmp')} className={isDropdownItemActive('/ppmp')}>PPMP Procurement</span>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <button 
                                    onClick={() => setSettingsOpen(!settingsOpen)} 
                                    onBlur={() => setTimeout(() => setSettingsOpen(false), 150)} 
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${['/audit-logs', '/personnel'].includes(location.pathname) ? 'bg-indigo-50 border border-indigo-100/80 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Settings
                                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {settingsOpen && (
                                    <div className="absolute mt-2 w-52 rounded-2xl shadow-xl bg-white/95 border border-slate-200/60 backdrop-blur-xl py-2 z-50 ring-1 ring-black/5">
                                        <span onMouseDown={() => navigate('/audit-logs')} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors">Audit Logs</span>
                                        <span onMouseDown={() => navigate('/personnel')} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors">Personnel Management</span>
                                        <span onMouseDown={() => navigate('/login')} className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer border-t border-slate-100 transition-colors font-semibold">Log out</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Side: Username Badge */}
                <div className="hidden md:flex items-center space-x-3">
                    {/* Notification Icon */}
                    <div className="relative">
                        <button 
                            onClick={handleNotificationClick} 
                            onBlur={() => setTimeout(() => setNotificationOpen(false), 200)} 
                            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer focus:outline-none relative border border-transparent hover:border-slate-200/50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black ring-2 ring-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        {notificationOpen && (
                            <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl bg-white/95 border border-slate-200/60 backdrop-blur-xl py-2 z-50 max-h-96 overflow-y-auto ring-1 ring-black/5">
                                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                                    <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center font-semibold py-4">No new notifications</p>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {notifications.map((notif, index) => {
                                            const isHighlighted = !notif.is_read || activeHighlights.has(notif.id);
                                            return (
                                                <li key={notif.id || index} className={`px-4 py-3 cursor-pointer transition-colors ${isHighlighted ? 'bg-indigo-50/50 hover:bg-indigo-100/50' : 'hover:bg-slate-50'}`} onMouseDown={() => navigate('/admin-requests')}>
                                                    <p className={`text-xs leading-relaxed ${isHighlighted ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{notif.message}</p>
                                                    <span className={`text-[10px] mt-1 block font-bold ${isHighlighted ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {username && (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-4 py-2 rounded-xl shadow-sm tracking-wide">
                            {username}
                        </span>
                    )}
                </div>
            </div>
        </nav>
    );
}
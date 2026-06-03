import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function StaffNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activeHighlights, setActiveHighlights] = useState(new Set());
    const [staffName, setStaffName] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        let intervalId;

        const initNotifications = async () => {
            if (user && user.email) {
                // Ensure only staff users are displayed on the staff navigation
                if (user.user_metadata?.role !== 'staff') {
                    return;
                }

                // Extract the staff identifier (e.g. from "staff_id@invtrack.local")
                const staffIdString = user.email.split('@')[0];
                const staffIdNum = parseInt(staffIdString.replace('-', ''), 10);
                let currentStaffName = staffIdString; // Fallback to ID

                // Look up the staff member's real name from the personnel table
                const { data: personnelData } = await supabase
                    .from('personnel')
                    .select('name')
                    .eq('personnel_id', staffIdNum)
                    .single();
                    
                if (personnelData && personnelData.name) {
                    currentStaffName = personnelData.name;
                }

                setStaffName(currentStaffName);

                const fetchNotifications = async () => {
                    const { data, error } = await supabase
                        .from('notifications')
                        .select('*')
                        .eq('target_user', currentStaffName)
                        .order('created_at', { ascending: false })
                        .limit(20);
                    
                    if (error) {
                        console.error("Error fetching staff notifications:", error.message);
                    }
                    if (data && !error) {
                        const localLastRead = parseInt(localStorage.getItem('staffLastReadNotif') || '0', 10);
                        
                        setNotifications(data.map(n => ({
                            ...n,
                            is_read: n.is_read || (new Date(n.created_at).getTime() <= localLastRead)
                        })));
                    }
                };

                fetchNotifications();

                // Polling fallback: Fetch notifications every 3 seconds to guarantee they appear.
                intervalId = setInterval(fetchNotifications, 3000);
            }
        };

        initNotifications();

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [user]);

    const handleNotificationClick = async () => {
        const isOpening = !notificationOpen;
        setNotificationOpen(isOpening);

        if (isOpening) {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            setActiveHighlights(new Set(unreadIds));

            if (notifications.length > 0) {
                // Save the exact timestamp of the newest loaded notification
                const maxTimestamp = Math.max(...notifications.map(n => new Date(n.created_at).getTime()));
                localStorage.setItem('staffLastReadNotif', maxTimestamp.toString());
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/staff-login');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Helper to dynamically highlight top-level tabs based on current route
    const isActiveTab = (paths) => paths.includes(location.pathname)
        ? "px-4 py-2 rounded-xl text-sm font-bold bg-purple-50 border border-purple-100/80 text-purple-600 shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5"
        : "px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer flex items-center gap-1.5";

    return (
        <nav className="bg-white/80 border-b border-slate-200/80 backdrop-blur-xl shadow-sm z-20 relative shrink-0">
            <div className="flex items-center justify-between px-6 lg:px-8 h-16">
                <div className="flex items-center">
                    <h1 className="text-2xl font-black tracking-tight mr-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-fuchsia-700 to-indigo-800 select-none">
                        InvTrack
                    </h1>
                    <div className="hidden md:block">
                        <div className="flex items-center space-x-1">
                            <span onClick={() => navigate('/staff-dashboard')} className={isActiveTab(['/staff-dashboard'])}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
                                Dashboard
                            </span>
                            <span onClick={() => navigate('/my-requests')} className={isActiveTab(['/my-requests'])}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                My Requests
                            </span>
                            <span onClick={() => navigate('/staff-request')} className={isActiveTab(['/staff-request'])}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Request Item
                            </span>
                            <span onClick={() => navigate('/staff-inventory')} className={isActiveTab(['/staff-inventory'])}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                Inventory
                            </span>
                            <span onClick={() => navigate('/staff-ppmp')} className={isActiveTab(['/staff-ppmp'])}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                PPMP
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Right Side: Username Badge & Notifications */}
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
                                                <li key={notif.id || index} className={`px-4 py-3 cursor-pointer transition-colors ${isHighlighted ? 'bg-purple-50/50 hover:bg-purple-100/50' : 'hover:bg-slate-50'}`} onMouseDown={() => navigate('/my-requests')}>
                                                    <p className={`text-xs leading-relaxed ${isHighlighted ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{notif.message}</p>
                                                    <span className={`text-[10px] mt-1 block font-bold ${isHighlighted ? 'text-purple-600' : 'text-slate-400'}`}>
                                                        {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {staffName && (
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100/80 px-4 py-2 rounded-xl shadow-sm tracking-wide">
                            {staffName}
                        </span>
                    )}
                    
                    <button onClick={handleLogout} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Log out
                    </button>
                </div>
            </div>
        </nav>
    );
}
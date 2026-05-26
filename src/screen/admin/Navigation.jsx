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
        ? "px-3 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white transition-colors cursor-pointer"
        : "px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer";

    // Helper to dynamically highlight procurement dropdown items based on current route
    const isDropdownItemActive = (path) => location.pathname === path
        ? "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer font-medium bg-gray-50"
        : "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer";

    return (
        <nav className="bg-indigo-700 text-white shadow-md z-20 relative shrink-0">
            <div className="flex items-center justify-between px-6 lg:px-8 h-16">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold tracking-tight mr-8">InvTrack</h1>
                    <div className="hidden md:block">
                        <div className="flex items-baseline space-x-2">
                            <span onClick={() => navigate('/dashboard')} className={isActiveTab(['/dashboard'])}>
                                Dashboard
                            </span>
                            <span onClick={() => navigate('/inventory')} className={isActiveTab(['/inventory'])}>
                                Inventory
                            </span>
                            <div className="relative">
                                <button onClick={() => setProcurementOpen(!procurementOpen)} onBlur={() => setTimeout(() => setProcurementOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                    Procurement
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {procurementOpen && (
                                    <div className="absolute mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                                        <span onMouseDown={() => navigate('/admin-requests')} className={isDropdownItemActive('/admin-requests')}>Requests</span>
                                        <span onMouseDown={() => navigate('/purchase-requests')} className={isDropdownItemActive('/purchase-requests')}>Purchase Requests</span>
                                        <span onMouseDown={() => navigate('/purchase-orders')} className={isDropdownItemActive('/purchase-orders')}>Purchase Orders</span>
                                        <span onMouseDown={() => navigate('/ppmp')} className={isDropdownItemActive('/ppmp')}>PPMP (Project Procurement Monitoring Plan)</span>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <button onClick={() => setSettingsOpen(!settingsOpen)} onBlur={() => setTimeout(() => setSettingsOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                    Settings
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {settingsOpen && (
                                    <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                                        <span onMouseDown={() => navigate('/audit-logs')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Audit Logs</span>
                                        <span onMouseDown={() => navigate('/personnel')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Personnel Management</span>
                                        <span onMouseDown={() => navigate('/login')} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer border-t border-gray-50">Log out</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Side: Username Badge */}
                <div className="hidden md:flex items-center space-x-4">
                    {/* Notification Icon */}
                    <div className="relative">
                        <button 
                            onClick={handleNotificationClick} 
                            onBlur={() => setTimeout(() => setNotificationOpen(false), 200)} 
                            className="p-2 rounded-full text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer focus:outline-none relative"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-indigo-700">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        {notificationOpen && (
                            <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-2 z-50 max-h-96 overflow-y-auto">
                                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                                    <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center font-medium py-4">There are no notifications.</p>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {notifications.map((notif, index) => {
                                            const isHighlighted = !notif.is_read || activeHighlights.has(notif.id);
                                            return (
                                                <li key={notif.id || index} className={`px-4 py-3 cursor-pointer transition-colors ${isHighlighted ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`} onMouseDown={() => navigate('/admin-requests')}>
                                                    <p className={`text-sm ${isHighlighted ? 'text-indigo-900 font-semibold' : 'text-gray-800'}`}>{notif.message}</p>
                                                    <span className={`text-xs mt-1 block ${isHighlighted ? 'text-indigo-700 font-medium' : 'text-gray-400'}`}>
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
                        <span className="text-sm font-medium text-indigo-100 bg-indigo-800 px-4 py-1.5 rounded-full shadow-inner">
                            {username}
                        </span>
                    )}
                </div>
            </div>
        </nav>
    );
}
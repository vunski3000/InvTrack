import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const [procurementOpen, setProcurementOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

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
                            <span onClick={() => navigate('/inventory')} className={isActiveTab(['/inventory', '/new-item'])}>
                                Inventory
                            </span>
                            <div className="relative">
                                <button onClick={() => setProcurementOpen(!procurementOpen)} onBlur={() => setTimeout(() => setProcurementOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                    Procurement
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {procurementOpen && (
                                    <div className="absolute mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                                        <span onMouseDown={() => navigate('/request')} className={isDropdownItemActive('/request')}>Requisition</span>
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
                                        <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Preferences</span>
                                        <span onMouseDown={() => navigate('/login')} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer border-t border-gray-50">Log out</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
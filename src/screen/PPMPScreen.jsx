import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PPMPScreen() {
    const navigate = useNavigate();
    const [procurementOpen, setProcurementOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Top Navigation */}
            <nav className="bg-indigo-700 text-white shadow-md z-10 shrink-0">
                <div className="flex items-center justify-between px-6 lg:px-8 h-16">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold tracking-tight mr-8">InvTrack</h1>
                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-2">
                                <span onClick={() => navigate('/dashboard')} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                                    Dashboard
                                </span>
                                <span onClick={() => navigate('/inventory')} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                                    Inventory
                                </span>
                                <div className="relative">
                                    <button onClick={() => setProcurementOpen(!procurementOpen)} onBlur={() => setTimeout(() => setProcurementOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                        Procurement
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {procurementOpen && (
                                        <div className="absolute mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                                        <span onMouseDown={() => navigate('/request')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Requisition</span>
                                        <span onMouseDown={() => navigate('/purchase-requests')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Purchase Requests</span>
                                        <span onMouseDown={() => navigate('/purchase-orders')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Purchase Orders</span>
                                        <span onMouseDown={() => navigate('/ppmp')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer font-medium bg-gray-50">PPMP (Project Procurement Monitoring Plan)</span>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <button onClick={() => setSettingsOpen(!settingsOpen)} onBlur={() => setTimeout(() => setSettingsOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                        Settings
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {settingsOpen && (
                                        <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
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

            {/* Main Content */}
            <div className="flex-1 flex justify-center items-center p-4 sm:p-6 overflow-y-auto">
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 text-center w-full max-w-sm">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">PPMP</h2>
                    <p className="text-gray-500 mb-8">
                        This module is currently in progress. Please check back later.
                    </p>
                    <button onClick={() => navigate('/dashboard')} className="w-full px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out font-medium shadow-sm">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
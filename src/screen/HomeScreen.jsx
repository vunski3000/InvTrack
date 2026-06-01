import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeScreen() {
    return (
        <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-indigo-50/30 to-purple-50/40 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
            {/* Soft Pastel Gradient Glow Orbs in the background */}
            <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-200/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-200/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[150px]"></div>

            {/* Subtle Tech Grid overlay for depth */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f105_1px,transparent_1px),linear-gradient(to_bottom,#6366f105_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            <div className="w-full max-w-2xl bg-white/75 border border-white/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_-15px_rgba(99,102,241,0.12)] text-center relative z-10 transition-all duration-300 hover:shadow-[0_25px_70px_-12px_rgba(168,85,247,0.18)]">
                {/* Brand Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold tracking-wider uppercase text-indigo-600 mb-6 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                    Enterprise Suite
                </div>

                {/* Main Logo & Headline */}
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 select-none">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900">
                        InvTrack
                    </span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-600 max-w-md mx-auto mb-10 font-normal leading-relaxed">
                    A premium unified portal for inventory optimization, PPMP procurement requests, and secure system auditing.
                </p>

                {/* Gateway Portals Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                    {/* Admin Portal */}
                    <Link 
                        to="/login" 
                        className="group flex flex-col items-center justify-between p-5 bg-gradient-to-b from-white to-slate-50/50 hover:from-indigo-50/40 hover:to-indigo-50/10 border border-slate-200/80 hover:border-indigo-300 rounded-2xl shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_20px_-8px_rgba(99,102,241,0.25)]"
                    >
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-slate-800 tracking-wide mb-1">Admin Portal</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">Manage Supply</span>
                    </Link>

                    {/* Staff Portal */}
                    <Link 
                        to="/staff-login" 
                        className="group flex flex-col items-center justify-between p-5 bg-gradient-to-b from-white to-slate-50/50 hover:from-purple-50/40 hover:to-purple-50/10 border border-slate-200/80 hover:border-purple-300 rounded-2xl shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_20px_-8px_rgba(168,85,247,0.25)]"
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-600 flex items-center justify-center mb-4 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-slate-800 tracking-wide mb-1">Staff Portal</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-purple-600 transition-colors">Procure Items</span>
                    </Link>

                    {/* Sysadmin Portal */}
                    <Link 
                        to="/sysadmin-login" 
                        className="group flex flex-col items-center justify-between p-5 bg-gradient-to-b from-white to-slate-50/50 hover:from-pink-50/40 hover:to-pink-50/10 border border-slate-200/80 hover:border-pink-300 rounded-2xl shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_12px_20px_-8px_rgba(236,72,153,0.25)]"
                    >
                        <div className="w-12 h-12 rounded-xl bg-pink-50 group-hover:bg-pink-100 text-pink-600 flex items-center justify-center mb-4 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-slate-800 tracking-wide mb-1">System Admin</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-pink-600 transition-colors">Audit & Control</span>
                    </Link>
                </div>

                {/* Footer Credits */}
                <div className="text-slate-400 text-xs font-semibold tracking-wider select-none border-t border-slate-100 pt-6">
                    POWERED BY SUPABASE SECURE DATABASE
                </div>
            </div>
        </div>
    );
}
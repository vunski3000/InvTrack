import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function MaintenanceScreen() {
    const navigate = useNavigate();

    const handleBackToLogin = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-rose-50/20 to-indigo-50/30 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
            {/* Glowing background circles for visual depth */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-rose-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-200/30 via-rose-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Subtle Tech Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f43f5e03_1px,transparent_1px),linear-gradient(to_bottom,#f43f5e03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Main Alert Card */}
            <div className="w-full max-w-lg bg-white/75 border border-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_-15px_rgba(244,63,94,0.12)] relative z-10 text-center flex flex-col items-center">
                
                {/* Visual Icon (Animated Cog or Tools) */}
                <div className="mb-6 p-5 rounded-full bg-rose-50 border border-rose-100/60 text-rose-500 relative flex items-center justify-center animate-pulse">
                    <svg className="w-12 h-12 animate-spin" style={{ animationDuration: '6s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="absolute top-3 right-3 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-3">
                    System Maintenance Lockout
                </h1>
                
                {/* Secondary Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-[10px] font-bold tracking-wider uppercase text-rose-600 mb-6 shadow-sm">
                    Scheduled Upkeep in Progress
                </div>

                {/* Subtext */}
                <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-8 max-w-sm">
                    We are currently executing essential database upgrades and manual alignments to improve system stability. Normal operations will resume shortly.
                </p>

                {/* Action button to return to index */}
                <button
                    onClick={handleBackToLogin}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white rounded-xl font-bold text-xs transition shadow-md shadow-rose-600/10 cursor-pointer active:scale-95 duration-150"
                >
                    Return to Login
                </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 font-semibold mt-8 select-none">
                InvTrack System Protection Unit &copy; {new Date().getFullYear()}
            </p>
        </div>
    );
}

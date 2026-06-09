import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SysadminBackupScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState('');

    // List of all critical tables in your database
    const tablesToBackup = [
        'inventory_procurement',
        'personnel',
        'requisition_issuance',
        'audit_logs',
        'categories',
        'units',
        'department',
        'purchase_orders',
        'purchase_requests',
        'ppmps',
        'notifications',
        'system_configuration'
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Helper to dynamically highlight top-level tabs based on current route
    const isActiveTab = (paths) => paths.includes(location.pathname)
        ? "px-4 py-2 rounded-xl text-sm font-bold bg-pink-50 border border-pink-100/80 text-pink-600 shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5"
        : "px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer flex items-center gap-1.5";

    const handleFullBackup = async () => {
        window.showConfirm(
            "Are you sure you want to export the entire database? This may take a moment depending on the size of the data.",
            "Export Confirmation",
            async () => {
                setIsExporting(true);
                setExportStatus('Initializing backup...');
                
                const backupData = {
                    timestamp: new Date().toISOString(),
                    tables: {}
                };

                try {
                    for (const table of tablesToBackup) {
                        setExportStatus(`Exporting table: ${table}...`);
                        const { data, error } = await supabase.from(table).select('*');
                        
                        if (error) {
                            console.error(`Error exporting ${table}:`, error.message);
                            backupData.tables[table] = { error: error.message };
                        } else {
                            backupData.tables[table] = data;
                        }
                    }

                    setExportStatus('Finalizing JSON file...');
                    
                    // Create and download the JSON file
                    const jsonString = JSON.stringify(backupData, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `invtrack_full_backup_${new Date().toISOString().split('T')[0]}.json`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setExportStatus('Backup completed successfully!');
                    setTimeout(() => setExportStatus(''), 4000);
                } catch (err) {
                    console.error("Backup failed:", err);
                    setExportStatus(`Backup failed: ${err.message}`);
                } finally {
                    setIsExporting(false);
                }
            }
        );
    };

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
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-pink-500 to-rose-600"></span>
                        System Backup Control
                    </h2>
                    <button onClick={() => navigate('/sysadmin-dashboard')} className="text-slate-500 hover:text-pink-600 transition-colors flex items-center text-xs font-bold bg-white border border-slate-200/60 shadow-sm px-3.5 py-2 rounded-xl cursor-pointer">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Dashboard
                    </button>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 flex flex-col items-center">
                    <div className="w-full max-w-4xl">
                        <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 overflow-hidden p-6 sm:p-8">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-700">Export Full Database</h3>
                                <p className="text-slate-400 font-semibold text-xs mt-1.5 leading-relaxed">
                                    Download a complete snapshot of all critical system tables in JSON format. This backup can be used for compliance, auditing, or disaster recovery.
                                </p>
                            </div>

                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/50 mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Included Tables:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {tablesToBackup.map(table => (
                                        <div key={table} className="flex items-center text-xs text-slate-600 bg-white border border-slate-100 px-3 py-2 rounded-xl shadow-sm">
                                            <svg className="w-4 h-4 text-emerald-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            <span className="font-mono font-bold text-[10px] text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">{table}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {exportStatus && (
                                <div className={`mb-6 p-4 rounded-xl text-xs font-bold border transition-all duration-300 ${exportStatus.includes('failed') ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-pink-50 text-pink-700 border-pink-200'}`}>
                                    {exportStatus}
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleFullBackup}
                                    disabled={isExporting}
                                    className="px-6 py-2.5 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition font-bold shadow-md text-xs tracking-wider flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isExporting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Generate Full JSON Backup
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
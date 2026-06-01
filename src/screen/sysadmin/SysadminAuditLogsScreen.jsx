import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SysadminAuditLogsScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const itemsPerPage = 15;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setCurrentPage(1);
        }, 300); // 300ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    useEffect(() => {
        fetchLogs();
    }, [currentPage, debouncedSearchQuery, startDate, endDate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase
                .from('audit_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (debouncedSearchQuery) {
                const search = `%${debouncedSearchQuery}%`;
                query = query.or(`action.ilike.${search},user_name.ilike.${search},details.ilike.${search}`);
            }
            if (startDate) {
                query = query.gte('created_at', new Date(startDate).toISOString());
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Include the entire end day
                query = query.lte('created_at', end.toISOString());
            }
            
            const { data, error, count } = await query;

            if (error) throw error;

            setLogs(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error("Error fetching audit logs:", err.message);
            setLogs([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Helper to dynamically highlight top-level tabs based on current route
    const isActiveTab = (paths) => paths.includes(location.pathname)
        ? "px-4 py-2 rounded-xl text-sm font-bold bg-pink-50 border border-pink-100/80 text-pink-600 shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5"
        : "px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer flex items-center gap-1.5";

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;

    const handleExportCSV = async () => {
        if (totalCount === 0) {
            alert("No logs to export.");
            return;
        }
        if (totalCount > 10000 && !window.confirm(`This will export ${totalCount} records. Continue?`)) {
            return;
        }

        setIsExporting(true);
        try {
            let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
            if (debouncedSearchQuery) {
                const search = `%${debouncedSearchQuery}%`;
                query = query.or(`action.ilike.${search},user_name.ilike.${search},details.ilike.${search}`);
            }
            if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1);
                query = query.lte('created_at', end.toISOString());
            }

            const { data: allLogs, error } = await query;
            if (error) throw error;

            const headers = ['Date & Time', 'User', 'Action', 'Details'];
            const csvRows = [headers.join(',')];
            allLogs.forEach(log => {
                const date = `"${new Date(log.created_at).toLocaleString().replace(/"/g, '""')}"`;
                const user = `"${(log.user_name || log.user_id || 'System').replace(/"/g, '""')}"`;
                const action = `"${(log.action || '').replace(/"/g, '""')}"`;
                const details = `"${(log.details || '').replace(/"/g, '""')}"`;
                csvRows.push([date, user, action, details].join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert("Failed to export logs: " + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
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
                        System Audit & Logs
                    </h2>
                    <button onClick={() => navigate('/sysadmin-dashboard')} className="text-slate-500 hover:text-pink-600 transition-colors flex items-center text-xs font-bold bg-white border border-slate-200/60 shadow-sm px-3.5 py-2 rounded-xl cursor-pointer">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Dashboard
                    </button>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden p-6 lg:p-8 min-h-0">
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
                        <div className="flex flex-col sm:flex-row gap-4 w-full items-center">
                            <input 
                                type="text" 
                                placeholder="Search logs..." 
                                className="w-full sm:w-64 px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">From:</label>
                                <input
                                    type="date"
                                    className="px-3 py-1.5 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-xs transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                />
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">To:</label>
                                <input
                                    type="date"
                                    className="px-3 py-1.5 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-xs transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                />
                                <button 
                                    onClick={handleClearFilters} 
                                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                        <div className="shrink-0 w-full xl:w-auto flex justify-end">
                            <button
                                onClick={handleExportCSV}
                                disabled={isExporting}
                                className="px-5 py-2 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 rounded-xl transition font-bold shadow-sm text-xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                            >
                                {isExporting ? 'Exporting...' : 'Export to CSV'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 flex flex-col flex-1 min-h-0 overflow-hidden w-full max-w-7xl">
                        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                            <table className="min-w-full divide-y divide-slate-100 relative">
                                <thead className="bg-slate-50/70 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">Loading logs...</td></tr>
                                    ) : logs.length === 0 ? (
                                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">No log records found.</td></tr>
                                    ) : logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-pink-50/10 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">{log.user_name || log.user_id || 'System'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-pink-600">{log.action}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500 font-semibold leading-relaxed">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls */}
                        {!loading && totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
                                <div className="text-xs text-slate-400 font-bold">
                                    Showing <span className="text-slate-600 font-black">{Math.min(startIndex + 1, totalCount)}</span> to <span className="text-slate-600 font-black">{Math.min(startIndex + itemsPerPage, totalCount)}</span> of <span className="text-slate-600 font-black">{totalCount}</span> logs
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-1.5 border border-slate-200/60 rounded-xl bg-white text-slate-600 hover:text-slate-900 text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-1.5 border border-slate-200/60 rounded-xl bg-white text-slate-600 hover:text-slate-900 text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
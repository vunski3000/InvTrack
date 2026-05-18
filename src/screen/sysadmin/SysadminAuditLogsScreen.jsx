import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SysadminAuditLogsScreen() {
    const navigate = useNavigate();
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
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            <header className="h-16 bg-white shadow-sm flex items-center px-6 lg:px-8 shrink-0 relative">
                <button onClick={() => navigate('/sysadmin-dashboard')} className="text-gray-500 hover:text-gray-900 transition-colors mr-4 flex items-center text-sm font-medium">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <h2 className="text-xl font-semibold text-gray-800">System Audit & Logs</h2>
            </header>

            <main className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-7xl mb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            className="w-full sm:w-auto lg:w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-500">From:</label>
                            <input
                                type="date"
                                className="p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                            />
                            <label className="text-sm font-medium text-gray-500">To:</label>
                            <input
                                type="date"
                                className="p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                            />
                            <button onClick={handleClearFilters} className="text-sm text-indigo-600 hover:underline p-2">Clear</button>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting}
                            className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition font-medium text-sm shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isExporting ? 'Exporting...' : 'Export to CSV'}
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-xl border border-gray-100 w-full max-w-7xl overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-x-auto flex-1">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Loading logs...</td></tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user_name || log.user_id || 'System'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{log.action}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {!loading && totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">{Math.min(startIndex + 1, totalCount)}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> logs
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
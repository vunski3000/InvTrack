import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';

export default function AuditScreen() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error("Error fetching audit logs:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchSearch = (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchDate = true;
        const logDate = new Date(log.created_at);
        
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (logDate < start) matchDate = false;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (logDate > end) matchDate = false;
        }

        return matchSearch && matchDate;
    });

    const handleExportCSV = () => {
        if (filteredLogs.length === 0) {
            alert("No logs to export.");
            return;
        }
        
        const headers = ['Date & Time', 'User', 'Action', 'Details'];
        const csvRows = [headers.join(',')];
        
        filteredLogs.forEach(log => {
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
    };

    const handleExportPDF = () => {
        if (filteredLogs.length === 0) {
            alert("No logs to export.");
            return;
        }

        const printWindow = window.open('', '_blank');
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Audit Logs</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { text-align: center; color: #111; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
                        th { background-color: #f9fafb; color: #555; }
                        .footer { margin-top: 40px; text-align: right; font-size: 0.9em; color: #666; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    <h1>System Audit Logs</h1>
                    ${startDate || endDate ? `<p><strong>Filter:</strong> ${startDate ? new Date(startDate).toLocaleDateString() : 'Any'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Any'}</p>` : ''}
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 20%">Date & Time</th>
                                <th style="width: 20%">User</th>
                                <th style="width: 20%">Action</th>
                                <th style="width: 40%">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredLogs.map(log => `
                                <tr>
                                    <td>${new Date(log.created_at).toLocaleString()}</td>
                                    <td>${log.user_name || log.user_id || 'System'}</td>
                                    <td>${log.action}</td>
                                    <td>${log.details}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.onafterprint = () => printWindow.close();
            printWindow.print();
        }, 250);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />

            <Navigation />

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-700"></span>
                        System Audit Logs
                    </h2>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden p-6 lg:p-8 min-h-0">
                    {/* Filters and Actions Bar */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0">
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-start sm:items-center">
                            <input 
                                type="text" 
                                placeholder="Search logs by action, user, or details..." 
                                className="w-full sm:w-64 px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">From:</span>
                                <input
                                    type="date"
                                    className="px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                    value={startDate || ''}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">To:</span>
                                <input
                                    type="date"
                                    className="px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                    value={endDate || ''}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                                {(startDate || endDate) && (
                                    <button 
                                        onClick={() => { setStartDate(''); setEndDate(''); }} 
                                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                    >
                                        Clear Dates
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 shrink-0 w-full sm:w-auto">
                            <button onClick={handleExportCSV} className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors font-bold text-sm shadow-sm whitespace-nowrap cursor-pointer">
                                Export CSV
                            </button>
                            <button onClick={handleExportPDF} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold text-sm shadow-sm whitespace-nowrap cursor-pointer">
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Logs Table Section */}
                    <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 flex flex-col flex-1 min-h-0 overflow-hidden">
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
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">Loading logs...</td>
                                        </tr>
                                    ) : filteredLogs.length > 0 ? (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{log.user_name || log.user_id || 'System'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{log.action}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{log.details}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">No audit logs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
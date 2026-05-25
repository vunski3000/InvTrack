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
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            <Navigation />
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-6xl mb-6 flex justify-between items-center mt-2">
                    <h2 className="text-2xl font-bold text-gray-800">System Audit Logs</h2>
                </div>

                <div className="w-full max-w-6xl mb-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <input 
                            type="text" 
                            placeholder="Search logs by action, user, or details..." 
                            className="w-full sm:w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-500">From:</label>
                            <input
                                type="date"
                                className="p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <label className="text-sm font-medium text-gray-500">To:</label>
                            <input
                                type="date"
                                className="p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button onClick={handleExportCSV} className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition font-medium text-sm shadow-sm whitespace-nowrap">
                            Export CSV
                        </button>
                        <button onClick={handleExportPDF} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium text-sm shadow-sm whitespace-nowrap">
                            Export PDF
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-xl border border-gray-100 w-full max-w-6xl overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-x-auto">
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
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">Loading logs...</td>
                                    </tr>
                                ) : filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user_name || log.user_id || 'System'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{log.action}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{log.details}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">No audit logs found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
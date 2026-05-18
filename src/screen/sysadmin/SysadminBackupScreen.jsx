import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SysadminBackupScreen() {
    const navigate = useNavigate();
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
        'notifications'
    ];

    const handleFullBackup = async () => {
        if (!window.confirm("Are you sure you want to export the entire database? This may take a moment depending on the size of the data.")) return;

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
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Top Navigation */}
            <header className="h-16 bg-white shadow-sm flex items-center px-6 lg:px-8 shrink-0 relative">
                <button onClick={() => navigate('/sysadmin-dashboard')} className="text-gray-500 hover:text-gray-900 transition-colors mr-4 flex items-center text-sm font-medium">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <h2 className="text-xl font-semibold text-gray-800">System Backups</h2>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden p-6 sm:p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Export Full Database</h3>
                            <p className="text-gray-500 text-sm mt-2">
                                Download a complete snapshot of all critical system tables in JSON format. This backup can be used for compliance, auditing, or disaster recovery.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Included Tables:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {tablesToBackup.map(table => (
                                    <div key={table} className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        <span className="font-mono text-xs">{table}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {exportStatus && (
                            <div className={`mb-6 p-4 rounded-md text-sm font-medium border ${exportStatus.includes('failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                {exportStatus}
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                onClick={handleFullBackup}
                                disabled={isExporting}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-md hover:bg-black transition font-medium shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Generate Full JSON Backup
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
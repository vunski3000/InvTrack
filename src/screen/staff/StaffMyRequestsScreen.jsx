import React, { useState, useEffect } from 'react';
import StaffNavigation from './StaffNavigation';
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

export default function StaffMyRequestsScreen() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [staffName, setStaffName] = useState('Staff');

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            let staffIdString = '';
            let realName = '';
            if (user && user.email) {
                staffIdString = user.email.split('@')[0];
                const staffIdNum = parseInt(staffIdString.replace('-', ''), 10);
                
                // Look up the staff member's real name from the personnel table
                const { data: personnelData } = await supabase
                    .from('personnel')
                    .select('name')
                    .eq('personnel_id', staffIdNum)
                    .single();
                    
                if (personnelData && personnelData.name) {
                    realName = personnelData.name;
                    setStaffName(realName);
                } else {
                    setStaffName(staffIdString);
                }
            }

            let query = supabase
                .from('requisition_issuance')
                .select('*')
                .order('request_date', { ascending: false });

            // Filter using their real name, or fallback to their email prefix identifier
            if (realName) {
                query = query.in('name', [realName, staffIdString]);
            } else if (staffIdString) {
                query = query.eq('name', staffIdString);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            if (data) {
                setRequests(data);
            }
        } catch (err) {
            console.error("Error fetching my requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    const handleDeleteRequest = async (requestId) => {
        window.showConfirm("Are you sure you want to delete this request?", "Delete Request", async () => {
            try {
                const { error } = await supabase
                    .from('requisition_issuance')
                    .delete()
                    .eq('request_id', requestId);
                
                if (error) throw error;
                
                // Audit Log
                await logAudit(staffName, 'Delete Request', `Deleted my request ${requestId}`);

                setRequests(prev => prev.filter(req => req.request_id !== requestId));
                closeModal();
                window.showAlert("Request deleted successfully!", "Success");
            } catch (err) {
                console.error("Error deleting request:", err);
                window.showAlert("Failed to delete request: " + err.message, "Error");
            }
        });
    };

    const handleGenerateRequest = async () => {
        if (!selectedRequest) return;

        const printWindow = window.open('', '_blank');
        
        // Audit Log
        await logAudit(staffName, 'Generate Requisition', `Generated requisition form for my request ${selectedRequest.request_id}`);
        
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Requisition Issuance - ${selectedRequest.request_id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { text-align: center; color: #111; margin-bottom: 5px; }
                        h3 { text-align: center; color: #555; margin-top: 0; margin-bottom: 30px; font-weight: normal; }
                        .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .info-grid div { margin-bottom: 10px; }
                        .info-label { font-size: 0.85em; color: #777; text-transform: uppercase; margin-bottom: 3px; }
                        .info-value { font-weight: bold; font-size: 1.1em; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f9fafb; color: #555; }
                        .status-box { padding: 15px; background-color: #f9fafb; border: 1px solid #ddd; margin-top: 30px; }
                        .footer { margin-top: 40px; text-align: right; font-size: 0.9em; color: #666; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Requisition Issuance Form</h1>
                    <h3>${selectedRequest.request_id}</h3>
                    
                    <div class="info-grid">
                        <div><div class="info-label">Requester Name</div><div class="info-value">${selectedRequest.name}</div></div>
                        <div><div class="info-label">Designation</div><div class="info-value">${selectedRequest.designation}</div></div>
                        <div><div class="info-label">Department</div><div class="info-value">${selectedRequest.dept}</div></div>
                        <div><div class="info-label">Date of Request</div><div class="info-value">${selectedRequest.request_date}</div></div>
                    </div>

                    <table>
                        <thead><tr><th style="width: 20%">Item Number</th><th style="width: 50%">Item Description</th><th style="width: 15%">Quantity</th><th style="width: 15%">Unit</th></tr></thead>
                        <tbody>
                            ${selectedRequest.items.length > 0 ? selectedRequest.items.map(item => `<tr><td>${item.itemNumber}</td><td>${item.itemDescription}</td><td>${item.quantity}</td><td>${item.unit}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align: center">No items found</td></tr>'}
                        </tbody>
                    </table>
                    
                    <div class="status-box">
                        <strong>Status:</strong> ${selectedRequest.status}
                        ${selectedRequest.remarks ? `<br><br><strong>Remarks:</strong><br><span style="white-space: pre-wrap; font-family: monospace;">${selectedRequest.remarks}</span>` : ''}
                    </div>

                    <div class="footer"><p>Generated on: ${new Date().toLocaleDateString()}</p></div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.onafterprint = () => printWindow.close(); printWindow.print(); }, 250);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100/80';
            case 'Pending':
                return 'bg-amber-50 text-amber-700 border-amber-100/80';
            case 'Rejected':
                return 'bg-rose-50 text-rose-700 border-rose-100/80';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200/60';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-200/40 via-fuchsia-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/30 via-pink-200/20 to-transparent blur-3xl pointer-events-none" />

            <StaffNavigation />

            {/* Details Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform scale-100 transition-all duration-300">
                        <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    Requisition Details: <span className="text-purple-600 font-black">{selectedRequest.request_id}</span>
                                </h3>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-lg border ${getStatusStyle(selectedRequest.status)}`}>
                                        {selectedRequest.status === 'Pending' ? 'Pending Admin Action' : `Action: ${selectedRequest.status}`}
                                    </span>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all text-xl font-bold cursor-pointer">&times;</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 shrink-0">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Requester Name</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedRequest.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Designation</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedRequest.designation}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedRequest.dept}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date of Request</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedRequest.request_date}</p>
                                </div>
                            </div>

                            {/* Admin Remarks and Notes */}
                            {(selectedRequest.remarks || selectedRequest.admin_note) && (
                                <div className="flex flex-col space-y-4 shrink-0">
                                    {selectedRequest.remarks && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Admin Remarks / Reason</p>
                                            <p className="p-3 bg-purple-50/50 border border-purple-100/50 rounded-xl text-xs text-purple-900 whitespace-pre-wrap font-mono font-medium">
                                                {selectedRequest.remarks}
                                            </p>
                                        </div>
                                    )}
                                    {selectedRequest.admin_note && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Admin Notes</p>
                                            <p className="p-3 bg-amber-50/50 border border-amber-100/80 rounded-xl text-xs text-amber-900 whitespace-pre-wrap font-mono font-medium">
                                                {selectedRequest.admin_note}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Requested Items</h4>
                                <div className="overflow-hidden border border-slate-200/60 rounded-xl shadow-sm">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/70">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Item Number</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/2">Item Description</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Quantity</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-slate-100">
                                            {selectedRequest.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-purple-50/10 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-bold text-slate-700">{item.itemNumber}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">{item.itemDescription}</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-slate-700">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-400">{item.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between shrink-0 p-6 pt-4 border-t border-slate-100 bg-slate-50/30">
                            <button onClick={() => handleDeleteRequest(selectedRequest.request_id)} className="px-5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl transition font-bold shadow-sm text-xs cursor-pointer">
                                Delete Request
                            </button>
                            <div className="flex space-x-3">
                                <button onClick={handleGenerateRequest} className="px-5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition font-bold shadow-sm text-xs whitespace-nowrap cursor-pointer">
                                    Print Form
                                </button>
                                <button onClick={closeModal} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition font-bold shadow-sm text-xs cursor-pointer">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-purple-500 to-indigo-600"></span>
                        My Requisition Requests
                    </h2>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 flex flex-col items-center">
                    <div className="w-full max-w-5xl">
                        <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 overflow-hidden">
                            <ul className="divide-y divide-slate-100">
                                {loading ? (
                                    <li className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">Loading requests...</li>
                                ) : requests.length > 0 ? (
                                    requests.map((req) => (
                                        <li key={req.request_id} className="px-6 py-5 hover:bg-purple-50/10 transition-all cursor-pointer flex justify-between items-center group" onClick={() => handleViewDetails(req)}>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-base font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{req.request_id}</span>
                                                <span className="text-xs font-semibold text-slate-400 flex flex-wrap items-center gap-1.5">
                                                    <span>{req.name}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span>{req.dept} • {req.designation}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-xs font-bold text-slate-400 hidden sm:block bg-slate-100/80 border border-slate-200/40 px-3 py-1.5 rounded-lg">{req.request_date}</span>
                                                <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-lg border ${getStatusStyle(req.status)}`}>
                                                    {req.status}
                                                </span>
                                                <svg className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path></svg>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">No requests found.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
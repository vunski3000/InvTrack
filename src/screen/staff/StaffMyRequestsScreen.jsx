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
        if (window.confirm("Are you sure you want to delete this request?")) {
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
                alert("Request deleted successfully!");
            } catch (err) {
                console.error("Error deleting request:", err);
                alert("Failed to delete request: " + err.message);
            }
        }
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
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            <StaffNavigation />

            {/* Details Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">Requisition Details: <span className="text-indigo-600">{selectedRequest.request_id}</span></h3>
                                <div className="mt-2">
                                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full border ${getStatusStyle(selectedRequest.status)}`}>
                                        {selectedRequest.status === 'Pending' ? 'Pending Admin Action' : `Action done by Admin: ${selectedRequest.status}`}
                                    </span>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Requester Name</p>
                                <p className="font-semibold text-gray-900">{selectedRequest.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Designation</p>
                                <p className="font-semibold text-gray-900">{selectedRequest.designation}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                                <p className="font-semibold text-gray-900">{selectedRequest.dept}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Date of Request</p>
                                <p className="font-semibold text-gray-900">{selectedRequest.request_date}</p>
                            </div>
                        </div>

                        {/* Admin Remarks and Notes */}
                        {(selectedRequest.remarks || selectedRequest.admin_note) && (
                            <div className="flex flex-col space-y-4 mb-6 shrink-0">
                                {selectedRequest.remarks && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Admin Remarks / Reason</p>
                                        <p className="p-3 bg-indigo-50 border border-indigo-100 rounded-md text-sm text-indigo-900 whitespace-pre-wrap font-mono text-xs">
                                            {selectedRequest.remarks}
                                        </p>
                                    </div>
                                )}
                                {selectedRequest.admin_note && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Admin Notes</p>
                                        <p className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-900 whitespace-pre-wrap font-mono text-xs">
                                            {selectedRequest.admin_note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <h4 className="text-lg font-semibold text-gray-800 mb-3 shrink-0">Requested Items</h4>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
                            <table className="min-w-full divide-y divide-gray-200 relative">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Item Number</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Item Description</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Quantity</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedRequest.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.itemNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{item.itemDescription}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.quantity}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{item.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </div>

                        <div className="flex justify-between shrink-0 pt-4 border-t border-gray-200 mt-auto">
                            <button onClick={() => handleDeleteRequest(selectedRequest.request_id)} className="px-6 py-2 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition font-medium shadow-sm">
                                Delete
                            </button>
                            <div className="flex space-x-3">
                                <button onClick={handleGenerateRequest} className="px-6 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium shadow-sm whitespace-nowrap">
                                    Print Form
                                </button>
                                <button onClick={closeModal} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-6xl mb-6 flex justify-between items-center mt-2">
                    <h2 className="text-2xl font-bold text-gray-800">My Requests</h2>
                </div>
                
                <div className="bg-white shadow-sm rounded-xl border border-gray-100 w-full max-w-6xl overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {loading ? (
                            <li className="px-6 py-10 text-center text-gray-500 font-medium">Loading requests...</li>
                        ) : requests.length > 0 ? (
                            requests.map((req) => (
                                <li key={req.request_id} className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleViewDetails(req)}>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-medium text-gray-900">{req.request_id} - {req.name}</span>
                                        <span className="text-sm text-gray-500">{req.dept} Department • {req.designation}</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500 hidden sm:block">{req.request_date}</span>
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(req.status)}`}>
                                            {req.status === 'Pending' ? 'Pending' : `Admin ${req.status}`}
                                        </span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-6 py-10 text-center text-gray-500 font-medium">No requests found.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

export default function AdminRequestScreen() {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [adminName, setAdminName] = useState('Admin');
    const [inventoryList, setInventoryList] = useState([]);

    useEffect(() => {
        fetchRequests();
        fetchAdminDetails();
        fetchInventory();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('requisition_issuance')
                .select('*')
                .order('request_date', { ascending: false });
            
            if (error) throw error;
            if (data) {
                setRequests(data);
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
        }
    };

    const fetchAdminDetails = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
            const extractedUsername = user.email.split('@')[0];
            if (extractedUsername === '19987975') setAdminName('Admin1');
            else if (extractedUsername === '19987941') setAdminName('Admin2');
            else setAdminName(extractedUsername);
        }
    };

    const fetchInventory = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory_procurement')
                .select('item_id, quantity_available');
            
            if (error) throw error;
            if (data) setInventoryList(data);
        } catch (err) {
            console.error("Error fetching inventory:", err);
        }
    };

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [adminNote, setAdminNote] = useState('');

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setRemarks('');
        setAdminNote('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    const handleDeleteRequest = async (requestId) => {
        window.showConfirm("Are you sure you want to delete this request?", "Delete Request", async () => {
            try {
                const requestToDelete = requests.find(r => r.request_id === requestId);

                const { error } = await supabase
                    .from('requisition_issuance')
                    .delete()
                    .eq('request_id', requestId);

                if (error) throw error;

                if (requestToDelete) {
                    await supabase.from('notifications').insert([{
                        target_user: requestToDelete.name,
                        message: `Your requisition request (${requestId}) has been deleted by an Admin.`
                    }]);
                }

                // Audit Log
                await logAudit(adminName, 'Delete Request', `Deleted request ${requestId} requested by ${requestToDelete ? requestToDelete.name : 'Unknown'}`);

                setRequests(prev => prev.filter(req => req.request_id !== requestId));
                closeModal();
                window.showAlert("Request deleted successfully!", "Success");
            } catch (error) {
                console.error('Error deleting request:', error);
                window.showAlert('Failed to delete request. Please try again.', 'Error');
            }
        });
    };

    const buildUpdatedText = (existingText, newText) => {
        if (!newText.trim()) return existingText || null;
        const timestamp = new Date().toLocaleString();
        const entry = `[${timestamp}] ${adminName}:\n${newText.trim()}`;
        return existingText ? `${existingText}\n\n${entry}` : entry;
    };

    const getStock = (itemNumber) => {
        if (!itemNumber) return 0;
        const id = parseInt(itemNumber.replace('ITM-', ''), 10);
        const invItem = inventoryList.find(i => i.item_id === id);
        return invItem ? invItem.quantity_available : 0;
    };

    const handleItemQuantityChange = (index, value) => {
        // Update the quantity directly in the selected request's item array
        const newItems = [...selectedRequest.items];
        newItems[index].quantity = value;
        setSelectedRequest(prev => ({ ...prev, items: newItems }));
    };

    const handleSaveNotes = async () => {
        const updatedRemarks = buildUpdatedText(selectedRequest.remarks, remarks);
        const updatedAdminNote = buildUpdatedText(selectedRequest.admin_note, adminNote);

        try {
            const { error } = await supabase
                .from('requisition_issuance')
                .update({ 
                    remarks: updatedRemarks,
                    admin_note: updatedAdminNote,
                    items: selectedRequest.items
                })
                .eq('request_id', selectedRequest.request_id);

            if (error) throw error;

            // Send notification to the staff member
            if (remarks.trim() || adminNote.trim()) {
                const { error: notifError } = await supabase.from('notifications').insert([{
                    target_user: selectedRequest.name,
                    message: `The admin left a note on your request (${selectedRequest.request_id}).`
                }]);
                if (notifError) console.error("Failed to send notification:", notifError);
            }

            setRequests(prev => prev.map(req => 
                req.request_id === selectedRequest.request_id ? { ...req, remarks: updatedRemarks, admin_note: updatedAdminNote, items: selectedRequest.items } : req
            ));
            
            // Audit Log
            await logAudit(adminName, 'Update Notes', `Updated notes for request ${selectedRequest.request_id}`);

            setSelectedRequest(prev => ({ ...prev, remarks: updatedRemarks, admin_note: updatedAdminNote }));
            setRemarks('');
            setAdminNote('');
            window.showAlert('Notes saved successfully!', 'Success');
        } catch (error) {
            console.error('Error saving notes:', error);
            window.showAlert(`Failed to save notes: ${error.message}`, 'Error');
        }
    };

    const updateStatus = async (newStatus) => {
        if (newStatus === 'Rejected' && !remarks.trim()) {
            window.showAlert('Please provide Remarks / Action Reason before rejecting this request.', 'Warning');
            return;
        }

        const updatedRemarks = buildUpdatedText(selectedRequest.remarks, remarks);
        const updatedAdminNote = buildUpdatedText(selectedRequest.admin_note, adminNote);

        try {
            const { error } = await supabase
                .from('requisition_issuance')
                .update({ 
                    status: newStatus,
                    remarks: updatedRemarks,
                    admin_note: updatedAdminNote,
                    items: selectedRequest.items
                })
                .eq('request_id', selectedRequest.request_id);

            if (error) throw error;

            // Deduct stock if Approved
            if (newStatus === 'Approved') {
                for (const item of selectedRequest.items) {
                    const id = parseInt(item.itemNumber.replace('ITM-', ''), 10);
                    const approvedQty = parseInt(item.quantity || 0, 10);

                    if (approvedQty > 0) {
                        const { data: invData, error: invError } = await supabase
                            .from('inventory_procurement')
                            .select('quantity_available')
                            .eq('item_id', id)
                            .single();
                        
                        if (!invError && invData) {
                            const newQuantity = Math.max(0, invData.quantity_available - approvedQty);
                            await supabase
                                .from('inventory_procurement')
                                .update({ quantity_available: newQuantity })
                                .eq('item_id', id);
                        }
                    }
                }
                fetchInventory(); // Refresh local stock so the UI stays up-to-date
            }

            // Instantly send a notification to the specific staff member
            const { error: notifError } = await supabase.from('notifications').insert([{
                target_user: selectedRequest.name,
                message: `Your requisition request (${selectedRequest.request_id}) has been ${newStatus}.`
            }]);
            if (notifError) console.error("Failed to send notification:", notifError);

            // Audit Log
            await logAudit(adminName, `Update Status: ${newStatus}`, `Updated request ${selectedRequest.request_id} to ${newStatus}`);

            setRequests(prev => prev.map(req => 
                req.request_id === selectedRequest.request_id ? { ...req, status: newStatus, remarks: updatedRemarks, admin_note: updatedAdminNote, items: selectedRequest.items } : req
            ));
            
            window.showAlert(`Request ${newStatus} successfully!`, 'Success');
            closeModal();
        } catch (error) {
            console.error('Error updating status:', error);
            window.showAlert(`Failed to update status: ${error.message}`, 'Error');
        }
    };

    const handleGenerateRequest = async () => {
        if (!selectedRequest) return;

        const printWindow = window.open('', '_blank');
        
        // Audit Log
        await logAudit(adminName, 'Generate Requisition', `Generated requisition form for ${selectedRequest.request_id}`);
        
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
            case 'Claimed':
                return 'bg-blue-50 text-blue-700 border-blue-100/80';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200/60';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Details Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-black text-slate-800">Requisition Details: <span className="text-indigo-600">{selectedRequest.request_id}</span></h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-3xl leading-none cursor-pointer">&times;</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-6">
                            {/* Requester Info Read-Only */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/50 shrink-0">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requester Name</p>
                                    <p className="font-bold text-slate-800 text-sm">{selectedRequest.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</p>
                                    <p className="font-bold text-slate-800 text-sm">{selectedRequest.designation}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                                    <p className="font-bold text-slate-800 text-sm">{selectedRequest.dept}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Request</p>
                                    <p className="font-bold text-slate-800 text-sm">{selectedRequest.request_date}</p>
                                </div>
                            </div>

                            {/* Remarks and Notes fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                                {/* Remarks Section */}
                                <div className="bg-white/40 border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Remarks History</h4>
                                    {selectedRequest.remarks ? (
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto mb-3 font-mono">
                                            {selectedRequest.remarks}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic mb-3">No previous remarks.</p>
                                    )}

                                    {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Approved') && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Add New Remark <span className="text-rose-500 font-normal ml-1">(Required for Rejection)</span></label>
                                            <textarea
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                                rows="2"
                                                placeholder="Why is this being approved or rejected?"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Admin Notes Section */}
                                <div className="bg-white/40 border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Admin Notes History</h4>
                                    {selectedRequest.admin_note ? (
                                        <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto mb-3 font-mono">
                                            {selectedRequest.admin_note}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic mb-3">No previous internal notes.</p>
                                    )}

                                    {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Approved') && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Add New Admin Note</label>
                                            <textarea
                                                value={adminNote}
                                                onChange={(e) => setAdminNote(e.target.value)}
                                                className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                                rows="2"
                                                placeholder="Any additional internal notes?"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items Table Read-Only */}
                            <div>
                                <h4 className="text-base font-bold text-slate-800 mb-3 shrink-0">Requested Items</h4>
                                <div className="overflow-x-auto border border-slate-100 rounded-2xl mb-6 bg-white/40">
                                    <table className="min-w-full divide-y divide-slate-100 relative">
                                        <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Item Number</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/3">Item Description</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">In Stock</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Approved Qty</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-slate-100">
                                            {selectedRequest.items.map((item, index) => {
                                                const inStock = getStock(item.itemNumber);
                                                const requestedQty = parseInt(item.quantity || 0, 10);
                                                const isLowStock = requestedQty > inStock;
                                                
                                                return (
                                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-slate-800 font-bold">{item.itemNumber}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">{item.itemDescription}</td>
                                                        <td className={`px-4 py-3 text-sm font-bold ${inStock === 0 ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                            {inStock}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                                                            {selectedRequest.status === 'Pending' ? (
                                                                <div className="flex flex-col">
                                                                    <input type="number" min="0" max={inStock} value={item.quantity} onChange={(e) => handleItemQuantityChange(index, e.target.value)} className={`w-24 px-2 py-1 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-slate-700 shadow-sm font-medium ${isLowStock ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200/60'}`} />
                                                                    {isLowStock && (
                                                                        <div className="mt-1 flex flex-col items-start gap-1">
                                                                            <span className="text-[10px] font-bold text-amber-600 leading-tight">Exceeds stock</span>
                                                                            <button type="button" onClick={() => handleItemQuantityChange(index, inStock)} className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg shadow-sm hover:bg-amber-100 transition-colors font-bold cursor-pointer">Set to Max</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                item.quantity
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-500">{item.unit}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-4 shrink-0 pt-4 border-t border-slate-100 mt-auto">
                            <div className="flex flex-wrap gap-2">
                                {selectedRequest.status === 'Pending' && (
                                    <>
                                        <button onClick={() => updateStatus('Approved')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Approve
                                        </button>
                                        <button onClick={() => updateStatus('Rejected')} className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Reject
                                        </button>
                                        <button onClick={handleSaveNotes} className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Save Notes
                                        </button>
                                    </>
                                )}
                                {selectedRequest.status === 'Approved' && (
                                    <>
                                        <button onClick={() => updateStatus('Claimed')} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Item Claimed
                                        </button>
                                        <button onClick={handleSaveNotes} className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Save Notes
                                        </button>
                                    </>
                                )}
                                <button onClick={() => handleDeleteRequest(selectedRequest.request_id)} className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition font-semibold text-sm shadow-sm cursor-pointer">
                                    Delete
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleGenerateRequest} className="px-5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-semibold text-sm shadow-sm cursor-pointer whitespace-nowrap">
                                    Print Form
                                </button>
                                <button onClick={closeModal} className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-700"></span>
                        Staff Requisitions
                    </h2>
                </header>
                
                <main className="flex-1 flex flex-col overflow-hidden p-6 lg:p-8 min-h-0">
                    <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 flex flex-col flex-1 min-h-0 overflow-y-auto">
                        <ul className="divide-y divide-slate-100">
                            {requests.map((req) => (
                                <li key={req.request_id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleViewDetails(req)}>
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-slate-800">{req.request_id} - {req.name}</span>
                                        <span className="text-xs font-semibold text-slate-400 mt-1">{req.dept} Department • {req.designation}</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-xs font-bold text-slate-400 hidden sm:block">{req.request_date}</span>
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusStyle(req.status)}`}>
                                            {req.status}
                                        </span>
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </main>
            </div>
        </div>
    );
}
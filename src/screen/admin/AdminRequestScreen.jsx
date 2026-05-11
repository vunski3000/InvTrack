import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';

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
        if (window.confirm("Are you sure you want to delete this request?")) {
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
                await supabase.from('audit_logs').insert([{
                    user_name: adminName,
                    action: 'Delete Request',
                    details: `Deleted request ${requestId} requested by ${requestToDelete ? requestToDelete.name : 'Unknown'}`
                }]);

                setRequests(prev => prev.filter(req => req.request_id !== requestId));
                closeModal();
                alert("Request deleted successfully!");
            } catch (error) {
                console.error('Error deleting request:', error);
                alert('Failed to delete request. Please try again.');
            }
        }
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

            setRequests(prev => prev.map(req => 
                req.request_id === selectedRequest.request_id ? { ...req, remarks: updatedRemarks, admin_note: updatedAdminNote, items: selectedRequest.items } : req
            ));
            
            // Audit Log
            await supabase.from('audit_logs').insert([{
                user_name: adminName,
                action: 'Update Notes',
                details: `Updated notes for request ${selectedRequest.request_id}`
            }]);

            setSelectedRequest(prev => ({ ...prev, remarks: updatedRemarks, admin_note: updatedAdminNote }));
            setRemarks('');
            setAdminNote('');
            alert('Notes saved successfully!');
        } catch (error) {
            console.error('Error saving notes:', error);
            alert(`Failed to save notes: ${error.message}`);
        }
    };

    const updateStatus = async (newStatus) => {
        if (newStatus === 'Rejected' && !remarks.trim()) {
            alert('Please provide Remarks / Action Reason before rejecting this request.');
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
            await supabase.from('audit_logs').insert([{
                user_name: adminName,
                action: `Update Status: ${newStatus}`,
                details: `Updated request ${selectedRequest.request_id} to ${newStatus}`
            }]);

            setRequests(prev => prev.map(req => 
                req.request_id === selectedRequest.request_id ? { ...req, status: newStatus, remarks: updatedRemarks, admin_note: updatedAdminNote, items: selectedRequest.items } : req
            ));
            
            alert(`Request ${newStatus} successfully!`);
            closeModal();
        } catch (error) {
            console.error('Error updating status:', error);
            alert(`Failed to update status: ${error.message}`);
        }
    };

    const handleGenerateRequest = () => {
        if (!selectedRequest) return;

        const printWindow = window.open('', '_blank');
        
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
            case 'Claimed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Details Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-800">Requisition Details: <span className="text-indigo-600">{selectedRequest.request_id}</span></h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                        {/* Requester Info Read-Only */}
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

                        {/* Remarks and Notes fields */}
                        <div className="flex flex-col space-y-6 mb-6 shrink-0">
                            {/* Remarks Section */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Remarks History</h4>
                                {selectedRequest.remarks ? (
                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-md text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto mb-3 font-mono">
                                        {selectedRequest.remarks}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic mb-3">No previous remarks.</p>
                                )}

                                {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Approved') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Add New Remark <span className="text-red-500 font-normal ml-1">(Required for Rejection)</span></label>
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            rows="2"
                                            placeholder="Why is this being approved or rejected?"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes Section */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Admin Notes History</h4>
                                {selectedRequest.admin_note ? (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto mb-3 font-mono">
                                        {selectedRequest.admin_note}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic mb-3">No previous internal notes.</p>
                                )}

                                {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Approved') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Add New Admin Note</label>
                                        <textarea
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            rows="2"
                                            placeholder="Any additional internal notes?"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items Table Read-Only */}
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 shrink-0">Requested Items</h4>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
                            <table className="min-w-full divide-y divide-gray-200 relative">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Item Number</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item Description</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">In Stock</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Approved Qty</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedRequest.items.map((item, index) => {
                                        const inStock = getStock(item.itemNumber);
                                        const requestedQty = parseInt(item.quantity || 0, 10);
                                        const isLowStock = requestedQty > inStock;
                                        
                                        return (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.itemNumber}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.itemDescription}</td>
                                                <td className={`px-4 py-3 text-sm font-bold ${inStock === 0 ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {inStock}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                    {selectedRequest.status === 'Pending' ? (
                                                        <div className="flex flex-col">
                                                            <input type="number" min="0" max={inStock} value={item.quantity} onChange={(e) => handleItemQuantityChange(index, e.target.value)} className={`w-20 p-1 border rounded-md text-sm shadow-sm ${isLowStock ? 'border-yellow-400 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                                                            {isLowStock && (
                                                                <div className="mt-1 flex flex-col items-start gap-1">
                                                                    <span className="text-xs text-yellow-600 leading-tight">Exceeds stock</span>
                                                                    <button type="button" onClick={() => handleItemQuantityChange(index, inStock)} className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded shadow-sm hover:bg-yellow-200 transition-colors">Set to Max</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        item.quantity
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{item.unit}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </div>

                        <div className="flex justify-between shrink-0 pt-4 border-t border-gray-200 mt-auto">
                            <div className="flex space-x-3">
                                {selectedRequest.status === 'Pending' && (
                                    <>
                                        <button onClick={() => updateStatus('Approved')} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium shadow-sm">
                                            Approve
                                        </button>
                                        <button onClick={() => updateStatus('Rejected')} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium shadow-sm">
                                            Reject
                                        </button>
                                        <button onClick={handleSaveNotes} className="px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition font-medium shadow-sm">
                                            Save Notes
                                        </button>
                                    </>
                                )}
                                {selectedRequest.status === 'Approved' && (
                                    <>
                                        <button onClick={() => updateStatus('Claimed')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium shadow-sm">
                                            Item Claimed
                                        </button>
                                        <button onClick={handleSaveNotes} className="px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition font-medium shadow-sm">
                                            Save Notes
                                        </button>
                                    </>
                                )}
                                <button onClick={() => handleDeleteRequest(selectedRequest.request_id)} className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition font-medium shadow-sm">
                                    Delete
                                </button>
                            </div>
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

            {/* Top Navigation */}
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-6xl mb-6 flex justify-between items-center mt-2">
                    <h2 className="text-2xl font-bold text-gray-800">Staff Requisitions</h2>
                </div>
                
                <div className="bg-white shadow-sm rounded-xl border border-gray-100 w-full max-w-6xl overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {requests.map((req) => (
                            <li key={req.request_id} className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleViewDetails(req)}>
                                <div className="flex flex-col">
                                    <span className="text-lg font-medium text-gray-900">{req.request_id} - {req.name}</span>
                                    <span className="text-sm text-gray-500">{req.dept} Department • {req.designation}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-500 hidden sm:block">{req.request_date}</span>
                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(req.status)}`}>
                                        {req.status}
                                    </span>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
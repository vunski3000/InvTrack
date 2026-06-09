import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Navigation from "./Navigation";
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

export default function PurchaseRequestScreen() {
    const navigate = useNavigate();
    
    // Form state
    const [requesterName, setRequesterName] = useState('');
    const [department, setDepartment] = useState('');
    const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
    const [activeTab, setActiveTab] = useState('create');
    const [inventoryList, setInventoryList] = useState([]);
    const [adminName, setAdminName] = useState('Admin');
    
    useEffect(() => {
        fetchInventory();
        fetchPurchaseRequests();
        fetchAdminDetails();
    }, []);

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
            const { data, error } = await supabase.from('inventory_procurement').select('*').order('item_id', { ascending: true });
            if (error) throw error;
            if (data) {
                setInventoryList(data);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
        }
    };

    const fetchPurchaseRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('purchase_requests')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                setPurchaseRequests(data);
            }
        } catch (err) {
            console.error("Error fetching purchase requests:", err);
        }
    };

    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingRequest, setIsEditingRequest] = useState(false);
    const [editForm, setEditForm] = useState(null);

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
        setIsEditingRequest(false);
        setEditForm(null);
    };

    const handleEditRequest = () => {
        setEditForm(JSON.parse(JSON.stringify(selectedRequest))); // Deep copy
        setIsEditingRequest(true);
    };

    const handleDeleteRequest = async () => {
        window.showConfirm(`Are you sure you want to delete purchase request ${selectedRequest.purchase_request_id}?`, "Delete Purchase Request", async () => {
            try {
                const { error } = await supabase
                    .from('purchase_requests')
                    .delete()
                    .eq('purchase_request_id', selectedRequest.purchase_request_id);

                if (error) throw error;

                // Audit Log
                await logAudit(adminName, 'Delete Purchase Request', `Deleted purchase request ${selectedRequest.purchase_request_id}`);

                setPurchaseRequests(prev => prev.filter(p => p.purchase_request_id !== selectedRequest.purchase_request_id));
                closeModal();
                alert('Purchase request deleted successfully.');
            } catch (error) {
                console.error('Error deleting request:', error);
                alert('Failed to delete request.');
            }
        });
    };

    const handleRequestAction = async (requestId, action) => {
        window.showConfirm(`Are you sure you want to mark this request as ${action}?`, "Confirm Action", async () => {
            try {
                const { error } = await supabase
                    .from('purchase_requests')
                    .update({ 
                        status: action,
                        approved_by: adminName 
                    })
                    .eq('purchase_request_id', requestId);

                if (error) throw error;
                
                setPurchaseRequests(prevRequests => 
                    prevRequests.map(req => 
                        req.purchase_request_id === requestId 
                            ? { ...req, status: action, approved_by: adminName } 
                            : req
                    )
                );

                // Add Notification
                const targetReq = purchaseRequests.find(r => r.purchase_request_id === requestId);
                if (targetReq) {
                    await supabase.from('notifications').insert([{
                        target_user: targetReq.requested_by,
                        message: `Your purchase request (${requestId}) has been ${action.toLowerCase()} by an Admin.`
                    }]);
                }

                // Audit Log
                await logAudit(adminName, 'Update Purchase Request Status', `Set purchase request ${requestId} to ${action}`);

                // Update selectedRequest if it's the one being modified
                if (selectedRequest && selectedRequest.purchase_request_id === requestId) {
                    setSelectedRequest(prev => ({ ...prev, status: action, approved_by: adminName }));
                }

                alert(`Request successfully ${action.toLowerCase()} by ${adminName}.`);
            } catch (err) {
                console.error('Error updating purchase request:', err);
                alert(`Failed to update the purchase request: ${err.message}`);
            }
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('purchase_requests')
                .update({
                    requesterName: editForm.requesterName,
                    department: editForm.department,
                    requestDate: editForm.requestDate,
                    items: editForm.items
                })
                .eq('purchase_request_id', editForm.purchase_request_id)
                .select();

            if (error) throw error;

            setPurchaseRequests(prev => prev.map(p => p.purchase_request_id === editForm.purchase_request_id ? data[0] : p));
            setSelectedRequest(data[0]);
            setIsEditingRequest(false);
            
            // Audit Log
            await logAudit(adminName, 'Edit Purchase Request', `Updated purchase request ${editForm.purchase_request_id}`);
            
            alert('Purchase request updated successfully!');
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Failed to update request.');
        }
    };

    const handleEditItemSelect = (index, selectedItemNumber) => {
        const newItems = [...editForm.items];
        newItems[index].itemNumber = selectedItemNumber;
        
        const selectedInventoryItem = inventoryList.find(i => `ITM-${String(i.item_id).padStart(4, '0')}` === selectedItemNumber);
        if (selectedInventoryItem) {
            newItems[index].itemDescription = selectedInventoryItem.description 
                ? `${selectedInventoryItem.item} - ${selectedInventoryItem.description}` 
                : selectedInventoryItem.item;
            newItems[index].unit = selectedInventoryItem.unit_name || selectedInventoryItem.unit || '';
        }
        
        setEditForm({ ...editForm, items: newItems });
    };

    const handleEditItemChange = (index, field, value) => {
        const newItems = [...editForm.items];
        newItems[index][field] = value;
        setEditForm({ ...editForm, items: newItems });
    };

    const handleAddEditItem = () => {
        setEditForm({ ...editForm, items: [...editForm.items, { itemNumber: '', itemDescription: '', quantity: '', unit: '' }] });
    };

    const handleRemoveEditItem = (index) => {
        const newItems = editForm.items.filter((_, i) => i !== index);
        setEditForm({ ...editForm, items: newItems });
    };

    const handleGeneratePR = async () => {
        if (!selectedRequest) return;

        const printWindow = window.open('', '_blank');
        
        // Audit Log
        await logAudit(adminName, 'Generate Purchase Request', `Generated purchase request form for ${selectedRequest.purchase_request_id}`);
        
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Purchase Request - ${selectedRequest.purchase_request_id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { text-align: center; color: #111; margin-bottom: 5px; }
                        h3 { text-align: center; color: #555; margin-top: 0; margin-bottom: 30px; font-weight: normal; }
                        .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .info-grid div { margin-bottom: 10px; }
                        .info-label { font-size: 0.85em; color: #777; text-transform: uppercase; margin-bottom: 3px; }
                        .info-value { font-weight: bold; font-size: 1.1em; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f9fafb; color: #555; }
                        .footer { margin-top: 40px; text-align: right; font-size: 0.9em; color: #666; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Purchase Request</h1>
                    <h3>${selectedRequest.purchase_request_id}</h3>
                    
                    <div class="info-grid">
                        <div>
                            <div class="info-label">Requester Name</div>
                            <div class="info-value">${selectedRequest.requesterName}</div>
                        </div>
                        <div>
                            <div class="info-label">Department</div>
                            <div class="info-value">${selectedRequest.department}</div>
                        </div>
                        <div>
                            <div class="info-label">Date of Request</div>
                            <div class="info-value">${selectedRequest.requestDate}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 20%">Item Number</th>
                                <th style="width: 50%">Item Description</th>
                                <th style="width: 15%">Quantity</th>
                                <th style="width: 15%">Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedRequest.items.length > 0 ? selectedRequest.items.map(item => `
                                <tr>
                                    <td>${item.itemNumber}</td>
                                    <td>${item.itemDescription}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.unit}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align: center">No items found</td></tr>'}
                        </tbody>
                    </table>
                    
                    ${selectedRequest.approved_by ? `
                    <div style="margin-top: 40px; text-align: right;">
                        <p style="color: #555; font-size: 0.85em; margin-bottom: 5px; text-transform: uppercase;">${selectedRequest.status === 'Rejected' ? 'Rejected By:' : 'Approved By:'}</p>
                        <div style="display: inline-block; min-width: 200px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold; text-transform: uppercase;">
                            ${selectedRequest.approved_by}
                        </div>
                    </div>
                    ` : ''}
                    
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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleItemSelect = (index, selectedItemNumber) => {
        const newItems = [...items];
        newItems[index].itemNumber = selectedItemNumber;
        
        const selectedInventoryItem = inventoryList.find(i => `ITM-${String(i.item_id).padStart(4, '0')}` === selectedItemNumber);
        if (selectedInventoryItem) {
            newItems[index].itemDescription = selectedInventoryItem.description 
                ? `${selectedInventoryItem.item} - ${selectedInventoryItem.description}` 
                : selectedInventoryItem.item;
            newItems[index].unit = selectedInventoryItem.unit_name || selectedInventoryItem.unit || '';
        }
        
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Dynamically query the database on submit to prevent duplicate ID errors
            const currentYear = new Date().getFullYear().toString();
            const { data: yearReqs, error: fetchError } = await supabase
                .from('purchase_requests')
                .select('purchase_request_id')
                .ilike('purchase_request_id', `PR-${currentYear}-%`);
            if (fetchError) throw fetchError;

            let nextNum = 1;
            if (yearReqs && yearReqs.length > 0) {
                const nums = yearReqs.map(p => {
                    const parts = p.purchase_request_id.split('-');
                    return parts.length >= 3 ? parseInt(parts[2], 10) : 0;
                }).filter(n => !isNaN(n));
                if (nums.length > 0) nextNum = Math.max(...nums) + 1;
            }
            const newId = `PR-${currentYear}-${String(nextNum).padStart(4, '0')}`;

            const newRequest = {
                purchase_request_id: newId,
                requesterName,
                department,
                requestDate,
                status: 'Pending',
                items
            };

            const { data, error } = await supabase
                .from('purchase_requests')
                .insert([newRequest])
                .select();

            if (error) throw error;
            
            // Audit Log
            await logAudit(adminName, 'Create Purchase Request', `Created new purchase request ${newId}`);

            alert('Purchase Request submitted successfully!');
            setPurchaseRequests(prev => [data[0], ...prev]);
            setRequesterName('');
            setDepartment('');
            setRequestDate(new Date().toISOString().split('T')[0]);
            setItems([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
            setActiveTab('list'); // Switch to the list tab after submitting
        } catch (error) {
            console.error('Error submitting purchase request:', error);
            alert('Failed to submit Purchase Request. Please check console for details.');
        }
    };

    const renderEditForm = () => (
        <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requester Name</label>
                    <input type="text" required value={editForm.requesterName} onChange={e => setEditForm({...editForm, requesterName: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Alice Johnson" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" required value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., HR" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Request</label>
                    <input type="date" required value={editForm.requestDate} onChange={e => setEditForm({...editForm, requestDate: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-800 mb-3 shrink-0">Requested Items</h4>
            <div className="overflow-x-auto overflow-y-auto flex-1 border border-gray-200 rounded-lg mb-4 min-h-0">
                <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Item Number</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Item Description</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Quantity</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-auto">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {editForm.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                <select
                                    required
                                    value={item.itemNumber}
                                    onChange={(e) => handleEditItemSelect(index, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="" disabled>Select Item</option>
                                    {inventoryList.map((invItem) => {
                                        const itemNum = `ITM-${String(invItem.item_id).padStart(4, '0')}`;
                                        return <option key={invItem.item_id} value={itemNum}>{itemNum} - {invItem.item}</option>;
                                    })}
                                </select>
                                </td>
                                <td className="px-4 py-3">
                                    <input type="text" required value={item.itemDescription} onChange={(e) => handleEditItemChange(index, 'itemDescription', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Description" />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="number" required min="1" value={item.quantity} onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Qty" />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="text" required value={item.unit} onChange={(e) => handleEditItemChange(index, 'unit', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Unit" />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button type="button" onClick={() => handleRemoveEditItem(index)} className="text-red-500 hover:text-red-700 transition-colors" title="Remove Item">
                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {editForm.items.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">No items added. Click "+ Add Row" to start.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-start mb-8 shrink-0">
                <button type="button" onClick={handleAddEditItem} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium text-sm shadow-sm">
                    + Add Row
                </button>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 shrink-0">
                <button type="button" onClick={() => setIsEditingRequest(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium shadow-sm">
                    Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                    Save Changes
                </button>
            </div>
        </form>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Details Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-800">{isEditingRequest ? `Edit Purchase Request: ${selectedRequest.purchase_request_id}` : <>Purchase Request Details: <span className="text-indigo-600">{selectedRequest.purchase_request_id}</span></>}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        {isEditingRequest && editForm ? renderEditForm() : (
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                {/* Requester Info Read-Only */}
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Requester Name</p>
                                        <p className="font-semibold text-gray-900">{selectedRequest.requesterName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                                        <p className="font-semibold text-gray-900">{selectedRequest.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Date of Request</p>
                                        <p className="font-semibold text-gray-900">{selectedRequest.requestDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                                        <p className="font-semibold text-gray-900"><span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(selectedRequest.status)}`}>{selectedRequest.status}</span></p>
                                    </div>
                                    {selectedRequest.approved_by && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Action By</p>
                                            <p className="font-semibold text-gray-900">{selectedRequest.approved_by}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Items Table Read-Only */}
                                <h4 className="text-base font-bold text-slate-800 mb-3 shrink-0">Requested Items</h4>
                                <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-100 rounded-2xl mb-6 min-h-0 bg-white/40">
                                    <table className="min-w-full divide-y divide-slate-100 relative">
                                        <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Item Number</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/2">Item Description</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Quantity</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-slate-100">
                                            {selectedRequest.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-slate-800 font-bold">{item.itemNumber}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 font-medium">{item.itemDescription}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-800 font-bold">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-slate-500">{item.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between gap-4 shrink-0 pt-4 border-t border-slate-100 mt-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRequest.status === 'Pending' && (
                                            <>
                                                <button onClick={() => handleRequestAction(selectedRequest.purchase_request_id, 'Approved')} className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                                                    Approve
                                                </button>
                                                <button onClick={() => handleRequestAction(selectedRequest.purchase_request_id, 'Rejected')} className="px-5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button onClick={handleEditRequest} className="px-5 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Edit
                                        </button>
                                        <button onClick={handleGeneratePR} className="px-5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-semibold text-sm shadow-sm whitespace-nowrap cursor-pointer">
                                            Generate Purchase Request
                                        </button>
                                        <button onClick={handleDeleteRequest} className="px-5 py-2 bg-white text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Delete
                                        </button>
                                    </div>
                                    <button onClick={closeModal} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm shadow-sm cursor-pointer">
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <Navigation />

            <div className="flex-1 flex overflow-hidden z-10">
                {/* Sidebar Tab */}
                <div className="w-64 bg-white/40 backdrop-blur-md border-r border-slate-200/60 p-4 flex flex-col gap-2 shrink-0 overflow-y-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('create')}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'create' ? 'bg-indigo-50 border border-indigo-100/80 text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        Create Purchase Request
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('list')}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'list' ? 'bg-indigo-50 border border-indigo-100/80 text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        Purchase Requests
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden min-h-0">
                    {activeTab === 'create' ? (
                        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 w-full max-w-5xl mx-auto flex flex-col flex-1 min-h-0 my-0">
                            <h2 className="text-xl font-black text-slate-800 mb-6 text-center shrink-0">Create Purchase Request</h2>
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-5">
                                
                                {/* Requester Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 shrink-0">
                                    <div>
                                        <label htmlFor="requesterName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Requester Name</label>
                                        <input
                                            type="text"
                                            id="requesterName"
                                            value={requesterName}
                                            onChange={(e) => setRequesterName(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="department" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                        <input
                                            type="text"
                                            id="department"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                            placeholder="e.g., HR, Finance"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="requestDate" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Request</label>
                                        <input
                                            type="date"
                                            id="requestDate"
                                            value={requestDate}
                                            onChange={(e) => setRequestDate(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 bg-slate-100 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-400 shadow-sm font-medium cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>
                                </div>
                            
                                {/* Dynamic Items Table */}
                                <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-100 rounded-2xl min-h-0 mt-0 bg-white/40 mb-4">
                                    <table className="min-w-full divide-y divide-slate-100 relative">
                                        <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Item Number</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-2/5">Item Description</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Quantity</th>
                                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Unit</th>
                                                <th scope="col" className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-slate-100">
                                            {items.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={item.itemNumber}
                                                            onChange={(e) => handleItemSelect(index, e.target.value)}
                                                            required
                                                            className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                                        >
                                                            <option value="" disabled>Select Item</option>
                                                            {inventoryList.map((invItem) => {
                                                                const itemNum = `ITM-${String(invItem.item_id).padStart(4, '0')}`;
                                                                return <option key={invItem.item_id} value={itemNum}>{itemNum} - {invItem.item}</option>;
                                                            })}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={item.itemDescription}
                                                            onChange={(e) => handleItemChange(index, 'itemDescription', e.target.value)}
                                                            required
                                                            className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                                            placeholder="Brief description"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                            required
                                                            min="1"
                                                            className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                                            placeholder="Qty"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={item.unit}
                                                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                            required
                                                            className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                                            placeholder="e.g. pcs, boxes"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                                                title="Remove Item"
                                                            >
                                                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            
                                {/* Actions */}
                                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-between shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="w-full sm:w-auto px-6 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-semibold text-sm shadow-sm cursor-pointer"
                                    >
                                        + Add Row
                                    </button>
                                    <button type="submit" className="w-full sm:w-auto px-8 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                                        Submit Purchase Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 w-full max-w-5xl mx-auto flex flex-col flex-1 min-h-0 my-0 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 shrink-0">
                                <h2 className="text-xl font-black text-slate-800 text-center">Purchase Requests</h2>
                            </div>
                            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                                <table className="min-w-full divide-y divide-slate-100 relative">
                                    <thead className="bg-slate-50/70 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID & Requester</th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-slate-100">
                                        {purchaseRequests.map((req) => (
                                            <tr key={req.purchase_request_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-slate-800">{req.purchase_request_id}</div>
                                                    <div className="text-xs font-semibold text-slate-400 mt-1">{req.requesterName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">{req.department}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">{req.requestDate}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusStyle(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                                                    <button type="button" onClick={() => handleViewDetails(req)} className="text-indigo-600 hover:text-indigo-900 font-bold mr-4 cursor-pointer">View Details</button>
                                                    {req.status === 'Pending' && (
                                                        <>
                                                            <button type="button" onClick={() => handleRequestAction(req.purchase_request_id, 'Approved')} className="text-emerald-600 hover:text-emerald-950 font-bold mr-4 cursor-pointer">Approve</button>
                                                            <button type="button" onClick={() => handleRequestAction(req.purchase_request_id, 'Rejected')} className="text-rose-600 hover:text-rose-950 font-bold cursor-pointer">Reject</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {purchaseRequests.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
                                                    No purchase requests found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
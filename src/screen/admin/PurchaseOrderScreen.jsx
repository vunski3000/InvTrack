import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';

export default function PurchaseOrderScreen() {
    const navigate = useNavigate();

    // Form state
    const [requesterName, setRequesterName] = useState('');
    const [department, setDepartment] = useState('');
    const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
    const [activeTab, setActiveTab] = useState('create');

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [inventoryList, setInventoryList] = useState([]);

    useEffect(() => {
        fetchInventory();
        fetchPurchaseOrders();
    }, []);

    const fetchPurchaseOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                setPurchaseOrders(data);
            }
        } catch (err) {
            console.error("Error fetching purchase orders:", err);
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

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingOrder, setIsEditingOrder] = useState(false);
    const [editForm, setEditForm] = useState(null);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
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

    const handleAddItem = () => {
        setItems([...items, { itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Generate a custom ID, e.g., PO-2026-1234
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newId = `PO-${new Date().getFullYear()}-${randomNum}`;
        
        const newOrder = {
            po_id: newId,
            requesterName,
            department,
            requestDate,
            status: 'Pending',
            items
        };

        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .insert([newOrder])
                .select();

            if (error) throw error;
            
            alert('Purchase Order created successfully!');
            setPurchaseOrders(prev => [data[0], ...prev]);
            setRequesterName('');
            setDepartment('');
            setRequestDate(new Date().toISOString().split('T')[0]);
            setItems([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
            setActiveTab('list'); // Switch to the list tab after submitting
        } catch (error) {
            console.error('Error submitting purchase order:', error);
            alert('Failed to create Purchase Order. Please check console for details.');
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setIsEditingOrder(false);
        setEditForm(null);
    };

    const handleEditOrder = () => {
        setEditForm(JSON.parse(JSON.stringify(selectedOrder))); // Deep copy
        setIsEditingOrder(true);
    };

    const handleDeleteOrder = async () => {
        if (window.confirm(`Are you sure you want to delete purchase order ${selectedOrder.id}?`)) {
            try {
                const { error } = await supabase
                    .from('purchase_orders')
                    .delete()
                    .eq('po_id', selectedOrder.po_id);

                if (error) throw error;

                setPurchaseOrders(prev => prev.filter(p => p.po_id !== selectedOrder.po_id));
                closeModal();
                alert('Purchase order deleted successfully.');
            } catch (error) {
                console.error('Error deleting order:', error);
                alert('Failed to delete order.');
            }
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .update({
                    requesterName: editForm.requesterName,
                    department: editForm.department,
                    requestDate: editForm.requestDate,
                    items: editForm.items
                })
                .eq('po_id', editForm.po_id)
                .select();

            if (error) throw error;

            setPurchaseOrders(prev => prev.map(p => p.po_id === editForm.po_id ? data[0] : p));
            setSelectedOrder(data[0]);
            setIsEditingOrder(false);
            alert('Purchase order updated successfully!');
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order.');
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

    const handleGeneratePO = () => {
        if (!selectedOrder) return;

        const printWindow = window.open('', '_blank');
        
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Purchase Order - ${selectedOrder.po_id}</title>
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
                    <h1>Purchase Order</h1>
                    <h3>${selectedOrder.po_id}</h3>
                    
                    <div class="info-grid">
                        <div>
                            <div class="info-label">Requester Name</div>
                            <div class="info-value">${selectedOrder.requesterName}</div>
                        </div>
                        <div>
                            <div class="info-label">Department</div>
                            <div class="info-value">${selectedOrder.department}</div>
                        </div>
                        <div>
                            <div class="info-label">Date of Request</div>
                            <div class="info-value">${selectedOrder.requestDate}</div>
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
                            ${selectedOrder.items.length > 0 ? selectedOrder.items.map(item => `
                                <tr>
                                    <td>${item.itemNumber}</td>
                                    <td>${item.itemDescription}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.unit}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align: center">No items found</td></tr>'}
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
                <button type="button" onClick={() => setIsEditingOrder(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium shadow-sm">
                    Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                    Save Changes
                </button>
            </div>
        </form>
    );

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
            {/* Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-800">{isEditingOrder ? `Edit Purchase Order: ${selectedOrder.po_id}` : <>Purchase Order Details: <span className="text-indigo-600">{selectedOrder.po_id}</span></>}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        {isEditingOrder && editForm ? renderEditForm() : (
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        {/* Requester Info Read-Only */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Requester Name</p>
                                <p className="font-semibold text-gray-900">{selectedOrder.requesterName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                                <p className="font-semibold text-gray-900">{selectedOrder.department}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Date of Request</p>
                                <p className="font-semibold text-gray-900">{selectedOrder.requestDate}</p>
                            </div>
                        </div>

                        {/* Items Table Read-Only */}
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 shrink-0">Requested Items</h4>
                        <div className="overflow-x-auto overflow-y-auto flex-1 border border-gray-200 rounded-lg mb-6 min-h-0">
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
                                    {selectedOrder.items.map((item, index) => (
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

                                <div className="flex justify-between items-center shrink-0 pt-4 border-t border-gray-200 mt-auto">
                                    <div className="flex gap-3">
                                        <button onClick={handleEditOrder} className="px-6 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition font-medium shadow-sm">
                                            Edit
                                        </button>
                                        <button onClick={handleGeneratePO} className="px-6 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium shadow-sm whitespace-nowrap">
                                            Generate Purchase Order
                                        </button>
                                        <button onClick={handleDeleteOrder} className="px-6 py-2 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition font-medium shadow-sm">
                                            Delete
                                        </button>
                                    </div>
                                    <button onClick={closeModal} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium shadow-sm">
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

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Tab */}
                <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-2 shrink-0 overflow-y-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('create')}
                        className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Create Purchase Order
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('list')}
                        className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Purchase Orders
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                    {activeTab === 'create' ? (
                        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-5xl mx-auto border border-gray-100 flex flex-col flex-1 min-h-0 my-0">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center shrink-0">Create Purchase Order</h2>
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-5">
                                
                                {/* Requester Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2 shrink-0">
                                    <div>
                                        <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700 mb-1">Requester Name</label>
                                        <input
                                            type="text"
                                            id="requesterName"
                                            value={requesterName}
                                            onChange={(e) => setRequesterName(e.target.value)}
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <input
                                            type="text"
                                            id="department"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="e.g., HR, Finance"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="requestDate" className="block text-sm font-medium text-gray-700 mb-1">Date of Request</label>
                                        <input
                                            type="date"
                                            id="requestDate"
                                            value={requestDate}
                                            onChange={(e) => setRequestDate(e.target.value)}
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                                            readOnly
                                        />
                                    </div>
                                </div>
                            
                                {/* Dynamic Items Table */}
                                <div className="overflow-x-auto overflow-y-auto flex-1 border border-gray-200 rounded-lg min-h-0 mt-0">
                                    <table className="min-w-full divide-y divide-gray-200 relative">
                                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Item Number</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Item Description</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Quantity</th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
                                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {items.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={item.itemNumber}
                                                            onChange={(e) => handleItemSelect(index, e.target.value)}
                                                            required
                                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                            placeholder="Qty"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={item.unit}
                                                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                            required
                                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                            placeholder="e.g. pcs, boxes"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="text-red-500 hover:text-red-700 transition-colors"
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
                                        className="w-full sm:w-auto px-6 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium shadow-sm"
                                    >
                                        + Add Row
                                    </button>
                                    <button type="submit" className="w-full sm:w-auto px-8 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                                        Submit Purchase Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-md w-full max-w-5xl mx-auto border border-gray-100 flex flex-col flex-1 min-h-0 my-0 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 shrink-0">
                                <h2 className="text-2xl font-bold text-gray-800 text-center">Purchase Orders</h2>
                            </div>
                            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                                <table className="min-w-full divide-y divide-gray-200 relative">
                                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID & Requester</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {purchaseOrders.map((order) => (
                                            <tr key={order.po_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{order.po_id}</div>
                                                    <div className="text-sm text-gray-500">{order.requesterName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.department}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.requestDate}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button type="button" onClick={() => handleViewDetails(order)} className="text-indigo-600 hover:text-indigo-900 font-medium">View Details</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {purchaseOrders.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 font-medium">
                                                    No purchase orders found.
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
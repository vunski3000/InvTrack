import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';

export default function PurchaseRequestScreen() {
    const navigate = useNavigate();
    
    // Form state
    const [requesterName, setRequesterName] = useState('');
    const [department, setDepartment] = useState('');
    const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
    
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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Purchase Request submitted:', { requesterName, department, requestDate, items });
        // TODO: Integrate actual purchase request logic here
        alert('Purchase Request submitted successfully!');
        setRequesterName('');
        setDepartment('');
        setRequestDate(new Date().toISOString().split('T')[0]);
        setItems([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Top Navigation */}
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-5xl mx-auto border border-gray-100 flex flex-col flex-1 min-h-0 my-0">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center shrink-0">Create Purchase Request</h2>
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
                                                <input
                                                    type="text"
                                                    value={item.itemNumber}
                                                    onChange={(e) => handleItemChange(index, 'itemNumber', e.target.value)}
                                                    required
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                    placeholder="SKU/No."
                                                />
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
                                Submit Purchase Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
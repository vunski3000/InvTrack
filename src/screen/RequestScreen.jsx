import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RequestScreen() {
    const navigate = useNavigate();
    const [procurementOpen, setProcurementOpen] = useState(false);
    const [department, setDepartment] = useState('');
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ itemNumber: '', itemDescription: '', quantity: '' }]);
    
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { itemNumber: '', itemDescription: '', quantity: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Requisition submitted:', { department, name, designation, requestDate, items });
        // TODO: Integrate actual requisition logic here
        alert('Item requested successfully!');
        setDepartment('');
        setName('');
        setDesignation('');
        setRequestDate(new Date().toISOString().split('T')[0]);
        setItems([{ itemNumber: '', itemDescription: '', quantity: '' }]);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Top Navigation */}
            <nav className="bg-indigo-700 text-white shadow-md z-10 shrink-0">
                <div className="flex items-center justify-between px-6 lg:px-8 h-16">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold tracking-tight mr-8">InvTrack</h1>
                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-2">
                                <span onClick={() => navigate('/dashboard')} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                                    Dashboard
                                </span>
                                <span onClick={() => navigate('/inventory')} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                                    Inventory
                                </span>
                                <div className="relative">
                                    <button onClick={() => setProcurementOpen(!procurementOpen)} onBlur={() => setTimeout(() => setProcurementOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                        Procurement
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {procurementOpen && (
                                        <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                                            <span onClick={() => navigate('/purchase-orders')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Purchase Orders</span>
                                            <span onClick={() => navigate('/request')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Requisition</span>
                                        </div>
                                    )}
                                </div>
                                <span className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                                    Settings
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button onClick={() => navigate('/login')} className="flex items-center px-3 py-2 text-indigo-100 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors text-sm font-medium">
                            <svg className="w-5 h-5 mr-2 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Log out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg border border-gray-100 my-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Request Item</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    id="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., IT, Sales"
                                />
                            </div>
                            <div>
                                <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input
                                    type="text"
                                    id="designation"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., Manager, Staff"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter your full name"
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
                        <hr className="my-2 border-t border-gray-200"/>
                        {items.map((item, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4 relative">
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                )}
                                <h3 className="font-semibold text-gray-700">Item {index + 1}</h3>
                                <div>
                                    <label htmlFor={`itemNumber-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Item Number</label>
                                    <input
                                        type="text"
                                        id={`itemNumber-${index}`}
                                        value={item.itemNumber}
                                        onChange={(e) => handleItemChange(index, 'itemNumber', e.target.value)}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        placeholder="Enter item number or SKU"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`itemDescription-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
                                    <textarea
                                        id={`itemDescription-${index}`}
                                        value={item.itemDescription}
                                        onChange={(e) => handleItemChange(index, 'itemDescription', e.target.value)}
                                        required
                                        rows={2}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        placeholder="Provide a brief description"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        id={`quantity-${index}`}
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        required
                                        min="1"
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        placeholder="Enter quantity needed"
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="pt-2">
                            <button 
                                type="button" 
                                onClick={handleAddItem} 
                                className="w-full bg-white border-2 border-dashed border-indigo-200 text-indigo-600 py-3 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition font-medium shadow-sm mb-4"
                            >
                                + Add Another Item
                            </button>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
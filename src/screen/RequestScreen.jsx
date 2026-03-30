import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RequestScreen() {
    const navigate = useNavigate();
    const [itemNumber, setItemNumber] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [quantity, setQuantity] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Requisition submitted:', { itemNumber, itemDescription, quantity });
        // TODO: Integrate actual requisition logic here
        alert('Item requested successfully!');
        setItemNumber('');
        setItemDescription('');
        setQuantity('');
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
                <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Request Item</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="itemNumber" className="block text-sm font-medium text-gray-700 mb-1">Item Number</label>
                            <input
                                type="text"
                                id="itemNumber"
                                value={itemNumber}
                                onChange={(e) => setItemNumber(e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter item number or SKU"
                            />
                        </div>
                        <div>
                            <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
                            <textarea
                                id="itemDescription"
                                value={itemDescription}
                                onChange={(e) => setItemDescription(e.target.value)}
                                required
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Provide a brief description"
                            />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                id="quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                                min="1"
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter quantity needed"
                            />
                        </div>
                        <div className="pt-2">
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
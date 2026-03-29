import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardScreen() {
    const navigate = useNavigate();

    // Mock data for inventory items
    const [inventory] = useState([
        { id: 1, name: 'Logitech Wireless Mouse', sku: 'WM-001', category: 'Electronics', quantity: 150, price: 25.99, status: 'In Stock' },
        { id: 2, name: 'Mechanical Keyboard v2', sku: 'MK-042', category: 'Electronics', quantity: 12, price: 89.99, status: 'Low Stock' },
        { id: 3, name: 'Ergonomic Office Chair', sku: 'OC-992', category: 'Furniture', quantity: 0, price: 199.99, status: 'Out of Stock' },
        { id: 4, name: 'Black Gel Pens (10 Pack)', sku: 'GP-110', category: 'Stationery', quantity: 85, price: 14.50, status: 'In Stock' },
        { id: 5, name: '27-inch 4K Monitor', sku: 'MN-4K27', category: 'Electronics', quantity: 8, price: 349.00, status: 'Low Stock' },
    ]);

    // Helper function to color-code status badges
    const getStatusStyle = (status) => {
        switch (status) {
            case 'In Stock':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Low Stock':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Out of Stock':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
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
                                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white transition-colors">
                                    Dashboard
                                </a>
                                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors">
                                    Inventory
                                </a>
                                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors">
                                    Settings
                                </a>
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
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Dashboard Overview</h2>
                    <div className="flex items-center space-x-4">
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                            + Add New Item
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 lg:p-8">
                    
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900">255</p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                                <p className="text-2xl font-bold text-gray-900">2</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Value</p>
                                <p className="text-2xl font-bold text-gray-900">$8,450.00</p>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Table Section */}
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Recent Inventory Items</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name & SKU</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {inventory.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                <div className="text-sm text-gray-500">{item.sku}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.category}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${item.price.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</a>
                                                <a href="#" className="text-red-600 hover:text-red-900">Delete</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
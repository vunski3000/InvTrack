import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function InventoryScreen() {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('inventory_procurement').select('*');
            if (error) throw error;
            setInventory(data || []);
        } catch (err) {
            console.error("Error fetching inventory:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleOpenEditModal = (item) => {
        setEditingItem({ ...item });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditingItem(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateItem = (e) => {
        e.preventDefault();
        // TODO: Also update the item in Supabase here before updating local state!
        setInventory(prevInventory =>
            prevInventory.map(item =>
                item.item_id === editingItem.item_id ? { ...editingItem, quantity_available: parseInt(editingItem.quantity_available, 10) || 0 } : item
            )
        );
        handleCloseEditModal();
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Filter logic
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const name = item.item || '';
            const description = item.description || '';
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            
            let derivedStatus = 'In Stock';
            if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
            else if (item.quantity_available < 10) derivedStatus = 'Low Stock';

            const matchesStatus = statusFilter === 'All' || derivedStatus === statusFilter;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [inventory, searchQuery, categoryFilter, statusFilter]);

    const [procurementOpen, setProcurementOpen] = useState(false);

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
            {/* Edit Item Modal */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Edit Item</h3>
                            <button onClick={handleCloseEditModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateItem} className="space-y-6">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={editingItem.category}
                                    onChange={handleEditFormChange}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option>Electronics</option>
                                    <option>Furniture</option>
                                    <option>Stationery</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                                <input
                                    type="number"
                                    id="quantity"
                                    name="quantity_available"
                                    value={editingItem.quantity_available || ''}
                                    onChange={handleEditFormChange}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                <span onClick={() => navigate('/inventory')} className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white transition-colors cursor-pointer">
                                    Inventory
                                </span>
                                <div className="relative">
                                    <button onClick={() => setProcurementOpen(!procurementOpen)} onBlur={() => setTimeout(() => setProcurementOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                        Procurement
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {procurementOpen && (
                                        <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                                        <span onMouseDown={() => navigate('/request')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Requisition</span>
                                        <span onMouseDown={() => navigate('/purchase-requests')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Purchase Requests</span>
                                        <span onMouseDown={() => navigate('/purchase-orders')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Purchase Orders</span>
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
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Complete Inventory</h2>
                    <div className="flex items-center space-x-4">
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                            + Add New Item
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 lg:p-8">
                    {/* Filters and Search Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="w-full sm:w-1/3">
                            <input 
                                type="text" 
                                placeholder="Search by item name or SKU..." 
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <select 
                                className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Stationery">Stationery</option>
                            </select>
                            <select 
                                className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>

                    {/* Inventory Table Section */}
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name & SKU</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                                Loading inventory...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-red-500">
                                                Error loading inventory: {error}
                                            </td>
                                        </tr>
                                    ) : filteredInventory.length > 0 ? filteredInventory.map((item) => {
                                        let derivedStatus = 'In Stock';
                                        if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
                                        else if (item.quantity_available < 10) derivedStatus = 'Low Stock';
                                        
                                        return (
                                        <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.item}</div>
                                                <div className="text-sm text-gray-500">{item.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {item.quantity_available} {item.unit || ''}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(derivedStatus)}`}>{derivedStatus}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <span onClick={() => handleOpenEditModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer">Edit</span>
                                                <span className="text-red-600 hover:text-red-900 cursor-pointer">Delete</span>
                                            </td>
                                        </tr>
                                    )}) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                                No items found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
import React, { useState, useMemo, useEffect } from 'react';
import StaffNavigation from './StaffNavigation';
import { supabase } from '../supabaseClient';

export default function StaffInventoryScreen() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchInventory();
        fetchCategories();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('inventory_procurement').select('*').order('item_id', { ascending: true });
            if (error) throw error;
            setInventory(data || []);
        } catch (err) {
            console.error("Error fetching inventory:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase.from('categories').select('*');
            if (error) throw error;
            if (data) {
                setCategories(data.map(d => d.name || d.Name || d.category || d.Category || d.category_name || Object.values(d).find(v => typeof v === 'string')).filter(Boolean));
            }
        } catch (err) {
            console.error("Error fetching categories:", err.message);
        }
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
            
            const itemCategory = item.category_name || item.category || '';
            const matchesCategory = categoryFilter === 'All' || itemCategory === categoryFilter;
            
            let derivedStatus = 'In Stock';
            if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
            else if (item.quantity_available < 10) derivedStatus = 'Low Stock';

            const matchesStatus = statusFilter === 'All' || derivedStatus === statusFilter;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [inventory, searchQuery, categoryFilter, statusFilter]);

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
            <StaffNavigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Inventory View</h2>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 p-6 lg:p-8 min-h-0">
                    {/* Filters and Search Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
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
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
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
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100 flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                            <table className="min-w-full divide-y divide-gray-200 relative">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Number & SKU</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name/Desription</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                                Loading inventory...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-red-500">
                                                Error loading inventory: {error}
                                            </td>
                                        </tr>
                                    ) : filteredInventory.length > 0 ? filteredInventory.map((item) => {
                                        let derivedStatus = 'In Stock';
                                        if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
                                        else if (item.quantity_available < 10) derivedStatus = 'Low Stock';
                                        
                                        return (
                                        <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{item.item_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.item}</div>
                                                <div className="text-sm text-gray-500">{item.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category_name || ''}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {item.quantity_available}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.unit_name || ''}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(derivedStatus)}`}>{derivedStatus}</span>
                                            </td>
                                        </tr>
                                    )}) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
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
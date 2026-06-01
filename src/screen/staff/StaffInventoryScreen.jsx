import React, { useState, useMemo, useEffect } from 'react';
import StaffNavigation from './StaffNavigation';
import { supabase } from '../../supabaseClient';

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
                return 'bg-emerald-50 text-emerald-700 border-emerald-100/80';
            case 'Low Stock':
                return 'bg-amber-50 text-amber-700 border-amber-100/80';
            case 'Out of Stock':
                return 'bg-rose-50 text-rose-700 border-rose-100/80';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200/60';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-200/40 via-fuchsia-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/30 via-pink-200/20 to-transparent blur-3xl pointer-events-none" />

            <StaffNavigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-purple-500 to-indigo-600"></span>
                        Inventory Catalogue
                    </h2>
                </header>
 
                <main className="flex-1 flex flex-col overflow-hidden p-6 lg:p-8 min-h-0">
                    {/* Filters and Search Bar */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                        <div className="w-full sm:w-1/3">
                            <input 
                                type="text" 
                                placeholder="Search by item name or SKU..." 
                                className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <select 
                                className="px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <select 
                                className="px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
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
                    <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                            <table className="min-w-full divide-y divide-slate-100 relative">
                                <thead className="bg-slate-50/70 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item ID & SKU</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Name & Description</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
                                                Loading catalogue inventory...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-rose-500 font-semibold text-sm">
                                                Error loading inventory: {error}
                                            </td>
                                        </tr>
                                    ) : filteredInventory.length > 0 ? filteredInventory.map((item) => {
                                        let derivedStatus = 'In Stock';
                                        if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
                                        else if (item.quantity_available < 10) derivedStatus = 'Low Stock';
                                        
                                        return (
                                        <tr key={item.item_id} className="hover:bg-purple-50/10 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-400 font-mono">
                                                ITM-{String(item.item_id).padStart(4, '0')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-700">{item.item}</div>
                                                <div className="text-xs font-semibold text-slate-400 mt-0.5">{item.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">{item.category_name || ''}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">
                                                {item.quantity_available}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-semibold">
                                                {item.unit_name || ''}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-lg border ${getStatusStyle(derivedStatus)}`}>{derivedStatus}</span>
                                            </td>
                                        </tr>
                                    )}) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
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
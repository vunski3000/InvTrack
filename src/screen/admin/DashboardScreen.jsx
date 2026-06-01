import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { logAudit } from '../../utils/auditLogger';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

export default function DashboardScreen() {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [adminName, setAdminName] = useState('Admin');

    useEffect(() => {
        fetchInventory();
        fetchCategories();
        fetchUnits();
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
            const { data, error } = await supabase.from('inventory_procurement').select('*').order('item_id', { ascending: false });
            if (error) throw error;
            setInventory(data || []);
        } catch (err) {
            console.error("Error fetching inventory:", err.message);
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

    const fetchUnits = async () => {
        try {
            const { data, error } = await supabase.from('units').select('*');
            if (error) throw error;
            if (data) {
                setUnits(data.map(d => d.name || d.Name || d.unit || d.Unit || Object.values(d).find(v => typeof v === 'string')).filter(Boolean));
            }
        } catch (err) {
            console.error("Error fetching units:", err.message);
        }
    };

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

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            const updatedQuantity = parseInt(editingItem.quantity_available, 10) || 0;

            const { error } = await supabase
                .from('inventory_procurement')
                .update({
                    category: editingItem.category || editingItem.category_name,
                    quantity_available: updatedQuantity,
                    unit: editingItem.unit || editingItem.unit_name
                })
                .eq('item_id', editingItem.item_id);

            if (error) throw error;

            // Audit Log
            await logAudit(adminName, 'Update Item', `Updated item ITM-${String(editingItem.item_id).padStart(4, '0')} (${editingItem.item})`);

            setInventory(prevInventory =>
                prevInventory.map(item =>
                    item.item_id === editingItem.item_id ? { ...editingItem, quantity_available: updatedQuantity } : item
                )
            );
            handleCloseEditModal();
        } catch (err) {
            console.error("Error updating item:", err.message);
            alert("Failed to update item.");
        }
    };

    const handleAddCategory = async () => {
        const newCategory = window.prompt("Enter new category name:");
        if (newCategory && newCategory.trim() !== '') {
            const upperCategory = newCategory.trim().toUpperCase();
            if (!categories.includes(upperCategory)) {
                try {
                    const { error } = await supabase.from('categories').insert([{ name: upperCategory }]);
                    if (error) throw error;
                    setCategories([...categories, upperCategory]);
                } catch (err) {
                    console.error("Error adding category:", err.message);
                    alert("Failed to add category.");
                    return;
                }
            }
            setEditingItem(prev => ({ ...prev, category: upperCategory, category_name: upperCategory }));
        }
    };

    const handleAddUnit = async () => {
        const newUnit = window.prompt("Enter new unit name:");
        if (newUnit && newUnit.trim() !== '') {
            const lowerUnit = newUnit.trim().toLowerCase();
            if (!units.includes(lowerUnit)) {
                try {
                    const { error } = await supabase.from('units').insert([{ name: lowerUnit }]);
                    if (error) throw error;
                    setUnits([...units, lowerUnit]);
                } catch (err) {
                    console.error("Error adding unit:", err.message);
                    alert("Failed to add unit.");
                    return;
                }
            }
            setEditingItem(prev => ({ ...prev, unit: lowerUnit, unit_name: lowerUnit }));
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                const itemToDelete = inventory.find(i => i.item_id === itemId);

                const { error } = await supabase
                    .from('inventory_procurement')
                    .delete()
                    .eq('item_id', itemId);
                if (error) throw error;
                
                // Audit Log
                await logAudit(adminName, 'Delete Item', `Deleted item ITM-${String(itemId).padStart(4, '0')} ${itemToDelete ? `(${itemToDelete.item})` : ''}`);

                setInventory(prev => prev.filter(item => item.item_id !== itemId));
            } catch (err) {
                console.error("Error deleting item:", err.message);
                alert("Failed to delete item: " + err.message);
            }
        }
    };

    const categoryCounts = inventory.reduce((acc, item) => {
        const cat = item.category_name || item.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const pieChartData = {
        labels: Object.keys(categoryCounts),
        datasets: [
            {
                label: '# of Items',
                data: Object.values(categoryCounts),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const value = context.raw;
                            const percentage = ((value / total) * 100).toFixed(2) + '%';
                            label += `${value} (${percentage})`;
                        }
                        return label;
                    }
                }
            }
        },
    };

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

    // Calculate KPIs
    const totalItems = inventory.reduce((sum, item) => sum + (parseInt(item.quantity_available, 10) || 0), 0);
    const lowStockAlerts = inventory.filter(item => {
        const qty = parseInt(item.quantity_available, 10) || 0;
        return qty > 0 && qty < 10;
    }).length;

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles for visual depth */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Edit Item Modal */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
                    <div className="bg-white/95 border border-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_-15px_rgba(99,102,241,0.15)] w-full max-w-md transform transition-all relative">
                        <button onClick={handleCloseEditModal} className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 cursor-pointer">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="mb-6">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Edit Inventory Item</h3>
                            <p className="text-slate-400 text-xs font-semibold mt-1">Modify category, stock quantity, and units for the selected item.</p>
                        </div>
                        <form onSubmit={handleUpdateItem} className="space-y-4">
                            <div>
                                <label htmlFor="category" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Category</label>
                                <div className="flex space-x-2">
                                    <select
                                        id="category"
                                        name="category"
                                        value={editingItem.category || editingItem.category_name || ''}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-semibold text-slate-800 cursor-pointer"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 border border-indigo-200 rounded-xl transition font-bold text-xs shadow-sm whitespace-nowrap cursor-pointer"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="quantity" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Stock Quantity Available</label>
                                <input
                                    type="number"
                                    id="quantity"
                                    name="quantity_available"
                                    value={editingItem.quantity_available || ''}
                                    onChange={handleEditFormChange}
                                    className="w-full px-4 py-2 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-semibold text-slate-800"
                                />
                            </div>
                            <div>
                                <label htmlFor="unit" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Measuring Unit</label>
                                <div className="flex space-x-2">
                                    <select
                                        id="unit"
                                        name="unit"
                                        value={editingItem.unit || editingItem.unit_name || ''}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-semibold text-slate-800 cursor-pointer"
                                    >
                                        <option value="" disabled>Select a unit</option>
                                        {units.map((u) => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddUnit}
                                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 border border-indigo-200 rounded-xl transition font-bold text-xs shadow-sm whitespace-nowrap cursor-pointer"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-slate-100">
                                <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-500 rounded-xl font-bold text-xs transition cursor-pointer">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-xl font-bold text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                {/* Top Header */}
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-indigo-500 to-purple-600"></span>
                        Admin Dashboard Overview
                    </h2>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
                    
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-indigo-300/40 transition-all duration-300 flex items-center group">
                            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mr-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Items</p>
                                <p className="text-3xl font-black text-slate-800">{totalItems}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-indigo-300/40 transition-all duration-300 flex items-center group">
                            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-600 mr-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Low Stock Alerts</p>
                                <p className="text-3xl font-black text-slate-800">{lowStockAlerts}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main content grid for table and chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Inventory Table Section */}
                        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 bg-white/40 flex justify-between items-center">
                                <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Recent Inventory Items
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Item Name & SKU</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white/40">
                                        {inventory.slice(0, 5).map((item) => {
                                            let derivedStatus = 'In Stock';
                                            if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
                                            else if (item.quantity_available < 10) derivedStatus = 'Low Stock';
                                            
                                            return (
                                            <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-slate-800">{item.item}</div>
                                                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                        ITM-{String(item.item_id).padStart(4, '0')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                                                    {item.category_name || item.category || ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">
                                                    {item.quantity_available}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-xl border ${getStatusStyle(derivedStatus)}`}>
                                                        {derivedStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold">
                                                    <span onClick={() => handleOpenEditModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer">Edit</span>
                                                    <span onClick={() => handleDeleteItem(item.item_id)} className="text-red-600 hover:text-red-900 cursor-pointer">Delete</span>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 p-6 flex flex-col">
                            <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                Items by Category
                            </h3>
                            <div className="relative h-56 flex justify-center w-full">
                                <Pie options={pieChartOptions} data={pieChartData} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
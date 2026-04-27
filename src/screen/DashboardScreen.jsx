import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { supabase } from '../supabaseClient';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

export default function DashboardScreen() {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);

    useEffect(() => {
        fetchInventory();
        fetchCategories();
        fetchUnits();
    }, []);

    const fetchInventory = async () => {
        try {
            const { data, error } = await supabase.from('inventory_procurement').select('*').order('item_id', { ascending: true });
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
                                <div className="flex space-x-2">
                                    <select
                                        id="category"
                                        name="category"
                                        value={editingItem.category || editingItem.category_name || ''}
                                        onChange={handleEditFormChange}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium text-sm shadow-sm whitespace-nowrap"
                                    >
                                        + Add
                                    </button>
                                </div>
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
                            <div>
                                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                <div className="flex space-x-2">
                                    <select
                                        id="unit"
                                        name="unit"
                                        value={editingItem.unit || editingItem.unit_name || ''}
                                        onChange={handleEditFormChange}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="" disabled>Select a unit</option>
                                        {units.map((u) => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddUnit}
                                        className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium text-sm shadow-sm whitespace-nowrap"
                                    >
                                        + Add
                                    </button>
                                </div>
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
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Dashboard Overview</h2>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 lg:p-8">
                    
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                                <p className="text-2xl font-bold text-gray-900">{lowStockAlerts}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main content grid for table and chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Inventory Table Section */}
                        <div className="lg:col-span-2 bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
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
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {inventory.slice(0, 5).map((item) => {
                                            let derivedStatus = 'In Stock';
                                            if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
                                            else if (item.quantity_available < 10) derivedStatus = 'Low Stock';
                                            
                                            return (
                                            <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.item}</div>
                                                    <div className="text-sm text-gray-500">{item.item_id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.category_name || item.category || ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {item.quantity_available}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(derivedStatus)}`}>
                                                        {derivedStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <span onClick={() => handleOpenEditModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer">Edit</span>
                                                    <span className="text-red-600 hover:text-red-900 cursor-pointer">Delete</span>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 flex flex-col">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Items by Category</h3>
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
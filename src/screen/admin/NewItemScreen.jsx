import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

export default function NewItemScreen() {
    const navigate = useNavigate();
    // Form state
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [adminName, setAdminName] = useState('Admin');
    
    useEffect(() => {
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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Fetch the current maximum item_id to determine the next ID
            const { data: maxData, error: maxError } = await supabase
                .from('inventory_procurement')
                .select('item_id')
                .order('item_id', { ascending: false })
                .limit(1);
                
            if (maxError) throw maxError;
            let nextId = (maxData && maxData.length > 0) ? maxData[0].item_id + 1 : 1;

            const { error: insertError } = await supabase
                .from('inventory_procurement')
                .insert([
                    {
                        item_id: nextId,
                        item: itemName,
                        description: description,
                        category: category,
                        quantity_available: parseInt(quantity, 10) || 0,
                        unit: unit
                    }
                ]);

            if (insertError) throw insertError;

            // Audit Log
            await logAudit(adminName, 'Add Item', `Added new item ITM-${String(nextId).padStart(4, '0')} (${itemName}) to inventory`);

            window.showAlert('Item added successfully!', 'Success', () => {
                navigate('/inventory');
            });
        } catch (err) {
            console.error("Error adding item:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
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
                    window.showAlert("Failed to add category.", "Error");
                    return;
                }
            }
            setCategory(upperCategory);
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
                    window.showAlert("Failed to add unit.", "Error");
                    return;
                }
            }
            setUnit(lowerUnit);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles for visual depth */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Top Navigation */}
            <Navigation />

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-700"></span>
                        Add New Inventory Item
                    </h2>
                    <button onClick={() => navigate('/inventory')} className="text-slate-500 hover:text-indigo-600 transition-colors font-semibold text-sm flex items-center group cursor-pointer">
                        <svg className="w-4 h-4 mr-1.5 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Inventory
                    </button>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 flex justify-center items-start">
                    <div className="w-full max-w-2xl bg-white/80 border border-slate-200/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-sm transition-all duration-300">
                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold flex items-center gap-2">
                                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label htmlFor="itemName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Item Name</label>
                                    <input
                                        type="text"
                                        id="itemName"
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-semibold text-slate-800"
                                        placeholder="e.g., Computer Mouse"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-semibold text-slate-800"
                                        placeholder="Provide a brief description of the item"
                                        rows="3"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="category" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                                        <div className="flex space-x-2">
                                            <select
                                                id="category"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-semibold text-slate-800 cursor-pointer"
                                            >
                                                <option value="" disabled>Select a category</option>
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
                                        <label htmlFor="quantity" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Quantity</label>
                                        <input
                                            type="number"
                                            id="quantity"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            required
                                            min="0"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-semibold text-slate-800"
                                            placeholder="e.g., 50"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label htmlFor="unit" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit of Measure</label>
                                        <div className="flex space-x-2">
                                            <select
                                                id="unit"
                                                value={unit}
                                                onChange={(e) => setUnit(e.target.value)}
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-semibold text-slate-800 cursor-pointer"
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
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => navigate('/inventory')}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-500 rounded-xl font-bold text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-xl font-bold text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Saving Item...' : 'Save Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';

export default function InventoryScreen() {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInventory();
        fetchCategories();
        fetchUnits();
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

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItems, setNewItems] = useState([{ item: '', description: '', category: '', quantity_available: '', unit: '' }]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);

    // PPMP Creation State
    const [isCreatingPPMP, setIsCreatingPPMP] = useState(false);
    const [selectedForPPMP, setSelectedForPPMP] = useState([]);
    const [isPPMPModalOpen, setIsPPMPModalOpen] = useState(false);
    const [ppmpForm, setPpmpForm] = useState({ name: '', department: '', year: new Date().getFullYear().toString() });
    const [isSubmittingPPMP, setIsSubmittingPPMP] = useState(false);

    // Stock Card Creation State
    const [isCreatingStockCard, setIsCreatingStockCard] = useState(false);
    const [selectedForStockCard, setSelectedForStockCard] = useState(null);
    const [isStockCardModalOpen, setIsStockCardModalOpen] = useState(false);

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

    const handleOpenAddModal = () => {
        setNewItems([{ item: '', description: '', category: '', quantity_available: '', unit: '' }]);
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleAddFormChange = (index, field, value) => {
        const updatedItems = [...newItems];
        updatedItems[index][field] = value;
        setNewItems(updatedItems);
    };

    const handleAddRow = () => {
        setNewItems([...newItems, { item: '', description: '', category: '', quantity_available: '', unit: '' }]);
    };

    const handleRemoveRow = (index) => {
        const updatedItems = newItems.filter((_, i) => i !== index);
        setNewItems(updatedItems);
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        if (newItems.length === 0) return;
        try {
            // Fetch the current maximum item_id to determine the next IDs
            const { data: maxData, error: maxError } = await supabase
                .from('inventory_procurement')
                .select('item_id')
                .order('item_id', { ascending: false })
                .limit(1);
                
            if (maxError) throw maxError;
            let nextId = (maxData && maxData.length > 0) ? maxData[0].item_id + 1 : 1;

            const itemsToInsert = newItems.map((item, index) => ({
                item_id: nextId + index,
                item: item.item,
                description: item.description,
                category_name: item.category,
                quantity_available: parseInt(item.quantity_available, 10) || 0,
                unit_name: item.unit
            }));

            const { error } = await supabase
                .from('inventory_procurement')
                .insert(itemsToInsert);

            if (error) throw error;

            await fetchInventory(); // Securely refresh the list from the database
            handleCloseAddModal();
        } catch (err) {
            console.error("Error creating item:", err.message);
            alert("Failed to create items: " + err.message);
        }
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            const updatedQuantity = parseInt(editingItem.quantity_available, 10) || 0;

            const { error } = await supabase
                .from('inventory_procurement')
                .update({
                    category_name: editingItem.category || editingItem.category_name,
                    quantity_available: updatedQuantity,
                    unit_name: editingItem.unit || editingItem.unit_name
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
            alert("Failed to update item: " + err.message);
        }
    };

    const handleAddCategory = async (index = null) => {
        const newCategory = window.prompt("Enter new category name:");
        if (newCategory && newCategory.trim() !== '') {
            const upperCategory = newCategory.trim().toUpperCase();
            
            const existingCat = categories.find(c => c.toUpperCase() === upperCategory);
            const finalCategory = existingCat || upperCategory;

            if (!existingCat) {
                try {
                    const { error } = await supabase.from('categories').insert([{ category_name: upperCategory }]);
                    if (error) {
                        console.warn("Note: Could not save category to DB:", error.message);
                        alert("Warning: Could not save category permanently.\nReason: " + error.message);
                    }
                } catch (err) {
                    console.error("Error adding category:", err.message);
                }
                setCategories(prev => [...prev, upperCategory]);
            }
            if (index !== null) {
                const updatedItems = [...newItems];
                updatedItems[index].category = finalCategory;
                setNewItems(updatedItems);
            } else {
                setEditingItem(prev => ({ ...prev, category: finalCategory, category_name: finalCategory }));
            }
        }
    };

    const handleAddUnit = async (index = null) => {
        const newUnit = window.prompt("Enter new unit name:");
        if (newUnit && newUnit.trim() !== '') {
            const lowerUnit = newUnit.trim().toLowerCase();
            
            const existingUnit = units.find(u => u.toLowerCase() === lowerUnit);
            const finalUnit = existingUnit || lowerUnit;

            if (!existingUnit) {
                try {
                    const { error } = await supabase.from('units').insert([{ unit_name: lowerUnit }]);
                    if (error) {
                        console.warn("Note: Could not save unit to DB:", error.message);
                        alert("Warning: Could not save unit permanently.\nReason: " + error.message);
                    }
                } catch (err) {
                    console.error("Error adding unit:", err.message);
                }
                setUnits(prev => [...prev, lowerUnit]);
            }
            if (index !== null) {
                const updatedItems = [...newItems];
                updatedItems[index].unit = finalUnit;
                setNewItems(updatedItems);
            } else {
                setEditingItem(prev => ({ ...prev, unit: finalUnit, unit_name: finalUnit }));
            }
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                const { error } = await supabase
                    .from('inventory_procurement')
                    .delete()
                    .eq('item_id', itemId);
                if (error) throw error;
                setInventory(prev => prev.filter(item => item.item_id !== itemId));
            } catch (err) {
                console.error("Error deleting item:", err.message);
                alert("Failed to delete item: " + err.message);
            }
        }
    };

    const handleTogglePPMPItem = (item) => {
        setSelectedForPPMP(prev => {
            const isSelected = prev.some(p => p.item_id === item.item_id);
            if (isSelected) {
                return prev.filter(p => p.item_id !== item.item_id);
            } else {
                return [...prev, item];
            }
        });
    };

    const handleCreatePPMP = async (e) => {
        e.preventDefault();
        setIsSubmittingPPMP(true);
        try {
            const { data: yearPpmps } = await supabase
                .from('ppmps')
                .select('ppmp_id')
                .ilike('ppmp_id', `PPMP-${ppmpForm.year}-%`);

            let nextNum = 1;
            if (yearPpmps && yearPpmps.length > 0) {
                const nums = yearPpmps.map(p => {
                    const parts = p.ppmp_id.split('-');
                    return parts.length >= 3 ? parseInt(parts[2], 10) : 0;
                }).filter(n => !isNaN(n));
                
                if (nums.length > 0) nextNum = Math.max(...nums) + 1;
            }
            const newId = `PPMP-${ppmpForm.year}-${String(nextNum).padStart(2, '0')}`;

            const mappedItems = selectedForPPMP.map(i => ({
                itemNumber: `ITM-${String(i.item_id).padStart(4, '0')}`,
                itemDescription: i.description ? `${i.item} - ${i.description}` : i.item,
                quantity: '1',
                maxQuantity: i.quantity_available,
                unit: i.unit_name || i.unit || ''
            }));

            const { error } = await supabase.from('ppmps').insert([{ ppmp_id: newId, name: ppmpForm.name, department: ppmpForm.department, year: ppmpForm.year, items: mappedItems }]);
            if (error) throw error;

            alert('PPMP created successfully!');
            setIsPPMPModalOpen(false);
            setIsCreatingPPMP(false);
            setSelectedForPPMP([]);
            setPpmpForm({ name: '', department: '', year: new Date().getFullYear().toString() });
        } catch (err) {
            console.error("Error creating PPMP:", err.message);
            alert("Failed to create PPMP: " + err.message);
        } finally {
            setIsSubmittingPPMP(false);
        }
    };

    const handleGenerateStockCard = () => {
        if (!selectedForStockCard) return;

        const printWindow = window.open('', '_blank');
        
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Stock Card - ITM-${String(selectedForStockCard.item_id).padStart(4, '0')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { text-align: center; color: #111; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f9fafb; width: 30%; color: #555; }
                        .footer { margin-top: 40px; text-align: right; font-size: 0.9em; color: #666; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Stock Card</h1>
                    <table>
                        <tr><th>Item ID</th><td>ITM-${String(selectedForStockCard.item_id).padStart(4, '0')}</td></tr>
                        <tr><th>Item Name</th><td>${selectedForStockCard.item}</td></tr>
                        <tr><th>Description</th><td>${selectedForStockCard.description || '-'}</td></tr>
                        <tr><th>Category</th><td>${selectedForStockCard.category_name || selectedForStockCard.category || '-'}</td></tr>
                        <tr><th>In Store Quantity</th><td>${selectedForStockCard.quantity_available} ${selectedForStockCard.unit_name || selectedForStockCard.unit || ''}</td></tr>
                    </table>
                    <div class="footer">
                        <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.onafterprint = () => printWindow.close();
            printWindow.print();
            setIsStockCardModalOpen(false);
            setIsCreatingStockCard(false);
            setSelectedForStockCard(null);
        }, 250);
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

    const handleToggleAllPPMPItems = () => {
        const availableItems = filteredInventory.filter(item => item.quantity_available > 0);

        const allSelected = availableItems.length > 0 && availableItems.every(item => 
            selectedForPPMP.some(p => p.item_id === item.item_id)
        );

        if (allSelected) {
            // Deselect all currently visible items
            setSelectedForPPMP(prev => 
                prev.filter(p => !availableItems.some(item => item.item_id === p.item_id))
            );
        } else {
            // Select all currently visible items
            setSelectedForPPMP(prev => {
                const newItems = availableItems.filter(item => !prev.some(p => p.item_id === item.item_id));
                return [...prev, ...newItems];
            });
        }
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
                                    <option value="" disabled>Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleAddCategory()}
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
                                        onClick={() => handleAddUnit()}
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

            {/* Add Item Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-800">Add New Items</h3>
                            <button onClick={handleCloseAddModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreateItem} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="overflow-x-auto overflow-y-auto flex-1 border border-gray-200 rounded-lg mb-4 min-h-0">
                                <table className="min-w-full divide-y divide-gray-200 relative">
                                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Item Name</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Description</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Category</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Initial Qty</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
                                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-auto">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {newItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <input type="text" required value={item.item} onChange={(e) => handleAddFormChange(index, 'item', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Item Name" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input type="text" value={item.description} onChange={(e) => handleAddFormChange(index, 'description', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Description" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex space-x-2">
                                                        <select required value={item.category} onChange={(e) => handleAddFormChange(index, 'category', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                                            <option value="" disabled>Category</option>
                                                            {categories.map((cat) => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                        <button type="button" onClick={() => handleAddCategory(index)} className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium text-sm shadow-sm whitespace-nowrap">+ Add</button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input type="number" required min="0" value={item.quantity_available} onChange={(e) => handleAddFormChange(index, 'quantity_available', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Qty" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex space-x-2">
                                                        <select required value={item.unit} onChange={(e) => handleAddFormChange(index, 'unit', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                                            <option value="" disabled>Unit</option>
                                                            {units.map((u) => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ))}
                                                        </select>
                                                        <button type="button" onClick={() => handleAddUnit(index)} className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium text-sm shadow-sm whitespace-nowrap">+ Add</button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button type="button" onClick={() => handleRemoveRow(index)} className="text-red-500 hover:text-red-700 transition-colors" title="Remove Item">
                                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {newItems.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">No items added. Click "+ Add Row" to start.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-start mb-4 shrink-0">
                                <button type="button" onClick={handleAddRow} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium text-sm shadow-sm">
                                    + Add Row
                                </button>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100 shrink-0">
                                <button type="button" onClick={handleCloseAddModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium shadow-sm">Cancel</button>
                                <button type="submit" disabled={newItems.length === 0} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Save Items</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create PPMP Modal */}
            {isPPMPModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">PPMP Details</h3>
                            <button onClick={() => setIsPPMPModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreatePPMP} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <input type="text" required value={ppmpForm.name} onChange={e => setPpmpForm({...ppmpForm, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., SMAW NC I" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input type="text" required value={ppmpForm.department} onChange={e => setPpmpForm({...ppmpForm, department: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Vocational" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <input type="text" required value={ppmpForm.year} onChange={e => setPpmpForm({...ppmpForm, year: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 2026" />
                            </div>
                            
                            <div className="bg-indigo-50 text-indigo-800 p-3 rounded-md text-sm border border-indigo-100">
                                <strong>{selectedForPPMP.length}</strong> items will be added to this PPMP.
                            </div>

                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100 mt-4">
                                <button type="button" onClick={() => setIsPPMPModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium shadow-sm">Back</button>
                                <button type="submit" disabled={isSubmittingPPMP} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm disabled:opacity-50">{isSubmittingPPMP ? 'Creating...' : 'Create PPMP'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Stock Card Modal */}
            {isStockCardModalOpen && selectedForStockCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Stock Card</h3>
                            <button onClick={() => setIsStockCardModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Item ID</p>
                                        <p className="font-semibold text-gray-900 font-mono">ITM-{String(selectedForStockCard.item_id).padStart(4, '0')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">In Store Quantity</p>
                                        <p className="font-semibold text-gray-900">{selectedForStockCard.quantity_available} {selectedForStockCard.unit_name || selectedForStockCard.unit || ''}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Item Name</p>
                                        <p className="font-semibold text-gray-900">{selectedForStockCard.item}</p>
                                    </div>
                                    {selectedForStockCard.description && (
                                        <div className="sm:col-span-2">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</p>
                                            <p className="text-gray-700">{selectedForStockCard.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => setIsStockCardModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium shadow-sm">Back</button>
                            <button type="button" onClick={handleGenerateStockCard} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">Generate Stock Card</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Complete Inventory</h2>
                    <div className="flex items-center space-x-4">
                        {isCreatingPPMP ? (
                            <>
                                <span className="text-sm font-medium text-gray-600 hidden sm:inline">{selectedForPPMP.length} selected</span>
                                <button onClick={() => { setIsCreatingPPMP(false); setSelectedForPPMP([]); }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={() => setIsPPMPModalOpen(true)} disabled={selectedForPPMP.length === 0} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
                                    Next: Set Details
                                </button>
                            </>
                        ) : isCreatingStockCard ? (
                            <>
                                <span className="text-sm font-medium text-gray-600 hidden sm:inline">{selectedForStockCard ? '1 selected' : 'Select an item'}</span>
                                <button onClick={() => { setIsCreatingStockCard(false); setSelectedForStockCard(null); }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={() => setIsStockCardModalOpen(true)} disabled={!selectedForStockCard} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
                                    Next: View Details
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsCreatingStockCard(true)} className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap">Create Stock Card</button>
                                <button onClick={() => setIsCreatingPPMP(true)} className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors shadow-sm">Create PPMP</button>
                                <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">+ Add New Item</button>
                            </>
                        )}
                    </div>
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
                                        {isCreatingPPMP && (
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 w-10">
                                                <input
                                                    type="checkbox"
                                                checked={filteredInventory.filter(i => i.quantity_available > 0).length > 0 && filteredInventory.filter(i => i.quantity_available > 0).every(item => selectedForPPMP.some(p => p.item_id === item.item_id))}
                                                    onChange={handleToggleAllPPMPItems}
                                                disabled={filteredInventory.filter(i => i.quantity_available > 0).length === 0}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Select All"
                                                />
                                            </th>
                                        )}
                                        {isCreatingStockCard && (
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 w-10">
                                                Select
                                            </th>
                                        )}
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Number & SKU</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name/Desription</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={isCreatingPPMP || isCreatingStockCard ? "8" : "7"} className="px-6 py-10 text-center text-gray-500">
                                                Loading inventory...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={isCreatingPPMP || isCreatingStockCard ? "8" : "7"} className="px-6 py-10 text-center text-red-500">
                                                Error loading inventory: {error}
                                            </td>
                                        </tr>
                                    ) : filteredInventory.length > 0 ? filteredInventory.map((item) => {
                                        let derivedStatus = 'In Stock';
                                        if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
                                        else if (item.quantity_available < 10) derivedStatus = 'Low Stock';
                                        
                                        return (
                                        <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                                            {isCreatingPPMP && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedForPPMP.some(p => p.item_id === item.item_id)}
                                                        onChange={() => handleTogglePPMPItem(item)}
                                                        disabled={item.quantity_available <= 0}
                                                        title={item.quantity_available <= 0 ? "Out of stock" : ""}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                            )}
                                            {isCreatingStockCard && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="radio"
                                                        name="stockCardSelection"
                                                        checked={selectedForStockCard?.item_id === item.item_id}
                                                        onChange={() => setSelectedForStockCard(item)}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                ITM-{String(item.item_id).padStart(4, '0')}
                                            </td>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <span onClick={() => handleOpenEditModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer">Edit</span>
                                                <span onClick={() => handleDeleteItem(item.item_id)} className="text-red-600 hover:text-red-900 cursor-pointer">Delete</span>
                                            </td>
                                        </tr>
                                    )}) : (
                                        <tr>
                                            <td colSpan={isCreatingPPMP || isCreatingStockCard ? "8" : "7"} className="px-6 py-10 text-center text-gray-500">
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
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

const PROXY_URL = 'http://localhost:3001';

export default function InventoryScreen() {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    const [nextItemId, setNextItemId] = useState(1);
    const [newItems, setNewItems] = useState([{ item: '', description: '', category: '', quantity_available: '', unit: '' }]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [editingCategoryName, setEditingCategoryName] = useState(null);
    const [renameInput, setRenameInput] = useState('');

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

    const handleOpenAddModal = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory_procurement')
                .select('item_id')
                .order('item_id', { ascending: false })
                .limit(1);
            if (error) throw error;
            const maxId = (data && data.length > 0) ? data[0].item_id : 0;
            setNextItemId(maxId + 1);
        } catch (err) {
            console.error("Error fetching max id:", err.message);
            setNextItemId(1);
        }
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
            // Re-fetch max id on submit just to make sure there are no duplicate key conflicts if others inserted
            const { data: maxData, error: maxError } = await supabase
                .from('inventory_procurement')
                .select('item_id')
                .order('item_id', { ascending: false })
                .limit(1);
                
            if (maxError) throw maxError;
            const currentMaxId = (maxData && maxData.length > 0) ? maxData[0].item_id : 0;
            const startId = Math.max(nextItemId, currentMaxId + 1);

            const itemsToInsert = newItems.map((item, index) => ({
                item_id: startId + index,
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

            // Audit Log
            await logAudit(adminName, 'Add Items', `Added ${itemsToInsert.length} new items to inventory`);

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
                        window.showAlert("Warning: Could not save category permanently.\nReason: " + error.message, "Warning");
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
            } else if (editingItem) {
                setEditingItem(prev => ({ ...prev, category: finalCategory, category_name: finalCategory }));
            }
        }
    };

    const handleAddNewCategorySubmit = async () => {
        if (!newCategoryInput || newCategoryInput.trim() === '') return;
        const upperCategory = newCategoryInput.trim().toUpperCase();

        const existingCat = categories.find(c => c.toUpperCase() === upperCategory);
        if (existingCat) {
            window.showAlert("A category with this name already exists.", "Validation Error");
            return;
        }

        try {
            const { error } = await supabase.from('categories').insert([{ category_name: upperCategory }]);
            if (error) throw error;
            
            // Log Audit
            await logAudit(adminName, 'Add Category', `Added category "${upperCategory}"`);

            setCategories(prev => [...prev, upperCategory]);
            setNewCategoryInput('');
        } catch (err) {
            console.error("Error adding category:", err.message);
            window.showAlert("Failed to add category: " + err.message, "Error");
        }
    };

    const handleRenameCategorySubmit = async (oldName) => {
        if (!renameInput || renameInput.trim() === '') {
            setEditingCategoryName(null);
            return;
        }

        // If the name is exactly the same (including case), just close editing
        if (renameInput.trim() === oldName) {
            setEditingCategoryName(null);
            return;
        }

        const formattedNewName = renameInput.trim().toUpperCase();
        const existingCat = categories.find(c => c.toUpperCase() === formattedNewName && c.toUpperCase() !== oldName.toUpperCase());
        if (existingCat) {
            window.showAlert("A category with this name already exists.", "Validation Error");
            return;
        }

        try {
            const response = await fetch(`${PROXY_URL}/api/categories/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ oldName, newName: formattedNewName })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }

            // Log Audit
            await logAudit(adminName, 'Rename Category', `Renamed category "${oldName}" to "${formattedNewName}"`);

            // Update local state (case-insensitive and trimmed for robustness)
            setCategories(prev => prev.map(c => c.trim().toUpperCase() === oldName.trim().toUpperCase() ? formattedNewName : c));
            setInventory(prev => prev.map(item => (item.category_name || '').trim().toUpperCase() === oldName.trim().toUpperCase() ? { ...item, category_name: formattedNewName } : item));
            
            // If the category filter was set to this category, update it
            if (categoryFilter.trim().toUpperCase() === oldName.trim().toUpperCase()) {
                setCategoryFilter(formattedNewName);
            }

            setEditingCategoryName(null);
        } catch (err) {
            console.error("Error renaming category:", err.message);
            window.showAlert("Failed to rename category: " + err.message, "Error");
        }
    };

    const handleDeleteCategory = async (categoryToDelete) => {
        const itemsCount = inventory.filter(item => (item.category_name || item.category) === categoryToDelete).length;
        
        let confirmMsg = `Are you sure you want to delete the category "${categoryToDelete}"?`;
        if (itemsCount > 0) {
            confirmMsg = `This category is currently used by ${itemsCount} item(s). Deleting it will leave these items uncategorized. Are you sure you want to proceed?`;
        }

        window.showConfirm(confirmMsg, "Delete Category", async () => {
            try {
                const response = await fetch(`${PROXY_URL}/api/categories/delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ categoryToDelete })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
                }

                // Log Audit
                await logAudit(adminName, 'Delete Category', `Deleted category "${categoryToDelete}"`);

                // Update local state
                setCategories(prev => prev.filter(c => c !== categoryToDelete));
                setInventory(prev => prev.map(item => item.category_name === categoryToDelete ? { ...item, category_name: null } : item));
                
                // If the category filter was set to this category, reset it
                if (categoryFilter === categoryToDelete) {
                    setCategoryFilter('All');
                }

                window.showAlert("Category deleted successfully.", "Success");
            } catch (err) {
                console.error("Error deleting category:", err.message);
                window.showAlert("Failed to delete category: " + err.message, "Error");
            }
        });
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
        window.showConfirm("Are you sure you want to delete this item?", "Delete Item", async () => {
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
        });
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

            // Audit Log
            await logAudit(adminName, 'Create PPMP', `Created new PPMP ${newId} (${ppmpForm.name})`);

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

    const handleGenerateStockCard = async () => {
        if (!selectedForStockCard) return;

        const printWindow = window.open('', '_blank');
        
                
        // Audit Log
        try {
            await supabase.from('audit_logs').insert([{
                user_name: adminName,
                action: 'Generate Stock Card',
                details: `Generated stock card for item ITM-${String(selectedForStockCard.item_id).padStart(4, '0')} (${selectedForStockCard.item})`
            }]);
        } catch (err) {
            console.error("Error logging stock card generation:", err.message);
        }
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
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Edit Item Modal */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Edit Item</h3>
                            <button onClick={handleCloseEditModal} className="text-slate-400 hover:text-slate-600 text-2xl leading-none cursor-pointer">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateItem} className="space-y-6">
                            <div>
                                <label htmlFor="category" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                                <div className="flex space-x-2">
                                    <select
                                        id="category"
                                        name="category"
                                        value={editingItem.category || editingItem.category_name || ''}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                    >
                                        <option value="" disabled>Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleAddCategory()}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-bold text-sm shadow-sm whitespace-nowrap cursor-pointer"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="quantity" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stock Quantity</label>
                                <input
                                    type="number"
                                    id="quantity"
                                    name="quantity_available"
                                    value={editingItem.quantity_available || ''}
                                    onChange={handleEditFormChange}
                                    className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                />
                            </div>
                            <div>
                                <label htmlFor="unit" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit</label>
                                <div className="flex space-x-2">
                                    <select
                                        id="unit"
                                        name="unit"
                                        value={editingItem.unit || editingItem.unit_name || ''}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                    >
                                        <option value="" disabled>Select a unit</option>
                                        {units.map((u) => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleAddUnit()}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-bold text-sm shadow-sm whitespace-nowrap cursor-pointer"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm cursor-pointer">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm cursor-pointer">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-black text-slate-800">Add New Items</h3>
                            <button onClick={handleCloseAddModal} className="text-slate-400 hover:text-slate-600 text-3xl leading-none cursor-pointer">&times;</button>
                        </div>
                        <form onSubmit={handleCreateItem} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-100 rounded-2xl mb-4 min-h-0 bg-white/40">
                                <table className="min-w-full divide-y divide-slate-100 relative">
                                    <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Item Number</th>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Item Name</th>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Description</th>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Category</th>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Initial Qty</th>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Unit</th>
                                            <th scope="col" className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-auto">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-slate-100">
                                        {newItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1.5 rounded-xl block text-center w-full shadow-sm">
                                                        ITM-{String(nextItemId + index).padStart(4, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input type="text" required value={item.item} onChange={(e) => handleAddFormChange(index, 'item', e.target.value)} className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="Item Name" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input type="text" value={item.description} onChange={(e) => handleAddFormChange(index, 'description', e.target.value)} className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="Description" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex space-x-2">
                                                        <select required value={item.category} onChange={(e) => handleAddFormChange(index, 'category', e.target.value)} className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer">
                                                            <option value="" disabled>Category</option>
                                                            {categories.map((cat) => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                        <button type="button" onClick={() => handleAddCategory(index)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-bold text-xs shadow-sm whitespace-nowrap cursor-pointer">+ Add</button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input type="number" required min="0" value={item.quantity_available} onChange={(e) => handleAddFormChange(index, 'quantity_available', e.target.value)} className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="Qty" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex space-x-2">
                                                        <select required value={item.unit} onChange={(e) => handleAddFormChange(index, 'unit', e.target.value)} className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer">
                                                            <option value="" disabled>Unit</option>
                                                            {units.map((u) => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ))}
                                                        </select>
                                                        <button type="button" onClick={() => handleAddUnit(index)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-bold text-xs shadow-sm whitespace-nowrap cursor-pointer">+ Add</button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button type="button" onClick={() => handleRemoveRow(index)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer" title="Remove Item">
                                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {newItems.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-6 text-center text-sm text-slate-400 font-semibold">No items added. Click "+ Add Row" to start.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-start mb-4 shrink-0">
                                <button type="button" onClick={handleAddRow} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-bold text-sm shadow-sm cursor-pointer">
                                    + Add Row
                                </button>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 shrink-0">
                                <button type="button" onClick={handleCloseAddModal} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm cursor-pointer shadow-sm">Cancel</button>
                                <button type="submit" disabled={newItems.length === 0} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">Save Items</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create PPMP Modal */}
            {isPPMPModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">PPMP Details</h3>
                            <button onClick={() => setIsPPMPModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none cursor-pointer">&times;</button>
                        </div>
                        <form onSubmit={handleCreatePPMP} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Name</label>
                                <input type="text" required value={ppmpForm.name} onChange={e => setPpmpForm({...ppmpForm, name: e.target.value})} className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="e.g., SMAW NC I" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                <input type="text" required value={ppmpForm.department} onChange={e => setPpmpForm({...ppmpForm, department: e.target.value})} className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="e.g., Vocational" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year</label>
                                <input type="text" required value={ppmpForm.year} onChange={e => setPpmpForm({...ppmpForm, year: e.target.value})} className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="e.g., 2026" />
                            </div>
                            
                            <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 p-4 rounded-xl text-sm font-medium">
                                <strong>{selectedForPPMP.length}</strong> items will be added to this PPMP.
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
                                <button type="button" onClick={() => setIsPPMPModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm cursor-pointer shadow-sm">Back</button>
                                <button type="submit" disabled={isSubmittingPPMP} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm disabled:opacity-50 cursor-pointer">{isSubmittingPPMP ? 'Creating...' : 'Create PPMP'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Stock Card Modal */}
            {isStockCardModalOpen && selectedForStockCard && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Stock Card</h3>
                            <button onClick={() => setIsStockCardModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none cursor-pointer">&times;</button>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item ID</p>
                                        <p className="font-bold text-slate-800 font-mono text-sm">ITM-{String(selectedForStockCard.item_id).padStart(4, '0')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">In Store Quantity</p>
                                        <p className="font-bold text-slate-800 text-sm">{selectedForStockCard.quantity_available} {selectedForStockCard.unit_name || selectedForStockCard.unit || ''}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name</p>
                                        <p className="font-bold text-slate-800 text-sm">{selectedForStockCard.item}</p>
                                    </div>
                                    {selectedForStockCard.description && (
                                        <div className="sm:col-span-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                                            <p className="text-slate-600 text-sm font-medium">{selectedForStockCard.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setIsStockCardModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm cursor-pointer shadow-sm">Back</button>
                            <button type="button" onClick={handleGenerateStockCard} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm cursor-pointer">Generate Stock Card</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Categories Modal */}
            {isManageCategoriesOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-black text-slate-800">Manage Categories</h3>
                            <button onClick={() => { setIsManageCategoriesOpen(false); setEditingCategoryName(null); }} className="text-slate-400 hover:text-slate-600 text-3xl leading-none cursor-pointer">&times;</button>
                        </div>

                        {/* Add New Category form inline */}
                        <div className="mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200/50 shrink-0">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Add New Category</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="e.g. ELECTRONICS"
                                    value={newCategoryInput}
                                    onChange={(e) => setNewCategoryInput(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold"
                                />
                                <button
                                    onClick={handleAddNewCategorySubmit}
                                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition font-semibold text-sm shadow-sm whitespace-nowrap cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* List of categories */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-6 min-h-0">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-white/95 py-1 z-10">Existing Categories</label>
                            {categories.length === 0 ? (
                                <p className="text-slate-400 text-center py-8 font-semibold text-sm">No categories found.</p>
                            ) : (
                                categories.map((cat) => (
                                    <div key={cat} className="flex justify-between items-center bg-slate-50/60 border border-slate-100 p-3.5 rounded-xl hover:bg-slate-100/40 transition">
                                        {editingCategoryName === cat ? (
                                            <div className="flex items-center space-x-2 w-full">
                                                <input
                                                    type="text"
                                                    value={renameInput}
                                                    onChange={(e) => setRenameInput(e.target.value)}
                                                    className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-bold text-slate-700"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleRenameCategorySubmit(cat)}
                                                    className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition font-bold text-xs cursor-pointer shadow-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingCategoryName(null)}
                                                    className="px-2.5 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg transition font-bold text-xs cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-bold text-slate-700 text-sm">{cat}</span>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategoryName(cat);
                                                            setRenameInput(cat);
                                                        }}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 rounded-lg transition font-bold text-xs cursor-pointer"
                                                    >
                                                        Rename
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat)}
                                                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100/80 rounded-lg transition font-bold text-xs cursor-pointer"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100 shrink-0">
                            <button
                                onClick={() => { setIsManageCategoriesOpen(false); setEditingCategoryName(null); }}
                                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm cursor-pointer shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-700"></span>
                        Complete Inventory
                    </h2>
                    <div className="flex items-center space-x-3">
                        {isCreatingPPMP ? (
                            <>
                                <span className="text-sm font-bold text-slate-500 hidden sm:inline">{selectedForPPMP.length} selected</span>
                                <button onClick={() => { setIsCreatingPPMP(false); setSelectedForPPMP([]); }} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-300 transition-colors shadow-sm cursor-pointer">
                                    Cancel
                                </button>
                                <button onClick={() => setIsPPMPModalOpen(true)} disabled={selectedForPPMP.length === 0} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                                    Next: Set Details
                                </button>
                            </>
                        ) : isCreatingStockCard ? (
                            <>
                                <span className="text-sm font-bold text-slate-500 hidden sm:inline">{selectedForStockCard ? '1 selected' : 'Select an item'}</span>
                                <button onClick={() => { setIsCreatingStockCard(false); setSelectedForStockCard(null); }} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-300 transition-colors shadow-sm cursor-pointer">
                                    Cancel
                                </button>
                                <button onClick={() => setIsStockCardModalOpen(true)} disabled={!selectedForStockCard} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                                    Next: View Details
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsManageCategoriesOpen(true)} className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer">Manage Categories</button>
                                <button onClick={() => setIsCreatingStockCard(true)} className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer">Create Stock Card</button>
                                <button onClick={() => setIsCreatingPPMP(true)} className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer">Create PPMP</button>
                                <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap cursor-pointer">+ Add New Item</button>
                            </>
                        )}
                    </div>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden p-6 lg:p-8 min-h-0">
                    {/* Filters and Search Bar */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                        <div className="w-full sm:w-1/3">
                            <input 
                                type="text" 
                                placeholder="Search by item name or SKU..." 
                                className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <select 
                                className="px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <select 
                                className="px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
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
                                        {isCreatingPPMP && (
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredInventory.filter(i => i.quantity_available > 0).length > 0 && filteredInventory.filter(i => i.quantity_available > 0).every(item => selectedForPPMP.some(p => p.item_id === item.item_id))}
                                                    onChange={handleToggleAllPPMPItems}
                                                    disabled={filteredInventory.filter(i => i.quantity_available > 0).length === 0}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-200 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Select All"
                                                />
                                            </th>
                                        )}
                                        {isCreatingStockCard && (
                                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 w-10">
                                                Select
                                            </th>
                                        )}
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item ID & SKU</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Name & Description</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={isCreatingPPMP || isCreatingStockCard ? "8" : "7"} className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
                                                Loading inventory...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={isCreatingPPMP || isCreatingStockCard ? "8" : "7"} className="px-6 py-12 text-center text-rose-500 font-semibold text-sm">
                                                Error loading inventory: {error}
                                            </td>
                                        </tr>
                                    ) : filteredInventory.length > 0 ? filteredInventory.map((item) => {
                                        let derivedStatus = 'In Stock';
                                        if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
                                        else if (item.quantity_available < 10) derivedStatus = 'Low Stock';
                                        
                                        return (
                                            <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors">
                                                {isCreatingPPMP && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedForPPMP.some(p => p.item_id === item.item_id)}
                                                            onChange={() => handleTogglePPMPItem(item)}
                                                            disabled={item.quantity_available <= 0}
                                                            title={item.quantity_available <= 0 ? "Out of stock" : ""}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-200 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-200 cursor-pointer"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                    ITM-{String(item.item_id).padStart(4, '0')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-slate-800">{item.item}</div>
                                                    <div className="text-xs font-semibold text-slate-400 mt-0.5">{item.description}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">{item.category_name || ''}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold">
                                                    {item.quantity_available}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                                                    {item.unit_name || ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusStyle(derivedStatus)}`}>{derivedStatus}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                                                    <span onClick={() => handleOpenEditModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer">Edit</span>
                                                    <span onClick={() => handleDeleteItem(item.item_id)} className="text-rose-600 hover:text-rose-900 cursor-pointer">Delete</span>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={isCreatingPPMP || isCreatingStockCard ? "8" : "7"} className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
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
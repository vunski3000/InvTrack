import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffNavigation from "./StaffNavigation";
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

export default function StaffPPMPScreen() {
    const navigate = useNavigate();

    const [ppmps, setPpmps] = useState([]);

    const [selectedPPMP, setSelectedPPMP] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingPPMP, setIsEditingPPMP] = useState(false);
    const [units, setUnits] = useState([]);
    const [ppmpForm, setPpmpForm] = useState({ name: '', department: '', year: '', items: [] });
    const [staffName, setStaffName] = useState('Staff');
    const [inventoryList, setInventoryList] = useState([]);

    const fetchInventory = async () => {
        try {
            const { data, error } = await supabase.from('inventory_procurement').select('*').order('item_id', { ascending: true });
            if (error) throw error;
            if (data) setInventoryList(data);
        } catch (err) {
            console.error("Error fetching inventory:", err.message);
        }
    };

    useEffect(() => {
        const fetchPPMPS = async () => {
            try {
                const { data, error } = await supabase.from('ppmps').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                setPpmps(data || []);
            } catch (err) {
                console.error("Error fetching PPMPs:", err.message);
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

        const fetchStaffDetails = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.email) {
                    const staffIdString = user.email.split('@')[0];
                    const staffIdNum = parseInt(staffIdString.replace('-', ''), 10);
                    const { data: personnel } = await supabase
                        .from('personnel')
                        .select('name')
                        .eq('personnel_id', staffIdNum)
                        .single();
                    if (personnel && personnel.name) setStaffName(personnel.name);
                    else setStaffName(staffIdString);
                }
            } catch (err) {
                console.error("Error fetching staff details:", err);
            }
        };

        fetchPPMPS();
        fetchUnits();
        fetchStaffDetails();
        fetchInventory();
    }, []);

    const handleViewDetails = (ppmp) => {
        setSelectedPPMP(ppmp);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPPMP(null);
        setIsEditingPPMP(false);
    };

    const syncNewItemsToInventory = async (items) => {
        const defaultCategory = 'General';

        try {
            const { data: existingCat } = await supabase.from('categories').select('*').ilike('category_name', defaultCategory);
            if (!existingCat || existingCat.length === 0) {
                await supabase.from('categories').insert([{ category_name: defaultCategory }]);
            }
        } catch (e) {
            console.warn("Could not check/create default category:", e.message);
        }

        // Fetch latest inventory from database
        const { data: latestInv, error: invErr } = await supabase.from('inventory_procurement').select('*');
        if (invErr) throw invErr;

        const newInventoryItemsMap = new Map();
        for (const item of items) {
            const parsedId = parseInt(item.itemNumber.replace('ITM-', ''), 10);
            if (!isNaN(parsedId)) {
                const exists = latestInv.find(inv => inv.item_id === parsedId);
                if (!exists && !newInventoryItemsMap.has(parsedId)) {
                    newInventoryItemsMap.set(parsedId, {
                        item_id: parsedId,
                        item: item.itemDescription,
                        category_name: defaultCategory,
                        quantity_available: 0,
                        unit_name: item.unit
                    });
                }
            }
        }
        const newInventoryItems = Array.from(newInventoryItemsMap.values());
        if (newInventoryItems.length > 0) {
            const { error } = await supabase.from('inventory_procurement').insert(newInventoryItems);
            if (error) throw error;
            await logAudit(staffName, 'Add Items', `Added ${newInventoryItems.length} new items to inventory from PPMP`);
            await fetchInventory();
        }
    };

    const handleEditPPMP = () => {
        setPpmpForm(JSON.parse(JSON.stringify(selectedPPMP)));
        setIsEditingPPMP(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            // Fetch latest inventory list from database to determine the absolute max item_id
            const { data: latestInv, error: invErr } = await supabase.from('inventory_procurement').select('item_id');
            if (invErr) throw invErr;
            
            let currentMaxId = 0;
            if (latestInv) {
                latestInv.forEach(item => {
                    if (item.item_id > currentMaxId) currentMaxId = item.item_id;
                });
            }

            // Map each item: if it is new, assign it the next sequential ID
            const updatedItems = ppmpForm.items.map(item => {
                const parsedId = parseInt(String(item.itemNumber).replace('ITM-', ''), 10);
                const exists = !isNaN(parsedId) && latestInv && latestInv.some(inv => inv.item_id === parsedId);
                
                if (!exists) {
                    currentMaxId += 1;
                    const newIdStr = `ITM-${String(currentMaxId).padStart(4, '0')}`;
                    return { ...item, itemNumber: newIdStr };
                }
                return item;
            });

            await syncNewItemsToInventory(updatedItems);

            const { error } = await supabase.from('ppmps').update({ items: updatedItems }).eq('ppmp_id', ppmpForm.ppmp_id);
            if (error) throw error;
            
            // Audit Log
            await logAudit(staffName, 'Edit PPMP', `Updated items for PPMP ${ppmpForm.ppmp_id} (${ppmpForm.name})`);

            const { data } = await supabase.from('ppmps').select('*').order('created_at', { ascending: false });
            if (data) setPpmps(data);
            
            setSelectedPPMP({ ...selectedPPMP, items: updatedItems });
            setIsEditingPPMP(false);
        } catch (err) {
            console.error("Error saving PPMP:", err.message);
            window.showAlert("Failed to save changes: " + err.message, "Error");
        }
    };

    const handleGeneratePPMP = () => {
        if (!selectedPPMP) return;

        const printWindow = window.open('', '_blank');
        
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>PPMP - ${selectedPPMP.ppmp_id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { text-align: center; color: #111; margin-bottom: 5px; }
                        h3 { text-align: center; color: #555; margin-top: 0; margin-bottom: 30px; font-weight: normal; }
                        .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .info-grid div { margin-bottom: 10px; }
                        .info-label { font-size: 0.85em; color: #777; text-transform: uppercase; margin-bottom: 3px; }
                        .info-value { font-weight: bold; font-size: 1.1em; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f9fafb; color: #555; }
                        .footer { margin-top: 40px; text-align: right; font-size: 0.9em; color: #666; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Project Procurement Monitoring Plan</h1>
                    <h3>${selectedPPMP.ppmp_id}</h3>
                    
                    <div class="info-grid">
                        <div>
                            <div class="info-label">Project Name</div>
                            <div class="info-value">${selectedPPMP.name}</div>
                        </div>
                        <div>
                            <div class="info-label">Department</div>
                            <div class="info-value">${selectedPPMP.department}</div>
                        </div>
                        <div>
                            <div class="info-label">Year</div>
                            <div class="info-value">${selectedPPMP.year}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 20%">Item Number</th>
                                <th style="width: 50%">Item Description</th>
                                <th style="width: 15%">Quantity</th>
                                <th style="width: 15%">Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedPPMP.items.length > 0 ? selectedPPMP.items.map(item => `
                                <tr>
                                    <td>${item.itemNumber}</td>
                                    <td>${item.itemDescription}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.unit}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align: center">No items found</td></tr>'}
                        </tbody>
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
        }, 250);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...ppmpForm.items];

        if (field === 'quantity' && newItems[index].maxQuantity !== undefined) {
            const max = parseInt(newItems[index].maxQuantity, 10);
            if (value !== '' && parseInt(value, 10) > max) {
                value = max.toString();
            }
        }

        newItems[index][field] = value;
        setPpmpForm({ ...ppmpForm, items: newItems });
    };

    const handleItemNumberChange = (index, value) => {
        const newItems = [...ppmpForm.items];
        newItems[index].itemNumber = value;

        // Auto-fill description and unit if we find a match
        const parsedId = parseInt(value.replace('ITM-', ''), 10);
        if (!isNaN(parsedId)) {
            const matched = inventoryList.find(inv => inv.item_id === parsedId);
            if (matched) {
                newItems[index].itemDescription = matched.item || '';
                const matchedUnit = (matched.unit_name || matched.unit || '').toLowerCase();
                newItems[index].unit = matchedUnit;
                if (matchedUnit && !units.includes(matchedUnit)) {
                    setUnits(prev => [...prev, matchedUnit]);
                }
            }
        }
        setPpmpForm({ ...ppmpForm, items: newItems });
    };

    const handleAddItem = () => {
        let maxId = 0;
        inventoryList.forEach(item => {
            if (item.item_id > maxId) maxId = item.item_id;
        });
        ppmpForm.items.forEach(item => {
            if (item.itemNumber && item.itemNumber.startsWith('ITM-')) {
                const num = parseInt(item.itemNumber.replace('ITM-', ''), 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        });
        const nextSku = `ITM-${String(maxId + 1).padStart(4, '0')}`;
        
        setPpmpForm({ ...ppmpForm, items: [...ppmpForm.items, { itemNumber: nextSku, itemDescription: '', quantity: '', unit: '' }] });
    };

    const handleRemoveItem = (index) => {
        const newItems = ppmpForm.items.filter((_, i) => i !== index);
        setPpmpForm({ ...ppmpForm, items: newItems });
    };

    const handleAddUnit = async (index) => {
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
            handleItemChange(index, 'unit', lowerUnit);
        }
    };

    const renderPPMPForm = () => (
        <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 shrink-0">
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
                    <input type="text" readOnly value={ppmpForm.name} className="w-full px-3 py-2 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 cursor-not-allowed font-medium text-xs shadow-inner" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <input type="text" readOnly value={ppmpForm.department} className="w-full px-3 py-2 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 cursor-not-allowed font-medium text-xs shadow-inner" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year</label>
                    <input type="text" readOnly value={ppmpForm.year} className="w-full px-3 py-2 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 cursor-not-allowed font-medium text-xs shadow-inner" />
                </div>
            </div>

            <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Plan Procurement Items</h4>
                <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-200/60 rounded-xl mb-4 min-h-0 shadow-sm max-h-[40vh] bg-white/40">
                    <table className="min-w-full divide-y divide-slate-100 relative">
                        <thead className="bg-slate-50/70 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Item Number</th>
                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-2/5">Item Description</th>
                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Quantity</th>
                                <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Unit</th>
                                <th scope="col" className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-auto">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-slate-100">
                            {ppmpForm.items.map((item, index) => (
                                <tr key={index} className="hover:bg-purple-50/10 transition-colors">
                                    <td className="px-4 py-3 relative">
                                        <input 
                                            type="text" 
                                            required 
                                            list={`inventory-items-${index}`}
                                            value={item.itemNumber} 
                                            onChange={(e) => handleItemNumberChange(index, e.target.value)} 
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-xs transition-all text-slate-700 shadow-sm font-bold" 
                                            placeholder="SKU/No." 
                                        />
                                        <datalist id={`inventory-items-${index}`}>
                                            {inventoryList.map(inv => {
                                                const sku = `ITM-${String(inv.item_id).padStart(4, '0')}`;
                                                return (
                                                    <option key={inv.item_id} value={sku}>
                                                        {inv.item}
                                                    </option>
                                                );
                                            })}
                                        </datalist>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input type="text" required value={item.itemDescription} onChange={(e) => handleItemChange(index, 'itemDescription', e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-xs transition-all text-slate-700 shadow-sm" placeholder="Description" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input type="number" required min="1" max={item.maxQuantity || undefined} value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-xs transition-all text-slate-700 shadow-sm font-bold" placeholder="Qty" />
                                        {item.maxQuantity !== undefined && <div className="text-[10px] text-slate-400 mt-1 font-bold">Max: {item.maxQuantity}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex space-x-2">
                                            <select
                                                required
                                                value={item.unit}
                                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-xs transition-all text-slate-700 shadow-sm cursor-pointer"
                                            >
                                                <option value="" disabled>Unit</option>
                                                {units.map((u) => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleAddUnit(index)}
                                                className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition font-bold text-[10px] shadow-sm whitespace-nowrap cursor-pointer"
                                            >+ Add</button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all cursor-pointer" title="Remove Item">
                                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {ppmpForm.items.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-6 text-center text-xs text-slate-400 font-semibold">No items added. Click "+ Add Row" to start.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-start mb-6 shrink-0">
                <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition font-bold text-xs shadow-sm cursor-pointer">
                    + Add Row
                </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsEditingPPMP(false)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-bold shadow-sm text-xs cursor-pointer">
                    Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-bold shadow-sm text-xs cursor-pointer">
                    Save Changes
                </button>
            </div>
        </form>
    );
 
    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-200/40 via-fuchsia-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/30 via-pink-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Details Modal */}
            {isModalOpen && selectedPPMP && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden transform scale-100 transition-all duration-300">
                        <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
                            <h3 className="text-xl font-black text-slate-800">{isEditingPPMP ? `Edit PPMP: ${selectedPPMP.ppmp_id}` : 'PPMP Plan Details'}</h3>
                            <button onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all text-xl font-bold cursor-pointer">&times;</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 min-h-0">
                            {isEditingPPMP ? renderPPMPForm() : (
                                <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 shrink-0">
                                        <div className="col-span-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Project Name</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedPPMP.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedPPMP.department}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Year</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedPPMP.year}</p>
                                        </div>
                                    </div>
 
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Planned Procurement Items</h4>
                                    {selectedPPMP.items.length > 0 ? (
                                        <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-200/60 rounded-xl mb-6 min-h-0 shadow-sm bg-white/40 max-h-[45vh]">
                                            <table className="min-w-full divide-y divide-slate-100 relative">
                                                <thead className="bg-slate-50/70 sticky top-0 z-10 shadow-sm">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Item Number</th>
                                                        <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/2">Item Description</th>
                                                        <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Quantity</th>
                                                        <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Unit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-transparent divide-y divide-slate-100">
                                                    {selectedPPMP.items.map((item, index) => (
                                                        <tr key={index} className="hover:bg-purple-50/10 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-bold text-slate-700 font-mono">{item.itemNumber}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600">{item.itemDescription}</td>
                                                            <td className="px-4 py-3 text-sm font-bold text-slate-700">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-400 font-semibold">{item.unit}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-8 text-center mb-6 shrink-0">
                                            <p className="text-slate-400 font-semibold text-xs">No items mapped in this PPMP yet.</p>
                                        </div>
                                    )}
 
                                    <div className="flex justify-between items-center shrink-0 mt-auto pt-4 border-t border-slate-100 bg-slate-50/30 p-6 -mx-6 -mb-6 rounded-b-2xl">
                                        <div className="flex space-x-3">
                                            <button onClick={handleEditPPMP} className="px-5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition font-bold shadow-sm text-xs cursor-pointer">
                                                Edit Plan
                                            </button>
                                            <button onClick={handleGeneratePPMP} className="px-5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition font-bold shadow-sm text-xs whitespace-nowrap cursor-pointer">
                                                Generate PPMP
                                            </button>
                                        </div>
                                        <button onClick={closeModal} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition font-bold shadow-sm text-xs cursor-pointer">
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
 
            {/* Top Navigation */}
            <StaffNavigation />
 
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-purple-500 to-indigo-600"></span>
                        Project Procurement Monitoring Plan (PPMP)
                    </h2>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 flex flex-col items-center">
                    <div className="w-full max-w-5xl">
                        <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 overflow-hidden">
                            <ul className="divide-y divide-slate-100">
                                {ppmps.map((ppmp) => (
                                    <li key={ppmp.ppmp_id} className="px-6 py-5 hover:bg-purple-50/10 transition-all cursor-pointer flex justify-between items-center group" onClick={() => handleViewDetails(ppmp)}>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-base font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{ppmp.name}</span>
                                            <span className="text-xs font-semibold text-slate-400 flex flex-wrap items-center gap-1.5">
                                                <span>ID: {ppmp.ppmp_id}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>Year: {ppmp.year}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>Dept: {ppmp.department}</span>
                                            </span>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path></svg>
                                    </li>
                                ))}
                                {ppmps.length === 0 && (
                                    <li className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">No PPMP plans found.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
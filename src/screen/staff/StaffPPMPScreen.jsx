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
        const defaultCategory = 'General'; // Ensure this matches your preferred default category

        // Ensure the default category exists to prevent foreign key constraint errors
        try {
            const { data: existingCat } = await supabase.from('categories').select('*').ilike('category_name', defaultCategory);
            if (!existingCat || existingCat.length === 0) {
                await supabase.from('categories').insert([{ category_name: defaultCategory }]);
            }
        } catch (e) {
            console.warn("Could not check/create default category:", e.message);
        }

        const newInventoryItemsMap = new Map();
        for (const item of items) {
            const parsedId = parseInt(item.itemNumber.replace('ITM-', ''), 10);
            if (!isNaN(parsedId)) {
                const exists = inventoryList.find(inv => inv.item_id === parsedId);
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
        setPpmpForm(JSON.parse(JSON.stringify(selectedPPMP))); // Deep copy for editing
        setIsEditingPPMP(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await syncNewItemsToInventory(ppmpForm.items);

            const { error } = await supabase.from('ppmps').update({ items: ppmpForm.items }).eq('ppmp_id', ppmpForm.ppmp_id);
            if (error) throw error;
            
            // Audit Log
            await logAudit(staffName, 'Edit PPMP', `Updated items for PPMP ${ppmpForm.ppmp_id} (${ppmpForm.name})`);

            const { data } = await supabase.from('ppmps').select('*').order('created_at', { ascending: false });
            if (data) setPpmps(data);
            
            setSelectedPPMP(ppmpForm);
            setIsEditingPPMP(false);
        } catch (err) {
            console.error("Error saving PPMP:", err.message);
            alert("Failed to save changes: " + err.message);
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
                    <h1>Project Procurement Management Plan</h1>
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
                value = max.toString(); // Clamp to the maximum available stock
            }
        }

        newItems[index][field] = value;
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
                    alert("Failed to add unit.");
                    return;
                }
            }
            handleItemChange(index, 'unit', lowerUnit);
        }
    };

    const renderPPMPForm = () => (
        <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input type="text" readOnly value={ppmpForm.name} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" readOnly value={ppmpForm.department} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input type="text" readOnly value={ppmpForm.year} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-800 mb-3 shrink-0">Requested Items</h4>
            <div className="overflow-x-auto overflow-y-auto flex-1 border border-gray-200 rounded-lg mb-4 min-h-0">
                <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Item Number</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Item Description</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Quantity</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Unit</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-auto">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {ppmpForm.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <input type="text" required value={item.itemNumber} onChange={(e) => handleItemChange(index, 'itemNumber', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="SKU/No." />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="text" required value={item.itemDescription} onChange={(e) => handleItemChange(index, 'itemDescription', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Description" />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="number" required min="1" max={item.maxQuantity || undefined} value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Qty" />
                                    {item.maxQuantity !== undefined && <div className="text-xs text-gray-500 mt-1">Max: {item.maxQuantity}</div>}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex space-x-2">
                                        <select
                                            required
                                            value={item.unit}
                                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="" disabled>Unit</option>
                                            {units.map((u) => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => handleAddUnit(index)}
                                            className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium text-sm shadow-sm whitespace-nowrap"
                                        >+ Add</button>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 transition-colors" title="Remove Item">
                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {ppmpForm.items.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">No items added. Click "+ Add Row" to start.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-start mb-8 shrink-0">
                <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium text-sm shadow-sm">
                    + Add Row
                </button>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 shrink-0">
                <button type="button" onClick={() => setIsEditingPPMP(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium shadow-sm">
                    Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                    Save Changes
                </button>
            </div>
        </form>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Details Modal */}
            {isModalOpen && selectedPPMP && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-800">{isEditingPPMP ? `Edit PPMP: ${selectedPPMP.ppmp_id}` : 'PPMP Details'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        {isEditingPPMP ? renderPPMPForm() : (
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                                    <div className="md:col-span-2">
                                        <p className="text-sm font-medium text-gray-500 mb-1">Project Name</p>
                                        <p className="font-semibold text-gray-900">{selectedPPMP.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                                        <p className="font-semibold text-gray-900">{selectedPPMP.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Year</p>
                                        <p className="font-semibold text-gray-900">{selectedPPMP.year}</p>
                                    </div>
                                </div>

                                <h4 className="text-lg font-semibold text-gray-800 mb-3 shrink-0">Requested Items</h4>
                                {selectedPPMP.items.length > 0 ? (
                                    <div className="overflow-x-auto overflow-y-auto flex-1 border border-gray-200 rounded-lg mb-6 min-h-0">
                                        <table className="min-w-full divide-y divide-gray-200 relative">
                                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Item Number</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Item Description</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Quantity</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Unit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedPPMP.items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.itemNumber}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">{item.itemDescription}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{item.unit}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-6 shrink-0">
                                        <p className="text-gray-500 font-medium">No items yet in the inventory for this project.</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center shrink-0 mt-auto pt-4 border-t border-gray-200">
                                    <div className="flex space-x-3">
                                        <button onClick={handleEditPPMP} className="px-6 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition font-medium shadow-sm">
                                            Edit
                                        </button>
                                        <button onClick={handleGeneratePPMP} className="px-6 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium shadow-sm whitespace-nowrap">
                                            Generate PPMP
                                        </button>
                                    </div>
                                    <button onClick={closeModal} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <StaffNavigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-6xl mb-6 flex justify-between items-center mt-2">
                    <h2 className="text-2xl font-bold text-gray-800">PPMP</h2>
                </div>
                
                <div className="bg-white shadow-sm rounded-xl border border-gray-100 w-full max-w-6xl overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {ppmps.map((ppmp) => (
                            <li key={ppmp.ppmp_id} className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleViewDetails(ppmp)}>
                                <span className="text-lg font-medium text-gray-900">{ppmp.name}</span>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
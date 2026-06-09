import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "./Navigation";
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

export default function PPMPScreen() {
    const navigate = useNavigate();

    const [ppmps, setPpmps] = useState([]);

    const [selectedPPMP, setSelectedPPMP] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditingPPMP, setIsEditingPPMP] = useState(false);
    const [units, setUnits] = useState([]);
    const [ppmpForm, setPpmpForm] = useState({ name: '', department: '', year: '', items: [] });
    const [adminName, setAdminName] = useState('Admin');
    const [inventoryList, setInventoryList] = useState([]);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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

        const fetchAdminDetails = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                const extractedUsername = user.email.split('@')[0];
                if (extractedUsername === '19987975') setAdminName('Admin1');
                else if (extractedUsername === '19987941') setAdminName('Admin2');
                else setAdminName(extractedUsername);
            }
        };

        fetchPPMPS();
        fetchUnits();
        fetchAdminDetails();
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
        setActiveDropdownIndex(null);
    };

    const handleOpenCreateModal = () => {
        const currentYear = new Date().getFullYear().toString();

        setPpmpForm({
            ppmp_id: '',
            name: '',
            department: '',
            year: currentYear,
            items: [{ itemNumber: '', itemDescription: '', quantity: '', unit: '' }]
        });
        setIsCreateModalOpen(true);
        setActiveDropdownIndex(null);
    };

    const handleCreatePPMP = async (e) => {
        e.preventDefault();
        try {
            // Validation: Ensure all items exist in the inventory
            const invalidItem = ppmpForm.items.find(item => 
                !inventoryList.some(inv => `ITM-${String(inv.item_id).padStart(4, '0')}` === item.itemNumber)
            );
            if (invalidItem) {
                alert(`Item number "${invalidItem.itemNumber}" is not a valid item in the inventory. Please select an item from the list.`);
                return;
            }

            // Dynamically query the database on submit to prevent duplicate ID errors
            const { data: yearPpmps, error: fetchError } = await supabase
                .from('ppmps')
                .select('ppmp_id')
                .ilike('ppmp_id', `PPMP-${ppmpForm.year}-%`);
            if (fetchError) throw fetchError;

            let nextNum = 1;
            if (yearPpmps && yearPpmps.length > 0) {
                const nums = yearPpmps.map(p => {
                    const parts = p.ppmp_id.split('-');
                    return parts.length >= 3 ? parseInt(parts[2], 10) : 0;
                }).filter(n => !isNaN(n));
                if (nums.length > 0) nextNum = Math.max(...nums) + 1;
            }
            const newPpmpId = `PPMP-${ppmpForm.year}-${String(nextNum).padStart(2, '0')}`;

            const { error } = await supabase.from('ppmps').insert([{
                ppmp_id: newPpmpId,
                name: ppmpForm.name,
                department: ppmpForm.department,
                year: ppmpForm.year,
                items: ppmpForm.items
            }]);
            if (error) throw error;
            
            // Audit Log
            await logAudit(adminName, 'Create PPMP', `Created new PPMP ${newPpmpId} (${ppmpForm.name})`);

            const { data } = await supabase.from('ppmps').select('*').order('created_at', { ascending: false });
            if (data) setPpmps(data);
            
            setIsCreateModalOpen(false);
            setActiveDropdownIndex(null);
        } catch (err) {
            console.error("Error creating PPMP:", err.message);
            alert("Failed to create PPMP: " + err.message);
        }
    };

    const handleEditPPMP = () => {
        setPpmpForm(JSON.parse(JSON.stringify(selectedPPMP))); // Deep copy for editing
        setIsEditingPPMP(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            // Validation: Ensure all items exist in the inventory
            const invalidItem = ppmpForm.items.find(item => 
                !inventoryList.some(inv => `ITM-${String(inv.item_id).padStart(4, '0')}` === item.itemNumber)
            );
            if (invalidItem) {
                alert(`Item number "${invalidItem.itemNumber}" is not a valid item in the inventory. Please select an item from the list.`);
                return;
            }

            const { error } = await supabase.from('ppmps').update({
                name: ppmpForm.name,
                department: ppmpForm.department,
                year: ppmpForm.year,
                items: ppmpForm.items
            }).eq('ppmp_id', ppmpForm.ppmp_id);
            if (error) throw error;
            
            // Audit Log
            await logAudit(adminName, 'Edit PPMP', `Updated PPMP ${ppmpForm.ppmp_id} (${ppmpForm.name})`);

            const { data } = await supabase.from('ppmps').select('*').order('created_at', { ascending: false });
            if (data) setPpmps(data);
            
            setSelectedPPMP(ppmpForm);
            setIsEditingPPMP(false);
            setActiveDropdownIndex(null);
        } catch (err) {
            console.error("Error saving PPMP:", err.message);
            alert("Failed to save changes: " + err.message);
        }
    };

    const handleDeletePPMP = async () => {
        if (!selectedPPMP) return;
        try {
            const { error } = await supabase.from('ppmps').delete().eq('ppmp_id', selectedPPMP.ppmp_id);
            if (error) throw error;
            
            // Audit Log
            await logAudit(adminName, 'Delete PPMP', `Deleted PPMP ${selectedPPMP.ppmp_id} (${selectedPPMP.name})`);

            setPpmps(prev => prev.filter(p => p.ppmp_id !== selectedPPMP.ppmp_id));
            setIsDeleteConfirmOpen(false);
            closeModal();
        } catch (err) {
            console.error("Error deleting PPMP:", err.message);
            alert("Failed to delete PPMP: " + err.message);
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
        newItems[index][field] = value;
        setPpmpForm({ ...ppmpForm, items: newItems });
    };

    const handleAddItem = () => {
        setPpmpForm({ ...ppmpForm, items: [...ppmpForm.items, { itemNumber: '', itemDescription: '', quantity: '', unit: '' }] });
    };

    const handleRemoveItem = (index) => {
        const newItems = ppmpForm.items.filter((_, i) => i !== index);
        setPpmpForm({ ...ppmpForm, items: newItems });
    };

    const renderPPMPForm = (isCreate) => (
        <form onSubmit={isCreate ? handleCreatePPMP : handleSaveEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/50 shrink-0">
                <div className="md:col-span-2">
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
            </div>

            <h4 className="text-base font-bold text-slate-800 mb-3 shrink-0">Requested Items</h4>
            <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-100 rounded-2xl mb-4 min-h-[240px] bg-white/40">
                <table className="min-w-full divide-y divide-slate-100 relative">
                    <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
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
                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 relative">
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            required
                                            value={item.itemNumber}
                                            onFocus={() => setActiveDropdownIndex(index)}
                                            onBlur={() => {
                                                setTimeout(() => setActiveDropdownIndex(null), 200);
                                            }}
                                            onChange={(e) => {
                                                handleItemChange(index, 'itemNumber', e.target.value);
                                                setActiveDropdownIndex(index);
                                            }}
                                            className="w-full pr-8 px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                            placeholder="SKU/No."
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setActiveDropdownIndex(activeDropdownIndex === index ? null : index);
                                            }}
                                            className="absolute right-2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>

                                    {activeDropdownIndex === index && (
                                        <div className="absolute left-0 mt-1 bg-white border border-slate-200/80 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto w-[320px] sm:w-[450px] p-1.5 backdrop-blur-md">
                                            {(() => {
                                                const query = (item.itemNumber || '').toLowerCase().trim();
                                                const filtered = inventoryList.filter(inv => {
                                                    const sku = `ITM-${String(inv.item_id).padStart(4, '0')}`.toLowerCase();
                                                    const name = (inv.item || '').toLowerCase();
                                                    return sku.includes(query) || name.includes(query);
                                                });

                                                if (filtered.length === 0) {
                                                    return (
                                                        <div className="px-4 py-3 text-sm text-slate-400 font-semibold italic text-center">
                                                            No matching items
                                                        </div>
                                                    );
                                                }

                                                return filtered.map(inv => {
                                                    const sku = `ITM-${String(inv.item_id).padStart(4, '0')}`;
                                                    return (
                                                        <button
                                                            key={inv.item_id}
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                handleItemChange(index, 'itemNumber', sku);
                                                                handleItemChange(index, 'itemDescription', inv.item || '');
                                                                if (inv.unit_name) {
                                                                    const unitToSet = inv.unit_name.toLowerCase();
                                                                    if (unitToSet && !units.includes(unitToSet)) {
                                                                        setUnits(prev => [...prev, unitToSet]);
                                                                    }
                                                                    handleItemChange(index, 'unit', unitToSet);
                                                                }
                                                                setActiveDropdownIndex(null);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors text-sm font-semibold text-slate-700 border-b border-slate-100 last:border-0 flex justify-between items-center gap-4 cursor-pointer rounded-lg"
                                                        >
                                                            <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg shrink-0">{sku}</span>
                                                            <span className="text-slate-600 truncate text-sm font-medium flex-1 text-right">{inv.item}</span>
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <input type="text" required readOnly value={item.itemDescription} className="w-full px-3 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-xl focus:outline-none text-sm text-slate-500 font-medium cursor-not-allowed shadow-inner" placeholder="Select item first" />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="number" required min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full px-3 py-1.5 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="Qty" />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="text" required readOnly value={item.unit} className="w-full px-3 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-xl focus:outline-none text-sm text-slate-500 font-medium cursor-not-allowed shadow-inner" placeholder="Unit" />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer" title="Remove Item">
                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {ppmpForm.items.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-sm text-slate-400 font-semibold">No items added. Click "+ Add Row" to start.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-start mb-8 shrink-0">
                <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-bold text-sm shadow-sm cursor-pointer">
                    + Add Row
                </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => { if (isCreate) { setIsCreateModalOpen(false); } else { setIsEditingPPMP(false); } setActiveDropdownIndex(null); }} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm cursor-pointer shadow-sm">
                    Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                    {isCreate ? 'Create PPMP' : 'Save Changes'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Details Modal */}
            {isModalOpen && selectedPPMP && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-black text-slate-800">{isEditingPPMP ? `Edit PPMP: ${selectedPPMP.ppmp_id}` : 'PPMP Details'}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-3xl leading-none cursor-pointer">&times;</button>
                        </div>
                        
                        {isEditingPPMP ? renderPPMPForm(false) : (
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/50 shrink-0">
                                    <div className="md:col-span-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Name</p>
                                        <p className="font-bold text-slate-800 text-sm">{selectedPPMP.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                                        <p className="font-bold text-slate-800 text-sm">{selectedPPMP.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year</p>
                                        <p className="font-bold text-slate-800 text-sm">{selectedPPMP.year}</p>
                                    </div>
                                </div>

                                <h4 className="text-base font-bold text-slate-800 mb-3 shrink-0">Requested Items</h4>
                                {selectedPPMP.items.length > 0 ? (
                                    <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-100 rounded-2xl mb-6 min-h-0 bg-white/40">
                                        <table className="min-w-full divide-y divide-slate-100 relative">
                                            <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/6">Item Number</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/2">Item Description</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Quantity</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Unit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-transparent divide-y divide-slate-100">
                                                {selectedPPMP.items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-slate-800 font-bold">{item.itemNumber}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">{item.itemDescription}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-800 font-bold">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-500">{item.unit}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-8 text-center mb-6 shrink-0">
                                        <p className="text-slate-400 font-bold text-sm">No items yet in the inventory for this project.</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center shrink-0 mt-auto pt-4 border-t border-slate-100">
                                    <div className="flex space-x-2">
                                        <button onClick={handleEditPPMP} className="px-5 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Edit
                                        </button>
                                        <button onClick={handleGeneratePPMP} className="px-5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl transition font-semibold text-sm shadow-sm whitespace-nowrap cursor-pointer">
                                            Generate PPMP
                                        </button>
                                        <button onClick={() => setIsDeleteConfirmOpen(true)} className="px-5 py-2 bg-white text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition font-semibold text-sm shadow-sm cursor-pointer">
                                            Delete
                                        </button>
                                    </div>
                                    <button onClick={closeModal} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm cursor-pointer">
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-black text-slate-800">Create New PPMP</h3>
                            <button onClick={() => { setIsCreateModalOpen(false); setActiveDropdownIndex(null); }} className="text-slate-400 hover:text-slate-600 text-3xl leading-none cursor-pointer">&times;</button>
                        </div>
                        {renderPPMPForm(true)}
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
                        Project Procurement Monitoring Plan (PPMP)
                    </h2>
                    <button onClick={handleOpenCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm cursor-pointer">
                        + Create New PPMP
                    </button>
                </header>
                
                <main className="flex-1 flex flex-col overflow-hidden p-6 lg:p-8 min-h-0">
                    <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 flex flex-col flex-1 min-h-0 overflow-y-auto">
                        <ul className="divide-y divide-slate-100">
                            {ppmps.map((ppmp) => (
                                <li key={ppmp.ppmp_id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleViewDetails(ppmp)}>
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-slate-800">{ppmp.name}</span>
                                        <span className="text-xs font-semibold text-slate-400 mt-1">{ppmp.department} Department • {ppmp.year}</span>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </li>
                            ))}
                        </ul>
                    </div>
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[60] p-4 transition-opacity duration-300">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all relative">
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-full text-rose-600 mb-4 animate-bounce">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-2">Delete PPMP</h3>
                            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
                                Are you sure you want to permanently delete <span className="font-mono font-bold text-slate-800">{selectedPPMP?.ppmp_id}</span>? This action cannot be undone.
                            </p>
                            <div className="flex space-x-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-xs shadow-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeletePPMP}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl hover:from-rose-700 hover:to-rose-800 transition font-bold text-xs shadow-md shadow-rose-600/10 cursor-pointer"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
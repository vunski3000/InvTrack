import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import StaffNavigation from "./StaffNavigation";
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

export default function StaffRequestScreen() {
    const navigate = useNavigate();
    const [department, setDepartment] = useState('');
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departmentsList, setDepartmentsList] = useState([]);
    const [unitsList, setUnitsList] = useState([]);
    const [inventoryList, setInventoryList] = useState([]);

    useEffect(() => {
        fetchDepartments();
        fetchUnits();
        fetchInventory();
        fetchMyDetails();
    }, []);

    // Pre-fill fields automatically using the logged in user's personnel record
    const fetchMyDetails = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                const staffIdString = user.email.split('@')[0];
                const staffIdNum = parseInt(staffIdString.replace('-', ''), 10);
                
                const { data: personnel } = await supabase
                    .from('personnel')
                    .select('*')
                    .eq('personnel_id', staffIdNum)
                    .single();
                
                if (personnel) {
                    setName(personnel.name || '');
                    setDepartment(personnel.department || personnel.dept || '');
                    setDesignation(personnel.designation || '');
                }
            }
        } catch (err) {
            console.error("Error fetching my details:", err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase.from('department').select('*');
            console.log("Raw departments data from Supabase:", data);
            if (error) throw error;
            if (data) {
                const mappedList = data.map(d => d.name || d.Name || d.department || d.Department || d.department_name || Object.values(d).find(v => typeof v === 'string')).filter(Boolean);
                console.log("Mapped departments dropdown list:", mappedList);
                setDepartmentsList(mappedList);
            }
        } catch (err) {
            console.error("Error fetching departments:", err);
        }
    };
    
    const fetchUnits = async () => {
        try {
            const { data, error } = await supabase.from('units').select('*');
            if (error) throw error;
            if (data) {
                const mappedList = data.map(d => d.name || d.Name || d.unit || d.Unit || Object.values(d).find(v => typeof v === 'string')).filter(Boolean);
                setUnitsList(mappedList.sort());
            }
        } catch (err) {
            console.error("Error fetching units:", err);
        }
    };

    const fetchInventory = async () => {
        try {
            const { data, error } = await supabase.from('inventory_procurement').select('*').order('item_id', { ascending: true });
            if (error) throw error;
            if (data) {
                setInventoryList(data);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleItemSelect = (index, selectedItemNumber) => {
        const newItems = [...items];
        newItems[index].itemNumber = selectedItemNumber;
        
        const selectedInventoryItem = inventoryList.find(i => `ITM-${String(i.item_id).padStart(4, '0')}` === selectedItemNumber);
        if (selectedInventoryItem) {
            newItems[index].itemDescription = selectedInventoryItem.description 
                ? `${selectedInventoryItem.item} - ${selectedInventoryItem.description}` 
                : selectedInventoryItem.item;
            newItems[index].unit = selectedInventoryItem.unit_name || selectedInventoryItem.unit || '';
        }
        
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleAddUnit = async (index) => {
        const newUnit = window.prompt("Enter new unit name:");
        if (newUnit && newUnit.trim() !== '') {
            const lowerUnit = newUnit.trim().toLowerCase();
            if (!unitsList.includes(lowerUnit)) {
                try {
                    const { error } = await supabase.from('units').insert([{ name: lowerUnit }]);
                    if (error) throw error;
                    setUnitsList(prev => [...prev, lowerUnit].sort());
                } catch (err) {
                    console.error("Error adding unit:", err.message);
                    alert("Failed to add new unit.");
                    return;
                }
            }
            handleItemChange(index, 'unit', lowerUnit);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // Auto-generate an ID like REQ-2026-001
            const currentYear = new Date().getFullYear().toString();
            const { data: existingReqs, error: fetchError } = await supabase
                .from('requisition_issuance')
                .select('request_id')
                .ilike('request_id', `REQ-${currentYear}-%`);

            if (fetchError) throw fetchError;

            let nextNum = 1;
            if (existingReqs && existingReqs.length > 0) {
                const nums = existingReqs.map(r => {
                    const parts = r.request_id.split('-');
                    return parts.length >= 3 ? parseInt(parts[2], 10) : 0;
                }).filter(n => !isNaN(n));
                if (nums.length > 0) nextNum = Math.max(...nums) + 1;
            }
            const newId = `REQ-${currentYear}-${String(nextNum).padStart(3, '0')}`;

            const { error } = await supabase.from('requisition_issuance').insert([{
                request_id: newId,
                dept: department,
                name: name,
                designation: designation,
                request_date: requestDate,
                items,
                status: 'Pending'
            }]);

            if (error) throw error;

            // Instantly send a notification to the admin
            const { error: notifError } = await supabase.from('notifications').insert([{
                target_user: 'admin',
                message: `New request from ${name} (${department})`
            }]);
            if (notifError) console.error("Failed to send notification:", notifError);

            // Audit Log
            await logAudit(name, 'Submit Request', `Submitted new requisition request ${newId}`);

            alert('Item requested successfully!');
            setDepartment('');
            setName('');
            setDesignation('');
            setRequestDate(new Date().toISOString().split('T')[0]);
            setItems([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
            // Re-fetch my details to prep for the next request
            fetchMyDetails();
        } catch (err) {
            console.error('Error submitting requisition:', err.message);
            alert('Failed to submit request: ' + err.message);
        } finally {
            setIsSubmitting(false);
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
                        Submit Requisition Request
                    </h2>
                </header>

                <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 flex flex-col items-center">
                    <div className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60 w-full max-w-4xl my-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="department" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                                    <select
                                        id="department"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        required
                                        disabled
                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 cursor-not-allowed font-medium text-sm shadow-inner"
                                    >
                                        <option value="" disabled>Select a department</option>
                                        {departmentsList.map((dept, index) => (
                                            <option key={index} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="designation" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
                                    <input
                                        type="text"
                                        id="designation"
                                        value={designation}
                                        onChange={(e) => setDesignation(e.target.value)}
                                        required
                                        readOnly
                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 cursor-not-allowed font-medium text-sm shadow-inner"
                                        placeholder="e.g., Manager, Staff"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Your Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        readOnly
                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 cursor-not-allowed font-medium text-sm shadow-inner"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="requestDate" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date of Request</label>
                                    <input
                                        type="date"
                                        id="requestDate"
                                        value={requestDate}
                                        onChange={(e) => setRequestDate(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 cursor-not-allowed font-semibold text-sm shadow-inner"
                                        readOnly
                                    />
                                </div>
                            </div>
                        
                        <div className="mt-8 border border-slate-200/60 rounded-xl overflow-hidden shadow-sm bg-white/40">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/70">
                                    <tr>
                                        <th scope="col" className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Item ID</th>
                                        <th scope="col" className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-5/12">Item Description</th>
                                        <th scope="col" className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Quantity</th>
                                        <th scope="col" className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Unit</th>
                                        <th scope="col" className="px-4 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/12">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-slate-100">
                                    {items.map((item, index) => (
                                        <tr key={index} className="hover:bg-purple-50/10 transition-colors">
                                            <td className="px-4 py-3">
                                                <select
                                                    value={item.itemNumber}
                                                    onChange={(e) => handleItemSelect(index, e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer"
                                                >
                                                    <option value="" disabled>Select Item</option>
                                                    {inventoryList.map((invItem) => {
                                                        const itemNum = `ITM-${String(invItem.item_id).padStart(4, '0')}`;
                                                        return (
                                                            <option key={invItem.item_id} value={itemNum}>{itemNum} - {invItem.item}</option>
                                                        );
                                                    })}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.itemDescription}
                                                    onChange={(e) => handleItemChange(index, 'itemDescription', e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm"
                                                    placeholder="Brief description"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    required
                                                    min="1"
                                                    className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm"
                                                    placeholder="Qty"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex space-x-2">
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                        required
                                                        className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm cursor-pointer"
                                                    >
                                                        <option value="" disabled>Unit</option>
                                                        {unitsList.map((u, i) => (
                                                            <option key={i} value={u}>{u}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddUnit(index)}
                                                        className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition font-bold text-xs shadow-sm whitespace-nowrap cursor-pointer"
                                                    >+ Add</button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all cursor-pointer"
                                                        title="Remove Item"
                                                    >
                                                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-between">
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="w-full sm:w-auto px-6 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition font-bold shadow-sm text-sm cursor-pointer"
                            >
                                + Add Row
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-bold shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Requisition'}
                            </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import StaffNavigation from "./StaffNavigation";
import { supabase } from '../../supabaseClient';

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
                request_date: requestDate, // Assuming your database uses snake_case 'request_date'
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
            await supabase.from('audit_logs').insert([{
                user_name: name,
                action: 'Submit Request',
                details: `Submitted new requisition request ${newId}`
            }]);

            alert('Item requested successfully!');
            setDepartment('');
            setName('');
            setDesignation('');
            setRequestDate(new Date().toISOString().split('T')[0]);
            setItems([{ itemNumber: '', unit: '', itemDescription: '', quantity: '' }]);
        } catch (err) {
            console.error('Error submitting requisition:', err.message);
            alert('Failed to submit request: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Top Navigation */}
            <StaffNavigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-4xl border border-gray-100 my-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Request Item</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select
                                    id="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    required
                                    disabled
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-gray-500 cursor-not-allowed"
                                >
                                    <option value="" disabled>Select a department</option>
                                    {departmentsList.map((dept, index) => (
                                        <option key={index} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input
                                    type="text"
                                    id="designation"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    required
                                    readOnly
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 cursor-not-allowed text-gray-500"
                                    placeholder="e.g., Manager, Staff"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    readOnly
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 cursor-not-allowed text-gray-500"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div>
                                <label htmlFor="requestDate" className="block text-sm font-medium text-gray-700 mb-1">Date of Request</label>
                                <input
                                    type="date"
                                    id="requestDate"
                                    value={requestDate}
                                    onChange={(e) => setRequestDate(e.target.value)}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                                    readOnly
                                />
                            </div>
                        </div>
                    
                    <div className="mt-8 overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Item Number</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">Item Description</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Quantity</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Unit</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <select
                                                value={item.itemNumber}
                                                onChange={(e) => handleItemSelect(index, e.target.value)}
                                                required
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                placeholder="Qty"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2">
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                    required
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                >
                                                    <option value="" disabled>Unit</option>
                                                    {unitsList.map((u, i) => (
                                                        <option key={i} value={u}>{u}</option>
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
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
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
                            className="w-full sm:w-auto px-6 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition font-medium shadow-sm"
                        >
                            + Add Row
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-8 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Requisition'}
                        </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
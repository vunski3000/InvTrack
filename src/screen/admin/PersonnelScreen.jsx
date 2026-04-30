import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';

export default function PersonnelScreen() {
    const [personnel, setPersonnel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({ personnel_id: '', name: '', department: '', designation: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departmentsList, setDepartmentsList] = useState([]);

    useEffect(() => {
        fetchPersonnel();
        fetchDepartments();
    }, []);

    const fetchPersonnel = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('personnel').select('*').order('name', { ascending: true });
            if (error) throw error;
            setPersonnel(data || []);
        } catch (err) {
            console.error("Error fetching personnel:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase.from('department').select('*');
            if (error) throw error;
            if (data) {
                const mappedList = data.map(d => d.name || d.Name || d.department || d.Department || d.department_name || Object.values(d).find(v => typeof v === 'string')).filter(Boolean);
                setDepartmentsList(mappedList);
            }
        } catch (err) {
            console.error("Error fetching departments:", err.message);
        }
    };

    const handleAddPersonnel = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dataToInsert = { 
                // Remove the dash before saving so it can be stored as a bigint
                personnel_id: parseInt(formData.personnel_id.replace('-', ''), 10),
                name: formData.name,
                dept: formData.department,
                designation: formData.designation 
            };
            const { error } = await supabase.from('personnel').insert([dataToInsert]);
            if (error) throw error;

            alert('Personnel added successfully!');
            setIsAddModalOpen(false);
            setFormData({ personnel_id: '', name: '', department: '', designation: '' });
            fetchPersonnel();
        } catch (err) {
            console.error("Error adding personnel:", err.message);
            alert("Failed to add personnel: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this personnel?")) {
            try {
                const { error } = await supabase.from('personnel').delete().eq('id', id);
                if (error) throw error;
                setPersonnel(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error("Error deleting personnel:", err.message);
                alert("Failed to delete personnel: " + err.message);
            }
        }
    };

    // Helper function to format IDs like 20260501 into 2026-0501
    const formatPersonnelId = (id) => {
        if (!id) return '-';
        const str = String(id);
        if (str.length === 8) {
            return `${str.slice(0, 4)}-${str.slice(4)}`;
        }
        return str;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            <Navigation />

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Add New Personnel</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleAddPersonnel} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Personnel ID</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.personnel_id} 
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, ''); // Allow only numbers
                                        if (val.length <= 8) {
                                            let formatted = val;
                                            if (val.length > 4) formatted = `${val.slice(0, 4)}-${val.slice(4)}`;
                                            setFormData({...formData, personnel_id: formatted});
                                        }
                                    }} 
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                    placeholder="e.g., 2026-0501" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Juan Dela Cruz" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="" disabled>Select a department</option>
                                    {departmentsList.map((dept, index) => (
                                        <option key={index} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input required type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Staff" />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium shadow-sm">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-6xl mb-6 flex justify-between items-center mt-2">
                    <h2 className="text-2xl font-bold text-gray-800">Personnel Management</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                        + Add Personnel
                    </button>
                </div>

                <div className="bg-white shadow-sm rounded-xl border border-gray-100 w-full max-w-6xl overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">Loading personnel...</td>
                                    </tr>
                                ) : personnel.length > 0 ? (
                                    personnel.map((person) => (
                                        <tr key={person.id || person.name} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{formatPersonnelId(person.personnel_id || person.id)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{person.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.department || person.dept || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.designation || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleDelete(person.id)} className="text-red-600 hover:text-red-900 transition-colors">Remove</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500 font-medium">No personnel found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
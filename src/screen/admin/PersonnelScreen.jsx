import React, { useState, useEffect, useMemo } from 'react';
import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';
import { logAudit } from '../../utils/auditLogger';

const PROXY_URL = 'http://localhost:3001';

export default function PersonnelScreen() {
    const [personnel, setPersonnel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({ personnel_id: '', name: '', department: '', designation: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departmentsList, setDepartmentsList] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [adminName, setAdminName] = useState('Admin');

    useEffect(() => {
        fetchPersonnel();
        fetchDepartments();
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

    const handleOpenAddModal = () => {
        setFormData({ personnel_id: '', name: '', department: '', designation: '' });
        setIsEditMode(false);
        setEditingId(null);
        setIsAddModalOpen(true);
    };

    const handleOpenEditModal = (person) => {
        setFormData({
            personnel_id: formatPersonnelId(person.personnel_id),
            name: person.name,
            department: person.department || person.dept || '',
            designation: person.designation || ''
        });
        setIsEditMode(true);
        setEditingId(person.personnel_id);
        setIsAddModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const parsedId = parseInt(String(formData.personnel_id).replace('-', ''), 10);
            const dataToSave = { 
                // Remove the dash before saving so it can be stored as a bigint
                personnel_id: parsedId,
                name: formData.name,
                dept: formData.department,
                designation: formData.designation 
            };
            
            if (isEditMode) {
                // Exclude the primary key to prevent update constraints, update only other details
                const { personnel_id, ...updatePayload } = dataToSave;
                
                const response = await fetch(`${PROXY_URL}/api/personnel/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ editingId, updatePayload })
                });
                
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to update personnel");
                }
                
                // Audit Log
                await logAudit(adminName, 'Update Personnel', `Updated personnel ${formData.name} (ID: ${formData.personnel_id})`);
                
                window.showAlert('Personnel updated successfully!', 'Success', () => {
                    // Optimistically update the list so changes appear instantly
                    setPersonnel(prev => prev.map(p => 
                        p.personnel_id === editingId ? { ...p, ...updatePayload, department: formData.department } : p
                    ));
                    setIsAddModalOpen(false);
                    setFormData({ personnel_id: '', name: '', department: '', designation: '' });
                    setIsEditMode(false);
                    setEditingId(null);
                });
            } else {
                const response = await fetch(`${PROXY_URL}/api/personnel/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSave)
                });
                
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to add personnel");
                }
                
                // Audit Log
                await logAudit(adminName, 'Add Personnel', `Added new personnel ${formData.name} (ID: ${formData.personnel_id})`);
                
                window.showAlert('Personnel added successfully!', 'Success', async () => {
                    await fetchPersonnel();
                    setIsAddModalOpen(false);
                    setFormData({ personnel_id: '', name: '', department: '', designation: '' });
                    setIsEditMode(false);
                    setEditingId(null);
                });
            }
        } catch (err) {
            console.error(`Error ${isEditMode ? 'updating' : 'adding'} personnel:`, err.message);
            window.showAlert(`Failed to ${isEditMode ? 'update' : 'add'} personnel: ` + err.message, 'Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        window.showConfirm("Are you sure you want to remove this personnel?", "Remove Personnel", async () => {
            try {
                const response = await fetch(`${PROXY_URL}/api/personnel/delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id })
                });
                
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to delete personnel");
                }
                
                // Audit Log
                await logAudit(adminName, 'Delete Personnel', `Deleted personnel (ID: ${id})`);
                
                window.showAlert("Personnel removed successfully.", "Success", () => {
                    setPersonnel(prev => prev.filter(p => p.personnel_id !== id));
                });
            } catch (err) {
                console.error("Error deleting personnel:", err.message);
                window.showAlert("Failed to delete personnel: " + err.message, "Error");
            }
        });
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

    const filteredPersonnel = useMemo(() => {
        if (!searchQuery) return personnel;
        const query = searchQuery.toLowerCase();
        return personnel.filter(person => {
            const matchName = person.name?.toLowerCase().includes(query);
            const matchId = String(person.personnel_id).includes(query) || formatPersonnelId(person.personnel_id).includes(query);
            return matchName || matchId;
        });
    }, [personnel, searchQuery]);

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />

            <Navigation />

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">{isEditMode ? 'Edit Personnel' : 'Add New Personnel'}</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none cursor-pointer">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Personnel ID</label>
                                <input 
                                    required 
                                    disabled={isEditMode}
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
                                    className={`w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium ${isEditMode ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`}
                                    placeholder="e.g., 2026-0501" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="e.g., Juan Dela Cruz" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-semibold cursor-pointer">
                                    <option value="" disabled>Select a department</option>
                                    {departmentsList.map((dept, index) => (
                                        <option key={index} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Designation</label>
                                <input required type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium" placeholder="e.g., Staff" />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm cursor-pointer shadow-sm">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm disabled:opacity-50 cursor-pointer">{isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-700"></span>
                        Personnel Management
                    </h2>
                    <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm cursor-pointer">
                        + Add Personnel
                    </button>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden p-6 lg:p-8 min-h-0">
                    {/* Filters and Search Bar */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6 flex justify-between items-center shrink-0">
                        <div className="w-full sm:w-1/3">
                            <input 
                                type="text" 
                                placeholder="Search by Name or ID..." 
                                className="w-full px-4 py-2 bg-white/90 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all text-slate-700 shadow-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Personnel Table Section */}
                    <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                            <table className="min-w-full divide-y divide-slate-100 relative">
                                <thead className="bg-slate-50/70 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personnel ID</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">Loading personnel...</td>
                                        </tr>
                                    ) : filteredPersonnel.length > 0 ? (
                                        filteredPersonnel.map((person) => (
                                            <tr key={person.personnel_id || person.name} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{formatPersonnelId(person.personnel_id)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{person.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">{person.department || person.dept || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">{person.designation || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                                                    <button onClick={() => handleOpenEditModal(person)} className="text-indigo-600 hover:text-indigo-900 transition-colors mr-4 cursor-pointer">Edit</button>
                                                    <button onClick={() => handleDelete(person.personnel_id)} className="text-rose-600 hover:text-rose-900 transition-colors cursor-pointer">Remove</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">No personnel found.</td>
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
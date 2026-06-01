import React, { useState, useEffect } from 'react';
import StaffNavigation from './StaffNavigation';
import { supabase } from '../../supabaseClient';

export default function StaffDashboardScreen() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recentAudits, setRecentAudits] = useState([]);
    const [totalClaimedQuantity, setTotalClaimedQuantity] = useState(0);

    useEffect(() => {
        fetchInventory();
        fetchUserDataAndClaims();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('inventory_procurement').select('*').order('item_id', { ascending: false });
            if (error) throw error;
            setInventory(data || []);
        } catch (err) {
            console.error("Error fetching inventory:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDataAndClaims = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                const staffIdString = user.email.split('@')[0];
                const staffIdNum = parseInt(staffIdString.replace('-', ''), 10);
                let currentStaffName = staffIdString; // Fallback to ID

                const { data: personnelData } = await supabase
                    .from('personnel')
                    .select('name')
                    .eq('personnel_id', staffIdNum)
                    .single();
                    
                if (personnelData && personnelData.name) {
                    currentStaffName = personnelData.name;
                }
                
                await fetchClaimedItems(currentStaffName);
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    const fetchClaimedItems = async (staffName) => {
        try {
            const { data, error } = await supabase
                .from('requisition_issuance')
                .select('request_id, request_date, items')
                .eq('status', 'Claimed')
                .eq('name', staffName)
                .order('request_date', { ascending: false });

            if (error) throw error;

            let totalQty = 0;
            let auditsList = [];

            if (data) {
                data.forEach((request) => {
                    if (request.items && Array.isArray(request.items)) {
                        request.items.forEach((item, index) => {
                            const qty = parseInt(item.quantity || 0, 10);
                            if (!isNaN(qty)) {
                                totalQty += qty;
                            }
                            auditsList.push({
                                id: `${request.request_id}-${item.itemNumber}-${index}`,
                                item: item.itemDescription || item.itemNumber,
                                quantity: item.quantity,
                                date: request.request_date,
                                status: 'Claimed'
                            });
                        });
                    }
                });
            }

            setTotalClaimedQuantity(totalQty);
            setRecentAudits(auditsList);
        } catch (err) {
            console.error("Error fetching claimed items:", err.message);
        }
    };

    const lowStockItems = inventory.filter(item => {
        const qty = parseInt(item.quantity_available, 10) || 0;
        return qty > 0 && qty < 10;
    }).map(item => ({
        id: item.item_id,
        item: item.item,
        quantity: item.quantity_available,
        threshold: 10
    }));

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles for visual depth */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-200/40 via-fuchsia-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/30 via-pink-200/20 to-transparent blur-3xl pointer-events-none" />

            <StaffNavigation />
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-purple-500 to-indigo-600"></span>
                        Staff Dashboard Overview
                    </h2>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        {/* Metric 1 */}
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-purple-300/40 transition-all duration-300 flex items-center group">
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 mr-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Low Stock Alerts</p>
                                <p className="text-3xl font-black text-slate-800">{loading ? '...' : lowStockItems.length}</p>
                            </div>
                        </div>
                        {/* Metric 2 */}
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-purple-300/40 transition-all duration-300 flex items-center group">
                            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 mr-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Items Acquired Audit</p>
                                <p className="text-3xl font-black text-slate-800">{totalClaimedQuantity} Items</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Low Stock Alerts */}
                        <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 bg-white/40 flex justify-between items-center">
                                <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    Low Stock Alerts
                                </h3>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/70">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Name</th>
                                            <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Stock</th>
                                            <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Threshold</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-10 text-center text-slate-400 font-semibold text-xs">Loading items...</td>
                                            </tr>
                                        ) : lowStockItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-10 text-center text-slate-400 font-semibold text-xs">No items are low on stock.</td>
                                            </tr>
                                        ) : lowStockItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-purple-50/10 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">{item.item}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 border border-red-100 text-red-600">
                                                        {item.quantity} available
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-400">{item.threshold}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Items Acquired Audit */}
                        <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 bg-white/40 flex justify-between items-center">
                                <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                    Recent Items Acquired Audit
                                </h3>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/70">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Name</th>
                                            <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-slate-100">
                                        {recentAudits.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-semibold text-xs">No items acquired yet.</td>
                                            </tr>
                                        ) : recentAudits.map((audit) => (
                                            <tr key={audit.id} className="hover:bg-purple-50/10 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">{audit.item}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">{audit.quantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-400">{audit.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">
                                                        {audit.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
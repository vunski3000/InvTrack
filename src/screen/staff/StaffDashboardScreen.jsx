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
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            <StaffNavigation />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Staff Dashboard</h2>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 lg:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : lowStockItems.length}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
                            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Items Acquired Audit</p>
                                <p className="text-2xl font-bold text-gray-900">{totalClaimedQuantity} Items</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Low Stock Alerts */}
                        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden mb-8">
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-10 text-center text-gray-500 font-medium">Loading items...</td>
                                            </tr>
                                        ) : lowStockItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-10 text-center text-gray-500 font-medium">No items are low on stock.</td>
                                            </tr>
                                        ) : lowStockItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{item.quantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.threshold}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Items Acquired Audit */}
                        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden mb-8">
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">Recent Items Acquired Audit</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentAudits.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">No items acquired yet.</td>
                                            </tr>
                                        ) : recentAudits.map((audit) => (
                                            <tr key={audit.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{audit.item}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{audit.quantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{audit.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${audit.status === 'Claimed' ? 'bg-blue-100 text-blue-800' : audit.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
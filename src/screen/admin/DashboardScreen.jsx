import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { supabase } from '../../supabaseClient';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

export default function DashboardScreen() {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            // Fetch inventory items and recent audit logs in parallel
            const [invResult, auditResult] = await Promise.all([
                supabase.from('inventory_procurement').select('*'),
                supabase
                    .from('audit_logs')
                    .select('*')
                    .in('action', ['Update Item', 'Add Item', 'Add Items'])
                    .order('created_at', { ascending: false })
                    .limit(200)
            ]);

            if (invResult.error) throw invResult.error;
            if (auditResult.error) throw auditResult.error;

            const invData = invResult.data || [];
            const auditData = auditResult.data || [];

            // Map to store the latest audit timestamp for each item_id
            const itemLatestChanges = {};

            auditData.forEach(log => {
                const match = log.details && log.details.match(/ITM-(\d+)/i);
                if (match) {
                    const itemId = parseInt(match[1], 10);
                    if (!itemLatestChanges[itemId]) {
                        itemLatestChanges[itemId] = new Date(log.created_at).getTime();
                    }
                }
            });

            // Sort inventory:
            // 1. By the latest change timestamp (from audit logs) descending.
            // 2. Fall back to item_id descending (newest added items first).
            const sortedInventory = [...invData].sort((a, b) => {
                const timeA = itemLatestChanges[a.item_id] || 0;
                const timeB = itemLatestChanges[b.item_id] || 0;

                if (timeA !== timeB) {
                    return timeB - timeA;
                }
                return b.item_id - a.item_id;
            });

            setInventory(sortedInventory);
        } catch (err) {
            console.error("Error fetching inventory:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const categoryCounts = inventory.reduce((acc, item) => {
        const cat = item.category_name || item.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const pieChartData = {
        labels: Object.keys(categoryCounts),
        datasets: [
            {
                label: '# of Items',
                data: Object.values(categoryCounts),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const value = context.raw;
                            const percentage = ((value / total) * 100).toFixed(2) + '%';
                            label += `${value} (${percentage})`;
                        }
                        return label;
                    }
                }
            }
        },
    };

    // Helper function to color-code status badges
    const getStatusStyle = (status) => {
        switch (status) {
            case 'In Stock':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Low Stock':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Out of Stock':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Calculate KPIs
    const totalItems = inventory.reduce((sum, item) => sum + (parseInt(item.quantity_available, 10) || 0), 0);
    const lowStockAlerts = inventory.filter(item => {
        const qty = parseInt(item.quantity_available, 10) || 0;
        return qty > 0 && qty < 10;
    }).length;

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 font-sans relative overflow-hidden">
            {/* Glowing background circles for visual depth */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/20 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />

            {/* Top Navigation */}
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden z-10">
                {/* Top Header */}
                <header className="h-16 border-b border-slate-200/80 bg-white/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <span className="h-8 w-2 rounded-lg bg-gradient-to-b from-indigo-500 to-purple-600"></span>
                        Admin Dashboard Overview
                    </h2>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
                    
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-indigo-300/40 transition-all duration-300 flex items-center group">
                            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mr-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Items</p>
                                <p className="text-3xl font-black text-slate-800">{totalItems}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-indigo-300/40 transition-all duration-300 flex items-center group">
                            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-600 mr-4 transition-transform group-hover:scale-105 duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Low Stock Alerts</p>
                                <p className="text-3xl font-black text-slate-800">{lowStockAlerts}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main content grid for table and chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Inventory Table Section */}
                        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 bg-white/40 flex justify-between items-center">
                                <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Inventory Items
                                </h3>
                            </div>
                            <div className="overflow-y-auto overflow-x-auto max-h-[500px]">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-100">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Item Name & SKU</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white/40">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-10 text-center text-xs font-semibold text-slate-400">Loading inventory...</td>
                                            </tr>
                                        ) : inventory.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-10 text-center text-xs font-semibold text-slate-400">No items in inventory.</td>
                                            </tr>
                                        ) : (
                                            inventory.map((item) => {
                                                let derivedStatus = 'In Stock';
                                                if (item.quantity_available <= 0) derivedStatus = 'Out of Stock';
                                                else if (item.quantity_available < 10) derivedStatus = 'Low Stock';
                                                
                                                return (
                                                    <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-slate-800">{item.item}</div>
                                                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                                ITM-{String(item.item_id).padStart(4, '0')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                                                            {item.category_name || item.category || ''}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">
                                                            {item.quantity_available} {item.unit_name || item.unit || ''}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-xl border ${getStatusStyle(derivedStatus)}`}>
                                                                {derivedStatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-200/60 p-6 flex flex-col">
                            <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                Items by Category
                            </h3>
                            <div className="relative h-56 flex justify-center w-full">
                                <Pie options={pieChartOptions} data={pieChartData} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
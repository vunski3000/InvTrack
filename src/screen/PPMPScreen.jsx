import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function PPMPScreen() {
    const navigate = useNavigate();
    const [procurementOpen, setProcurementOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [ppmps, setPpmps] = useState([
        {
            id: 'PPMP-2026-01',
            name: 'SMAW NC I',
            department: 'Vocational',
            year: '2026',
            status: 'Approved',
            items: []
        },
        {
            id: 'PPMP-2026-02',
            name: 'MASONRY NC I',
            department: 'Vocational',
            year: '2026',
            status: 'Pending',
            items: []
        }
    ]);

    const [selectedPPMP, setSelectedPPMP] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchInventoryForPPMP = async () => {
            try {
                // Fetch all inventory items for SMAW NC I
                const { data, error } = await supabase
                    .from('inventory_procurement')
                    .select('*')
                    .order('item_id', { ascending: true });
                
                if (error) throw error;

                if (data) {
                    // Map Supabase inventory data to match the PPMP modal's expected format
                    const inventoryItems = data.map(item => ({
                        itemNumber: item.item_id,
                        itemDescription: item.description ? `${item.item} - ${item.description}` : item.item,
                        quantity: item.quantity_available,
                        unit: item.unit || ''
                    }));

                    setPpmps(prev => prev.map(p => 
                        p.id === 'PPMP-2026-01' ? { ...p, items: inventoryItems } : p
                    ));

                    // Update the modal content if it is already open while data is loading
                    setSelectedPPMP(prevSelected => {
                        if (prevSelected && prevSelected.id === 'PPMP-2026-01') {
                            return { ...prevSelected, items: inventoryItems };
                        }
                        return prevSelected;
                    });
                }
            } catch (err) {
                console.error("Error fetching inventory for PPMP:", err.message);
            }
        };

        fetchInventoryForPPMP();
    }, []);

    const handleViewDetails = (ppmp) => {
        setSelectedPPMP(ppmp);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPPMP(null);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Details Modal */}
            {isModalOpen && selectedPPMP && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-full overflow-y-auto transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">PPMP Details: <span className="text-indigo-600">{selectedPPMP.id}</span></h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
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

                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Requested Items</h4>
                        {selectedPPMP.items.length > 0 ? (
                            <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Item Number</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Item Description</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Quantity</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
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
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-6">
                                <p className="text-gray-500 font-medium">No items yet in the inventory for this project.</p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button onClick={closeModal} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <nav className="bg-indigo-700 text-white shadow-md z-10 shrink-0">
                <div className="flex items-center justify-between px-6 lg:px-8 h-16">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold tracking-tight mr-8">InvTrack</h1>
                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-2">
                                <span onClick={() => navigate('/dashboard')} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                                    Dashboard
                                </span>
                                <span onClick={() => navigate('/inventory')} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                                    Inventory
                                </span>
                                <div className="relative">
                                    <button onClick={() => setProcurementOpen(!procurementOpen)} onBlur={() => setTimeout(() => setProcurementOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                        Procurement
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {procurementOpen && (
                                        <div className="absolute mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                                        <span onMouseDown={() => navigate('/request')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Requisition</span>
                                        <span onMouseDown={() => navigate('/purchase-requests')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Purchase Requests</span>
                                        <span onMouseDown={() => navigate('/purchase-orders')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Purchase Orders</span>
                                        <span onMouseDown={() => navigate('/ppmp')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer font-medium bg-gray-50">PPMP (Project Procurement Monitoring Plan)</span>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <button onClick={() => setSettingsOpen(!settingsOpen)} onBlur={() => setTimeout(() => setSettingsOpen(false), 150)} className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center">
                                        Settings
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {settingsOpen && (
                                        <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                                            <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Preferences</span>
                                            <span onMouseDown={() => navigate('/login')} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer border-t border-gray-50">Log out</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-6xl mb-6 flex justify-between items-center mt-2">
                    <h2 className="text-2xl font-bold text-gray-800">PPMP</h2>
                </div>
                
                <div className="bg-white shadow-sm rounded-xl border border-gray-100 w-full max-w-6xl overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {ppmps.map((ppmp) => (
                            <li key={ppmp.id} className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleViewDetails(ppmp)}>
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
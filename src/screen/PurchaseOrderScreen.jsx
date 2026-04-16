import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PurchaseOrderScreen() {
    const navigate = useNavigate();
    const [procurementOpen, setProcurementOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Mock data reflecting the structure from PurchaseRequestScreen
    const [purchaseOrders] = useState([
        {
            id: 'PO-1001',
            requesterName: 'John Doe',
            department: 'Finance',
            requestDate: '2026-04-08',
            status: 'Approved',
            items: [
                { itemNumber: 'PEN-01', itemDescription: 'Blue Pens', quantity: 50, unit: 'boxes' },
                { itemNumber: 'PAP-02', itemDescription: 'A4 Paper', quantity: 20, unit: 'reams' }
            ]
        },
        {
            id: 'PO-1002',
            requesterName: 'Jane Smith',
            department: 'IT',
            requestDate: '2026-04-09',
            status: 'Pending',
            items: [
                { itemNumber: 'LAP-01', itemDescription: 'Developer Laptops', quantity: 2, unit: 'pcs' },
                { itemNumber: 'MOU-05', itemDescription: 'Wireless Mouse', quantity: 5, unit: 'pcs' }
            ]
        }
    ]);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-800">Purchase Order Details: <span className="text-indigo-600">{selectedOrder.id}</span></h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        {/* Requester Info Read-Only */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Requester Name</p>
                                <p className="font-semibold text-gray-900">{selectedOrder.requesterName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                                <p className="font-semibold text-gray-900">{selectedOrder.department}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Date of Request</p>
                                <p className="font-semibold text-gray-900">{selectedOrder.requestDate}</p>
                            </div>
                        </div>

                        {/* Items Table Read-Only */}
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 shrink-0">Requested Items</h4>
                        <div className="overflow-x-auto overflow-y-auto flex-1 border border-gray-200 rounded-lg mb-6 min-h-0">
                            <table className="min-w-full divide-y divide-gray-200 relative">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Item Number</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Item Description</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Quantity</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedOrder.items.map((item, index) => (
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

                        <div className="flex justify-end shrink-0 pt-4 border-t border-gray-200 mt-auto">
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
                                        <span onMouseDown={() => navigate('/purchase-orders')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer font-medium bg-gray-50">Purchase Orders</span>
                                        <span onMouseDown={() => navigate('/ppmp')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">PPMP (Project Procurement Monitoring Plan)</span>
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
            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                <div className="w-full max-w-6xl mx-auto mb-6 flex justify-between items-center mt-2 shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
                </div>
                
                <div className="bg-white shadow-sm rounded-xl border border-gray-100 mx-auto w-full max-w-6xl flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <table className="min-w-full divide-y divide-gray-200 relative">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {purchaseOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.requesterName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.department}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.requestDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleViewDetails(order)} className="text-indigo-600 hover:text-indigo-900 transition-colors">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
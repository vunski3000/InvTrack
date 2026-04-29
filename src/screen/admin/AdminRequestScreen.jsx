import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navigation from './Navigation';

export default function AdminRequestScreen() {
    const navigate = useNavigate();

    // Mock data reflecting the structure submitted from RequestScreen (Staff side)
    const [requests, setRequests] = useState([
        {
            id: 'REQ-2026-001',
            name: 'Alice Johnson',
            designation: 'Staff',
            department: 'IT',
            requestDate: '2026-04-20',
            status: 'Pending',
            items: [
                { itemNumber: 'LAP-01', itemDescription: 'Developer Laptop', quantity: '1', unit: 'pc' },
                { itemNumber: 'MOU-05', itemDescription: 'Wireless Mouse', quantity: '1', unit: 'pc' }
            ]
        },
        {
            id: 'REQ-2026-002',
            name: 'Bob Smith',
            designation: 'Manager',
            department: 'Sales',
            requestDate: '2026-04-21',
            status: 'Approved',
            items: [
                { itemNumber: 'PEN-01', itemDescription: 'Blue Pens', quantity: '10', unit: 'boxes' },
                { itemNumber: 'PAP-02', itemDescription: 'A4 Paper', quantity: '5', unit: 'reams' }
            ]
        }
    ]);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    const updateStatus = (newStatus) => {
        setRequests(prev => prev.map(req => 
            req.id === selectedRequest.id ? { ...req, status: newStatus } : req
        ));
        setSelectedRequest({ ...selectedRequest, status: newStatus });
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
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-800">Requisition Details: <span className="text-indigo-600">{selectedRequest.id}</span></h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                        </div>
                        
                        {/* Requester Info Read-Only */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Requester Name</p>
                                <p className="font-semibold text-gray-900">{selectedRequest.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Designation</p>
                                <p className="font-semibold text-gray-900">{selectedRequest.designation}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                                <p className="font-semibold text-gray-900">{selectedRequest.department}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Date of Request</p>
                                <p className="font-semibold text-gray-900">{selectedRequest.requestDate}</p>
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
                                    {selectedRequest.items.map((item, index) => (
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

                        <div className="flex justify-between shrink-0 pt-4 border-t border-gray-200 mt-auto">
                            <div className="flex space-x-3">
                                {selectedRequest.status === 'Pending' && (
                                    <>
                                        <button onClick={() => updateStatus('Approved')} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium shadow-sm">
                                            Approve
                                        </button>
                                        <button onClick={() => updateStatus('Rejected')} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium shadow-sm">
                                            Reject
                                        </button>
                                    </>
                                )}
                            </div>
                            <button onClick={closeModal} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium shadow-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <Navigation />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-6xl mb-6 flex justify-between items-center mt-2">
                    <h2 className="text-2xl font-bold text-gray-800">Staff Requisitions</h2>
                </div>
                
                <div className="bg-white shadow-sm rounded-xl border border-gray-100 w-full max-w-6xl overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {requests.map((req) => (
                            <li key={req.id} className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center" onClick={() => handleViewDetails(req)}>
                                <div className="flex flex-col">
                                    <span className="text-lg font-medium text-gray-900">{req.id} - {req.name}</span>
                                    <span className="text-sm text-gray-500">{req.department} Department • {req.designation}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-500 hidden sm:block">{req.requestDate}</span>
                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(req.status)}`}>
                                        {req.status}
                                    </span>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
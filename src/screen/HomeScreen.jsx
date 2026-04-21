import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeScreen() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-600 mb-6">Welcome to Invtrack</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10">Your Inventory, Simplified.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="px-8 py-3 bg-indigo-600 text-white text-lg font-medium rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-200 ease-in-out">
                    Login as Admin
                </Link>
                <Link to="/staff-login" className="px-8 py-3 bg-white text-indigo-600 border border-indigo-600 text-lg font-medium rounded-lg shadow-md hover:bg-indigo-50 hover:shadow-lg transition-all duration-200 ease-in-out">
                    Login as Staff
                </Link>
            </div>
        </div>
    );
}
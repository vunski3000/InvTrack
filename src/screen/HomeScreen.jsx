import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeScreen() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-600 mb-6">Welcome to Invtrack</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10">Your Inventory, Simplified.</p>
            
            <Link to="/login" className="px-8 py-3 bg-indigo-600 text-white text-lg font-medium rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-200 ease-in-out">
                Go to Login
            </Link>
        </div>
    );
}
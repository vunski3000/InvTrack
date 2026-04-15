import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './screen/LoginScreen.jsx'
import SignupScreen from './screen/SignupScreen.jsx'
import HomeScreen from './screen/HomeScreen.jsx'
import InventoryScreen from './screen/InventoryScreen.jsx'
import DashboardScreen from './screen/DashboardScreen.jsx'
import RequestScreen from './screen/RequestScreen.jsx'
import PurchaseOrderScreen from './screen/PurchaseOrderScreen.jsx'
import PurchaseRequestScreen from './screen/PurchaseRequestScreen.jsx'
import PPMPScreen from './screen/PPMPScreen'
import NewItemScreen from './screen/NewItemScreen.jsx'

function App() {
  return (
    <Router>
      <div className="flex-1 min-h-screen">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
          <Route path="/request" element={<RequestScreen />} />
          <Route path="/purchase-orders" element={<PurchaseOrderScreen />} />
          <Route path="/purchase-requests" element={<PurchaseRequestScreen />} />
          <Route path="/ppmp" element={<PPMPScreen />} />
          <Route path="/new-item" element={<NewItemScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
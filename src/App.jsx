import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLoginScreen from './screen/AdminLoginScreen.jsx'
import StaffLoginScreen from './screen/StaffLoginScreen.jsx'
import SignupScreen from './screen/SignupScreen.jsx'
import HomeScreen from './screen/HomeScreen.jsx'
import InventoryScreen from './screen/InventoryScreen.jsx'
import DashboardScreen from './screen/DashboardScreen.jsx'
import StaffRequestScreen from './screen/StaffRequestScreen.jsx'
import PurchaseOrderScreen from './screen/PurchaseOrderScreen.jsx'
import PurchaseRequestScreen from './screen/PurchaseRequestScreen.jsx'
import AdminRequestScreen from './screen/AdminRequestScreen.jsx'
import PPMPScreen from './screen/PPMPScreen'
import NewItemScreen from './screen/NewItemScreen.jsx'
import StaffNavigation from './screen/StaffNavigation.jsx'
import StaffDashboardScreen from './screen/StaffDashboardScreen.jsx'
import StaffInventoryScreen from './screen/StaffInventoryScreen.jsx'
import StaffPPMPScreen from './screen/StaffPPMPScreen.jsx'

function App() {
  return (
    <Router>
      <div className="flex-1 min-h-screen">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/login" element={<AdminLoginScreen />} />
          <Route path="/staff-login" element={<StaffLoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
          <Route path="/staff-request" element={<StaffRequestScreen />} />
          <Route path="/purchase-orders" element={<PurchaseOrderScreen />} />
          <Route path="/purchase-requests" element={<PurchaseRequestScreen />} />
          <Route path="/admin-requests" element={<AdminRequestScreen />} />
          <Route path="/ppmp" element={<PPMPScreen />} />
          <Route path="/new-item" element={<NewItemScreen />} />
          <Route path="/staff-dashboard" element={<StaffDashboardScreen />} />
          <Route path="/staff-inventory" element={<StaffInventoryScreen />} />
          <Route path="/staff-ppmp" element={<StaffPPMPScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
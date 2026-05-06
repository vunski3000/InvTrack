import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLoginScreen from './screen/admin/AdminLoginScreen.jsx'
import StaffLoginScreen from './screen/staff/StaffLoginScreen.jsx'
import SignupScreen from './screen/SignupScreen.jsx'
import HomeScreen from './screen/HomeScreen.jsx'
import InventoryScreen from './screen/admin/InventoryScreen.jsx'
import DashboardScreen from './screen/admin/DashboardScreen.jsx'
import StaffRequestScreen from './screen/staff/StaffRequestScreen.jsx'
import PurchaseOrderScreen from './screen/admin/PurchaseOrderScreen.jsx'
import PurchaseRequestScreen from './screen/admin/PurchaseRequestScreen.jsx'
import AdminRequestScreen from './screen/admin/AdminRequestScreen.jsx'
import PPMPScreen from './screen/admin/PPMPScreen.jsx'
import StaffNavigation from './screen/staff/StaffNavigation.jsx'
import PersonnelScreen from './screen/admin/PersonnelScreen.jsx'
import StaffDashboardScreen from './screen/staff/StaffDashboardScreen.jsx'
import StaffInventoryScreen from './screen/staff/StaffInventoryScreen.jsx'
import StaffPPMPScreen from './screen/staff/StaffPPMPScreen.jsx'
import StaffMyRequestsScreen from './screen/staff/StaffMyRequestsScreen.jsx'

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
          <Route path="/personnel" element={<PersonnelScreen />} />
          <Route path="/staff-dashboard" element={<StaffDashboardScreen />} />
          <Route path="/staff-inventory" element={<StaffInventoryScreen />} />
          <Route path="/staff-ppmp" element={<StaffPPMPScreen />} />
          <Route path="/my-requests" element={<StaffMyRequestsScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
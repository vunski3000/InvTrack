import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLoginScreen from './screen/admin/AdminLoginScreen.jsx'
import StaffLoginScreen from './screen/staff/StaffLoginScreen.jsx'
import ProtectedRoute from './screen/ProtectedRoute.jsx'
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
import StaffSignupScreen from './screen/staff/StaffSignupScreen.jsx'
import AuditScreen from './screen/admin/AuditScreen.jsx'

function App() {
  return (
    <Router>
      <div className="flex-1 min-h-screen">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/login" element={<AdminLoginScreen />} />
          <Route path="/staff-login" element={<StaffLoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/staff-signup" element={<StaffSignupScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          {/* Admin Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><DashboardScreen /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><InventoryScreen /></ProtectedRoute>} />
          <Route path="/purchase-orders" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><PurchaseOrderScreen /></ProtectedRoute>} />
          <Route path="/purchase-requests" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><PurchaseRequestScreen /></ProtectedRoute>} />
          <Route path="/admin-requests" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><AdminRequestScreen /></ProtectedRoute>} />
          <Route path="/ppmp" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><PPMPScreen /></ProtectedRoute>} />
          <Route path="/personnel" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><PersonnelScreen /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login"><AuditScreen /></ProtectedRoute>} />

          {/* Staff Protected Routes */}
          <Route path="/staff-dashboard" element={<ProtectedRoute allowedRoles={['staff']} redirectTo="/staff-login"><StaffDashboardScreen /></ProtectedRoute>} />
          <Route path="/staff-request" element={<ProtectedRoute allowedRoles={['staff']} redirectTo="/staff-login"><StaffRequestScreen /></ProtectedRoute>} />
          <Route path="/staff-inventory" element={<ProtectedRoute allowedRoles={['staff']} redirectTo="/staff-login"><StaffInventoryScreen /></ProtectedRoute>} />
          <Route path="/staff-ppmp" element={<ProtectedRoute allowedRoles={['staff']} redirectTo="/staff-login"><StaffPPMPScreen /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute allowedRoles={['staff']} redirectTo="/staff-login"><StaffMyRequestsScreen /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
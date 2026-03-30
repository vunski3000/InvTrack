import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './screen/LoginScreen.jsx'
import SignupScreen from './screen/SignupScreen.jsx'
import HomeScreen from './screen/HomeScreen.jsx'
import InventoryScreen from './screen/InventoryScreen.jsx'
import DashboardScreen from './screen/DashboardScreen.jsx'
import RequestScreen from './screen/RequestScreen.jsx'

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
        </Routes>
      </div>
    </Router>
  );
}

export default App
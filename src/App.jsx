import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './screen/LoginScreen.jsx'
import HomeScreen from './screen/HomeScreen.jsx'
import DashboardScreen from './screen/DashboardScreen.jsx'

// Placeholder components for routing
const RegisterScreen = () => <div className="flex-1 flex justify-center items-center h-screen"><p className="text-2xl">Registration Screen</p></div>;

function App() {
  return (
    <Router>
      <div className="flex-1 min-h-screen">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import PremiumHome from './pages/PremiumHome';
import Dashboard from './pages/Dashboard';
import PremiumRegister from './pages/PremiumRegister';
import PremiumLogin from './pages/PremiumLogin';
import PremiumBooking from './pages/PremiumBooking';
import AddField from './pages/AddField';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Layout>
          <Routes>
            <Route path="/" element={<PremiumHome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<PremiumRegister />} />
            <Route path="/login" element={<PremiumLogin />} />
            <Route path="/booking" element={<PremiumBooking />} />
            <Route path="/add-field" element={<AddField />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
};

export default App;
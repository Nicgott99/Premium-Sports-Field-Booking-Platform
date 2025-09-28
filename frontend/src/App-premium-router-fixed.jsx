import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PremiumNavbar from './components/PremiumNavbar';
import UltraPremiumHome from './pages/UltraPremiumHome';
import WorkingFields from './pages/WorkingFields';
import FieldDetails from './pages/FieldDetails';
import WorkingBookings from './pages/WorkingBookings';
import Profile from './pages/Profile';
import WorkingAbout from './pages/WorkingAbout';
import WorkingContact from './pages/WorkingContact';
import PremiumLogin from './pages/PremiumLogin';
import PremiumRegister from './pages/PremiumRegister';
import WorkingDashboard from './pages/WorkingDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative">
        {/* NAVIGATION */}
        <PremiumNavbar />

        {/* MAIN CONTENT */}
        <main className="relative">
          <Routes>
            <Route path="/" element={<UltraPremiumHome />} />
            <Route path="/fields" element={<WorkingFields />} />
            <Route path="/fields/:id" element={<FieldDetails />} />
            <Route path="/bookings" element={<WorkingBookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<WorkingAbout />} />
            <Route path="/contact" element={<WorkingContact />} />
            <Route path="/login" element={<PremiumLogin />} />
            <Route path="/register" element={<PremiumRegister />} />
            <Route path="/dashboard" element={<WorkingDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
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
import WorkingFields from './pages/WorkingFields';
import FieldDetails from './pages/FieldDetails';
import WorkingBookings from './pages/WorkingBookings';
import Profile from './pages/Profile';
import WorkingContact from './pages/WorkingContact';
import WorkingAbout from './pages/WorkingAbout';
import NotFound from './pages/NotFound';
import SearchPage from './pages/SearchPage';
import LoyaltyProgram from './pages/LoyaltyProgram';
import TournamentPage from './pages/TournamentPage';
import TeamManagement from './pages/TeamManagement';
import PricingCalculator from './pages/PricingCalculator';
import MembershipPlans from './pages/MembershipPlans';
import NotificationsPage from './pages/NotificationsPage';
import HelpCenter from './pages/HelpCenter';

const App = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f0c29,#1a1040,#0f0c29)' }}>
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
            <Route path="/fields" element={<WorkingFields />} />
            <Route path="/fields/:id" element={<FieldDetails />} />
            <Route path="/bookings" element={<WorkingBookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<WorkingContact />} />
            <Route path="/about" element={<WorkingAbout />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/loyalty" element={<LoyaltyProgram />} />
            <Route path="/tournaments" element={<TournamentPage />} />
            <Route path="/teams" element={<TeamManagement />} />
            <Route path="/pricing" element={<PricingCalculator />} />
            <Route path="/membership" element={<MembershipPlans />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
};

export default App;

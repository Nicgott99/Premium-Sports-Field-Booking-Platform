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
import FieldComparison from './pages/FieldComparison';
import ReferralProgram from './pages/ReferralProgram';
import LeaderboardPage from './pages/LeaderboardPage';
import SchedulePage from './pages/SchedulePage';
import PromotionsPage from './pages/PromotionsPage';
import SportsStatsPage from './pages/SportsStatsPage';
import MapView from './pages/MapView';
import QuickBookWidget from './pages/QuickBookWidget';
import FieldOwnerPortal from './pages/FieldOwnerPortal';
import VenueDashboard from './pages/VenueDashboard';
import ReservationManagement from './pages/ReservationManagement';
import EventsCalendar from './pages/EventsCalendar';
import AchievementsPage from './pages/AchievementsPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import BookingCalendar from './pages/BookingCalendar';
import ChatMessaging from './pages/ChatMessaging';
import CoachConnect from './pages/CoachConnect';
import CommunityFeed from './pages/CommunityFeed';
import LiveSessions from './pages/LiveSessions';
import PlayerProfilePage from './pages/PlayerProfilePage';
import ReviewsPage from './pages/ReviewsPage';
import SettingsPage from './pages/SettingsPage';
import SportsNewsPage from './pages/SportsNewsPage';
import TrainingCenter from './pages/TrainingCenter';
import WalletPage from './pages/WalletPage';

const App = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#051424' }}>
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
            <Route path="/compare" element={<FieldComparison />} />
            <Route path="/referral" element={<ReferralProgram />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/stats" element={<SportsStatsPage />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/quick-book" element={<QuickBookWidget />} />
            <Route path="/owner-portal" element={<FieldOwnerPortal />} />
            <Route path="/venue-dashboard" element={<VenueDashboard />} />
            <Route path="/reservations" element={<ReservationManagement />} />
            <Route path="/events" element={<EventsCalendar />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/book-calendar" element={<BookingCalendar />} />
            <Route path="/chat" element={<ChatMessaging />} />
            <Route path="/coaches" element={<CoachConnect />} />
            <Route path="/community" element={<CommunityFeed />} />
            <Route path="/live" element={<LiveSessions />} />
            <Route path="/players/:id" element={<PlayerProfilePage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/news" element={<SportsNewsPage />} />
            <Route path="/training" element={<TrainingCenter />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
};

export default App;

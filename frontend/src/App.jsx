import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const PremiumHome = React.lazy(() => import('./pages/PremiumHome'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const PremiumRegister = React.lazy(() => import('./pages/PremiumRegister'));
const PremiumLogin = React.lazy(() => import('./pages/PremiumLogin'));
const PremiumBooking = React.lazy(() => import('./pages/PremiumBooking'));
const AddField = React.lazy(() => import('./pages/AddField'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const WorkingFields = React.lazy(() => import('./pages/WorkingFields'));
const FieldDetails = React.lazy(() => import('./pages/FieldDetails'));
const WorkingBookings = React.lazy(() => import('./pages/WorkingBookings'));
const Profile = React.lazy(() => import('./pages/Profile'));
const WorkingContact = React.lazy(() => import('./pages/WorkingContact'));
const WorkingAbout = React.lazy(() => import('./pages/WorkingAbout'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const LoyaltyProgram = React.lazy(() => import('./pages/LoyaltyProgram'));
const TournamentPage = React.lazy(() => import('./pages/TournamentPage'));
const TeamManagement = React.lazy(() => import('./pages/TeamManagement'));
const PricingCalculator = React.lazy(() => import('./pages/PricingCalculator'));
const MembershipPlans = React.lazy(() => import('./pages/MembershipPlans'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter'));
const FieldComparison = React.lazy(() => import('./pages/FieldComparison'));
const ReferralProgram = React.lazy(() => import('./pages/ReferralProgram'));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'));
const SchedulePage = React.lazy(() => import('./pages/SchedulePage'));
const PromotionsPage = React.lazy(() => import('./pages/PromotionsPage'));
const SportsStatsPage = React.lazy(() => import('./pages/SportsStatsPage'));
const MapView = React.lazy(() => import('./pages/MapView'));
const QuickBookWidget = React.lazy(() => import('./pages/QuickBookWidget'));
const FieldOwnerPortal = React.lazy(() => import('./pages/FieldOwnerPortal'));
const VenueDashboard = React.lazy(() => import('./pages/VenueDashboard'));
const ReservationManagement = React.lazy(() => import('./pages/ReservationManagement'));
const EventsCalendar = React.lazy(() => import('./pages/EventsCalendar'));
const AchievementsPage = React.lazy(() => import('./pages/AchievementsPage'));
const AnalyticsDashboard = React.lazy(() => import('./pages/AnalyticsDashboard'));
const BookingCalendar = React.lazy(() => import('./pages/BookingCalendar'));
const ChatMessaging = React.lazy(() => import('./pages/ChatMessaging'));
const CoachConnect = React.lazy(() => import('./pages/CoachConnect'));
const CommunityFeed = React.lazy(() => import('./pages/CommunityFeed'));
const LiveSessions = React.lazy(() => import('./pages/LiveSessions'));
const PlayerProfilePage = React.lazy(() => import('./pages/PlayerProfilePage'));
const ReviewsPage = React.lazy(() => import('./pages/ReviewsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const SportsNewsPage = React.lazy(() => import('./pages/SportsNewsPage'));
const TrainingCenter = React.lazy(() => import('./pages/TrainingCenter'));
const WalletPage = React.lazy(() => import('./pages/WalletPage'));

const PageLoader = () => <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#506070' }}>Loading...</div>;

const App = () => {
  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#051424' }}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Layout>
            <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </Layout>
      </Router>
      </div>
    </ErrorBoundary>
  );
};

export default App;

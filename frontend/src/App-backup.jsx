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

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Redux Actions
import { initializeAuth } from './store/slices/authSlice';
import { initializeApp, setOnlineStatus } from './store/slices/appSlice';

// Socket connection
import { initializeSocket, disconnectSocket } from './services/socketService';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Fields = React.lazy(() => import('./pages/Fields'));
const FieldDetails = React.lazy(() => import('./pages/FieldDetails'));
const Bookings = React.lazy(() => import('./pages/Bookings'));
const BookingDetails = React.lazy(() => import('./pages/BookingDetails'));
const CreateBooking = React.lazy(() => import('./pages/CreateBooking'));
const Teams = React.lazy(() => import('./pages/Teams'));
const TeamDetails = React.lazy(() => import('./pages/TeamDetails'));
const CreateTeam = React.lazy(() => import('./pages/CreateTeam'));
const Tournaments = React.lazy(() => import('./pages/Tournaments'));
const TournamentDetails = React.lazy(() => import('./pages/TournamentDetails'));
const Players = React.lazy(() => import('./pages/Players'));
const PlayerProfile = React.lazy(() => import('./pages/PlayerProfile'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Help = React.lazy(() => import('./pages/Help'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Subscription = React.lazy(() => import('./pages/Subscription'));
const Payment = React.lazy(() => import('./pages/Payment'));
const Analytics = React.lazy(() => import('./pages/Analytics'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminFields = React.lazy(() => import('./pages/admin/AdminFields'));
const AdminBookings = React.lazy(() => import('./pages/admin/AdminBookings'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));

// Error Pages
const NotFound = React.lazy(() => import('./pages/errors/NotFound'));
const ServerError = React.lazy(() => import('./pages/errors/ServerError'));
const Maintenance = React.lazy(() => import('./pages/errors/Maintenance'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading: authLoading } = useSelector((state) => state.auth);
  const { isInitialized, isOnline, sidebarOpen } = useSelector((state) => state.app);

  useEffect(() => {
    // Initialize AOS (Animate On Scroll)
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
    });

    // Initialize app
    dispatch(initializeApp());
    dispatch(initializeAuth());

    // Setup online/offline detection
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  useEffect(() => {
    // Initialize socket connection when user is authenticated
    if (isAuthenticated && user) {
      initializeSocket(user.id);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  // Show loading screen while app is initializing
  if (!isInitialized || authLoading) {
    return <PageLoader />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
        <Helmet>
          <title>CSE471 Premium Sports Platform</title>
          <meta name="description" content="Premium sports booking and community platform - Book fields, find players, join teams, and compete in tournaments." />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="theme-color" content="#1f2937" />
          <link rel="canonical" href={window.location.href} />
        </Helmet>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-warning-500 text-white text-center py-2 px-4 text-sm font-medium">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              You're currently offline. Some features may not be available.
            </span>
          </div>
        )}

        {/* Header */}
        <Header />

        {/* Main Layout */}
        <div className="flex">
          {/* Sidebar - Only show when authenticated */}
          {isAuthenticated && (
            <>
              <Sidebar />
              {/* Mobile sidebar overlay */}
              {sidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                  onClick={() => dispatch(setSidebarOpen(false))}
                />
              )}
            </>
          )}

          {/* Main Content */}
          <main className={`flex-1 transition-all duration-300 ${
            isAuthenticated ? 'lg:ml-64' : ''
          }`}>
            <div className="min-h-screen">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                  } />
                  <Route path="/register" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
                  } />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/help" element={<Help />} />

                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Fields Routes */}
                  <Route path="/fields" element={<Fields />} />
                  <Route path="/fields/:id" element={<FieldDetails />} />

                  {/* Bookings Routes */}
                  <Route path="/bookings" element={
                    <ProtectedRoute>
                      <Bookings />
                    </ProtectedRoute>
                  } />
                  <Route path="/bookings/create" element={
                    <ProtectedRoute>
                      <CreateBooking />
                    </ProtectedRoute>
                  } />
                  <Route path="/bookings/:id" element={
                    <ProtectedRoute>
                      <BookingDetails />
                    </ProtectedRoute>
                  } />

                  {/* Teams Routes */}
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/teams/create" element={
                    <ProtectedRoute>
                      <CreateTeam />
                    </ProtectedRoute>
                  } />
                  <Route path="/teams/:id" element={<TeamDetails />} />

                  {/* Tournaments Routes */}
                  <Route path="/tournaments" element={<Tournaments />} />
                  <Route path="/tournaments/:id" element={<TournamentDetails />} />

                  {/* Players Routes */}
                  <Route path="/players" element={<Players />} />
                  <Route path="/players/:id" element={<PlayerProfile />} />

                  {/* Communication Routes */}
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } />

                  {/* Settings and Subscription */}
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/subscription" element={
                    <ProtectedRoute>
                      <Subscription />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment" element={
                    <ProtectedRoute>
                      <Payment />
                    </ProtectedRoute>
                  } />

                  {/* Analytics */}
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/admin/users" element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  } />
                  <Route path="/admin/fields" element={
                    <AdminRoute>
                      <AdminFields />
                    </AdminRoute>
                  } />
                  <Route path="/admin/bookings" element={
                    <AdminRoute>
                      <AdminBookings />
                    </AdminRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <AdminRoute>
                      <AdminReports />
                    </AdminRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <AdminRoute>
                      <AdminSettings />
                    </AdminRoute>
                  } />

                  {/* Error Routes */}
                  <Route path="/500" element={<ServerError />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>

        {/* Footer - Only show on public pages */}
        {!isAuthenticated && <Footer />}
      </div>
    </Router>
  );
}

export default App;
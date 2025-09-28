import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      alert('Please login to access dashboard');
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadUserBookings();
  }, [navigate]);

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookings/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-24 px-4 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please login to access your dashboard</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">👤 My Dashboard</h1>
          <p className="text-gray-300 text-lg">Welcome back, {user.firstName}!</p>
          {user.isAdmin && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
              >
                👑 Go to Admin Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/booking')}
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all text-left"
          >
            <div className="text-4xl mb-4">🏟️</div>
            <h3 className="text-xl font-bold text-white mb-2">Book a Field</h3>
            <p className="text-gray-300">Reserve your next game session</p>
          </button>

          <button
            onClick={() => navigate('/add-field')}
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all text-left"
          >
            <div className="text-4xl mb-4">➕</div>
            <h3 className="text-xl font-bold text-white mb-2">Add Your Field</h3>
            <p className="text-gray-300">Submit your field for approval</p>
          </button>

          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Your Stats</h3>
            <p className="text-gray-300">{userBookings.length} total bookings</p>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">📅 Recent Bookings</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400">Loading bookings...</p>
            </div>
          ) : userBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No bookings yet</p>
              <button
                onClick={() => navigate('/booking')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
              >
                Make Your First Booking
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBookings.slice(0, 6).map(booking => (
                <div key={booking._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-white font-bold">{booking.field?.name}</h3>
                  <p className="text-blue-300 text-sm">{booking.field?.type}</p>
                  <p className="text-gray-300 text-sm">📅 {new Date(booking.date).toLocaleDateString()}</p>
                  <p className="text-gray-300 text-sm">⏰ {booking.startTime} - {booking.endTime}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                      booking.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {booking.status.toUpperCase()}
                    </span>
                    <span className="text-green-400 font-bold">${booking.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
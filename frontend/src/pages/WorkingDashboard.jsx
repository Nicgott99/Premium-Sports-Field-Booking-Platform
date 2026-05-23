import React, { useState, useEffect } from 'react';

const WorkingDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    favoriteFields: 0,
    totalSpent: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      globalThis.location.href = '/login';
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [profileRes, bookingsRes] = await Promise.all([
          fetch('/api/v1/auth/profile', { headers }),
          fetch('/api/v1/bookings?limit=5&sort=-createdAt', { headers })
        ]);

        if (profileRes.status === 401 || bookingsRes.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          globalThis.location.href = '/login';
          return;
        }

        const profileData = await profileRes.json();
        const bookingsData = await bookingsRes.json();

        if (!profileRes.ok) throw new Error(profileData.message || 'Failed to load profile');

        const userData = profileData.data?.user ?? profileData.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        const bookingsList = bookingsData.data?.bookings ?? bookingsData.data ?? [];
        setRecentBookings(bookingsList.slice(0, 3));

        const allBookings = bookingsList;
        const upcoming = allBookings.filter(b => b.status === 'confirmed').length;
        const totalSpent = allBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount ?? b.price ?? 0), 0);

        setStats({
          totalBookings: bookingsData.data?.total ?? allBookings.length,
          upcomingBookings: upcoming,
          favoriteFields: userData?.stats?.favoriteFields?.length ?? 0,
          totalSpent
        });
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    if (globalThis.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      globalThis.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">📊</div>
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Loading Dashboard...</h2>
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-8xl mb-6">⚠️</div>
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Error</h2>
          <p className="text-xl text-gray-300 mb-6">{error}</p>
          <button onClick={() => globalThis.location.reload()} className="premium-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-8xl mb-6">🔒</div>
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Access Denied</h2>
          <p className="text-xl text-gray-300 mb-6">Please login to access your dashboard</p>
          <button
            onClick={() => { globalThis.location.href = '/login'; }}
            className="premium-btn"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : user.name ?? user.email ?? 'User';

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-7xl mx-auto">

        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black premium-gradient-text mb-2">
                Welcome Back, {displayName}! 👋
              </h1>
              <p className="text-xl text-gray-300">
                Here's your sports activity overview
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => { globalThis.location.href = '/fields'; }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                🏟️ Quick Book
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { title: 'Total Bookings', value: stats.totalBookings, icon: '📊', color: 'from-blue-500 to-cyan-500' },
            { title: 'Upcoming Bookings', value: stats.upcomingBookings, icon: '⏰', color: 'from-green-500 to-emerald-500' },
            { title: 'Favorite Fields', value: stats.favoriteFields, icon: '⭐', color: 'from-yellow-500 to-orange-500' },
            { title: 'Total Spent', value: `৳${stats.totalSpent.toLocaleString()}`, icon: '💰', color: 'from-purple-500 to-violet-500' }
          ].map((stat) => (
            <div key={stat.title} className="premium-card text-center">
              <div className="text-4xl mb-3">{stat.icon}</div>
              <h3 className="text-white font-semibold mb-2">{stat.title}</h3>
              <div className={`text-3xl font-black mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="premium-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">📅 Recent Bookings</h2>
                <button
                  onClick={() => { globalThis.location.href = '/bookings'; }}
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  View All →
                </button>
              </div>

              {recentBookings.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No bookings yet. Book your first field!</p>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => {
                    const bookingId = booking._id || booking.id;
                    const fieldName = booking.field?.name ?? booking.fieldName ?? 'Unknown Field';
                    const sport = booking.sport ?? 'N/A';
                    const amount = booking.pricing?.totalAmount ?? booking.price ?? 0;
                    return (
                      <div key={bookingId} className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{fieldName}</h4>
                          <p className="text-gray-400 text-sm">{sport} • {booking.date} at {booking.startTime}</p>
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'confirmed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {booking.status?.toUpperCase()}
                          </div>
                          <p className="text-white font-semibold mt-1">৳{amount}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">

            {/* Profile Summary */}
            <div className="premium-card">
              <h3 className="text-xl font-bold text-white mb-4">👤 Profile</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white ml-2 font-semibold">{displayName}</span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white ml-2">{user.email}</span>
                </div>
                {user.phone && (
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white ml-2">{user.phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Verified:</span>
                  <span className={`ml-2 font-semibold ${user.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                    {user.isVerified ? '✅ Yes' : '⚠️ No'}
                  </span>
                </div>
                <button
                  onClick={() => { globalThis.location.href = '/profile'; }}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="premium-card">
              <h3 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => { globalThis.location.href = '/fields'; }}
                  className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>🏟️</span>
                  <span>Book New Field</span>
                </button>
                <button
                  onClick={() => { globalThis.location.href = '/bookings'; }}
                  className="w-full p-3 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>📅</span>
                  <span>My Bookings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingDashboard;

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

  useEffect(() => {
    // Get user data from localStorage (simulated login)
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if not authenticated
      alert('Please login to access dashboard');
      window.location.href = '/login';
      return;
    }

    // Simulate loading dashboard data
    setTimeout(() => {
      setStats({
        totalBookings: 12,
        upcomingBookings: 3,
        favoriteFields: 5,
        totalSpent: 45000
      });

      setRecentBookings([
        {
          id: 1,
          fieldName: 'Elite Champions Stadium',
          sport: 'Football',
          date: '2025-09-30',
          time: '16:00',
          status: 'confirmed',
          amount: 10000
        },
        {
          id: 2,
          fieldName: 'Thunder Basketball Arena',
          sport: 'Basketball',
          date: '2025-10-01',
          time: '19:00',
          status: 'confirmed',
          amount: 6000
        },
        {
          id: 3,
          fieldName: 'Royal Tennis Club',
          sport: 'Tennis',
          date: '2025-09-28',
          time: '14:00',
          status: 'completed',
          amount: 2500
        }
      ]);
      
      setLoading(false);
    }, 1500);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('user');
      alert('Logged out successfully!');
      window.location.href = '/';
    }
  };

  const handleQuickBook = () => {
    alert('Quick booking feature would redirect to fields page with pre-filled preferences');
    window.location.href = '/fields';
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

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-8xl mb-6">🔒</div>
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Access Denied</h2>
          <p className="text-xl text-gray-300 mb-6">Please login to access your dashboard</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="premium-btn"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black premium-gradient-text mb-2">
                Welcome Back, {user.name}! 👋
              </h1>
              <p className="text-xl text-gray-300">
                Here's your sports activity overview
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleQuickBook}
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
            {
              title: 'Total Bookings',
              value: stats.totalBookings,
              icon: '📊',
              color: 'from-blue-500 to-cyan-500',
              change: '+2 this month'
            },
            {
              title: 'Upcoming Bookings',
              value: stats.upcomingBookings,
              icon: '⏰',
              color: 'from-green-500 to-emerald-500',
              change: 'Next: Today 4:00 PM'
            },
            {
              title: 'Favorite Fields',
              value: stats.favoriteFields,
              icon: '⭐',
              color: 'from-yellow-500 to-orange-500',
              change: '+1 this week'
            },
            {
              title: 'Total Spent',
              value: `৳${stats.totalSpent.toLocaleString()}`,
              icon: '💰',
              color: 'from-purple-500 to-violet-500',
              change: '+৳15,000 this month'
            }
          ].map((stat, index) => (
            <div key={index} className="premium-card text-center">
              <div className="text-4xl mb-3">{stat.icon}</div>
              <h3 className="text-white font-semibold mb-2">{stat.title}</h3>
              <div className={`text-3xl font-black mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <p className="text-gray-400 text-sm">{stat.change}</p>
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
                  onClick={() => window.location.href = '/bookings'}
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  View All →
                </button>
              </div>
              
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{booking.fieldName}</h4>
                      <p className="text-gray-400 text-sm">{booking.sport} • {booking.date} at {booking.time}</p>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {booking.status.toUpperCase()}
                      </div>
                      <p className="text-white font-semibold mt-1">৳{booking.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                  <span className="text-white ml-2 font-semibold">{user.name}</span>
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
                <button
                  onClick={() => window.location.href = '/profile'}
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
                  onClick={() => window.location.href = '/fields'}
                  className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>🏟️</span>
                  <span>Book New Field</span>
                </button>
                <button
                  onClick={() => alert('Feature coming soon: View and manage your favorite fields')}
                  className="w-full p-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>⭐</span>
                  <span>My Favorites</span>
                </button>
                <button
                  onClick={() => alert('Feature coming soon: Join tournaments and competitions')}
                  className="w-full p-3 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>🏆</span>
                  <span>Tournaments</span>
                </button>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="premium-card">
              <h3 className="text-xl font-bold text-white mb-4">📈 This Month</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Fields Booked:</span>
                  <span className="text-white font-semibold">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hours Played:</span>
                  <span className="text-white font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount Spent:</span>
                  <span className="text-white font-semibold">৳15,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Favorite Sport:</span>
                  <span className="text-white font-semibold">Football</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: '📊 Analytics',
              description: 'View detailed statistics about your sports activities',
              action: () => alert('Analytics feature would show detailed charts and statistics')
            },
            {
              title: '🎯 Goals',
              description: 'Set and track your fitness and sports goals',
              action: () => alert('Goals feature would allow setting monthly targets')
            },
            {
              title: '👥 Friends',
              description: 'Connect with other players and build your network',
              action: () => alert('Social features would allow connecting with other players')
            }
          ].map((feature, index) => (
            <div key={index} className="premium-card text-center cursor-pointer" onClick={feature.action}>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300 mb-4">{feature.description}</p>
              <button className="text-purple-400 hover:text-purple-300 font-semibold">
                Learn More →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkingDashboard;
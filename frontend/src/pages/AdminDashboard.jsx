import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [stats, setStats] = useState({});
  const [pendingFields, setPendingFields] = useState([]);
  const [approvedFields, setApprovedFields] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      alert('Please login as admin');
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (!parsedUser.isAdmin) {
      alert('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
    
    setUser(parsedUser);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load all data in parallel
      const [statsRes, fieldsRes, bookingsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/fields', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [statsData, fieldsData, bookingsData, usersData] = await Promise.all([
        statsRes.json(),
        fieldsRes.json(),
        bookingsRes.json(),
        usersRes.json()
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (fieldsData.success) {
        setPendingFields(fieldsData.fields.filter(f => f.status === 'pending'));
        setApprovedFields(fieldsData.fields.filter(f => f.status === 'approved'));
      }
      if (bookingsData.success) setAllBookings(bookingsData.bookings);
      if (usersData.success) setAllUsers(usersData.users);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldAction = async (fieldId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/fields/${fieldId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(`Field ${action}d successfully!`);
        loadDashboardData(); // Refresh data
      } else {
        alert(data.message || `Failed to ${action} field`);
      }
    } catch (error) {
      console.error(`Error ${action}ing field:`, error);
      alert(`Failed to ${action} field`);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Cancelled by admin' })
      });

      const data = await response.json();
      if (data.success) {
        alert('Booking cancelled successfully!');
        loadDashboardData(); // Refresh data
      } else {
        alert(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const tabs = [
    { id: 'overview', name: '📊 Overview', icon: '📊' },
    { id: 'fields', name: '🏟️ Field Management', icon: '🏟️' },
    { id: 'bookings', name: '📅 Booking Management', icon: '📅' },
    { id: 'users', name: '👥 User Management', icon: '👥' }
  ];

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-24 px-4 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="text-gray-300 mb-6">You need admin privileges to access this dashboard</p>
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
          <h1 className="text-4xl font-black text-white mb-2">⚡ Admin Dashboard</h1>
          <p className="text-gray-300 text-lg">Manage your sports platform</p>
          <p className="text-purple-300 text-sm mt-2">Welcome, Admin {user.firstName}!</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 bg-black/30 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-bold transition-all mx-1 mb-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Users</p>
                      <p className="text-3xl font-bold">{stats.totalUsers || allUsers.length}</p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Approved Fields</p>
                      <p className="text-3xl font-bold">{approvedFields.length}</p>
                    </div>
                    <div className="text-4xl">🏟️</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100">Pending Fields</p>
                      <p className="text-3xl font-bold">{pendingFields.length}</p>
                    </div>
                    <div className="text-4xl">⏳</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100">Total Bookings</p>
                      <p className="text-3xl font-bold">{allBookings.length}</p>
                    </div>
                    <div className="text-4xl">📅</div>
                  </div>
                </div>
              </div>
            )}

            {/* Field Management Tab */}
            {activeTab === 'fields' && (
              <div className="space-y-8">
                {/* Pending Fields */}
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">⏳ Pending Field Approvals ({pendingFields.length})</h2>
                  {pendingFields.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No pending fields</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingFields.map(field => (
                        <div key={field._id} className="bg-white/5 rounded-xl p-6 border border-yellow-500/30">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-white font-bold text-xl">{field.name}</h3>
                              <p className="text-blue-300">{field.type}</p>
                              <p className="text-gray-300">📍 {field.location}</p>
                              <p className="text-green-400 font-bold">${field.pricePerHour}/hour</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-400 text-sm">Submitted by:</p>
                              <p className="text-white font-bold">{field.owner?.firstName} {field.owner?.lastName}</p>
                              <p className="text-blue-300 text-sm">{field.owner?.email}</p>
                            </div>
                          </div>
                          
                          {field.description && (
                            <p className="text-gray-300 mb-4">{field.description}</p>
                          )}
                          
                          {field.amenities && (
                            <div className="mb-4">
                              <p className="text-white font-bold mb-1">Amenities:</p>
                              <p className="text-gray-300">{field.amenities}</p>
                            </div>
                          )}
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleFieldAction(field._id, 'approve')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleFieldAction(field._id, 'reject')}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved Fields */}
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">✅ Approved Fields ({approvedFields.length})</h2>
                  {approvedFields.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No approved fields</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {approvedFields.map(field => (
                        <div key={field._id} className="bg-white/5 rounded-xl p-4 border border-green-500/30">
                          <h3 className="text-white font-bold">{field.name}</h3>
                          <p className="text-blue-300 text-sm">{field.type}</p>
                          <p className="text-gray-300 text-sm">📍 {field.location}</p>
                          <p className="text-green-400 font-bold">${field.pricePerHour}/hour</p>
                          <p className="text-gray-400 text-xs mt-2">
                            Owner: {field.owner?.firstName} {field.owner?.lastName}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Management Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">📅 All Bookings ({allBookings.length})</h2>
                {allBookings.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No bookings found</p>
                ) : (
                  <div className="space-y-4">
                    {allBookings.slice(0, 20).map(booking => (
                      <div key={booking._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-white font-bold">{booking.field?.name}</h3>
                            <p className="text-blue-300">{booking.field?.type}</p>
                            <p className="text-gray-300">📅 {new Date(booking.date).toLocaleDateString()}</p>
                            <p className="text-gray-300">⏰ {booking.startTime} - {booking.endTime}</p>
                            <p className="text-green-400 font-bold">${booking.totalAmount}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm">Booked by:</p>
                            <p className="text-white font-bold">{booking.user?.firstName} {booking.user?.lastName}</p>
                            <p className="text-blue-300 text-sm">{booking.user?.email}</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                              booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                              booking.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {booking.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {booking.status === 'confirmed' && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
                            >
                              🚫 Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">👥 All Users ({allUsers.length})</h2>
                {allUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No users found</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allUsers.map(user => (
                      <div key={user._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h3 className="text-white font-bold">{user.firstName} {user.lastName}</h3>
                        <p className="text-blue-300">{user.email}</p>
                        <p className="text-gray-300">{user.phone}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.isVerified ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {user.isVerified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                          {user.isAdmin && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                              👑 Admin
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-2">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
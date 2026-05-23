import React, { useState, useEffect, useCallback } from 'react';

const WorkingBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        globalThis.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load bookings');
      }

      setBookings(data.data?.bookings || data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return booking.status === 'confirmed' && new Date(booking.date) >= new Date();
    if (filter === 'completed') return booking.status === 'completed';
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'price') {
      const priceA = a.pricing?.totalAmount ?? a.price ?? 0;
      const priceB = b.pricing?.totalAmount ?? b.price ?? 0;
      return priceB - priceA;
    }
    const nameA = a.field?.name ?? a.fieldName ?? '';
    const nameB = b.field?.name ?? b.fieldName ?? '';
    return nameA.localeCompare(nameB);
  });

  const handleCancelBooking = async (booking) => {
    const bookingId = booking._id || booking.id;
    if (!globalThis.confirm(`Cancel booking for ${booking.field?.name ?? booking.fieldName} on ${booking.date}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Cancelled by user' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel booking');
      }

      setBookings(prev => prev.map(b =>
        (b._id || b.id) === bookingId ? { ...b, status: 'cancelled' } : b
      ));
      alert('Booking cancelled successfully!');
    } catch (err) {
      alert(err.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const handleViewDetails = (booking) => {
    const name = booking.field?.name ?? booking.fieldName ?? 'N/A';
    const sport = booking.sport ?? 'N/A';
    const price = booking.pricing?.totalAmount ?? booking.price ?? 'N/A';
    const location = booking.field?.location?.address ?? booking.location ?? 'N/A';
    alert(`Booking Details:\n\nField: ${name}\nSport: ${sport}\nDate: ${booking.date}\nStatus: ${booking.status?.toUpperCase()}\nLocation: ${location}\nPrice: ৳${price}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">📅</div>
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Loading Your Bookings...</h2>
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
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Failed to Load Bookings</h2>
          <p className="text-xl text-gray-300 mb-6">{error}</p>
          <button onClick={fetchBookings} className="premium-btn">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black premium-gradient-text mb-6">
            📅 MY BOOKINGS
          </h1>
          <p className="text-2xl text-gray-300">
            Manage your sports field reservations
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: '📊', color: 'from-blue-500 to-cyan-500' },
            { label: 'Upcoming', value: bookings.filter(b => b.status === 'confirmed').length, icon: '⏰', color: 'from-green-500 to-emerald-500' },
            { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: '✅', color: 'from-purple-500 to-violet-500' },
            { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, icon: '❌', color: 'from-red-500 to-pink-500' }
          ].map((stat) => (
            <div key={stat.label} className="premium-card text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className={`text-3xl font-black mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-white font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters & Controls */}
        <div className="premium-card mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="filter-status" className="block text-white font-semibold mb-2">Filter by Status</label>
                <select
                  id="filter-status"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Bookings</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label htmlFor="sort-by" className="block text-white font-semibold mb-2">Sort by</label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                >
                  <option value="date">Date</option>
                  <option value="price">Price</option>
                  <option value="field">Field Name</option>
                </select>
              </div>
            </div>
            <div className="text-white">
              <span className="font-semibold">Showing: </span>
              <span className="premium-gradient-text font-bold text-xl">{filteredBookings.length} Bookings</span>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const bookingId = booking._id || booking.id;
            const fieldName = booking.field?.name ?? booking.fieldName ?? 'Unknown Field';
            const sport = booking.sport ?? 'N/A';
            const price = booking.pricing?.totalAmount ?? booking.price ?? 0;
            const location = booking.field?.location?.address ?? booking.location ?? 'N/A';
            return (
              <div key={bookingId} className="premium-card">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-2xl font-bold text-white">{fieldName}</h3>
                      <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                      <div>
                        <p><strong>🏅 Sport:</strong> {sport}</p>
                        <p><strong>📅 Date:</strong> {booking.date}</p>
                        <p><strong>🕒 Time:</strong> {booking.startTime} - {booking.endTime}</p>
                      </div>
                      <div>
                        <p><strong>📍 Location:</strong> {location}</p>
                        <p><strong>💰 Price:</strong> ৳{price}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleViewDetails(booking)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                    >
                      View Details
                    </button>
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(booking)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Bookings */}
        {filteredBookings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-4">📅</div>
            <h3 className="text-4xl font-bold premium-gradient-text mb-4">No Bookings Found</h3>
            <p className="text-xl text-gray-300 mb-6">
              {filter === 'all' ? 'You have no bookings yet.' : `No ${filter} bookings found.`}
            </p>
            <button
              onClick={() => { globalThis.location.href = '/fields'; }}
              className="premium-btn"
            >
              Book Your First Field
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="premium-card mt-12">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => { globalThis.location.href = '/fields'; }}
              className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all"
            >
              🏟️ Book New Field
            </button>
            <button
              onClick={fetchBookings}
              className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all"
            >
              🔄 Refresh Bookings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingBookings;

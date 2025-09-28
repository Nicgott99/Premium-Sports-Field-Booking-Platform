import React, { useState, useEffect } from 'react';

const WorkingBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [sortBy, setSortBy] = useState('date');

  // Generate working bookings data
  const generateBookingsData = () => {
    return [
      {
        id: 1,
        fieldName: 'Elite Champions Stadium',
        sport: 'Football',
        date: '2025-09-30',
        time: '16:00 - 18:00',
        duration: 2,
        price: 10000,
        status: 'confirmed',
        location: 'Gulshan, Dhaka',
        bookingDate: '2025-09-25',
        contact: '+880-1711-123456'
      },
      {
        id: 2,
        fieldName: 'Thunder Basketball Arena',
        sport: 'Basketball',
        date: '2025-10-01',
        time: '19:00 - 21:00',
        duration: 2,
        price: 6000,
        status: 'confirmed',
        location: 'Dhanmondi, Dhaka',
        bookingDate: '2025-09-26',
        contact: '+880-1711-234567'
      },
      {
        id: 3,
        fieldName: 'Royal Tennis Club',
        sport: 'Tennis',
        date: '2025-09-28',
        time: '14:00 - 15:00',
        duration: 1,
        price: 2500,
        status: 'completed',
        location: 'Banani, Dhaka',
        bookingDate: '2025-09-20',
        contact: '+880-1711-345678'
      },
      {
        id: 4,
        fieldName: 'Aqua Sports Complex',
        sport: 'Swimming',
        date: '2025-10-05',
        time: '07:00 - 08:00',
        duration: 1,
        price: 2000,
        status: 'confirmed',
        location: 'Bashundhara, Dhaka',
        bookingDate: '2025-09-27',
        contact: '+880-1711-678901'
      },
      {
        id: 5,
        fieldName: 'Badminton Excellence Center',
        sport: 'Badminton',
        date: '2025-09-25',
        time: '18:00 - 19:00',
        duration: 1,
        price: 1500,
        status: 'cancelled',
        location: 'Uttara, Dhaka',
        bookingDate: '2025-09-22',
        contact: '+880-1711-567890'
      }
    ];
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setBookings(generateBookingsData());
      setLoading(false);
    }, 1000);
  }, []);

  // Working filter function
  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return booking.status === 'confirmed' && new Date(booking.date) >= new Date();
    if (filter === 'completed') return booking.status === 'completed';
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'price') return b.price - a.price;
    return a.fieldName.localeCompare(b.fieldName);
  });

  // Working action functions
  const handleCancelBooking = (booking) => {
    if (window.confirm(`Cancel booking for ${booking.fieldName} on ${booking.date}?`)) {
      setBookings(bookings.map(b => 
        b.id === booking.id ? { ...b, status: 'cancelled' } : b
      ));
      alert('Booking cancelled successfully!');
    }
  };

  const handleRescheduleBooking = (booking) => {
    const newDate = prompt(`Reschedule ${booking.fieldName} booking. Enter new date (YYYY-MM-DD):`, booking.date);
    if (newDate && newDate !== booking.date) {
      setBookings(bookings.map(b => 
        b.id === booking.id ? { ...b, date: newDate } : b
      ));
      alert(`Booking rescheduled to ${newDate}!`);
    }
  };

  const handleViewDetails = (booking) => {
    alert(`Booking Details:\n\nField: ${booking.fieldName}\nSport: ${booking.sport}\nDate: ${booking.date}\nTime: ${booking.time}\nDuration: ${booking.duration} hour(s)\nPrice: ৳${booking.price}\nStatus: ${booking.status.toUpperCase()}\nLocation: ${booking.location}\nContact: ${booking.contact}`);
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
          ].map((stat, index) => (
            <div key={index} className="premium-card text-center">
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
                <label className="block text-white font-semibold mb-2">Filter by Status</label>
                <select
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
                <label className="block text-white font-semibold mb-2">Sort by</label>
                <select
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
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="premium-card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                
                {/* Booking Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-white">{booking.fieldName}</h3>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                    <div>
                      <p><strong>🏅 Sport:</strong> {booking.sport}</p>
                      <p><strong>📅 Date:</strong> {booking.date}</p>
                      <p><strong>🕒 Time:</strong> {booking.time}</p>
                    </div>
                    <div>
                      <p><strong>📍 Location:</strong> {booking.location}</p>
                      <p><strong>⏱️ Duration:</strong> {booking.duration} hour(s)</p>
                      <p><strong>💰 Price:</strong> ৳{booking.price}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleViewDetails(booking)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    View Details
                  </button>
                  
                  {booking.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => handleRescheduleBooking(booking)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
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
              onClick={() => window.location.href = '/fields'}
              className="premium-btn"
            >
              Book Your First Field
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="premium-card mt-12">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/fields'}
              className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all"
            >
              🏟️ Book New Field
            </button>
            <button 
              onClick={() => alert('Feature coming soon! This would show booking history and analytics.')}
              className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all"
            >
              📊 View Analytics
            </button>
            <button 
              onClick={() => alert('Feature coming soon! This would show favorite fields and quick booking options.')}
              className="p-4 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-xl font-semibold transition-all"
            >
              ⭐ Favorites
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingBookings;
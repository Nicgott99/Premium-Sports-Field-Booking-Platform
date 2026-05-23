import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/v1/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load bookings');
        setBookings(data.data?.bookings ?? data.data ?? []);
      } catch (err) {
        setError(err.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  const handleCancel = async (bookingId) => {
    if (!globalThis.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
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
      if (!response.ok) throw new Error(data.message || 'Failed to cancel booking');
      setBookings(prev => prev.map(b =>
        (b._id || b.id) === bookingId ? { ...b, status: 'cancelled' } : b
      ));
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const statusColor = (status) => {
    if (status === 'confirmed') return 'bg-green-500/20 text-green-400';
    if (status === 'cancelled') return 'bg-red-500/20 text-red-400';
    if (status === 'completed') return 'bg-blue-500/20 text-blue-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-black premium-gradient-text mb-4">📅 My Bookings</h1>
          <p className="text-xl text-gray-300">Manage your field reservations</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="premium-card text-center py-16">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Bookings Yet</h2>
            <p className="text-gray-300 mb-6">Book your first sports field today!</p>
            <button
              onClick={() => navigate('/fields')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
            >
              Browse Fields
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const bookingId = booking._id || booking.id;
              const fieldName = booking.field?.name ?? 'Field';
              const sport = booking.sport ?? booking.field?.sport ?? '';
              const startTime = booking.startTime ? new Date(booking.startTime) : null;
              const totalAmount = booking.pricing?.totalAmount ?? booking.totalAmount ?? 0;
              const currency = booking.pricing?.currency ?? 'BDT';
              const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

              return (
                <div key={bookingId} className="premium-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">{fieldName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(booking.status)}`}>
                          {booking.status?.toUpperCase()}
                        </span>
                      </div>
                      {sport && (
                        <p className="text-purple-400 text-sm capitalize mb-1">🏆 {sport}</p>
                      )}
                      {startTime && (
                        <p className="text-gray-300 text-sm">
                          📅 {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {booking.duration && (
                        <p className="text-gray-400 text-sm">⏱ {booking.duration}h duration</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="text-green-400 font-bold text-lg">
                        {currency} {totalAmount.toLocaleString()}
                      </span>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(bookingId)}
                          disabled={cancellingId === bookingId}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                        >
                          {cancellingId === bookingId ? 'Cancelling...' : '✕ Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/booking')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all hover:scale-105"
          >
            🎯 New Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default Bookings;

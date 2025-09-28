import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PremiumBooking = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userBookings, setUserBookings] = useState([]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      alert('Please login to make bookings');
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadFields();
    loadUserBookings();
  }, [navigate]);

  const loadFields = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/fields');
      const data = await response.json();
      if (data.success) {
        setFields(data.fields);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  };

  const loadUserBookings = async () => {
    try {
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
    }
  };

  const loadTimeSlots = async (fieldId, date) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/fields/${fieldId}/slots/${date}`);
      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.slots);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSelect = (field) => {
    setSelectedField(field);
    setSelectedSlot(null);
    setAvailableSlots([]);
    if (selectedDate) {
      loadTimeSlots(field._id, selectedDate);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedField) {
      loadTimeSlots(selectedField._id, date);
    }
  };

  const handleSlotSelect = (slot) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
    }
  };

  const handleBooking = async () => {
    if (!selectedField || !selectedDate || !selectedSlot) {
      alert('Please select field, date, and time slot');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fieldId: selectedField._id,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Booking confirmed! 
Field: ${selectedField.name}
Date: ${selectedDate}
Time: ${selectedSlot.startTime} - ${selectedSlot.endTime}
Amount: $${selectedSlot.price}`);
        
        // Refresh data
        loadTimeSlots(selectedField._id, selectedDate);
        loadUserBookings();
        setSelectedSlot(null);
      } else {
        alert(data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-24 px-4 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please login to make bookings</p>
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
          <h1 className="text-4xl font-black text-white mb-2">🏟️ Book Your Field</h1>
          <p className="text-gray-300 text-lg">Reserve your premium sports field today</p>
          <p className="text-blue-300 text-sm mt-2">Welcome back, {user.firstName}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Field Selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Field Selection */}
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                🏟️ Select Field
              </h2>
              {fields.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No approved fields available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(field => (
                    <div
                      key={field._id}
                      onClick={() => handleFieldSelect(field)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedField?._id === field._id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:border-purple-400 hover:bg-purple-400/10'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-bold">{field.name}</h3>
                        <span className="text-green-400 font-bold">${field.pricePerHour}/hour</span>
                      </div>
                      <p className="text-blue-300 text-sm mb-1">🏆 {field.type}</p>
                      <p className="text-gray-300 text-sm mb-2">📍 {field.location}</p>
                      <p className="text-gray-400 text-xs">{field.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Selection */}
            {selectedField && (
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  📅 Select Date
                </h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  min={getTodayDate()}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}

            {/* Time Slot Selection */}
            {selectedField && selectedDate && (
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  ⏰ Select Time Slot (2-hour slots)
                </h2>
                <p className="text-gray-300 text-sm mb-4">Fields are open from 8:00 AM to 12:00 AM</p>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-400">Loading time slots...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No time slots available for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          !slot.isAvailable
                            ? 'border-red-500/30 bg-red-500/10 text-red-400 cursor-not-allowed'
                            : selectedSlot?.startTime === slot.startTime
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : 'border-white/20 bg-white/5 text-white hover:border-purple-400 hover:bg-purple-400/10'
                        }`}
                      >
                        <div className="text-sm font-bold">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-xs mt-1">
                          ${slot.price}
                        </div>
                        <div className="text-xs mt-1">
                          {slot.isAvailable ? '✅ Available' : '❌ Booked'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Booking Confirmation */}
            {selectedSlot && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-green-300 mb-4">✅ Confirm Booking</h2>
                <div className="space-y-2 text-white">
                  <p><strong>Field:</strong> {selectedField.name}</p>
                  <p><strong>Date:</strong> {selectedDate}</p>
                  <p><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
                  <p><strong>Duration:</strong> 2 hours</p>
                  <p><strong>Amount:</strong> ${selectedSlot.price}</p>
                </div>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : '🎯 Confirm Booking'}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - My Bookings */}
          <div className="space-y-6">
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                📋 My Bookings
              </h2>
              {userBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userBookings.slice(0, 5).map(booking => (
                    <div key={booking._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-bold">{booking.field.name}</h3>
                      <p className="text-blue-300 text-sm">{booking.field.type}</p>
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
      </div>
    </div>
  );
};

export default PremiumBooking;
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch fields from API
  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/fields`);
      const data = await response.json();
      
      if (data.success) {
        setFields(data.data);
      } else {
        setError('Failed to fetch fields');
      }
    } catch (err) {
      setError('Unable to connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter fields based on search
  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBooking = async (fieldId) => {
    try {
      const bookingData = {
        fieldId: fieldId,
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM - 12:00 PM',
        duration: 2,
        participants: 5
      };

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Booking successful! Reference: ${data.data.bookingReference}`);
      } else {
        alert('Booking failed: ' + data.message);
      }
    } catch (err) {
      alert('Booking error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white text-center">
            🏆 CSE471 Premium Sports Platform
          </h1>
          <p className="text-gray-200 text-center mt-2">
            Book premium sports fields across Bangladesh
          </p>
        </div>
      </header>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Find Your Perfect Field
          </h2>
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search by name, sport, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </section>

      {/* Fields Section */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          Available Fields
        </h2>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white mt-4">Loading fields...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
            <p className="text-red-200">❌ {error}</p>
            <button
              onClick={fetchFields}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFields.map((field) => (
              <div
                key={field.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
              >
                {/* Field Image */}
                <div className="h-48 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
                  <img
                    src={field.imageUrl}
                    alt={field.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">
                      ⭐ {field.rating}
                    </span>
                  </div>
                </div>

                {/* Field Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {field.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-300 text-sm">
                      🏃 {field.sport}
                    </p>
                    <p className="text-gray-300 text-sm">
                      📍 {field.location}
                    </p>
                    <p className="text-gray-300 text-sm">
                      💰 {field.pricePerHour} {field.currency}/hour
                    </p>
                    <p className="text-gray-300 text-sm">
                      ⏰ {field.availableSlots} slots available
                    </p>
                    <p className="text-gray-300 text-sm">
                      👥 Min {field.minBookingSize} players
                    </p>
                  </div>

                  {/* Amenities */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {field.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {field.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/30 text-gray-200 text-xs rounded-full">
                          +{field.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reviews */}
                  <p className="text-gray-400 text-sm mb-4">
                    📝 {field.reviews} reviews
                  </p>

                  {/* Book Button */}
                  <button
                    onClick={() => handleBooking(field.id)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredFields.length === 0 && fields.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">
              No fields found matching "{searchTerm}"
            </p>
          </div>
        )}

        {!loading && !error && fields.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">
              No fields available at the moment
            </p>
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="bg-black/20 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">
                {fields.length}+
              </h3>
              <p className="text-gray-300">Premium Fields</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">50+</h3>
              <p className="text-gray-300">Cities Covered</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">10k+</h3>
              <p className="text-gray-300">Happy Customers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">24/7</h3>
              <p className="text-gray-300">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-300">
            © 2024 CSE471 Premium Sports Platform. Built with MERN Stack.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
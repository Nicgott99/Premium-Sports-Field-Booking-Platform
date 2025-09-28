import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');

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
        setError(null);
      } else {
        setError('Failed to fetch fields');
      }
    } catch (err) {
      setError('Unable to connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (field) => {
    try {
      const bookingData = {
        fieldId: field.id,
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM - 12:00 PM',
        duration: 2,
        participants: field.minBookingSize || 5
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
        alert(`🎉 Booking Confirmed!\n\nField: ${field.name}\nReference: ${data.data.bookingReference}\nTotal: ${data.data.totalAmount} ${data.data.currency}`);
      } else {
        alert('❌ Booking failed: ' + data.message);
      }
    } catch (err) {
      alert('❌ Booking error: ' + err.message);
    }
  };

  // Filter fields
  const filteredFields = fields.filter(field =>
    (field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     field.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
     field.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedSport === '' || field.sport === selectedSport)
  );

  const sports = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Badminton', 'Volleyball'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{animationDelay: '4s'}}></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-10 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 mb-4 tracking-tight">
              🏆 PREMIUM SPORTS
            </h1>
            <div className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
              Elite Sports Platform
            </div>
            <p className="text-gray-300 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
              Book Bangladesh's most premium sports facilities with advanced amenities and professional standards
            </p>
            
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-full px-6 py-2 mt-4 border border-yellow-400/30">
              <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
              <span className="text-yellow-400 font-semibold text-sm tracking-wider uppercase">Premium Experience</span>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-8">
            🔍 Find Your Perfect Arena
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search fields, sports, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 text-lg font-medium shadow-lg"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-2xl">🔍</span>
              </div>
            </div>

            {/* Sport Filter */}
            <div className="relative">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 text-lg font-medium shadow-lg appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-800 text-white">All Sports</option>
                {sports.map(sport => (
                  <option key={sport} value={sport} className="bg-gray-800 text-white">{sport}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <span className="text-2xl">⚽</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fields Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-12">
          🌟 Premium Facilities
        </h2>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent shadow-lg"></div>
            <p className="text-white mt-6 text-xl font-semibold">Loading premium fields...</p>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/50 rounded-3xl p-8 text-center shadow-2xl">
            <p className="text-red-200 text-xl font-semibold mb-4">❌ {error}</p>
            <button
              onClick={fetchFields}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFields.map((field) => (
              <div
                key={field.id}
                className="group bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-purple-500/25"
              >
                {/* Field Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={field.imageUrl || `https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=400&fit=crop`}
                    alt={field.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = `https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=300&fit=crop&auto=format`;
                    }}
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <span className="text-white font-bold text-sm flex items-center gap-1">
                      ⭐ {field.rating || '4.5'}
                    </span>
                  </div>

                  {/* Sport Badge */}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <span className="text-white font-bold text-sm">{field.sport}</span>
                  </div>
                </div>

                {/* Field Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300">
                    {field.name}
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-lg">📍</span>
                      <span className="font-medium">{field.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-lg">💰</span>
                      <span className="font-bold text-xl text-green-400">
                        {field.pricePerHour || '2000'} {field.currency || 'BDT'}
                      </span>
                      <span className="text-sm opacity-75">/hour</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-lg">⏰</span>
                      <span className="font-medium">{field.availableSlots || '5'} slots available</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-lg">👥</span>
                      <span className="font-medium">Min {field.minBookingSize || '5'} players</span>
                    </div>
                  </div>

                  {/* Premium Amenities */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Premium Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {(field.amenities || ['Floodlights', 'Changing Rooms', 'Parking']).slice(0, 4).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-200 text-xs rounded-full font-medium border border-blue-400/30"
                        >
                          {amenity}
                        </span>
                      ))}
                      {(field.amenities || []).length > 4 && (
                        <span className="px-3 py-1 bg-gradient-to-r from-gray-500/30 to-gray-600/30 text-gray-200 text-xs rounded-full font-medium border border-gray-400/30">
                          +{field.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                    <span>📝</span>
                    <span>{field.reviews || '100'} premium reviews</span>
                  </div>

                  {/* Premium Book Button */}
                  <button
                    onClick={() => handleBooking(field)}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-black text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      🚀 Book Premium Slot
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredFields.length === 0 && fields.length > 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-300 text-xl font-semibold">
              No premium fields found matching "{searchTerm}"
            </p>
          </div>
        )}

        {!loading && !error && fields.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏟️</div>
            <p className="text-gray-300 text-xl font-semibold">
              No fields available. Please try again later.
            </p>
          </div>
        )}
      </section>

      {/* Premium Stats Section */}
      <section className="relative z-10 bg-gradient-to-r from-black/40 via-purple-900/20 to-black/40 backdrop-blur-xl border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group cursor-pointer">
              <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 group-hover:scale-110 transition-transform duration-300">
                {fields.length || 6}+
              </h3>
              <p className="text-gray-300 font-semibold">Premium Fields</p>
            </div>
            <div className="group cursor-pointer">
              <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2 group-hover:scale-110 transition-transform duration-300">
                50+
              </h3>
              <p className="text-gray-300 font-semibold">Cities Covered</p>
            </div>
            <div className="group cursor-pointer">
              <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mb-2 group-hover:scale-110 transition-transform duration-300">
                10k+
              </h3>
              <p className="text-gray-300 font-semibold">Happy Athletes</p>
            </div>
            <div className="group cursor-pointer">
              <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-2 group-hover:scale-110 transition-transform duration-300">
                24/7
              </h3>
              <p className="text-gray-300 font-semibold">Premium Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
              Premium Sports Platform
            </h3>
            <p className="text-gray-400">Elevating Sports Experience in Bangladesh</p>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 CSE471 Premium Sports Platform. Built with MERN Stack & Advanced UI/UX.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
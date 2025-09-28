import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Fields = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid');

  const API_BASE_URL = 'http://localhost:5000/api';

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

  // Filter and sort fields
  const filteredFields = fields
    .filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           field.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           field.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = selectedSport === '' || field.sport === selectedSport;
      const matchesCity = selectedCity === '' || field.location.includes(selectedCity);
      const matchesPrice = priceRange === '' || 
        (priceRange === 'low' && field.pricePerHour < 1500) ||
        (priceRange === 'mid' && field.pricePerHour >= 1500 && field.pricePerHour < 2500) ||
        (priceRange === 'high' && field.pricePerHour >= 2500);
      
      return matchesSearch && matchesSport && matchesCity && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'price') return (a.pricePerHour || 0) - (b.pricePerHour || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const sports = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Badminton', 'Volleyball'];
  const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal'];

  return (
    <div className="min-h-screen pt-24">
      {/* Page Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-900/10 to-purple-900/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 mb-6 tracking-tight">
            🏟️ PREMIUM FIELDS
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-medium max-w-3xl mx-auto leading-relaxed">
            Discover Bangladesh's most exclusive sports facilities with world-class amenities and professional standards
          </p>
        </div>
      </section>

      {/* Advanced Search & Filters */}
      <section className="py-12 bg-gradient-to-r from-black/20 via-purple-900/10 to-black/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8">
              🔍 Advanced Field Search
            </h2>
            
            {/* Search Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

              {/* City Filter */}
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-lg font-medium shadow-lg appearance-none cursor-pointer"
                >
                  <option value="" className="bg-gray-800 text-white">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city} className="bg-gray-800 text-white">{city}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <span className="text-2xl">🏙️</span>
                </div>
              </div>

              {/* Price Range */}
              <div className="relative">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 text-lg font-medium shadow-lg appearance-none cursor-pointer"
                >
                  <option value="" className="bg-gray-800 text-white">All Prices</option>
                  <option value="low" className="bg-gray-800 text-white">Under 1,500 BDT</option>
                  <option value="mid" className="bg-gray-800 text-white">1,500 - 2,500 BDT</option>
                  <option value="high" className="bg-gray-800 text-white">Above 2,500 BDT</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            {/* Sort and View Options */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-white font-semibold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                >
                  <option value="rating" className="bg-gray-800">Highest Rated</option>
                  <option value="price" className="bg-gray-800">Lowest Price</option>
                  <option value="name" className="bg-gray-800">Name A-Z</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <span className="text-xl">⊞</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <span className="text-xl">☰</span>
                </button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-6 text-center">
              <p className="text-gray-300 font-medium">
                Found <span className="text-cyan-400 font-bold">{filteredFields.length}</span> premium fields
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fields Grid/List */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-20 w-20 border-4 border-purple-500 border-t-transparent shadow-lg"></div>
              <p className="text-white mt-8 text-2xl font-semibold">Loading premium fields...</p>
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/50 rounded-3xl p-12 text-center shadow-2xl">
              <p className="text-red-200 text-2xl font-semibold mb-6">❌ {error}</p>
              <button
                onClick={fetchFields}
                className="px-10 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredFields.length > 0 && (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
              : "space-y-6"
            }>
              {filteredFields.map((field, index) => (
                <div
                  key={field.id}
                  className={`group bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-purple-500/25 ${
                    viewMode === 'list' ? 'flex max-w-4xl mx-auto' : ''
                  }`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {/* Field Image */}
                  <div className={`relative overflow-hidden ${
                    viewMode === 'list' ? 'w-80 h-64' : 'h-64'
                  }`}>
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

                    {/* Quick View Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Link
                        to={`/fields/${field.id}`}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                      >
                        👁️ Quick View
                      </Link>
                    </div>
                  </div>

                  {/* Field Content */}
                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300">
                      {field.name}
                    </h3>
                    
                    <div className={`space-y-3 mb-6 ${viewMode === 'list' ? 'grid grid-cols-2 gap-4' : ''}`}>
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
                        {(field.amenities || ['Floodlights', 'Changing Rooms', 'Parking']).slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-200 text-xs rounded-full font-medium border border-blue-400/30"
                          >
                            {amenity}
                          </span>
                        ))}
                        {(field.amenities || []).length > 3 && (
                          <span className="px-3 py-1 bg-gradient-to-r from-gray-500/30 to-gray-600/30 text-gray-200 text-xs rounded-full font-medium border border-gray-400/30">
                            +{field.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reviews */}
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                      <span>📝</span>
                      <span>{field.reviews || '100'} premium reviews</span>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex gap-3 ${viewMode === 'list' ? 'flex-col' : ''}`}>
                      <Link
                        to={`/fields/${field.id}`}
                        className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-center rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        🔍 View Details
                      </Link>
                      <button className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                        🚀 Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredFields.length === 0 && (
            <div className="text-center py-20">
              <div className="text-8xl mb-8">🔍</div>
              <h3 className="text-3xl font-bold text-white mb-4">No Fields Found</h3>
              <p className="text-xl text-gray-300 mb-8">
                {searchTerm || selectedSport || selectedCity || priceRange
                  ? 'Try adjusting your search filters'
                  : 'No fields available at the moment'
                }
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSport('');
                  setSelectedCity('');
                  setPriceRange('');
                }}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Fields;
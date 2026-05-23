import React, { useState, useEffect, useCallback } from 'react';

const WorkingFields = () => {
  const [fields, setFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  const sports = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Badminton', 'Swimming', 'Baseball', 'Volleyball'];
  const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];

  const fetchFields = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/fields?limit=50');

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load fields');
      }

      const fieldsList = data.data?.fields ?? data.data ?? [];
      setFields(fieldsList);
      setFilteredFields(fieldsList);
    } catch (err) {
      setError(err.message || 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  useEffect(() => {
    let filtered = fields.filter(field => {
      const name = field.name ?? '';
      const locationStr = field.location?.address ?? field.location ?? '';
      const description = field.description ?? '';
      const sport = field.sport ?? field.sports?.[0] ?? '';
      const city = field.location?.city ?? '';
      const price = field.pricing?.basePrice ?? field.price ?? 0;

      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            locationStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = !selectedSport || sport === selectedSport;
      const matchesCity = !selectedCity || city === selectedCity;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesSearch && matchesSport && matchesCity && matchesPrice;
    });

    filtered.sort((a, b) => {
      const priceA = a.pricing?.basePrice ?? a.price ?? 0;
      const priceB = b.pricing?.basePrice ?? b.price ?? 0;
      switch (sortBy) {
        case 'price': return priceA - priceB;
        case 'rating': return (b.rating?.average ?? b.rating ?? 0) - (a.rating?.average ?? a.rating ?? 0);
        case 'popularity': return (b.totalBookings ?? b.bookings ?? 0) - (a.totalBookings ?? a.bookings ?? 0);
        default: return (a.name ?? '').localeCompare(b.name ?? '');
      }
    });

    setFilteredFields(filtered);
  }, [fields, searchTerm, selectedSport, selectedCity, priceRange, sortBy]);

  const handleBooking = (field) => {
    const fieldId = field._id || field.id;
    globalThis.location.href = `/fields/${fieldId}/book`;
  };

  const handleViewDetails = (field) => {
    const fieldId = field._id || field.id;
    globalThis.location.href = `/fields/${fieldId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">🏟️</div>
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Loading Premium Fields...</h2>
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
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Failed to Load Fields</h2>
          <p className="text-xl text-gray-300 mb-6">{error}</p>
          <button onClick={fetchFields} className="premium-btn">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black premium-gradient-text mb-6">
            🏟️ PREMIUM SPORTS FIELDS
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Discover and book the finest sports facilities
          </p>
        </div>

        {/* Search & Filters */}
        <div className="premium-card mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">🔍 Search & Filter Fields</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label htmlFor="field-search" className="block text-white font-semibold mb-2">Search</label>
              <input
                id="field-search"
                type="text"
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="field-sport" className="block text-white font-semibold mb-2">Sport</label>
              <select
                id="field-sport"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
              >
                <option value="">All Sports</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="field-city" className="block text-white font-semibold mb-2">City</label>
              <select
                id="field-city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="field-sort" className="block text-white font-semibold mb-2">Sort By</label>
              <select
                id="field-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="price">Price (Low to High)</option>
                <option value="rating">Rating (High to Low)</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label htmlFor="price-range" className="block text-white font-semibold mb-4">
              Price Range: ৳{priceRange[0]} - ৳{priceRange[1]} per hour
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">৳0</span>
              <input
                id="price-range"
                type="range"
                min="0"
                max="10000"
                step="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number.parseInt(e.target.value, 10)])}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-gray-300">৳10,000</span>
            </div>
          </div>

          {/* Results Info & View Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-white">
              <span className="font-semibold">Found: </span>
              <span className="premium-gradient-text font-bold text-xl">{filteredFields.length} Fields</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'bg-black/30 text-gray-300 hover:bg-purple-600/50'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-black/30 text-gray-300 hover:bg-purple-600/50'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {/* Fields Display */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-6'} gap-8`}>
          {filteredFields.map((field) => {
            const fieldId = field._id || field.id;
            const fieldName = field.name ?? 'Unknown Field';
            const location = field.location?.address ?? field.location ?? 'N/A';
            const sport = field.sport ?? field.sports?.[0] ?? 'N/A';
            const price = field.pricing?.basePrice ?? field.price ?? 0;
            const rating = field.rating?.average ?? field.rating ?? 0;
            const imageUrl = field.images?.[0]?.url ?? field.image ?? '';
            const features = field.amenities ?? field.features ?? [];
            const openTime = field.operatingHours?.open ?? field.openTime ?? '06:00';
            const closeTime = field.operatingHours?.close ?? field.closeTime ?? '22:00';
            const isAvailable = field.isActive !== false;

            return (
              <div key={fieldId} className="premium-card group cursor-pointer">
                {/* Field Image */}
                <div className="relative overflow-hidden rounded-xl mb-6">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={fieldName}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center">
                      <span className="text-6xl">🏟️</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full text-white font-semibold">
                    ⭐ {typeof rating === 'number' ? rating.toFixed(1) : rating}
                  </div>
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full font-semibold ${
                    isAvailable ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                {/* Field Info */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{fieldName}</h3>
                  <p className="text-gray-300 mb-2">📍 {location}</p>
                  <p className="text-gray-300 mb-2">🏅 {sport}</p>
                  {field.description && (
                    <p className="text-gray-400 mb-4 text-sm line-clamp-2">{field.description}</p>
                  )}

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {features.slice(0, 3).map((feature) => (
                        <span key={feature} className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timing */}
                  <p className="text-gray-300 mb-4">🕒 Open: {openTime} - {closeTime}</p>

                  {/* Price & Actions */}
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-3xl font-black premium-gradient-text">৳{price}</span>
                      <span className="text-gray-400">/hour</span>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleViewDetails(field)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleBooking(field)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredFields.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-4">🔍</div>
            <h3 className="text-4xl font-bold premium-gradient-text mb-4">No Fields Found</h3>
            <p className="text-xl text-gray-300 mb-6">Try adjusting your search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSport('');
                setSelectedCity('');
                setPriceRange([0, 10000]);
              }}
              className="premium-btn"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingFields;

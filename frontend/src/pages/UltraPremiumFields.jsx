import React, { useState, useEffect } from 'react';

const UltraPremiumFields = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  const sports = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Badminton', 'Swimming', 'Baseball', 'Volleyball'];
  const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/fields');
      if (response.ok) {
        const data = await response.json();
        setFields(data);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      // Fallback premium data
      setFields(generatePremiumFields());
    } finally {
      setLoading(false);
    }
  };

  const generatePremiumFields = () => {
    return [
      {
        id: 1,
        name: '🏆 Elite Champions Stadium',
        sport: 'Football',
        location: 'Gulshan, Dhaka',
        price: 5000,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?w=800',
        features: ['Premium Turf', 'Floodlights', 'Changing Rooms', 'Parking'],
        availability: 'Available',
        bookings: 1250
      },
      {
        id: 2,
        name: '⚡ Thunder Basketball Arena',
        sport: 'Basketball',
        location: 'Dhanmondi, Dhaka',
        price: 3000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1546519638, 00.jpg?w=800',
        features: ['Indoor Court', 'AC', 'Professional Hoops', 'Sound System'],
        availability: 'Available',
        bookings: 890
      },
      {
        id: 3,
        name: '🎾 Royal Tennis Club',
        sport: 'Tennis',
        location: 'Banani, Dhaka',
        price: 2500,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
        features: ['Clay Courts', 'Pro Shop', 'Coaching', 'Restaurant'],
        availability: 'Busy',
        bookings: 750
      },
      {
        id: 4,
        name: '🏏 Cricket Premier Ground',
        sport: 'Cricket',
        location: 'Mirpur, Dhaka',
        price: 8000,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
        features: ['Full Ground', 'Pavilion', 'Scoreboard', 'Media Box'],
        availability: 'Available',
        bookings: 520
      },
      {
        id: 5,
        name: '🏸 Badminton Excellence Center',
        sport: 'Badminton',
        location: 'Uttara, Dhaka',
        price: 1500,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
        features: ['Multiple Courts', 'Air Conditioning', 'Equipment Rental', 'Coaching'],
        availability: 'Available',
        bookings: 680
      },
      {
        id: 6,
        name: '🏊 Aqua Sports Complex',
        sport: 'Swimming',
        location: 'Bashundhara, Dhaka',
        price: 2000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800',
        features: ['Olympic Pool', 'Kids Pool', 'Sauna', 'Changing Rooms'],
        availability: 'Available',
        bookings: 920
      }
    ];
  };

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = !selectedSport || field.sport === selectedSport;
    const matchesCity = !selectedCity || field.location.includes(selectedCity);
    const matchesPrice = field.price >= priceRange[0] && field.price <= priceRange[1];
    
    return matchesSearch && matchesSport && matchesCity && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popularity':
        return b.bookings - a.bookings;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚽</div>
          <h2 className="text-3xl font-bold premium-gradient-text">Loading Premium Fields...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4">
      {/* PREMIUM HEADER */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black premium-gradient-text mb-4">
            🏟️ PREMIUM SPORTS FIELDS 🏟️
          </h1>
          <p className="text-2xl text-white">
            Discover and book the finest sports facilities in Bangladesh
          </p>
        </div>

        {/* ULTRA-PREMIUM SEARCH & FILTERS */}
        <div className="premium-card mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-white font-semibold mb-2">🔍 Search Fields</label>
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-white font-semibold mb-2">⚽ Sport</label>
              <select
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

            {/* City Filter */}
            <div>
              <label className="block text-white font-semibold mb-2">📍 City</label>
              <select
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

            {/* Sort */}
            <div>
              <label className="block text-white font-semibold mb-2">📊 Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">💰 Price Range: ৳{priceRange[0]} - ৳{priceRange[1]}</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-white">
              <span className="font-semibold">Found: </span>
              <span className="premium-gradient-text font-bold text-xl">{filteredFields.length} Premium Fields</span>
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
                🔲 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'list' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-black/30 text-gray-300 hover:bg-purple-600/50'
                }`}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        {/* PREMIUM FIELDS GRID */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-6'} gap-8`}>
          {filteredFields.map((field, index) => (
            <div 
              key={field.id}
              className="premium-card scale-hover group cursor-pointer fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Field Image */}
              <div className="relative overflow-hidden rounded-xl mb-6">
                <img
                  src={field.image || 'https://images.unsplash.com/photo-1552667466-07770ae110d0?w=800'}
                  alt={field.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1552667466-07770ae110d0?w=800';
                  }}
                />
                <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full text-white font-semibold">
                  ⭐ {field.rating}
                </div>
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full font-semibold ${
                  field.availability === 'Available' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {field.availability}
                </div>
              </div>

              {/* Field Info */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {field.name}
                </h3>
                <p className="text-gray-300 mb-2">📍 {field.location}</p>
                <p className="text-gray-300 mb-3">🏅 {field.sport}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {field.features?.slice(0, 3).map((feature, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Price & Stats */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-3xl font-black premium-gradient-text">৳{field.price}</span>
                    <span className="text-gray-400">/hour</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{field.bookings}+ bookings</div>
                    <button className="premium-btn mt-2 text-sm px-4 py-2">
                      📅 BOOK NOW
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredFields.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-4">🔍</div>
            <h3 className="text-3xl font-bold premium-gradient-text mb-4">No Fields Found</h3>
            <p className="text-xl text-gray-300">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltraPremiumFields;
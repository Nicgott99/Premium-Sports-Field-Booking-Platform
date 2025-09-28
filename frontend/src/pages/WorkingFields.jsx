import React, { useState, useEffect } from 'react';

const WorkingFields = () => {
  const [fields, setFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  const sports = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Badminton', 'Swimming', 'Baseball', 'Volleyball'];
  const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];

  // Generate working data
  const generateWorkingFields = () => {
    return [
      {
        id: 1,
        name: 'Elite Champions Stadium',
        sport: 'Football',
        location: 'Gulshan, Dhaka',
        city: 'Dhaka',
        price: 5000,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?w=800',
        features: ['Premium Turf', 'Floodlights', 'Changing Rooms', 'Parking', 'Cafeteria'],
        availability: 'Available',
        bookings: 1250,
        description: 'Professional-grade football stadium with FIFA-approved turf and state-of-the-art facilities.',
        openTime: '06:00',
        closeTime: '22:00',
        contact: '+880-1711-123456'
      },
      {
        id: 2,
        name: 'Thunder Basketball Arena',
        sport: 'Basketball',
        location: 'Dhanmondi, Dhaka',
        city: 'Dhaka',
        price: 3000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1546519638-68e109498573?w=800',
        features: ['Indoor Court', 'Air Conditioning', 'Professional Hoops', 'Sound System', 'Scoreboard'],
        availability: 'Available',
        bookings: 890,
        description: 'Modern indoor basketball arena with professional-grade equipment and climate control.',
        openTime: '07:00',
        closeTime: '23:00',
        contact: '+880-1711-234567'
      },
      {
        id: 3,
        name: 'Royal Tennis Club',
        sport: 'Tennis',
        location: 'Banani, Dhaka',
        city: 'Dhaka',
        price: 2500,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
        features: ['Clay Courts', 'Pro Shop', 'Coaching Available', 'Restaurant', 'Locker Rooms'],
        availability: 'Busy',
        bookings: 750,
        description: 'Premium tennis club with multiple courts and professional coaching services.',
        openTime: '06:00',
        closeTime: '21:00',
        contact: '+880-1711-345678'
      },
      {
        id: 4,
        name: 'Cricket Premier Ground',
        sport: 'Cricket',
        location: 'Mirpur, Dhaka',
        city: 'Dhaka',
        price: 8000,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
        features: ['Full Ground', 'Pavilion', 'Digital Scoreboard', 'Media Box', 'Practice Nets'],
        availability: 'Available',
        bookings: 520,
        description: 'International standard cricket ground with complete facilities for matches and training.',
        openTime: '08:00',
        closeTime: '18:00',
        contact: '+880-1711-456789'
      },
      {
        id: 5,
        name: 'Badminton Excellence Center',
        sport: 'Badminton',
        location: 'Uttara, Dhaka',
        city: 'Dhaka',
        price: 1500,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
        features: ['8 Courts', 'Air Conditioning', 'Equipment Rental', 'Coaching', 'Tournament Hall'],
        availability: 'Available',
        bookings: 680,
        description: 'Multi-court badminton facility with professional coaching and equipment rental.',
        openTime: '06:00',
        closeTime: '22:00',
        contact: '+880-1711-567890'
      },
      {
        id: 6,
        name: 'Aqua Sports Complex',
        sport: 'Swimming',
        location: 'Bashundhara, Dhaka',
        city: 'Dhaka',
        price: 2000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
        features: ['Olympic Pool', 'Kids Pool', 'Sauna', 'Changing Rooms', 'Cafe'],
        availability: 'Available',
        bookings: 920,
        description: 'Complete aquatic facility with Olympic-sized pool and recreational amenities.',
        openTime: '05:30',
        closeTime: '22:30',
        contact: '+880-1711-678901'
      },
      {
        id: 7,
        name: 'Champions Baseball Field',
        sport: 'Baseball',
        location: 'Wari, Dhaka',
        city: 'Dhaka',
        price: 4000,
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800',
        features: ['Professional Diamond', 'Dugouts', 'Scoreboards', 'Equipment Storage', 'Parking'],
        availability: 'Available',
        bookings: 340,
        description: 'Professional baseball field with regulation diamond and complete facilities.',
        openTime: '07:00',
        closeTime: '19:00',
        contact: '+880-1711-789012'
      },
      {
        id: 8,
        name: 'Volleyball Arena Pro',
        sport: 'Volleyball',
        location: 'Mohammadpur, Dhaka',
        city: 'Dhaka',
        price: 2200,
        rating: 4.4,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        features: ['Indoor Courts', 'Professional Nets', 'Seating Area', 'Sound System', 'Lighting'],
        availability: 'Available',
        bookings: 450,
        description: 'Modern volleyball facility with multiple courts and tournament capabilities.',
        openTime: '06:30',
        closeTime: '21:30',
        contact: '+880-1711-890123'
      }
    ];
  };

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      const data = generateWorkingFields();
      setFields(data);
      setFilteredFields(data);
      setLoading(false);
    }, 1000);
  }, []);

  // Working filter function
  useEffect(() => {
    let filtered = fields.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           field.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           field.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = !selectedSport || field.sport === selectedSport;
      const matchesCity = !selectedCity || field.city === selectedCity;
      const matchesPrice = field.price >= priceRange[0] && field.price <= priceRange[1];
      
      return matchesSearch && matchesSport && matchesCity && matchesPrice;
    });

    // Working sort function
    filtered.sort((a, b) => {
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

    setFilteredFields(filtered);
  }, [fields, searchTerm, selectedSport, selectedCity, priceRange, sortBy]);

  // Working booking function
  const handleBooking = (field) => {
    alert(`Booking ${field.name}!\n\nPrice: ৳${field.price}/hour\nContact: ${field.contact}\nTime: ${field.openTime} - ${field.closeTime}\n\nThis would normally redirect to booking form.`);
  };

  // Working view details function
  const handleViewDetails = (field) => {
    alert(`${field.name} Details:\n\n${field.description}\n\nLocation: ${field.location}\nRating: ${field.rating}/5\nFeatures: ${field.features.join(', ')}\n\nThis would normally show detailed view.`);
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

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black premium-gradient-text mb-6">
            🏟️ PREMIUM SPORTS FIELDS
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Discover and book the finest sports facilities with working features
          </p>
        </div>

        {/* Working Search & Filters */}
        <div className="premium-card mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">🔍 Search & Filter Fields</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Search */}
            <div>
              <label className="block text-white font-semibold mb-2">Search</label>
              <input
                type="text"
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-white font-semibold mb-2">Sport</label>
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
              <label className="block text-white font-semibold mb-2">City</label>
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
              <label className="block text-white font-semibold mb-2">Sort By</label>
              <select
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
            <label className="block text-white font-semibold mb-4">
              Price Range: ৳{priceRange[0]} - ৳{priceRange[1]} per hour
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">৳0</span>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
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

        {/* Working Fields Display */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-6'} gap-8`}>
          {filteredFields.map((field) => (
            <div key={field.id} className="premium-card group cursor-pointer">
              {/* Field Image */}
              <div className="relative overflow-hidden rounded-xl mb-6">
                <img
                  src={field.image}
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
                    : 'bg-orange-500 text-white'
                }`}>
                  {field.availability}
                </div>
              </div>

              {/* Field Info */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{field.name}</h3>
                <p className="text-gray-300 mb-2">📍 {field.location}</p>
                <p className="text-gray-300 mb-2">🏅 {field.sport}</p>
                <p className="text-gray-400 mb-4 text-sm">{field.description}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {field.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Timing */}
                <p className="text-gray-300 mb-4">🕒 Open: {field.openTime} - {field.closeTime}</p>

                {/* Price & Actions */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-3xl font-black premium-gradient-text">৳{field.price}</span>
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
          ))}
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
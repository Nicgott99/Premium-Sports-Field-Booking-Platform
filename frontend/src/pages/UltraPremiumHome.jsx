import React, { useState, useEffect } from 'react';

const UltraPremiumHome = () => {
  const [stats, setStats] = useState({ fields: 0, users: 0, bookings: 0, sports: 0 });

  useEffect(() => {
    // Animate stats
    const targets = { fields: 1250, users: 15000, bookings: 8500, sports: 25 };
    Object.keys(targets).forEach(key => {
      let start = 0;
      const end = targets[key];
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        setStats(prev => ({ ...prev, [key]: Math.floor(start) }));
      }, 16);
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* FLOATING PARTICLES BACKGROUND */}
      <div className="floating-particles">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* MEGA HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-6xl mx-auto">
          <h1 
            className="premium-gradient-text text-6xl md:text-8xl font-black mb-8 fade-in-up"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              textShadow: '0 0 30px rgba(255, 107, 107, 0.5)'
            }}
          >
            🏆 PREMIUM SPORTS PLATFORM 🏆
          </h1>
          
          <p className="text-2xl md:text-3xl text-white mb-12 fade-in-up" style={{ animationDelay: '0.2s', fontFamily: 'Rajdhani, sans-serif' }}>
            🚀 The Ultimate Sports Booking Experience 🚀
          </p>

          <div className="flex flex-wrap gap-6 justify-center mb-16 fade-in-up" style={{ animationDelay: '0.4s' }}>
            <button className="premium-btn scale-hover">
              🏟️ BOOK FIELDS NOW
            </button>
            <button className="premium-btn scale-hover">
              👥 JOIN COMMUNITY
            </button>
            <button className="premium-btn scale-hover">
              🏅 START TOURNAMENT
            </button>
          </div>
        </div>
      </section>

      {/* PREMIUM STATS SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16 premium-gradient-text">
            🌟 PLATFORM STATISTICS 🌟
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { key: 'fields', label: 'Premium Fields', icon: '🏟️', value: stats.fields },
              { key: 'users', label: 'Active Users', icon: '👥', value: stats.users },
              { key: 'bookings', label: 'Total Bookings', icon: '📅', value: stats.bookings },
              { key: 'sports', label: 'Sports Available', icon: '⚽', value: stats.sports }
            ].map((stat, index) => (
              <div 
                key={stat.key}
                className="premium-card text-center scale-hover fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-6xl mb-4">{stat.icon}</div>
                <div className="text-4xl font-black premium-gradient-text mb-2">
                  {stat.value.toLocaleString()}+
                </div>
                <div className="text-xl text-white font-semibold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM FEATURES GRID */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16 premium-gradient-text">
            ⚡ PREMIUM FEATURES ⚡
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🏟️',
                title: 'Premium Fields',
                description: 'Book the best sports facilities with advanced amenities and professional-grade equipment.',
                color: 'from-pink-500 to-rose-500'
              },
              {
                icon: '⚡',
                title: 'Instant Booking',
                description: 'Lightning-fast booking system with real-time availability and instant confirmation.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: '👥',
                title: 'Team Management',
                description: 'Advanced team creation, player recruitment, and tournament organization tools.',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: '🏆',
                title: 'Tournaments',
                description: 'Participate in or organize premium tournaments with prize pools and rankings.',
                color: 'from-purple-500 to-violet-500'
              },
              {
                icon: '📊',
                title: 'Analytics',
                description: 'Comprehensive performance tracking and detailed analytics for improvement.',
                color: 'from-orange-500 to-amber-500'
              },
              {
                icon: '🌟',
                title: 'Premium Support',
                description: '24/7 premium customer support with dedicated account managers.',
                color: 'from-teal-500 to-cyan-500'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="premium-card scale-hover fade-in-up group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className={`text-2xl font-bold mb-4 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                  {feature.title}
                </h3>
                <p className="text-white text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM SPORTS CATEGORIES */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16 premium-gradient-text">
            🏅 SPORTS CATEGORIES 🏅
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'Football', icon: '⚽', count: 150 },
              { name: 'Basketball', icon: '🏀', count: 120 },
              { name: 'Tennis', icon: '🎾', count: 100 },
              { name: 'Cricket', icon: '🏏', count: 90 },
              { name: 'Badminton', icon: '🏸', count: 80 },
              { name: 'Swimming', icon: '🏊', count: 70 },
              { name: 'Baseball', icon: '⚾', count: 60 },
              { name: 'Volleyball', icon: '🏐', count: 50 },
              { name: 'Golf', icon: '⛳', count: 40 },
              { name: 'Hockey', icon: '🏒', count: 35 },
              { name: 'Boxing', icon: '🥊', count: 30 },
              { name: 'Wrestling', icon: '🤼', count: 25 }
            ].map((sport, index) => (
              <div 
                key={index}
                className="premium-card text-center scale-hover fade-in-up group cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">
                  {sport.icon}
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {sport.name}
                </h4>
                <p className="text-sm text-gray-300">
                  {sport.count} Fields
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEGA CALL TO ACTION */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="premium-card">
            <h2 className="text-5xl font-black mb-8 premium-gradient-text">
              🚀 JOIN THE PREMIUM EXPERIENCE 🚀
            </h2>
            <p className="text-2xl text-white mb-12 leading-relaxed">
              Elevate your sports journey with our premium platform. 
              Book fields, join tournaments, build teams, and achieve greatness!
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <button className="premium-btn scale-hover text-xl px-8 py-4">
                🏆 START YOUR JOURNEY
              </button>
              <button className="premium-btn scale-hover text-xl px-8 py-4">
                📱 DOWNLOAD APP
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UltraPremiumHome;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [stats, setStats] = useState({ fields: 0, users: 0, bookings: 0, cities: 0 });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    // Animate counters
    const animateCounter = (target, key) => {
      let current = 0;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setStats(prev => ({ ...prev, [key]: Math.floor(current) }));
      }, 30);
    };

    animateCounter(250, 'fields');
    animateCounter(15000, 'users');
    animateCounter(50000, 'bookings');
    animateCounter(64, 'cities');

    // Testimonial rotation
    const testimonialTimer = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(testimonialTimer);
  }, []);

  const features = [
    {
      icon: '🏟️',
      title: 'Premium Fields',
      description: 'Access to Bangladesh\'s most exclusive sports facilities with world-class amenities',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '⚡',
      title: 'Instant Booking',
      description: 'Book your favorite fields instantly with our advanced real-time availability system',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '💎',
      title: 'Elite Experience',
      description: 'Enjoy VIP treatment with premium services and exclusive member benefits',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: '🔒',
      title: 'Secure Payments',
      description: 'Bank-level security with multiple payment options and instant confirmations',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: '📱',
      title: 'Smart Platform',
      description: 'AI-powered recommendations and intelligent matching for the perfect sports experience',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: '🏆',
      title: 'Championship Ready',
      description: 'Professional-grade facilities trusted by elite athletes and sports organizations',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmed Rahman',
      role: 'Professional Football Player',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      quote: 'The premium facilities here are absolutely world-class. Every detail is perfect for professional training.',
      rating: 5
    },
    {
      name: 'Fatima Khan',
      role: 'Tennis Coach',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b550?w=100&h=100&fit=crop&crop=face',
      quote: 'Outstanding courts and exceptional service. My students love training at these premium facilities.',
      rating: 5
    },
    {
      name: 'Rashid Ahmed',
      role: 'Cricket Captain',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      quote: 'The booking system is incredibly smooth and the facilities exceed international standards.',
      rating: 5
    }
  ];

  const sports = [
    { name: 'Football', icon: '⚽', count: '85+', color: 'from-green-400 to-blue-500' },
    { name: 'Cricket', icon: '🏏', count: '45+', color: 'from-yellow-400 to-orange-500' },
    { name: 'Basketball', icon: '🏀', count: '38+', color: 'from-orange-400 to-red-500' },
    { name: 'Tennis', icon: '🎾', count: '52+', color: 'from-green-400 to-cyan-500' },
    { name: 'Badminton', icon: '🏸', color: 'from-purple-400 to-pink-500', count: '67+' },
    { name: 'Volleyball', icon: '🏐', count: '29+', color: 'from-blue-400 to-indigo-500' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Additional Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          {/* Main Title */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 mb-6 tracking-tight leading-none">
              ELITE SPORTS
            </h1>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 mb-8 tracking-wide">
              Premium Experience
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 font-medium max-w-4xl mx-auto leading-relaxed mb-12">
            Experience Bangladesh's most exclusive sports facilities with world-class amenities, 
            professional-grade equipment, and elite-level service that champions deserve.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              to="/fields"
              className="group px-10 py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-black text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                🚀 Explore Premium Fields
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>
            
            <Link
              to="/about"
              className="px-10 py-5 border-2 border-white/20 text-white font-bold text-xl rounded-2xl transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-sm hover:border-white/40 hover:scale-105 shadow-lg"
            >
              🏆 Learn More
            </Link>
          </div>

          {/* Premium Badge */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-full px-8 py-3 border border-yellow-400/30 shadow-lg">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-lg animate-pulse" style={{animationDelay: `${i * 0.2}s`}}>⭐</span>
              ))}
            </div>
            <span className="text-yellow-400 font-bold text-lg tracking-wider uppercase">Premium Certified</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-black/40 via-purple-900/20 to-black/40 backdrop-blur-xl border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group cursor-pointer">
              <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                {stats.fields}+
              </div>
              <p className="text-gray-300 font-semibold text-lg">Premium Fields</p>
            </div>
            <div className="group cursor-pointer">
              <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                {stats.users.toLocaleString()}+
              </div>
              <p className="text-gray-300 font-semibold text-lg">Elite Members</p>
            </div>
            <div className="group cursor-pointer">
              <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                {stats.bookings.toLocaleString()}+
              </div>
              <p className="text-gray-300 font-semibold text-lg">Successful Bookings</p>
            </div>
            <div className="group cursor-pointer">
              <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                {stats.cities}+
              </div>
              <p className="text-gray-300 font-semibold text-lg">Cities Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6">
              🌟 Sports Categories
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose from our diverse range of premium sports facilities
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {sports.map((sport, index) => (
              <div
                key={sport.name}
                className="group bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-purple-500/25 cursor-pointer"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {sport.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300">
                    {sport.name}
                  </h3>
                  <p className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${sport.color}`}>
                    {sport.count}
                  </p>
                  <p className="text-sm text-gray-400">Fields Available</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-black/20 via-purple-900/10 to-black/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
              💎 Premium Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the ultimate in sports facility booking with our elite features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-purple-500/25"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="text-center">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Feature highlight */}
                  <div className={`mt-6 h-1 w-20 mx-auto bg-gradient-to-r ${feature.gradient} rounded-full group-hover:w-32 transition-all duration-300`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-6">
              🗣️ What Champions Say
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Hear from elite athletes who trust our premium facilities
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 shadow-2xl">
              <div className="text-center">
                <img
                  src={testimonials[currentTestimonial].image}
                  alt={testimonials[currentTestimonial].name}
                  className="w-20 h-20 rounded-full mx-auto mb-6 border-4 border-gradient-to-r from-purple-400 to-pink-400 shadow-lg"
                />
                
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                  ))}
                </div>
                
                <blockquote className="text-2xl md:text-3xl text-white font-medium mb-6 leading-relaxed">
                  "{testimonials[currentTestimonial].quote}"
                </blockquote>
                
                <div>
                  <h4 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    {testimonials[currentTestimonial].name}
                  </h4>
                  <p className="text-gray-400">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </div>

            {/* Testimonial Indicators */}
            <div className="flex justify-center mt-8 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-gradient-to-r from-purple-400 to-pink-400 w-8'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 mb-6">
            Ready to Experience Elite Sports?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of athletes who choose premium quality. Book your first session today and discover the difference.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/register"
              className="group px-12 py-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-black text-2xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                ✨ Start Premium Journey
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>
            
            <Link
              to="/fields"
              className="px-12 py-6 border-2 border-white/20 text-white font-bold text-2xl rounded-2xl transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-sm hover:border-white/40 hover:scale-105 shadow-lg"
            >
              🏟️ Browse Fields
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
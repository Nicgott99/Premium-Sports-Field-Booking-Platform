import React from 'react';
import { useNavigate } from 'react-router-dom';

const PremiumHome = () => {
  const navigate = useNavigate();

  const handleBookingClick = () => {
    navigate('/booking');
  };

  const handleAddFieldClick = () => {
    navigate('/add-field');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="pt-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Premium Sports
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}Platform
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Book premium sports fields with advanced time slot system, connect with players, and elevate your game in our state-of-the-art facilities
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={handleBookingClick}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              🏟️ Book a Field
            </button>
            <button 
              onClick={handleAddFieldClick}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-2xl hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              ➕ Add Your Field
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleRegisterClick}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              🚀 Sign Up Now
            </button>
            <button 
              onClick={handleLoginClick}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              🔑 Login
            </button>
          </div>
        </div>
      </div>

      {/* Premium Features Banner */}
      <div className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white mb-4">🎯 Premium Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">📧</span>
                  <span className="font-bold">Email & Phone Verification</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">⏰</span>
                  <span className="font-bold">2-Hour Time Slots (8AM-12AM)</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">👑</span>
                  <span className="font-bold">Admin Approval System</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-black text-blue-400 mb-2">500+</div>
              <div className="text-gray-300">Premium Fields</div>
            </div>
            <div className="text-center bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-black text-purple-400 mb-2">10K+</div>
              <div className="text-gray-300">Active Players</div>
            </div>
            <div className="text-center bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-black text-green-400 mb-2">16Hrs</div>
              <div className="text-gray-300">Daily Availability</div>
            </div>
            <div className="text-center bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-black text-yellow-400 mb-2">99%</div>
              <div className="text-gray-300">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">Simple steps to book your perfect field</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold text-white mb-2">Sign Up</h3>
              <p className="text-gray-300">Create your account with email verification</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold text-white mb-2">Browse Fields</h3>
              <p className="text-gray-300">Explore our premium approved sports facilities</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-red-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold text-white mb-2">Select Time</h3>
              <p className="text-gray-300">Choose your preferred 2-hour time slot</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-green-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">4</div>
              <h3 className="text-xl font-bold text-white mb-2">Book & Play</h3>
              <p className="text-gray-300">Instant confirmation and enjoy your game</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Why Choose Our Platform?</h2>
            <p className="text-xl text-gray-300">Experience the best in sports facility booking</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-4">Premium Fields</h3>
              <p className="text-gray-300">State-of-the-art facilities with professional-grade equipment and admin-approved quality standards</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart Booking</h3>
              <p className="text-gray-300">Advanced 2-hour slot system with real-time availability, automatic verification, and instant confirmations</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-green-500/50 transition-all">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure Platform</h3>
              <p className="text-gray-300">Email/phone uniqueness, verification codes, admin oversight, and secure user authentication system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      <div className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 text-center">
            <h2 className="text-3xl font-black text-white mb-4">🔐 Admin Access</h2>
            <p className="text-gray-300 mb-6">
              Admin users get access to advanced dashboard for field approval, booking management, and user oversight
            </p>
            <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
              <p className="text-purple-300 font-bold mb-2">Admin Credentials:</p>
              <p className="text-white">📧 hasibullah.khan.alvie@g.bracu.ac.bd</p>
              <p className="text-white">🔑 admin1234</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-12 border border-blue-500/30">
            <h2 className="text-4xl font-black text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300 mb-8">Join thousands of athletes using our premium platform</p>
            <button 
              onClick={handleRegisterClick}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              🚀 Start Your Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumHome;
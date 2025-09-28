import React, { useState } from 'react';

const WorkingLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (formData.email && formData.password) {
        alert(`Welcome back!\n\nEmail: ${formData.email}\nRemember Me: ${formData.rememberMe ? 'Yes' : 'No'}\n\nThis would normally authenticate and redirect to dashboard.`);
        // Simulate successful login
        localStorage.setItem('user', JSON.stringify({
          email: formData.email,
          name: formData.email.split('@')[0],
          loginTime: new Date().toISOString()
        }));
        window.location.href = '/dashboard';
      } else {
        alert('Please fill in all fields!');
      }
      setLoading(false);
    }, 1500);
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@sportspro.com',
      password: 'demo123',
      rememberMe: false
    });
    setTimeout(() => {
      document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true }));
    }, 500);
  };

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern flex items-center justify-center">
      <div className="max-w-md w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-4xl font-black premium-gradient-text mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">
            Sign in to your premium sports account
          </p>
        </div>

        {/* Login Form */}
        <div className="premium-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                📧 Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-white/70 text-gray-900 border border-blue-300 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500"
                autoComplete="email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                🔒 Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl bg-white/70 text-gray-900 border border-blue-300 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Password reset feature would be implemented here')}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                '🚀 Sign In'
              )}
            </button>

            {/* Demo Login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all duration-300"
            >
              🎮 Try Demo Login
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="px-4 text-gray-400">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              onClick={() => alert('Google login would be implemented here')}
              className="w-full py-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>🔍</span>
              <span>Continue with Google</span>
            </button>
            <button
              onClick={() => alert('Facebook login would be implemented here')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>📘</span>
              <span>Continue with Facebook</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <span className="text-gray-400">Don't have an account? </span>
            <button
              onClick={() => window.location.href = '/register'}
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Sign up here
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          {[
            { icon: '🏟️', text: 'Premium Fields' },
            { icon: '⚡', text: 'Instant Booking' },
            { icon: '🏆', text: 'Tournaments' },
            { icon: '📊', text: 'Analytics' }
          ].map((feature, index) => (
            <div key={index} className="premium-card py-4">
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-sm text-gray-300">{feature.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkingLogin;
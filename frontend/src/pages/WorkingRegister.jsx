import React, { useState } from 'react';

const WorkingRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    newsletter: true
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, phone, password, confirmPassword, agreeTerms } = formData;
    
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      alert('Please fill in all required fields!');
      return false;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return false;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return false;
    }
    
    if (!agreeTerms) {
      alert('Please agree to the Terms and Conditions!');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      alert(`Account Created Successfully!\n\nWelcome ${formData.firstName} ${formData.lastName}!\nEmail: ${formData.email}\nPhone: ${formData.phone}\nNewsletter: ${formData.newsletter ? 'Subscribed' : 'Not subscribed'}\n\nThis would normally create account and send verification email.`);
      
      // Simulate successful registration
      localStorage.setItem('user', JSON.stringify({
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        registrationTime: new Date().toISOString()
      }));
      
      // Redirect to login or dashboard
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
      setLoading(false);
    }, 2000);
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 4) return { strength: 25, text: 'Weak', color: 'text-red-400' };
    if (password.length < 6) return { strength: 50, text: 'Fair', color: 'text-yellow-400' };
    if (password.length < 8) return { strength: 75, text: 'Good', color: 'text-blue-400' };
    return { strength: 100, text: 'Strong', color: 'text-green-400' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-4xl font-black premium-gradient-text mb-2">
            Join Premium Sports
          </h1>
          <p className="text-gray-600 text-lg">
            Create your account and start your sports journey
          </p>
        </div>

        {/* Registration Form */}
        <div className="premium-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  👤 First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 rounded-xl bg-white/70 text-gray-900 border border-blue-300 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  👤 Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className="w-full px-4 py-3 rounded-xl bg-white/70 text-gray-900 border border-blue-300 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                📧 Email Address *
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

            {/* Phone Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                📱 Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 rounded-xl bg-white/70 text-gray-900 border border-blue-300 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500"
                required
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  🔒 Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create password"
                    className="w-full px-4 py-3 rounded-xl bg-white/70 text-gray-900 border border-blue-300 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500"
                    autoComplete="new-password"
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
                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${passwordStrength.strength}%` }}
                      ></div>
                    </div>
                    <p className={`text-sm mt-1 ${passwordStrength.color}`}>
                      Password strength: {passwordStrength.text}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  🔒 Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 rounded-xl bg-white/70 text-gray-900 border border-blue-300 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <p className={`text-sm mt-1 ${
                    formData.password === formData.confirmPassword 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {formData.password === formData.confirmPassword 
                      ? '✅ Passwords match' 
                      : '❌ Passwords do not match'
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="w-5 h-5 mt-0.5 text-purple-600 bg-black/30 border-purple-500/30 rounded focus:ring-purple-500"
                  required
                />
                <span className="text-gray-300">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => alert('Terms and Conditions would be displayed here')}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Terms and Conditions
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => alert('Privacy Policy would be displayed here')}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Privacy Policy
                  </button>
                  *
                </span>
              </label>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleInputChange}
                  className="w-5 h-5 mt-0.5 text-purple-600 bg-black/30 border-purple-500/30 rounded focus:ring-purple-500"
                />
                <span className="text-gray-300">
                  Subscribe to newsletter for updates and special offers
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                '🚀 Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <span className="text-gray-400">Already have an account? </span>
            <button
              onClick={() => window.location.href = '/login'}
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Sign in here
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 premium-card">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">What You'll Get</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🏟️', title: 'Premium Fields', desc: 'Access to top-tier facilities' },
              { icon: '⚡', title: 'Instant Booking', desc: 'Book fields in seconds' },
              { icon: '🏆', title: 'Tournaments', desc: 'Join competitive events' },
              { icon: '📊', title: 'Analytics', desc: 'Track your progress' }
            ].map((feature, index) => (
              <div key={index} className="text-center p-4 bg-black/20 rounded-xl">
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h4 className="text-gray-700 font-semibold mb-1">{feature.title}</h4>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingRegister;

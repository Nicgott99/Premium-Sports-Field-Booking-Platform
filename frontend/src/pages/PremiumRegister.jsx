import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PremiumRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Register, 2: Verify
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        setUserId(data.userId);
        setIsAdmin(data.isAdmin);
        setStep(2);
        alert(`Registration successful! ${data.message}`);
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      alert('Please enter verification code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          verificationCode: verificationCode
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store auth token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert(`Welcome ${data.user.firstName}! Account verified successfully.`);
        
        // Redirect based on user type
        if (data.user.isAdmin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        alert(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 4) return { strength: 25, text: 'Weak', color: 'text-red-500' };
    if (password.length < 6) return { strength: 50, text: 'Fair', color: 'text-yellow-500' };
    if (password.length < 8) return { strength: 75, text: 'Good', color: 'text-blue-500' };
    return { strength: 100, text: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-24 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-4xl font-black text-white mb-2">
            {step === 1 ? 'Join Premium Sports' : 'Verify Your Account'}
          </h1>
          <p className="text-gray-300 text-lg">
            {step === 1 
              ? 'Create your premium sports account'
              : 'Enter the verification code from terminal'
            }
          </p>
        </div>

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <form onSubmit={handleRegister} className="space-y-6">
              
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    👤 First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">
                    👤 Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  📧 Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                  autoComplete="email"
                  required
                />
                {formData.email === 'hasibullah.khan.alvie@g.bracu.ac.bd' && (
                  <p className="text-yellow-400 text-sm mt-1 flex items-center">
                    👑 Admin account detected
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  📞 Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                  autoComplete="tel"
                  required
                />
              </div>

              {/* Password Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    🔒 Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create password"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                    autoComplete="new-password"
                    required
                  />
                  {/* Password Strength */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.strength < 50 ? 'bg-red-500' :
                              passwordStrength.strength < 75 ? 'bg-yellow-500' :
                              passwordStrength.strength < 100 ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${passwordStrength.color}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    🔒 Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                    autoComplete="new-password"
                    required
                  />
                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className="mt-1">
                      {formData.password === formData.confirmPassword ? (
                        <p className="text-green-400 text-sm flex items-center">
                          ✅ Passwords match
                        </p>
                      ) : (
                        <p className="text-red-400 text-sm flex items-center">
                          ❌ Passwords do not match
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-300">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Verification Form */}
        {step === 2 && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <form onSubmit={handleVerify} className="space-y-6">
              
              {/* Verification Instructions */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                <h3 className="text-white font-bold mb-2 flex items-center">
                  🔐 Verification Required
                </h3>
                <p className="text-blue-200 text-sm">
                  A 6-digit verification code has been sent to the terminal. 
                  Please check the backend terminal and enter the code below.
                </p>
                {isAdmin && (
                  <p className="text-yellow-300 text-sm mt-2 font-semibold">
                    👑 Admin account - Additional security verification
                  </p>
                )}
              </div>

              {/* Verification Code Field */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  🔢 Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-green-500 focus:outline-none transition-all placeholder-gray-400 text-center text-2xl font-mono tracking-widest"
                  maxLength="6"
                  required
                />
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  '✅ Verify Account'
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Registration
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumRegister;
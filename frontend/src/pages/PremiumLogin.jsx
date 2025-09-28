import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PremiumLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Login, 2: Admin Verification
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [userId, setUserId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setRememberMe(checked);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        if (data.needsAdminVerification) {
          // Admin login - needs verification
          setUserId(data.userId);
          setStep(2);
          alert('Admin verification code sent to terminal!');
        } else {
          // Regular user login - complete
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          
          alert(`Welcome back, ${data.user.firstName}!`);
          navigate('/dashboard');
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminVerify = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      alert('Please enter verification code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/admin-verify', {
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
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        alert(`Welcome back, Admin ${data.user.firstName}!`);
        navigate('/admin/dashboard');
      } else {
        alert(data.message || 'Admin verification failed');
      }
    } catch (error) {
      console.error('Admin verification error:', error);
      alert('Admin verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdminEmail = formData.email === 'hasibullah.khan.alvie@g.bracu.ac.bd';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-24 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-4xl font-black text-white mb-2">
            {step === 1 ? 'Welcome Back' : 'Admin Verification'}
          </h1>
          <p className="text-gray-300 text-lg">
            {step === 1 
              ? 'Sign in to your premium sports account'
              : 'Enter admin verification code from terminal'
            }
          </p>
          {step === 1 && isAdminEmail && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
              <span className="text-yellow-300 text-sm font-semibold">👑 Admin Login</span>
            </div>
          )}
        </div>

        {/* Step 1: Login Form */}
        {step === 1 && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Email Field */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  📧 Email Address
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
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  🔒 Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset feature would be implemented here')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Admin Login Notice */}
              {isAdminEmail && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="text-yellow-300 font-bold mb-1 flex items-center">
                    👑 Admin Login Detected
                  </h3>
                  <p className="text-yellow-200 text-sm">
                    Additional verification will be required after login.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Register Link */}
              <div className="text-center">
                <p className="text-gray-300">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
                    Create Account
                  </Link>
                </p>
              </div>

              {/* Quick Admin Login */}
              <div className="border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      email: 'hasibullah.khan.alvie@g.bracu.ac.bd',
                      password: 'admin1234'
                    });
                  }}
                  className="w-full py-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm border border-yellow-500/30 rounded-lg hover:bg-yellow-500/10"
                >
                  👑 Quick Admin Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Admin Verification Form */}
        {step === 2 && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <form onSubmit={handleAdminVerify} className="space-y-6">
              
              {/* Admin Verification Instructions */}
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                <h3 className="text-yellow-300 font-bold mb-2 flex items-center">
                  👑 Admin Security Verification
                </h3>
                <p className="text-yellow-200 text-sm">
                  A 6-digit verification code has been sent to the backend terminal. 
                  Please check the server terminal and enter the code below.
                </p>
              </div>

              {/* Verification Code Field */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  🔢 Admin Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-yellow-500 focus:outline-none transition-all placeholder-gray-400 text-center text-2xl font-mono tracking-widest"
                  maxLength="6"
                  required
                />
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying Admin...</span>
                  </div>
                ) : (
                  '👑 Verify Admin Access'
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Login
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumLogin;
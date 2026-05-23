import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    gender: '',
    dateOfBirth: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      globalThis.location.href = '/login';
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/v1/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          globalThis.location.href = '/login';
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load profile');

        const userData = data.data?.user ?? data.data;
        setUser(userData);
        setFormData({
          firstName: userData.firstName ?? '',
          lastName: userData.lastName ?? '',
          phone: userData.phone ?? '',
          bio: userData.bio ?? '',
          gender: userData.gender ?? '',
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : ''
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');

      const updatedUser = data.data?.user ?? data.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">👤</div>
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Loading Profile...</h2>
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-8xl mb-6">⚠️</div>
          <h2 className="text-4xl font-bold premium-gradient-text mb-4">Profile Not Found</h2>
          <p className="text-xl text-gray-300 mb-6">{error}</p>
          <button onClick={() => globalThis.location.reload()} className="premium-btn">Retry</button>
        </div>
      </div>
    );
  }

  const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black premium-gradient-text mb-4">👤 My Profile</h1>
          <p className="text-xl text-gray-300">Manage your account information</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-400">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Profile Summary Card */}
          <div className="premium-card text-center">
            <div className="text-7xl mb-4">
              {user.avatar?.url ? (
                <img src={user.avatar.url} alt="avatar" className="w-24 h-24 rounded-full mx-auto object-cover" />
              ) : '👤'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
            <p className="text-gray-400 mb-2">{user.email}</p>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${
              user.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {user.isVerified ? '✅ Verified' : '⚠️ Unverified'}
            </div>
            <div className="text-left space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="text-white capitalize">{user.role ?? 'user'}</span>
              </div>
              {user.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-white">{user.phone}</span>
                </div>
              )}
              {user.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Gender:</span>
                  <span className="text-white capitalize">{user.gender}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="mt-6 w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
            >
              {editing ? 'Cancel Editing' : '✏️ Edit Profile'}
            </button>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 premium-card">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editing ? '✏️ Edit Information' : '📋 Profile Information'}
            </h3>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prof-firstName" className="block text-gray-400 text-sm mb-1">First Name</label>
                    <input
                      id="prof-firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="prof-lastName" className="block text-gray-400 text-sm mb-1">Last Name</label>
                    <input
                      id="prof-lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="prof-phone" className="block text-gray-400 text-sm mb-1">Phone</label>
                  <input
                    id="prof-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="prof-bio" className="block text-gray-400 text-sm mb-1">Bio</label>
                  <textarea
                    id="prof-bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none resize-vertical"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prof-gender" className="block text-gray-400 text-sm mb-1">Gender</label>
                    <select
                      id="prof-gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="prof-dob" className="block text-gray-400 text-sm mb-1">Date of Birth</label>
                    <input
                      id="prof-dob"
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'First Name', value: user.firstName },
                  { label: 'Last Name', value: user.lastName },
                  { label: 'Email', value: user.email },
                  { label: 'Phone', value: user.phone },
                  { label: 'Bio', value: user.bio },
                  { label: 'Gender', value: user.gender },
                  { label: 'Date of Birth', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null }
                ].filter(item => item.value).map((item) => (
                  <div key={item.label} className="flex justify-between items-start py-3 border-b border-gray-700/50 last:border-0">
                    <span className="text-gray-400">{item.label}:</span>
                    <span className="text-white text-right max-w-xs capitalize">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => { globalThis.location.href = '/bookings'; }}
            className="premium-card text-center hover:scale-105 transition-all cursor-pointer"
          >
            <div className="text-4xl mb-2">📅</div>
            <h3 className="text-white font-semibold">My Bookings</h3>
          </button>
          <button
            onClick={() => { globalThis.location.href = '/dashboard'; }}
            className="premium-card text-center hover:scale-105 transition-all cursor-pointer"
          >
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-white font-semibold">Dashboard</h3>
          </button>
          <button
            onClick={() => { globalThis.location.href = '/fields'; }}
            className="premium-card text-center hover:scale-105 transition-all cursor-pointer"
          >
            <div className="text-4xl mb-2">🏟️</div>
            <h3 className="text-white font-semibold">Browse Fields</h3>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

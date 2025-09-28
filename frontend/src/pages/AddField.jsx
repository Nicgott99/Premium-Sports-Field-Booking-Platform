import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AddField = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    description: '',
    pricePerHour: '',
    contactPhone: '',
    contactEmail: '',
    amenities: '',
    operatingHours: {
      start: '08:00',
      end: '24:00'
    },
    images: []
  });

  const fieldTypes = [
    'Football Field',
    'Basketball Court',
    'Tennis Court',
    'Cricket Ground',
    'Badminton Court',
    'Volleyball Court',
    'Hockey Field',
    'Baseball Field',
    'Multi-Purpose Court',
    'Other'
  ];

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      alert('Please login to add fields');
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('operatingHours.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.type || !formData.location || !formData.pricePerHour) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.pricePerHour <= 0) {
      alert('Price per hour must be greater than 0');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          pricePerHour: parseFloat(formData.pricePerHour)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Field submitted successfully! 🎉

Field Name: ${formData.name}
Type: ${formData.type}
Location: ${formData.location}
Price: $${formData.pricePerHour}/hour

Your field is now pending admin approval. You will be notified once it's approved and available for booking.`);
        
        // Reset form
        setFormData({
          name: '',
          type: '',
          location: '',
          description: '',
          pricePerHour: '',
          contactPhone: '',
          contactEmail: '',
          amenities: '',
          operatingHours: {
            start: '08:00',
            end: '24:00'
          },
          images: []
        });
      } else {
        alert(data.message || 'Failed to submit field');
      }
    } catch (error) {
      console.error('Error submitting field:', error);
      alert('Failed to submit field. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-24 px-4 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please login to add fields</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">🏟️ Add Your Field</h1>
          <p className="text-gray-300 text-lg">Submit your sports field for approval</p>
          <p className="text-blue-300 text-sm mt-2">Welcome, {user.firstName}!</p>
        </div>

        {/* Form */}
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-bold mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Central Sports Complex"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Field Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">Select field type</option>
                  {fieldTypes.map(type => (
                    <option key={type} value={type} className="bg-gray-800">{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-bold mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Sports Avenue, City"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Price per Hour ($) *
                </label>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-bold mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="e.g., +1234567890"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="e.g., field@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-bold mb-2">
                  Opening Time
                </label>
                <input
                  type="time"
                  name="operatingHours.start"
                  value={formData.operatingHours.start}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Closing Time
                </label>
                <input
                  type="time"
                  name="operatingHours.end"
                  value={formData.operatingHours.end}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-bold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your field, facilities, and any special features..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-white font-bold mb-2">
                Amenities & Facilities
              </label>
              <textarea
                name="amenities"
                value={formData.amenities}
                onChange={handleInputChange}
                placeholder="e.g., Parking, Changing rooms, Lighting, Restrooms, Water fountain..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-6">
              <h3 className="text-blue-300 font-bold mb-2">📋 Submission Process</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Your field will be reviewed by our admin team</li>
                <li>• Approval typically takes 1-2 business days</li>
                <li>• You'll be notified via email once approved</li>
                <li>• All fields must meet our quality and safety standards</li>
                <li>• Accurate information helps faster approval</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                  Submitting Field...
                </div>
              ) : (
                '🚀 Submit Field for Approval'
              )}
            </button>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6">
          <h3 className="text-yellow-300 font-bold mb-2">⚠️ Important Notes</h3>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• Fields are only available between 8:00 AM and 12:00 AM</li>
            <li>• Bookings are made in 2-hour time slots</li>
            <li>• You can manage your submitted fields from your dashboard</li>
            <li>• Ensure all contact information is accurate for verification</li>
            <li>• Price should be competitive and fair for your area</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddField;
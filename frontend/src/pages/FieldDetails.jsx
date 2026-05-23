import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const FieldDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchField = async () => {
      try {
        const response = await fetch(`/api/v1/fields/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load field');
        setField(data.data);
      } catch (err) {
        setError(err.message || 'Failed to load field');
      } finally {
        setLoading(false);
      }
    };
    fetchField();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading field details...</p>
        </div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center premium-bg-pattern">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-white mb-4">Field Not Found</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/fields')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
          >
            Browse Fields
          </button>
        </div>
      </div>
    );
  }

  const hourlyRate = field.pricing?.hourly ?? field.pricing?.basePrice ?? 0;
  const currency = field.pricing?.currency ?? 'BDT';
  const address = field.location?.address ?? '';
  const city = field.location?.city ?? '';
  const locationText = [address, city].filter(Boolean).join(', ');
  const avgRating = field.rating?.average ?? 0;
  const totalReviews = field.rating?.count ?? 0;
  const amenities = field.amenities ?? {};
  const images = field.images ?? [];

  return (
    <div className="min-h-screen pt-24 px-4 premium-bg-pattern">
      <div className="max-w-5xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => navigate('/fields')}
          className="mb-6 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          ← Back to Fields
        </button>

        {/* Hero image */}
        <div className="w-full h-64 rounded-2xl overflow-hidden mb-8 bg-gray-800">
          {images[0]?.url ? (
            <img src={images[0].url} alt={field.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🏟️</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="premium-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2">{field.name}</h1>
                  <p className="text-purple-400 font-semibold capitalize">{field.sport}</p>
                </div>
                {avgRating > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">⭐ {avgRating.toFixed(1)}</div>
                    <div className="text-gray-400 text-sm">{totalReviews} reviews</div>
                  </div>
                )}
              </div>

              {locationText && (
                <p className="text-gray-300 mb-4">📍 {locationText}</p>
              )}

              {field.description && (
                <p className="text-gray-300 leading-relaxed">{field.description}</p>
              )}
            </div>

            {/* Amenities */}
            {Object.keys(amenities).length > 0 && (
              <div className="premium-card">
                <h2 className="text-xl font-bold text-white mb-4">🏆 Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(amenities).map(([key, value]) => value && (
                    <div key={key} className="flex items-center gap-2 text-gray-300">
                      <span className="text-green-400">✓</span>
                      <span className="capitalize">{key.replaceAll('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Surface & Type */}
            {(field.surface || field.fieldType || field.capacity?.max) && (
              <div className="premium-card">
                <h2 className="text-xl font-bold text-white mb-4">📋 Details</h2>
                <div className="space-y-2">
                  {field.surface && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Surface:</span>
                      <span className="text-white capitalize">{field.surface}</span>
                    </div>
                  )}
                  {field.fieldType && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white capitalize">{field.fieldType}</span>
                    </div>
                  )}
                  {field.capacity?.max && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Capacity:</span>
                      <span className="text-white">{field.capacity.max} players</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: pricing + CTA */}
          <div className="space-y-6">
            <div className="premium-card text-center">
              <div className="text-4xl font-black premium-gradient-text mb-1">
                {currency} {hourlyRate.toLocaleString()}
              </div>
              <p className="text-gray-400 mb-6">per hour</p>
              <button
                onClick={() => navigate('/booking')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all hover:scale-105"
              >
                🎯 Book This Field
              </button>
            </div>

            {/* Owner info */}
            {field.owner && (
              <div className="premium-card">
                <h3 className="text-white font-bold mb-2">🏢 Owner</h3>
                <p className="text-gray-300">
                  {field.owner.firstName} {field.owner.lastName}
                </p>
                {field.owner.phone && (
                  <p className="text-gray-400 text-sm mt-1">📞 {field.owner.phone}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDetails;

/**
 * geoDistance.js
 * Utility to calculate geographical distance between coordinates.
 * Premium Sports Field Booking Platform
 */

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of the first point in decimal degrees.
 * @param {number} lon1 - Longitude of the first point in decimal degrees.
 * @param {number} lat2 - Latitude of the second point in decimal degrees.
 * @param {number} lon2 - Longitude of the second point in decimal degrees.
 * @param {string} [unit='km'] - The unit of distance ('km' or 'miles').
 * @returns {number} The distance between the two points.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2, unit = 'km') => {
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number'
  ) {
    throw new Error('All coordinates must be valid numbers.');
  }

  const toRadians = (degree) => (degree * Math.PI) / 180;

  const R = unit === 'miles' ? 3958.8 : 6371; // Earth's radius in miles or kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  
  // Return rounded to 2 decimal places
  return Math.round(distance * 100) / 100;
};

export default {
  calculateDistance
};

/**
 * colorUtils.js
 * Utility functions for color manipulation and generation.
 * Premium Sports Field Booking Platform
 */

/**
 * Converts a hex color string to an RGB object.
 * @param {string} hex - The hex color string (e.g., "#FF0000" or "FF0000").
 * @returns {object|null} - An object with r, g, b properties or null if invalid.
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Calculates the relative luminance of a color based on sRGB color space.
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {number} - The relative luminance.
 */
export const getLuminance = (r, g, b) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

/**
 * Determines whether text over a given hex background color should be dark or light.
 * @param {string} hexColor - The background hex color.
 * @returns {string} - 'dark' or 'light'.
 */
export const getContrastTextColor = (hexColor) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'dark'; // fallback
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  // standard threshold for deciding between light/dark text
  return luminance > 0.179 ? 'dark' : 'light';
};

/**
 * Generates an array of distinct colors (useful for charts).
 * Uses HSL to evenly distribute colors across the spectrum.
 * @param {number} count - The number of colors to generate.
 * @param {number} saturation - The saturation (0-100).
 * @param {number} lightness - The lightness (0-100).
 * @returns {string[]} - An array of HSL color strings.
 */
export const generateChartColors = (count, saturation = 70, lightness = 50) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = Math.floor((i * (360 / count)) % 360);
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
};

export default {
  hexToRgb,
  getLuminance,
  getContrastTextColor,
  generateChartColors
};

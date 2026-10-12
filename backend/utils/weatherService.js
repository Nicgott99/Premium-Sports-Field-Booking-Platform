/**
 * weatherService.js — Weather-Aware Booking Advisor
 * Premium Sports Booking Platform
 *
 * Provides weather intelligence for outdoor sports field bookings:
 *  - Fetches current / forecast weather for a field's coordinates
 *  - Scores playability (0–100) based on sport type and conditions
 *  - Emits booking warnings (rain, high winds, extreme heat/cold)
 *  - Caches responses to avoid hammering the weather API
 *
 * Supported sport presets: football, cricket, tennis, basketball (outdoor),
 * badminton (outdoor), rugby, hockey, volleyball (beach).
 *
 * Environment variables required:
 *   WEATHER_API_KEY   – OpenWeatherMap API key (free tier is fine)
 *   WEATHER_API_BASE  – optional, defaults to https://api.openweathermap.org/data/2.5
 */

const WEATHER_API_BASE =
  process.env.WEATHER_API_BASE || 'https://api.openweathermap.org/data/2.5';

// ─── In-Memory Cache ────────────────────────────────────────────────────────

const _cache = new Map(); // key → { data, expiresAt }
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function _cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function _cacheSet(key, data) {
  _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Sport Playability Thresholds ───────────────────────────────────────────

/**
 * Each sport defines its tolerance for adverse weather.
 * Values are "worst acceptable" thresholds — beyond them the sport is flagged.
 */
const SPORT_THRESHOLDS = {
  football: {
    maxWindKph: 60,
    maxRainMmPerHour: 7.5,
    minTempC: 2,
    maxTempC: 38,
    lightningHaltMinutes: 30,
  },
  cricket: {
    maxWindKph: 40,
    maxRainMmPerHour: 0.5, // any meaningful rain stops play
    minTempC: 10,
    maxTempC: 40,
    lightningHaltMinutes: 30,
  },
  tennis: {
    maxWindKph: 35,
    maxRainMmPerHour: 0.3,
    minTempC: 5,
    maxTempC: 38,
    lightningHaltMinutes: 30,
  },
  basketball: {
    maxWindKph: 50,
    maxRainMmPerHour: 5,
    minTempC: 0,
    maxTempC: 40,
    lightningHaltMinutes: 30,
  },
  badminton: {
    maxWindKph: 20, // very wind-sensitive
    maxRainMmPerHour: 1,
    minTempC: 5,
    maxTempC: 38,
    lightningHaltMinutes: 30,
  },
  rugby: {
    maxWindKph: 70,
    maxRainMmPerHour: 15,
    minTempC: -2,
    maxTempC: 36,
    lightningHaltMinutes: 30,
  },
  hockey: {
    maxWindKph: 55,
    maxRainMmPerHour: 10,
    minTempC: -5,
    maxTempC: 36,
    lightningHaltMinutes: 30,
  },
  volleyball: {
    maxWindKph: 30,
    maxRainMmPerHour: 1,
    minTempC: 10,
    maxTempC: 40,
    lightningHaltMinutes: 30,
  },
  default: {
    maxWindKph: 50,
    maxRainMmPerHour: 5,
    minTempC: 0,
    maxTempC: 40,
    lightningHaltMinutes: 30,
  },
};

// ─── OWM Weather Code → Internal Condition Map ──────────────────────────────

function _classifyOwmCode(code) {
  if (code >= 200 && code < 300) return 'thunderstorm';
  if (code >= 300 && code < 400) return 'drizzle';
  if (code >= 500 && code < 600) return 'rain';
  if (code >= 600 && code < 700) return 'snow';
  if (code >= 700 && code < 800) return 'fog'; // mist, haze, etc.
  if (code === 800) return 'clear';
  if (code > 800) return 'cloudy';
  return 'unknown';
}

// ─── Fetch Helpers ──────────────────────────────────────────────────────────

async function _fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Weather API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Core Weather Fetcher ───────────────────────────────────────────────────

/**
 * Fetch current weather for a lat/lon coordinate pair.
 * Returns a normalised weather object (independent of OWM schema version).
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<NormalisedWeather>}
 */
async function fetchCurrentWeather(lat, lon) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('WEATHER_API_KEY is not set in environment variables');
  }

  const cacheKey = `current:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  const cached = _cacheGet(cacheKey);
  if (cached) return cached;

  const url =
    `${WEATHER_API_BASE}/weather` +
    `?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  const raw = await _fetchJson(url);
  const result = _normaliseOwmCurrent(raw);
  _cacheSet(cacheKey, result);
  return result;
}

/**
 * Fetch 3-hour forecast for the next `hoursAhead` hours.
 * Returns an array of NormalisedWeather snapshots.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {number} [hoursAhead=24]
 * @returns {Promise<NormalisedWeather[]>}
 */
async function fetchForecast(lat, lon, hoursAhead = 24) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('WEATHER_API_KEY is not set in environment variables');
  }

  const cacheKey = `forecast:${lat.toFixed(3)}:${lon.toFixed(3)}:${hoursAhead}`;
  const cached = _cacheGet(cacheKey);
  if (cached) return cached;

  const cnt = Math.ceil(hoursAhead / 3); // OWM returns 3-h slots
  const url =
    `${WEATHER_API_BASE}/forecast` +
    `?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=${cnt}`;

  const raw = await _fetchJson(url);
  const result = (raw.list || []).map(_normaliseOwmForecastSlot);
  _cacheSet(cacheKey, result);
  return result;
}

// ─── OWM → Normalised Schema ─────────────────────────────────────────────────

function _normaliseOwmCurrent(raw) {
  const weather = raw.weather?.[0] || {};
  return {
    timestamp: raw.dt ? new Date(raw.dt * 1000).toISOString() : new Date().toISOString(),
    tempC: raw.main?.temp ?? null,
    feelsLikeC: raw.main?.feels_like ?? null,
    humidity: raw.main?.humidity ?? null,       // %
    windKph: raw.wind?.speed != null ? raw.wind.speed * 3.6 : null, // m/s → kph
    windGustKph: raw.wind?.gust != null ? raw.wind.gust * 3.6 : null,
    rainMmPerHour: raw.rain?.['1h'] ?? raw.rain?.['3h'] ?? 0,
    snowMmPerHour: raw.snow?.['1h'] ?? raw.snow?.['3h'] ?? 0,
    condition: _classifyOwmCode(weather.id ?? 800),
    description: weather.description ?? '',
    visibility: raw.visibility ?? null,         // metres
    uvIndex: raw.uvi ?? null,
    cloudCoverPct: raw.clouds?.all ?? 0,
    location: raw.name ?? '',
    country: raw.sys?.country ?? '',
  };
}

function _normaliseOwmForecastSlot(slot) {
  const weather = slot.weather?.[0] || {};
  return {
    timestamp: slot.dt ? new Date(slot.dt * 1000).toISOString() : null,
    tempC: slot.main?.temp ?? null,
    feelsLikeC: slot.main?.feels_like ?? null,
    humidity: slot.main?.humidity ?? null,
    windKph: slot.wind?.speed != null ? slot.wind.speed * 3.6 : null,
    windGustKph: slot.wind?.gust != null ? slot.wind.gust * 3.6 : null,
    rainMmPerHour: slot.rain?.['3h'] != null ? slot.rain['3h'] / 3 : 0,
    snowMmPerHour: slot.snow?.['3h'] != null ? slot.snow['3h'] / 3 : 0,
    condition: _classifyOwmCode(weather.id ?? 800),
    description: weather.description ?? '',
    cloudCoverPct: slot.clouds?.all ?? 0,
  };
}

// ─── Playability Scorer ──────────────────────────────────────────────────────

/**
 * Score how suitable the given weather is for a sport (0 = unplayable, 100 = perfect).
 *
 * @param {NormalisedWeather} weather
 * @param {string}            [sport='default']
 * @returns {{ score: number, warnings: string[], recommendation: string }}
 */
function scorePlayability(weather, sport = 'default') {
  const thresholds = SPORT_THRESHOLDS[sport.toLowerCase()] ?? SPORT_THRESHOLDS.default;
  const warnings = [];
  let deductions = 0;

  // Lightning / thunderstorm — always unplayable
  if (weather.condition === 'thunderstorm') {
    warnings.push(
      `⚡ Thunderstorm detected — all outdoor play must stop for at least ${thresholds.lightningHaltMinutes} minutes after last lightning.`
    );
    deductions += 100;
  }

  // Rain
  const rain = weather.rainMmPerHour ?? 0;
  if (rain > thresholds.maxRainMmPerHour) {
    const severity = rain > thresholds.maxRainMmPerHour * 3 ? 'Heavy' : 'Moderate';
    warnings.push(`🌧 ${severity} rain (${rain.toFixed(1)} mm/h) — exceeds limit for ${sport}.`);
    deductions += rain > thresholds.maxRainMmPerHour * 3 ? 60 : 35;
  } else if (rain > 0) {
    warnings.push(`🌦 Light rain (${rain.toFixed(1)} mm/h) — surface may be slippery.`);
    deductions += 10;
  }

  // Wind
  const wind = weather.windKph ?? 0;
  if (wind > thresholds.maxWindKph) {
    warnings.push(`💨 Wind speed (${wind.toFixed(0)} kph) exceeds safe limit for ${sport} (max ${thresholds.maxWindKph} kph).`);
    deductions += 40;
  } else if (wind > thresholds.maxWindKph * 0.75) {
    warnings.push(`💨 Strong winds (${wind.toFixed(0)} kph) — may affect play quality.`);
    deductions += 15;
  }

  // Gusts
  const gust = weather.windGustKph ?? 0;
  if (gust > thresholds.maxWindKph * 1.2) {
    warnings.push(`💨 Wind gusts up to ${gust.toFixed(0)} kph — hazardous conditions.`);
    deductions += 20;
  }

  // Temperature — heat
  const temp = weather.tempC ?? 20;
  if (temp > thresholds.maxTempC) {
    warnings.push(`🌡 Extreme heat (${temp.toFixed(1)}°C) — risk of heat exhaustion. Ensure hydration and breaks.`);
    deductions += 30;
  } else if (temp > thresholds.maxTempC - 3) {
    warnings.push(`🌡 High temperature (${temp.toFixed(1)}°C) — frequent water breaks recommended.`);
    deductions += 10;
  }

  // Temperature — cold
  if (temp < thresholds.minTempC) {
    warnings.push(`🥶 Temperature (${temp.toFixed(1)}°C) below safe threshold for ${sport}. Risk of hypothermia and muscle injuries.`);
    deductions += 30;
  } else if (temp < thresholds.minTempC + 3) {
    warnings.push(`🥶 Cold conditions (${temp.toFixed(1)}°C) — warm up thoroughly before play.`);
    deductions += 10;
  }

  // Snow
  if (weather.snowMmPerHour > 0) {
    warnings.push(`❄️ Snowfall detected — field surface may be dangerous.`);
    deductions += 50;
  }

  // Fog / low visibility
  const vis = weather.visibility ?? 10000;
  if (vis < 1000) {
    warnings.push(`🌫 Very low visibility (${vis}m) — dangerous for fast-paced sports.`);
    deductions += 40;
  } else if (vis < 3000) {
    warnings.push(`🌫 Reduced visibility (${vis}m) — exercise caution.`);
    deductions += 15;
  }

  const score = Math.max(0, Math.min(100, 100 - deductions));

  let recommendation;
  if (score >= 85) recommendation = 'Excellent conditions — go play!';
  else if (score >= 65) recommendation = 'Good conditions with minor considerations.';
  else if (score >= 45) recommendation = 'Marginal conditions — proceed with caution.';
  else if (score >= 20) recommendation = 'Poor conditions — consider rescheduling.';
  else recommendation = 'Unplayable — strongly recommend cancellation or postponement.';

  return { score, warnings, recommendation };
}

// ─── Booking Advisory (Main Public API) ─────────────────────────────────────

/**
 * Generate a full weather advisory for a booking.
 *
 * @param {object} params
 * @param {number}   params.lat           - Field latitude
 * @param {number}   params.lon           - Field longitude
 * @param {string}   params.sport         - Sport type (see SPORT_THRESHOLDS keys)
 * @param {Date|string} [params.bookingTime] - Booking start time (defaults to now)
 * @param {number}   [params.durationHours=2] - Booking duration in hours
 * @returns {Promise<BookingWeatherAdvisory>}
 */
async function getBookingWeatherAdvisory({ lat, lon, sport = 'default', bookingTime, durationHours = 2 }) {
  if (lat == null || lon == null) {
    throw new Error('lat and lon are required for weather advisory');
  }

  const startTime = bookingTime ? new Date(bookingTime) : new Date();
  const now = new Date();
  const minutesUntilBooking = (startTime - now) / (1000 * 60);

  let weatherData;
  let dataSource;

  if (minutesUntilBooking < 60) {
    // Booking is soon or now — use current weather
    weatherData = [await fetchCurrentWeather(lat, lon)];
    dataSource = 'current';
  } else {
    // Booking is in the future — use forecast
    const hoursAhead = Math.ceil(minutesUntilBooking / 60) + durationHours;
    const forecast = await fetchForecast(lat, lon, Math.min(hoursAhead, 120));

    // Filter to slots that fall within the booking window
    const endTime = new Date(startTime.getTime() + durationHours * 3600 * 1000);
    weatherData = forecast.filter((slot) => {
      if (!slot.timestamp) return false;
      const slotTime = new Date(slot.timestamp);
      return slotTime >= startTime && slotTime <= endTime;
    });

    // Fallback: use first forecast slot if no exact match
    if (weatherData.length === 0 && forecast.length > 0) {
      weatherData = [forecast[0]];
    }
    dataSource = 'forecast';
  }

  // Score each relevant weather window and take the worst-case
  const assessments = weatherData.map((w) => ({
    ...scorePlayability(w, sport),
    weather: w,
    timestamp: w.timestamp,
  }));

  // Worst case = lowest score
  assessments.sort((a, b) => a.score - b.score);
  const worstCase = assessments[0] ?? { score: 100, warnings: [], recommendation: 'No data available.' };

  // Aggregate all unique warnings
  const allWarnings = [...new Set(assessments.flatMap((a) => a.warnings))];

  return {
    sport,
    fieldLocation: { lat, lon },
    bookingTime: startTime.toISOString(),
    durationHours,
    dataSource,
    playabilityScore: worstCase.score,
    recommendation: worstCase.recommendation,
    warnings: allWarnings,
    weatherSummary: {
      current: assessments[0]?.weather ?? null,
      windowAssessments: assessments,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ─── Convenience Exports ─────────────────────────────────────────────────────

/**
 * Quick check: is the weather suitable enough to show a "book now" prompt?
 *
 * @param {number} lat
 * @param {number} lon
 * @param {string} [sport='default']
 * @param {number} [minScore=50]
 * @returns {Promise<boolean>}
 */
async function isFieldPlayable(lat, lon, sport = 'default', minScore = 50) {
  try {
    const weather = await fetchCurrentWeather(lat, lon);
    const { score } = scorePlayability(weather, sport);
    return score >= minScore;
  } catch {
    return true; // fail open — don't block bookings on weather API errors
  }
}

/**
 * Clear the in-memory weather cache (useful in tests or after manual invalidation).
 */
function clearWeatherCache() {
  _cache.clear();
}

/**
 * Return the list of sport types that have dedicated thresholds.
 * @returns {string[]}
 */
function getSupportedSports() {
  return Object.keys(SPORT_THRESHOLDS).filter((s) => s !== 'default');
}

export {
  fetchCurrentWeather,
  fetchForecast,
  scorePlayability,
  getBookingWeatherAdvisory,
  isFieldPlayable,
  clearWeatherCache,
  getSupportedSports,
  SPORT_THRESHOLDS,
};

export default {
  fetchCurrentWeather,
  fetchForecast,
  scorePlayability,
  getBookingWeatherAdvisory,
  isFieldPlayable,
  clearWeatherCache,
  getSupportedSports,
  SPORT_THRESHOLDS,
};

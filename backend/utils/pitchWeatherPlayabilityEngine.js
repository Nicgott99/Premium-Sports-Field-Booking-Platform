/**
 * Pitch Weather & Playability Sensor Engine
 * 
 * Ingests hyper-local pitch telemetry (soil saturation, wind speed, surface temp, lightning distance),
 * evaluates sporting governing body playability safety thresholds (FIFA / World Rugby / FA),
 * and issues automated match delay or playable greenlight certificates.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const SPORT_WEATHER_THRESHOLDS = {
  FOOTBALL_3G_SYNTHETIC: {
    sport: 'Football (Synthetic Turf)',
    maxWindSpeedKmh: 65,
    maxRainRateMmPerHour: 25,
    maxSaturationPercentage: 88,
    minSurfaceTempCelsius: 1.0, // Risk of frozen surface studs sliding
    maxSurfaceTempCelsius: 48.0, // Risk of crumb rubber heat burns
    lightningSafetyRadiusKm: 10.0,
  },
  FOOTBALL_NATURAL_GRASS: {
    sport: 'Football (Natural Grass)',
    maxWindSpeedKmh: 60,
    maxRainRateMmPerHour: 18,
    maxSaturationPercentage: 78,
    minSurfaceTempCelsius: 2.0,
    maxSurfaceTempCelsius: 40.0,
    lightningSafetyRadiusKm: 10.0,
  },
  RUGBY_UNION: {
    sport: 'Rugby Union',
    maxWindSpeedKmh: 75,
    maxRainRateMmPerHour: 30,
    maxSaturationPercentage: 92,
    minSurfaceTempCelsius: 0.5,
    maxSurfaceTempCelsius: 42.0,
    lightningSafetyRadiusKm: 10.0,
  },
};

/**
 * Validates raw pitch environmental sensor telemetry readings.
 * 
 * @param {Object} sensorData
 * @param {number} sensorData.soilSaturationPct - Soil moisture 0-100%
 * @param {number} sensorData.surfaceTempC - Surface temperature in Celsius
 * @param {number} sensorData.windSpeedKmh - Wind gust speed in km/h
 * @param {number} sensorData.rainRateMmPerHour - Rainfall intensity mm/hr
 * @param {number} [sensorData.lightningDistanceKm=999] - Closest lightning strike in km
 * @returns {Object} Validation status and sanitized readings
 */
export function validateSensorReadings(sensorData) {
  if (!sensorData || typeof sensorData !== 'object') {
    throw new Error('Sensor telemetry payload is missing or invalid.');
  }

  const {
    soilSaturationPct = 0,
    surfaceTempC = 15,
    windSpeedKmh = 0,
    rainRateMmPerHour = 0,
    lightningDistanceKm = 999,
  } = sensorData;

  const errors = [];
  if (soilSaturationPct < 0 || soilSaturationPct > 100) {
    errors.push('Soil saturation percentage must be between 0 and 100.');
  }
  if (windSpeedKmh < 0) {
    errors.push('Wind speed cannot be negative.');
  }
  if (rainRateMmPerHour < 0) {
    errors.push('Rainfall rate cannot be negative.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      soilSaturationPct: Math.min(100, Math.max(0, soilSaturationPct)),
      surfaceTempC: Math.round(surfaceTempC * 10) / 10,
      windSpeedKmh: Math.max(0, windSpeedKmh),
      rainRateMmPerHour: Math.max(0, rainRateMmPerHour),
      lightningDistanceKm: Math.max(0, lightningDistanceKm),
    },
  };
}

/**
 * Evaluates real-time pitch playability status against governing body safety limits.
 * 
 * @param {Object} sensorData - Telemetry readings
 * @param {string} [pitchProfile='FOOTBALL_3G_SYNTHETIC'] - Key from SPORT_WEATHER_THRESHOLDS
 * @returns {Object} Comprehensive playability audit with status code and action advisory
 */
export function evaluatePitchPlayability(sensorData, pitchProfile = 'FOOTBALL_3G_SYNTHETIC') {
  const validation = validateSensorReadings(sensorData);
  if (!validation.isValid) {
    throw new Error(`Sensor validation error: ${validation.errors.join('; ')}`);
  }

  const telemetry = validation.sanitized;
  const thresholds = SPORT_WEATHER_THRESHOLDS[pitchProfile] || SPORT_WEATHER_THRESHOLDS.FOOTBALL_3G_SYNTHETIC;
  const criticalHazards = [];
  const advisoryWarnings = [];

  // 1. Lightning safety check (Absolute priority: 30-30 rule)
  if (telemetry.lightningDistanceKm <= thresholds.lightningSafetyRadiusKm) {
    criticalHazards.push({
      hazard: 'LIGHTNING_IMMINENT',
      detail: `Lightning detected within ${telemetry.lightningDistanceKm} km (Safety radius: ${thresholds.lightningSafetyRadiusKm} km).`,
      action: 'IMMEDIATE_PITCH_EVACUATION_TO_CHANGING_ROOMS',
    });
  }

  // 2. High wind gale risk
  if (telemetry.windSpeedKmh >= thresholds.maxWindSpeedKmh) {
    criticalHazards.push({
      hazard: 'EXCESSIVE_WIND_GUSTS',
      detail: `Wind gusts at ${telemetry.windSpeedKmh} km/h exceed maximum threshold of ${thresholds.maxWindSpeedKmh} km/h.`,
      action: 'SUSPEND_MATCH_RISK_OF_EQUIPMENT_OR_HOARDING_COLLAPSE',
    });
  } else if (telemetry.windSpeedKmh >= thresholds.maxWindSpeedKmh * 0.8) {
    advisoryWarnings.push('High wind warning: Ball flight affected, secure corner flags.');
  }

  // 3. Waterlogging and soil saturation
  if (telemetry.soilSaturationPct >= thresholds.maxSaturationPercentage) {
    criticalHazards.push({
      hazard: 'WATERLOGGED_UNPLAYABLE',
      detail: `Turf moisture at ${telemetry.soilSaturationPct}% exceeds drainage capacity (${thresholds.maxSaturationPercentage}% limit).`,
      action: 'WATERLOGGING_SUSPENSION_AWAIT_PUMP_DRAINAGE',
    });
  } else if (telemetry.soilSaturationPct >= thresholds.maxSaturationPercentage * 0.85) {
    advisoryWarnings.push('Elevated turf moisture: Reduced ball roll distance expected.');
  }

  // 4. Surface temperature freeze / heat burn
  if (telemetry.surfaceTempC <= thresholds.minSurfaceTempCelsius) {
    criticalHazards.push({
      hazard: 'FROZEN_SURFACE',
      detail: `Pitch temperature at ${telemetry.surfaceTempC}°C creates hard impact and stud slip hazards.`,
      action: 'CANCEL_OR_DELAY_UNTIL_THAW_AND_BRUSHING',
    });
  } else if (telemetry.surfaceTempC >= thresholds.maxSurfaceTempCelsius) {
    advisoryWarnings.push(`Excessive surface heat (${telemetry.surfaceTempC}°C): Schedule mandatory drinks breaks every 15 minutes.`);
  }

  // Compute composite playability score (0 to 100)
  let playabilityScore = 100;
  if (criticalHazards.length > 0) {
    playabilityScore = Math.max(10, 40 - criticalHazards.length * 15);
  } else if (advisoryWarnings.length > 0) {
    playabilityScore = Math.max(60, 95 - advisoryWarnings.length * 12);
  }

  const isPlayable = criticalHazards.length === 0;
  let statusLevel = 'UNPLAYABLE_HAZARD';
  if (isPlayable) {
    statusLevel = advisoryWarnings.length === 0 ? 'OPTIMAL' : 'CAUTIONARY';
  }

  return {
    assessmentTimestamp: new Date().toISOString(),
    pitchProfile,
    playabilityScore,
    isPlayable,
    statusLevel,
    telemetry,
    criticalHazards,
    advisoryWarnings,
    certificateToken: `PLAY-CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
  };
}

export default {
  SPORT_WEATHER_THRESHOLDS,
  validateSensorReadings,
  evaluatePitchPlayability,
};

/**
 * fieldRecommendationEngine.js — Personalized Field Recommendation Engine
 * Premium Sports Booking Platform
 *
 * Scores and ranks sports fields for a specific user based on multiple signals:
 *  - Booking history affinity (sports the user plays most)
 *  - Location proximity to the user's preferred area
 *  - Price range compatibility with the user's historical spend
 *  - Field quality signals (rating, review count, amenities)
 *  - Time-of-day affinity (user's preferred booking hours)
 *  - Availability on the user's preferred days
 *  - Novelty boost for fields the user hasn't tried yet
 *  - Recency decay on fields already booked recently
 *
 * All functions are pure — no DB calls. Pass in pre-fetched data arrays.
 *
 * Usage:
 *   import { recommendFields, buildUserProfile } from './fieldRecommendationEngine.js';
 *
 *   const profile = buildUserProfile(user, bookingHistory);
 *   const ranked  = recommendFields(profile, allFields, { maxResults: 10 });
 */

// ─── Scoring Weights (sum should equal 1.0) ───────────────────────────────────

export const DEFAULT_WEIGHTS = {
  sportAffinity:    0.25,   // Does the field support sports the user plays?
  proximity:        0.20,   // How close is the field to user's home/preferred area?
  priceMatch:       0.15,   // Does the price fit user's typical spend?
  quality:          0.15,   // Rating + review count composite
  timeAffinity:     0.10,   // Does the field match user's preferred booking hours?
  novelty:          0.10,   // First-time visit bonus
  recencyPenalty:  -0.05,   // Slight discount if booked very recently (encourage variety)
};

// ─── Haversine Distance ──────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── User Profile Builder ─────────────────────────────────────────────────────

/**
 * Build a user affinity profile from raw booking history.
 *
 * @param {object}    user             - User document { _id, location: { lat, lon }, ... }
 * @param {object[]}  bookingHistory   - Array of past bookings
 * @param {object}    [options]
 * @param {number}    [options.recencyWindowDays=90] - Only consider bookings within this window
 * @returns {UserProfile}
 *
 * @typedef {object} UserProfile
 * @property {string}                  userId
 * @property {{ lat, lon }|null}       location
 * @property {Record<string,number>}   sportFrequency      - sport → count
 * @property {string[]}                topSports           - sorted by frequency
 * @property {number}                  avgSpend            - average amount paid
 * @property {number}                  maxSpend
 * @property {number[]}                preferredHours      - 0–23 hour distribution
 * @property {number[]}                preferredDays       - 0=Sun … 6=Sat distribution
 * @property {Set<string>}             visitedFieldIds
 * @property {Map<string,Date>}        lastVisitByField    - fieldId → most recent booking date
 */
export function buildUserProfile(user, bookingHistory = [], options = {}) {
  const { recencyWindowDays = 90 } = options;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recencyWindowDays);

  const recent = bookingHistory.filter((b) => {
    const d = new Date(b.startTime ?? b.createdAt);
    return !isNaN(d.getTime()) && d >= cutoff;
  });

  // Sport frequency
  const sportFrequency = {};
  for (const b of recent) {
    const sport = b.sport?.toLowerCase();
    if (sport) sportFrequency[sport] = (sportFrequency[sport] ?? 0) + 1;
  }
  const topSports = Object.entries(sportFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);

  // Spend profile
  const amounts = recent.map((b) => b.amountPaid ?? b.totalAmount ?? 0).filter((n) => n > 0);
  const avgSpend = amounts.length ? amounts.reduce((s, n) => s + n, 0) / amounts.length : 0;
  const maxSpend = amounts.length ? Math.max(...amounts) : 0;

  // Hour distribution (0–23)
  const preferredHours = Array(24).fill(0);
  for (const b of recent) {
    const d = new Date(b.startTime);
    if (!isNaN(d.getTime())) preferredHours[d.getHours()]++;
  }

  // Day distribution (0=Sun … 6=Sat)
  const preferredDays = Array(7).fill(0);
  for (const b of recent) {
    const d = new Date(b.startTime);
    if (!isNaN(d.getTime())) preferredDays[d.getDay()]++;
  }

  // Visited fields
  const visitedFieldIds = new Set(bookingHistory.map((b) => String(b.fieldId ?? b.field?._id ?? b.field)));

  // Last visit per field (for recency penalty)
  const lastVisitByField = new Map();
  for (const b of bookingHistory) {
    const fid  = String(b.fieldId ?? b.field?._id ?? b.field);
    const date = new Date(b.startTime ?? b.createdAt);
    if (!isNaN(date.getTime())) {
      const existing = lastVisitByField.get(fid);
      if (!existing || date > existing) lastVisitByField.set(fid, date);
    }
  }

  return {
    userId:           String(user._id ?? user.id),
    location:         user.location ?? user.homeLocation ?? null,
    sportFrequency,
    topSports,
    avgSpend,
    maxSpend,
    preferredHours,
    preferredDays,
    visitedFieldIds,
    lastVisitByField,
  };
}

// ─── Individual Signal Scorers ────────────────────────────────────────────────

/**
 * Score sport affinity: does this field support sports the user plays?
 * @returns 0.0 – 1.0
 */
function scoreSportAffinity(profile, field) {
  const fieldSports = (field.sports ?? field.sport ? [field.sport] : [])
    .map((s) => s?.toLowerCase())
    .filter(Boolean);

  if (fieldSports.length === 0) return 0.5; // unknown — neutral

  const totalBookings = Object.values(profile.sportFrequency).reduce((s, n) => s + n, 0) || 1;

  let score = 0;
  for (const sport of fieldSports) {
    const freq = profile.sportFrequency[sport] ?? 0;
    score = Math.max(score, freq / totalBookings);
  }
  return Math.min(1, score * 2); // amplify — even 50% match → 1.0
}

/**
 * Score proximity: how close is the field to the user's preferred location?
 * @returns 0.0 – 1.0
 */
function scoreProximity(profile, field) {
  const uLoc = profile.location;
  const fLoc = field.location ?? field.coordinates;
  if (!uLoc?.lat || !fLoc?.lat) return 0.5; // no data — neutral

  const distKm = haversineKm(uLoc.lat, uLoc.lon, fLoc.lat, fLoc.lon);
  // Full score within 2 km; decays to 0 at 30 km
  return Math.max(0, 1 - distKm / 30);
}

/**
 * Score price compatibility: does the field price fit the user's budget?
 * @returns 0.0 – 1.0
 */
function scorePriceMatch(profile, field) {
  const fieldPrice = field.pricePerHour ?? field.basePrice ?? 0;
  if (fieldPrice === 0 || profile.avgSpend === 0) return 0.5;

  // Estimate booking cost for a 1.5h slot
  const estimated = fieldPrice * 1.5;
  const ratio     = estimated / profile.avgSpend;

  if (ratio <= 1.0)  return 1.0;                       // cheaper or same — great
  if (ratio <= 1.25) return 0.8;                       // 25% more — acceptable
  if (ratio <= 1.75) return 0.5 - (ratio - 1.25);     // getting pricey
  return 0;                                             // too expensive
}

/**
 * Score field quality: composite of rating and review count.
 * @returns 0.0 – 1.0
 */
function scoreQuality(field) {
  const rating      = field.rating ?? field.averageRating ?? 0;
  const reviewCount = field.reviewCount ?? field.numReviews ?? 0;

  // Normalise rating (max 5)
  const ratingScore = Math.min(1, rating / 5);

  // Review count gives confidence — log scale (0 reviews = 0, 50 reviews ≈ 1)
  const confidenceScore = Math.min(1, Math.log1p(reviewCount) / Math.log1p(50));

  // Weighted combo: 70% rating, 30% confidence
  return ratingScore * 0.7 + confidenceScore * 0.3;
}

/**
 * Score time affinity: does the field's availability align with user's preferred hours?
 * @returns 0.0 – 1.0
 */
function scoreTimeAffinity(profile, field) {
  const openFrom = field.openingHour ?? field.openFrom ?? 6;
  const openTo   = field.closingHour ?? field.openTo   ?? 22;
  const totalBookings = profile.preferredHours.reduce((s, n) => s + n, 0) || 1;

  // Sum the fraction of user's bookings that fall within the field's operating hours
  let matchingBookings = 0;
  for (let h = openFrom; h < openTo; h++) {
    matchingBookings += profile.preferredHours[h] ?? 0;
  }

  return Math.min(1, matchingBookings / totalBookings);
}

/**
 * Novelty bonus: has the user never visited this field?
 * @returns 0.0 or 1.0
 */
function scoreNovelty(profile, field) {
  const fid = String(field._id ?? field.id);
  return profile.visitedFieldIds.has(fid) ? 0 : 1;
}

/**
 * Recency penalty: discourage recommending fields booked very recently.
 * Returns a NEGATIVE value (penalty).
 * @returns -1.0 – 0.0
 */
function scoreRecencyPenalty(profile, field) {
  const fid       = String(field._id ?? field.id);
  const lastVisit = profile.lastVisitByField.get(fid);
  if (!lastVisit) return 0; // never visited — no penalty

  const daysSince = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 14) return 0;             // older than 2 weeks — no penalty
  return -(1 - daysSince / 14);             // linear penalty fading over 14 days
}

// ─── Main Recommendation Function ────────────────────────────────────────────

/**
 * Score and rank fields for a user.
 *
 * @param {UserProfile} profile           - Built with buildUserProfile()
 * @param {object[]}    fields            - All candidate field documents
 * @param {object}      [options]
 * @param {number}      [options.maxResults=10]
 * @param {object}      [options.weights]          - Override DEFAULT_WEIGHTS
 * @param {number}      [options.minScore=0.0]     - Exclude fields below this threshold
 * @param {string}      [options.forSport]         - Hard-filter to only fields supporting this sport
 * @param {number}      [options.maxPricePerHour]  - Hard price cap
 * @returns {FieldRecommendation[]}
 *
 * @typedef {object} FieldRecommendation
 * @property {object}  field
 * @property {number}  score            - 0.0–1.0 composite score
 * @property {number}  percentageMatch  - score as 0–100
 * @property {number}  rank
 * @property {object}  breakdown        - per-signal scores for transparency
 * @property {string}  headline         - Human-readable reason for recommendation
 */
export function recommendFields(profile, fields = [], options = {}) {
  const {
    maxResults      = 10,
    weights         = {},
    minScore        = 0,
    forSport,
    maxPricePerHour,
  } = options;

  const w = { ...DEFAULT_WEIGHTS, ...weights };

  let candidates = fields;

  // Hard filters
  if (forSport) {
    const sport = forSport.toLowerCase();
    candidates = candidates.filter((f) => {
      const fieldSports = (f.sports ?? (f.sport ? [f.sport] : [])).map((s) => s?.toLowerCase());
      return fieldSports.includes(sport);
    });
  }
  if (maxPricePerHour != null) {
    candidates = candidates.filter((f) => (f.pricePerHour ?? f.basePrice ?? 0) <= maxPricePerHour);
  }

  const scored = candidates.map((field) => {
    const signals = {
      sportAffinity:  scoreSportAffinity(profile, field),
      proximity:      scoreProximity(profile, field),
      priceMatch:     scorePriceMatch(profile, field),
      quality:        scoreQuality(field),
      timeAffinity:   scoreTimeAffinity(profile, field),
      novelty:        scoreNovelty(profile, field),
      recencyPenalty: scoreRecencyPenalty(profile, field),
    };

    const score = Math.max(0, Math.min(1,
      signals.sportAffinity  * w.sportAffinity  +
      signals.proximity      * w.proximity      +
      signals.priceMatch     * w.priceMatch     +
      signals.quality        * w.quality        +
      signals.timeAffinity   * w.timeAffinity   +
      signals.novelty        * w.novelty        +
      signals.recencyPenalty * Math.abs(w.recencyPenalty)
    ));

    const headline = buildHeadline(signals, profile, field);

    return {
      field,
      score:           +score.toFixed(3),
      percentageMatch: Math.round(score * 100),
      breakdown:       Object.fromEntries(Object.entries(signals).map(([k, v]) => [k, +v.toFixed(3)])),
      headline,
    };
  });

  return scored
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// ─── Headline Generator ───────────────────────────────────────────────────────

/**
 * Build a short human-readable reason for the recommendation.
 */
function buildHeadline(signals, profile, field) {
  const reasons = [];

  if (signals.sportAffinity >= 0.8 && profile.topSports[0]) {
    reasons.push(`Great for ${profile.topSports[0]}`);
  }
  if (signals.proximity >= 0.85) {
    reasons.push('Very close to you');
  } else if (signals.proximity >= 0.6) {
    reasons.push('Nearby');
  }
  if (signals.quality >= 0.8) {
    reasons.push('Highly rated');
  }
  if (signals.novelty === 1) {
    reasons.push("You haven't tried this one yet");
  }
  if (signals.priceMatch >= 0.9) {
    reasons.push('Great value for you');
  }

  if (reasons.length === 0) {
    const name = field.name ?? 'This field';
    return `${name} matches your booking preferences`;
  }

  return reasons.slice(0, 2).join(' · ');
}

// ─── Trending Fields ──────────────────────────────────────────────────────────

/**
 * Identify trending fields based on recent booking velocity.
 *
 * @param {object[]}  allBookings         - Platform-wide booking records
 * @param {object[]}  fields              - All field documents
 * @param {object}    [options]
 * @param {number}    [options.windowDays=7]    - Lookback window
 * @param {number}    [options.maxResults=5]
 * @returns {TrendingField[]}
 *
 * @typedef {object} TrendingField
 * @property {object} field
 * @property {number} recentBookings
 * @property {number} trendScore        - normalized 0–1
 * @property {number} rank
 */
export function getTrendingFields(allBookings, fields, options = {}) {
  const { windowDays = 7, maxResults = 5 } = options;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);

  const recentByField = {};
  for (const b of allBookings) {
    const d = new Date(b.startTime ?? b.createdAt);
    if (isNaN(d.getTime()) || d < cutoff) continue;
    const fid = String(b.fieldId ?? b.field?._id ?? b.field);
    recentByField[fid] = (recentByField[fid] ?? 0) + 1;
  }

  const maxCount = Math.max(...Object.values(recentByField), 1);

  return fields
    .map((field) => {
      const fid          = String(field._id ?? field.id);
      const recentBookings = recentByField[fid] ?? 0;
      const trendScore   = recentBookings / maxCount;
      return { field, recentBookings, trendScore: +trendScore.toFixed(3) };
    })
    .filter((r) => r.recentBookings > 0)
    .sort((a, b) => b.recentBookings - a.recentBookings)
    .slice(0, maxResults)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// ─── Similar Fields ───────────────────────────────────────────────────────────

/**
 * Find fields similar to a given reference field (for "You might also like" sections).
 *
 * @param {object}   referenceField
 * @param {object[]} allFields
 * @param {object}   [options]
 * @param {number}   [options.maxResults=4]
 * @returns {SimilarField[]}
 */
export function getSimilarFields(referenceField, allFields, options = {}) {
  const { maxResults = 4 } = options;

  const refId     = String(referenceField._id ?? referenceField.id);
  const refSports = (referenceField.sports ?? [referenceField.sport]).map((s) => s?.toLowerCase()).filter(Boolean);
  const refPrice  = referenceField.pricePerHour ?? referenceField.basePrice ?? 0;
  const refRating = referenceField.rating ?? referenceField.averageRating ?? 0;
  const refLat    = referenceField.location?.lat ?? referenceField.coordinates?.lat;
  const refLon    = referenceField.location?.lon ?? referenceField.coordinates?.lon;

  return allFields
    .filter((f) => String(f._id ?? f.id) !== refId)
    .map((field) => {
      const sports  = (field.sports ?? [field.sport]).map((s) => s?.toLowerCase()).filter(Boolean);
      const price   = field.pricePerHour ?? field.basePrice ?? 0;
      const rating  = field.rating ?? field.averageRating ?? 0;
      const lat     = field.location?.lat ?? field.coordinates?.lat;
      const lon     = field.location?.lon ?? field.coordinates?.lon;

      // Sport overlap (Jaccard)
      const intersection = refSports.filter((s) => sports.includes(s)).length;
      const union        = new Set([...refSports, ...sports]).size;
      const sportSim     = union > 0 ? intersection / union : 0;

      // Price similarity (within ±30%)
      const priceSim = refPrice > 0
        ? Math.max(0, 1 - Math.abs(price - refPrice) / (refPrice * 0.3))
        : 0.5;

      // Rating similarity
      const ratingSim = Math.max(0, 1 - Math.abs(rating - refRating) / 5);

      // Proximity
      let proxSim = 0.5;
      if (refLat && refLon && lat && lon) {
        const dist = haversineKm(refLat, refLon, lat, lon);
        proxSim = Math.max(0, 1 - dist / 20);
      }

      const similarity = sportSim * 0.4 + priceSim * 0.2 + ratingSim * 0.2 + proxSim * 0.2;

      return { field, similarity: +similarity.toFixed(3) };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
  DEFAULT_WEIGHTS,
  buildUserProfile,
  recommendFields,
  getTrendingFields,
  getSimilarFields,
};

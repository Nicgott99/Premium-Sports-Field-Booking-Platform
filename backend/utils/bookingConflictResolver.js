/**
 * bookingConflictResolver.js — Booking Conflict Detection & Resolution Engine
 * Premium Sports Booking Platform
 *
 * Detects scheduling conflicts across field bookings and provides intelligent
 * resolution strategies including priority-based eviction, gap detection,
 * and alternative slot suggestions.
 *
 * Features:
 *  - O(n log n) sweep-line conflict detection
 *  - Overlap classification: exact, partial-start, partial-end, contained
 *  - Priority scoring based on booking type, user tier, and creation time
 *  - Alternative slot finder within a configurable search window
 *  - Minimum buffer gap enforcement between consecutive bookings
 *  - Batch conflict scan for bulk import / admin operations
 *
 * All functions are pure (no DB calls) — pass in pre-fetched booking arrays.
 * Integrate with the Booking model controller for pre-save conflict checks.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Buffer (in minutes) automatically enforced between consecutive bookings. */
export const DEFAULT_BUFFER_MINUTES = 15;

/** How far ahead (in days) to search for an alternative slot. */
export const DEFAULT_SEARCH_WINDOW_DAYS = 7;

/** Priority weights — higher = takes precedence in conflict resolution. */
export const PRIORITY_WEIGHTS = {
  bookingType: {
    tournament: 100,
    league:     80,
    corporate:  60,
    recurring:  50,
    regular:    30,
    casual:     10,
  },
  userTier: {
    premium:    40,
    standard:   20,
    guest:      0,
  },
};

// ─── Time Helpers ─────────────────────────────────────────────────────────────

/**
 * Parse a booking's start/end into millisecond timestamps.
 * Accepts Date objects, ISO strings, or epoch numbers.
 *
 * @param {{ startTime: any, endTime: any }} booking
 * @returns {{ startMs: number, endMs: number }}
 */
export function parseBookingWindow(booking) {
  const startMs = new Date(booking.startTime).getTime();
  const endMs   = new Date(booking.endTime).getTime();
  if (isNaN(startMs) || isNaN(endMs)) {
    throw new Error(`Invalid booking window for booking ${booking._id ?? booking.id}: startTime=${booking.startTime}, endTime=${booking.endTime}`);
  }
  if (endMs <= startMs) {
    throw new Error(`Booking ${booking._id ?? booking.id} has endTime before or equal to startTime`);
  }
  return { startMs, endMs };
}

/**
 * Check whether two booking windows overlap (including buffer).
 *
 * @param {{ startTime, endTime }} bookingA
 * @param {{ startTime, endTime }} bookingB
 * @param {number} [bufferMinutes=0]
 * @returns {boolean}
 */
export function doBookingsOverlap(bookingA, bookingB, bufferMinutes = 0) {
  const bufferMs = bufferMinutes * 60_000;
  const { startMs: aStart, endMs: aEnd } = parseBookingWindow(bookingA);
  const { startMs: bStart, endMs: bEnd } = parseBookingWindow(bookingB);
  // A overlaps B if A starts before B ends (+ buffer) and A ends after B starts (- buffer)
  return aStart < bEnd + bufferMs && aEnd > bStart - bufferMs;
}

/**
 * Classify the type of overlap between two bookings.
 *
 * @param {{ startTime, endTime }} bookingA
 * @param {{ startTime, endTime }} bookingB
 * @returns {'none'|'exact'|'contained'|'contains'|'partial-start'|'partial-end'}
 */
export function classifyOverlap(bookingA, bookingB) {
  const { startMs: aStart, endMs: aEnd } = parseBookingWindow(bookingA);
  const { startMs: bStart, endMs: bEnd } = parseBookingWindow(bookingB);

  if (aEnd <= bStart || bEnd <= aStart) return 'none';
  if (aStart === bStart && aEnd === bEnd) return 'exact';
  if (aStart >= bStart && aEnd <= bEnd)  return 'contained';    // A is inside B
  if (aStart <= bStart && aEnd >= bEnd)  return 'contains';     // A wraps around B
  if (aStart < bStart && aEnd > bStart)  return 'partial-end';  // A starts first
  if (aStart > bStart && aStart < bEnd)  return 'partial-start';// B starts first
  return 'none';
}

/**
 * Calculate overlap duration in minutes between two bookings.
 *
 * @param {{ startTime, endTime }} bookingA
 * @param {{ startTime, endTime }} bookingB
 * @returns {number} Overlap in minutes (0 if none)
 */
export function overlapDurationMinutes(bookingA, bookingB) {
  const { startMs: aStart, endMs: aEnd } = parseBookingWindow(bookingA);
  const { startMs: bStart, endMs: bEnd } = parseBookingWindow(bookingB);
  const overlapMs = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
  return Math.round(overlapMs / 60_000);
}

// ─── Priority Scoring ─────────────────────────────────────────────────────────

/**
 * Compute a numeric priority score for a booking.
 * Higher score = higher priority = should not be bumped.
 *
 * @param {object} booking
 * @param {string} [booking.bookingType]  - Key from PRIORITY_WEIGHTS.bookingType
 * @param {string} [booking.userTier]     - Key from PRIORITY_WEIGHTS.userTier
 * @param {string|Date} [booking.createdAt] - Earlier bookings get a small bonus
 * @returns {number}
 */
export function computePriorityScore(booking) {
  const typeScore = PRIORITY_WEIGHTS.bookingType[booking.bookingType?.toLowerCase()] ?? 30;
  const tierScore = PRIORITY_WEIGHTS.userTier[booking.userTier?.toLowerCase()] ?? 0;

  // Earlier bookings get a recency bonus (up to 20 points over 30 days)
  const ageMs    = booking.createdAt ? Date.now() - new Date(booking.createdAt).getTime() : 0;
  const ageDays  = ageMs / (1000 * 60 * 60 * 24);
  const ageBonus = Math.max(0, 20 - ageDays * (20 / 30)); // linearly decays over 30 days

  return typeScore + tierScore + ageBonus;
}

// ─── Core Conflict Detector ───────────────────────────────────────────────────

/**
 * Detect all conflicts for a single candidate booking against an existing set.
 *
 * @param {object}   candidate              - The new/updated booking to check
 * @param {object[]} existingBookings       - Current confirmed bookings for the field
 * @param {object}   [options]
 * @param {number}   [options.bufferMinutes=15]  - Minimum gap between bookings
 * @param {string[]} [options.ignoreIds=[]]      - Booking IDs to exclude (e.g. self on update)
 * @returns {ConflictResult[]}
 *
 * @typedef {object} ConflictResult
 * @property {object}  conflictingBooking
 * @property {string}  overlapType
 * @property {number}  overlapMinutes
 * @property {number}  candidatePriority
 * @property {number}  existingPriority
 * @property {'candidate-wins'|'existing-wins'|'tie'} resolution
 */
export function detectConflicts(candidate, existingBookings, options = {}) {
  const { bufferMinutes = DEFAULT_BUFFER_MINUTES, ignoreIds = [] } = options;

  const ignoreSet = new Set(ignoreIds.map(String));

  return existingBookings
    .filter((b) => !ignoreSet.has(String(b._id ?? b.id)))
    .filter((b) => doBookingsOverlap(candidate, b, bufferMinutes))
    .map((conflicting) => {
      const overlapType    = classifyOverlap(candidate, conflicting);
      const overlapMins    = overlapDurationMinutes(candidate, conflicting);
      const candidatePriority = computePriorityScore(candidate);
      const existingPriority  = computePriorityScore(conflicting);

      let resolution;
      if (candidatePriority > existingPriority)       resolution = 'candidate-wins';
      else if (existingPriority > candidatePriority)  resolution = 'existing-wins';
      else                                             resolution = 'tie';

      return {
        conflictingBooking: conflicting,
        overlapType,
        overlapMinutes: overlapMins,
        candidatePriority: +candidatePriority.toFixed(1),
        existingPriority:  +existingPriority.toFixed(1),
        resolution,
      };
    });
}

/**
 * Quick boolean check — is there ANY conflict for a candidate booking?
 *
 * @param {object}   candidate
 * @param {object[]} existingBookings
 * @param {object}   [options]
 * @returns {boolean}
 */
export function hasConflict(candidate, existingBookings, options = {}) {
  return detectConflicts(candidate, existingBookings, options).length > 0;
}

// ─── Gap Finder ───────────────────────────────────────────────────────────────

/**
 * Find all free time gaps in a field's schedule within a date range.
 *
 * @param {object[]} bookings      - Existing confirmed bookings (any order)
 * @param {Date|string} rangeStart
 * @param {Date|string} rangeEnd
 * @param {number} [bufferMinutes=15]
 * @returns {Gap[]}
 *
 * @typedef {object} Gap
 * @property {string} start        - ISO string
 * @property {string} end          - ISO string
 * @property {number} durationMins
 */
export function findFreeGaps(bookings, rangeStart, rangeEnd, bufferMinutes = DEFAULT_BUFFER_MINUTES) {
  const bufferMs    = bufferMinutes * 60_000;
  const rangeStartMs = new Date(rangeStart).getTime();
  const rangeEndMs   = new Date(rangeEnd).getTime();

  // Sort bookings by start time
  const sorted = [...bookings]
    .filter((b) => {
      const { startMs, endMs } = parseBookingWindow(b);
      return endMs > rangeStartMs && startMs < rangeEndMs;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const gaps = [];
  let cursor = rangeStartMs;

  for (const booking of sorted) {
    const { startMs, endMs } = parseBookingWindow(booking);
    const effectiveStart = Math.max(rangeStartMs, startMs);

    if (cursor + bufferMs < effectiveStart) {
      const gapStart = cursor;
      const gapEnd   = effectiveStart;
      const durationMins = Math.round((gapEnd - gapStart) / 60_000);
      if (durationMins > 0) {
        gaps.push({
          start: new Date(gapStart).toISOString(),
          end:   new Date(gapEnd).toISOString(),
          durationMins,
        });
      }
    }

    cursor = Math.max(cursor, endMs + bufferMs);
  }

  // Trailing gap
  if (cursor < rangeEndMs) {
    const durationMins = Math.round((rangeEndMs - cursor) / 60_000);
    if (durationMins > 0) {
      gaps.push({
        start: new Date(cursor).toISOString(),
        end:   new Date(rangeEndMs).toISOString(),
        durationMins,
      });
    }
  }

  return gaps;
}

// ─── Alternative Slot Suggester ───────────────────────────────────────────────

/**
 * Suggest alternative time slots when a requested slot is unavailable.
 *
 * @param {object}   requestedBooking   - The booking that caused a conflict
 * @param {object[]} existingBookings   - Current field schedule
 * @param {object}   [options]
 * @param {number}   [options.searchWindowDays=7]   - How many days ahead to search
 * @param {number}   [options.maxSuggestions=3]
 * @param {number}   [options.bufferMinutes=15]
 * @param {number[]} [options.allowedHours]          - e.g. [6,7,8,...,22] — operating hours
 * @returns {SlotSuggestion[]}
 *
 * @typedef {object} SlotSuggestion
 * @property {string} start
 * @property {string} end
 * @property {number} durationMins
 * @property {number} daysFromOriginal
 * @property {'same-day'|'next-day'|'later'} proximity
 */
export function suggestAlternativeSlots(requestedBooking, existingBookings, options = {}) {
  const {
    searchWindowDays = DEFAULT_SEARCH_WINDOW_DAYS,
    maxSuggestions   = 3,
    bufferMinutes    = DEFAULT_BUFFER_MINUTES,
    allowedHours     = Array.from({ length: 17 }, (_, i) => i + 6), // 06:00–22:00
  } = options;

  const { startMs, endMs } = parseBookingWindow(requestedBooking);
  const durationMs = endMs - startMs;
  const minHour    = Math.min(...allowedHours);
  const maxHour    = Math.max(...allowedHours);

  const searchStart = new Date(startMs);
  searchStart.setHours(0, 0, 0, 0);

  const searchEnd = new Date(searchStart.getTime() + searchWindowDays * 86_400_000);

  // Find all free gaps within the search window
  const gaps = findFreeGaps(existingBookings, searchStart, searchEnd, bufferMinutes);

  const suggestions = [];

  for (const gap of gaps) {
    if (suggestions.length >= maxSuggestions) break;

    const gapStartMs = new Date(gap.start).getTime();
    const gapEndMs   = new Date(gap.end).getTime();

    // Try to fit the booking duration within this gap, respecting operating hours
    let slotStart = gapStartMs;

    // Snap to operating hours
    const slotStartDate = new Date(slotStart);
    if (slotStartDate.getHours() < minHour) {
      slotStartDate.setHours(minHour, 0, 0, 0);
      slotStart = slotStartDate.getTime();
    }

    const slotEnd = slotStart + durationMs;

    // Verify slot fits in gap and within operating hours
    const slotEndDate = new Date(slotEnd);
    if (
      slotEnd <= gapEndMs &&
      slotEndDate.getHours() < maxHour + 1 &&
      slotStart >= gapStartMs
    ) {
      const daysFromOriginal = Math.round((slotStart - startMs) / 86_400_000);
      let proximity;
      if (daysFromOriginal === 0)      proximity = 'same-day';
      else if (daysFromOriginal === 1) proximity = 'next-day';
      else                             proximity = 'later';

      suggestions.push({
        start:            new Date(slotStart).toISOString(),
        end:              new Date(slotEnd).toISOString(),
        durationMins:     Math.round(durationMs / 60_000),
        daysFromOriginal,
        proximity,
      });
    }
  }

  return suggestions;
}

// ─── Batch Conflict Scanner ────────────────────────────────────────────────────

/**
 * Scan an entire array of bookings for internal conflicts.
 * Useful for admin bulk-import validation or nightly consistency checks.
 *
 * @param {object[]} bookings       - All bookings for a field (mixed status ok)
 * @param {object}   [options]
 * @param {number}   [options.bufferMinutes=0]  - Buffer between bookings
 * @param {string[]} [options.statusFilter]     - Only check these statuses (default: ['confirmed'])
 * @returns {BatchConflictReport}
 *
 * @typedef {object} BatchConflictReport
 * @property {number}                 totalBookings
 * @property {number}                 conflictPairCount
 * @property {ConflictPair[]}         conflictPairs
 * @property {string[]}               affectedBookingIds
 * @property {boolean}                hasConflicts
 *
 * @typedef {object} ConflictPair
 * @property {string} bookingIdA
 * @property {string} bookingIdB
 * @property {string} overlapType
 * @property {number} overlapMinutes
 */
export function batchScanConflicts(bookings, options = {}) {
  const {
    bufferMinutes  = 0,
    statusFilter   = ['confirmed'],
  } = options;

  const filtered = statusFilter.length
    ? bookings.filter((b) => statusFilter.includes(b.status?.toLowerCase()))
    : bookings;

  // Sort by start time for the sweep
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const conflictPairs  = [];
  const affectedIds    = new Set();

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];

      // Early exit: once B starts after A ends (+ buffer), no more overlaps possible
      const { endMs: aEnd } = parseBookingWindow(a);
      const { startMs: bStart } = parseBookingWindow(b);
      if (bStart >= aEnd + bufferMinutes * 60_000) break;

      if (doBookingsOverlap(a, b, bufferMinutes)) {
        const idA = String(a._id ?? a.id);
        const idB = String(b._id ?? b.id);
        conflictPairs.push({
          bookingIdA:     idA,
          bookingIdB:     idB,
          overlapType:    classifyOverlap(a, b),
          overlapMinutes: overlapDurationMinutes(a, b),
        });
        affectedIds.add(idA);
        affectedIds.add(idB);
      }
    }
  }

  return {
    totalBookings:     filtered.length,
    conflictPairCount: conflictPairs.length,
    conflictPairs,
    affectedBookingIds: [...affectedIds],
    hasConflicts:      conflictPairs.length > 0,
  };
}

// ─── Full Resolution Report ───────────────────────────────────────────────────

/**
 * Generate a complete conflict resolution report for a candidate booking.
 * Combines conflict detection + alternative slot suggestions into one response.
 *
 * @param {object}   candidate
 * @param {object[]} existingBookings
 * @param {object}   [options]
 * @returns {ResolutionReport}
 *
 * @typedef {object} ResolutionReport
 * @property {boolean}          hasConflicts
 * @property {ConflictResult[]} conflicts
 * @property {SlotSuggestion[]} alternatives
 * @property {string}           summary
 */
export function resolveBookingConflicts(candidate, existingBookings, options = {}) {
  const conflicts    = detectConflicts(candidate, existingBookings, options);
  const hasConflicts = conflicts.length > 0;

  let alternatives = [];
  if (hasConflicts) {
    alternatives = suggestAlternativeSlots(candidate, existingBookings, options);
  }

  let summary;
  if (!hasConflicts) {
    summary = 'No conflicts detected. Slot is available.';
  } else if (conflicts.every((c) => c.resolution === 'candidate-wins')) {
    summary = `${conflicts.length} conflict(s) detected — candidate booking has higher priority.`;
  } else {
    summary = `${conflicts.length} conflict(s) detected — ${alternatives.length} alternative slot(s) suggested.`;
  }

  return {
    hasConflicts,
    conflicts,
    alternatives,
    summary,
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
  DEFAULT_BUFFER_MINUTES,
  DEFAULT_SEARCH_WINDOW_DAYS,
  PRIORITY_WEIGHTS,
  parseBookingWindow,
  doBookingsOverlap,
  classifyOverlap,
  overlapDurationMinutes,
  computePriorityScore,
  detectConflicts,
  hasConflict,
  findFreeGaps,
  suggestAlternativeSlots,
  batchScanConflicts,
  resolveBookingConflicts,
};

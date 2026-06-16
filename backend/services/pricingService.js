const DEMAND_MULTIPLIERS = {
  peak:    1.5,
  high:    1.25,
  normal:  1,
  low:     0.85,
};

const PEAK_HOURS  = new Set([17, 18, 19, 20, 21]);
const HIGH_HOURS  = new Set([8, 9, 10, 11, 15, 16]);
const LOW_HOURS   = new Set([5, 6, 7, 22]);

const SPORT_MODIFIERS = {
  Football:   1.2,
  Cricket:    1.1,
  Badminton:  0.9,
  Basketball: 1,
  Tennis:     1.15,
  Volleyball: 0.95,
};

const getDemandLevel = (hour, isWeekend, occupancyRate = 0.5) => {
  if (isWeekend && PEAK_HOURS.has(hour)) return 'peak';
  if (PEAK_HOURS.has(hour) || (isWeekend && occupancyRate > 0.7)) return 'high';
  if (LOW_HOURS.has(hour) || occupancyRate < 0.2) return 'low';
  return 'normal';
};

const calculatePrice = ({ basePrice, sport, startHour, durationHours, isWeekend, occupancyRate, membershipDiscount = 0, promoDiscount = 0 }) => {
  const demandLevel  = getDemandLevel(startHour, isWeekend, occupancyRate);
  const demandMult   = DEMAND_MULTIPLIERS[demandLevel];
  const sportMod     = SPORT_MODIFIERS[sport] ?? 1;
  const hourlyRate   = Math.round(basePrice * demandMult * sportMod);
  const subtotal     = hourlyRate * durationHours;

  const memberDiscount = Math.round(subtotal * (membershipDiscount / 100));
  const promoOff       = Math.round(subtotal * (promoDiscount / 100));
  const total          = Math.max(0, subtotal - memberDiscount - promoOff);

  return {
    hourlyRate,
    subtotal,
    discounts:     { membership: memberDiscount, promo: promoOff },
    total,
    demandLevel,
    breakdown: {
      basePrice,
      demandMultiplier: demandMult,
      sportModifier:    sportMod,
      durationHours,
    },
  };
};

const getSurgeLabel = (level) => {
  if (level === 'peak') return '🔥 Peak Hour';
  if (level === 'high') return '📈 High Demand';
  if (level === 'low')  return '💤 Off-Peak';
  return '✅ Normal Rate';
};

const getSurgeInfo = (hour, isWeekend, occupancyRate) => {
  const level = getDemandLevel(hour, isWeekend, occupancyRate);
  return {
    level,
    multiplier: DEMAND_MULTIPLIERS[level],
    label: getSurgeLabel(level),
  };
};

const getBestTimeSlots = (basePrice, sport, isWeekend, count = 3) => {
  const slots = [];
  for (let h = 5; h <= 22; h++) {
    const info  = calculatePrice({ basePrice, sport, startHour: h, durationHours: 1, isWeekend, occupancyRate: 0.5 });
    slots.push({ hour: h, label: `${h}:00 – ${h + 1}:00`, price: info.hourlyRate, level: info.demandLevel });
  }
  return slots.toSorted((a, b) => a.price - b.price).slice(0, count);
};

export { calculatePrice, getSurgeInfo, getBestTimeSlots, getDemandLevel, DEMAND_MULTIPLIERS, SPORT_MODIFIERS };

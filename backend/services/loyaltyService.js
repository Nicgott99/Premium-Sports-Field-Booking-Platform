const POINTS_CONFIG = {
  perHour: 50,
  perBooking: 20,
  bonusWeekend: 1.5,
  bonusEarlyBird: 1.25,
  bonusPremiumField: 2,
  referralBonus: 200,
  reviewBonus: 30,
};

const TIERS = [
  { name: 'Bronze',   minPoints: 0,     maxPoints: 999,   discount: 0,  perks: ['Priority support'] },
  { name: 'Silver',   minPoints: 1000,  maxPoints: 4999,  discount: 5,  perks: ['5% booking discount', 'Free cancellation up to 2h'] },
  { name: 'Gold',     minPoints: 5000,  maxPoints: 14999, discount: 10, perks: ['10% booking discount', 'Free cancellation up to 4h', 'Early access to new fields'] },
  { name: 'Platinum', minPoints: 15000, maxPoints: Infinity, discount: 15, perks: ['15% booking discount', 'Free cancellation anytime', 'VIP field access', 'Dedicated support'] },
];

const getTier = (points) => TIERS.find(t => points >= t.minPoints && points <= t.maxPoints) ?? TIERS[0];

const getNextTier = (points) => {
  const idx = TIERS.findIndex(t => points >= t.minPoints && points <= t.maxPoints);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
};

const calculateBookingPoints = ({ hours = 1, startHour = 10, isWeekend = false, isPremium = false }) => {
  let points = hours * POINTS_CONFIG.perHour + POINTS_CONFIG.perBooking;
  if (isWeekend) points *= POINTS_CONFIG.bonusWeekend;
  if (startHour < 9) points *= POINTS_CONFIG.bonusEarlyBird;
  if (isPremium) points *= POINTS_CONFIG.bonusPremiumField;
  return Math.round(points);
};

const redeemPoints = (currentPoints, pointsToRedeem) => {
  if (pointsToRedeem > currentPoints) throw new Error('Insufficient points');
  if (pointsToRedeem % 100 !== 0) throw new Error('Points must be redeemed in multiples of 100');
  const discountAmount = (pointsToRedeem / 100) * 10;
  return { remainingPoints: currentPoints - pointsToRedeem, discountAmount };
};

const buildSummary = (userPoints) => {
  const tier     = getTier(userPoints);
  const nextTier = getNextTier(userPoints);
  return {
    points: userPoints,
    tier:   tier.name,
    discount: tier.discount,
    perks:  tier.perks,
    nextTier: nextTier ? {
      name:          nextTier.name,
      pointsNeeded:  nextTier.minPoints - userPoints,
      totalRequired: nextTier.minPoints,
    } : null,
    progressPercent: nextTier
      ? Math.round(((userPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
      : 100,
  };
};

export { calculateBookingPoints, redeemPoints, buildSummary, getTier, getNextTier, TIERS, POINTS_CONFIG };

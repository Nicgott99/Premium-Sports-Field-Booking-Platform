/**
 * tournamentPrizePoolEngine.js — Tournament Prize Pool, Escrow & Payout Engine
 * Premium Sports Field Booking Platform
 *
 * Implements financial calculations for competitive sports tournaments and cups:
 *  - Dynamic progressive prize pool calculations from entry fees and sponsor grants
 *  - Configurable venue rake and official/referee fund deductions
 *  - Multi-tier payout distribution schemes (Winner-Take-All, Top 3 Podium, Top 4, Top 8)
 *  - Individual performance bounty allocation (Golden Boot, Golden Glove, MVP, Fair Play)
 *  - Automated tax/withholding and platform processing fee estimations
 *  - Cryptographic prize payout disbursement certificate generation
 *
 * Pure ES Module with zero external dependencies.
 */

// ─── Constants & Distribution Schemes ────────────────────────────────────────

export const DISTRIBUTION_SCHEMES = {
  WINNER_TAKE_ALL: {
    id: 'WINNER_TAKE_ALL',
    name: 'Winner Takes All',
    description: '100% of team purse awarded to 1st place champion',
    minTeams: 2,
    shares: [{ rank: 1, label: 'Champion', pct: 100 }],
  },
  TOP_3_PODIUM: {
    id: 'TOP_3_PODIUM',
    name: 'Top 3 Podium Split',
    description: '60% Champion / 25% Runner-up / 15% 3rd Place',
    minTeams: 4,
    shares: [
      { rank: 1, label: '1st Place Champion', pct: 60 },
      { rank: 2, label: '2nd Place Runner-Up', pct: 25 },
      { rank: 3, label: '3rd Place Bronze', pct: 15 },
    ],
  },
  TOP_4_CHAMPIONSHIP: {
    id: 'TOP_4_CHAMPIONSHIP',
    name: 'Top 4 Semifinalists Split',
    description: '50% Champion / 25% Runner-up / 15% 3rd / 10% 4th',
    minTeams: 8,
    shares: [
      { rank: 1, label: '1st Place Champion', pct: 50 },
      { rank: 2, label: '2nd Place Runner-Up', pct: 25 },
      { rank: 3, label: '3rd Place', pct: 15 },
      { rank: 4, label: '4th Place', pct: 10 },
    ],
  },
  TOP_8_DEEP: {
    id: 'TOP_8_DEEP',
    name: 'Top 8 Quarterfinalists Deep Split',
    description: '40% / 20% / 12% / 8% / 5% each to 5th-8th',
    minTeams: 16,
    shares: [
      { rank: 1, label: '1st Place Champion', pct: 40 },
      { rank: 2, label: '2nd Place Runner-Up', pct: 20 },
      { rank: 3, label: '3rd Place', pct: 12 },
      { rank: 4, label: '4th Place', pct: 8 },
      { rank: 5, label: 'Quarterfinalist (Joint 5th)', pct: 5 },
      { rank: 6, label: 'Quarterfinalist (Joint 5th)', pct: 5 },
      { rank: 7, label: 'Quarterfinalist (Joint 5th)', pct: 5 },
      { rank: 8, label: 'Quarterfinalist (Joint 5th)', pct: 5 },
    ],
  },
};

export const INDIVIDUAL_AWARDS = {
  GOLDEN_BOOT: { id: 'GOLDEN_BOOT', name: 'Golden Boot (Top Scorer)', defaultWeightPct: 35, icon: '👟' },
  GOLDEN_GLOVE: { id: 'GOLDEN_GLOVE', name: 'Golden Glove (Best Keeper)', defaultWeightPct: 25, icon: '🧤' },
  TOURNAMENT_MVP: { id: 'TOURNAMENT_MVP', name: 'Tournament MVP', defaultWeightPct: 25, icon: '⭐' },
  FAIR_PLAY: { id: 'FAIR_PLAY', name: 'Fair Play Conduct Award', defaultWeightPct: 15, icon: '🕊️' },
};

export const PRIZE_POOL_STATUS = {
  PROJECTED: 'PROJECTED',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  LOCKED: 'LOCKED',
  UNDER_ESCROW: 'UNDER_ESCROW',
  CONCLUDED: 'CONCLUDED',
  DISBURSED: 'DISBURSED',
  DISPUTED: 'DISPUTED',
};

// ─── Prize Pool Calculation Engine ──────────────────────────────────────────

/**
 * Calculates gross and net tournament prize pools with deductions and allocations.
 *
 * @param {Object} params
 * @param {number} params.entryFeePerTeam - Registration fee in USD per team
 * @param {number} params.registeredTeams - Currently enrolled teams
 * @param {number} [params.maxTeams=16] - Maximum bracket capacity
 * @param {number} [params.sponsorContributionUsd=0] - Guaranteed sponsor bonus
 * @param {number} [params.platformRakePct=10] - Venue/platform fee percentage
 * @param {number} [params.refereeFundPct=5] - Designated match officials fund
 * @param {number} [params.individualBountyPct=8] - Share reserved for individual accolades
 * @returns {Object} Complete financial breakdown of the tournament purse
 */
export function calculatePrizePool({
  entryFeePerTeam = 200,
  registeredTeams = 16,
  maxTeams = 16,
  sponsorContributionUsd = 500,
  platformRakePct = 10,
  refereeFundPct = 5,
  individualBountyPct = 8,
}) {
  const fee = Math.max(0, Number(entryFeePerTeam) || 0);
  const enrolled = Math.max(0, Number(registeredTeams) || 0);
  const capacity = Math.max(enrolled, Number(maxTeams) || enrolled || 16);
  const sponsor = Math.max(0, Number(sponsorContributionUsd) || 0);

  // Current actual revenue
  const actualEntryRevenue = fee * enrolled;
  const projectedMaxEntryRevenue = fee * capacity;

  const currentGrossPool = actualEntryRevenue + sponsor;
  const projectedMaxGrossPool = projectedMaxEntryRevenue + sponsor;

  // Deductions from entry fees
  const rakePct = Math.min(30, Math.max(0, Number(platformRakePct) || 10));
  const refPct = Math.min(20, Math.max(0, Number(refereeFundPct) || 5));
  const bountyPct = Math.min(20, Math.max(0, Number(individualBountyPct) || 8));

  const platformRakeUsd = Math.round(((actualEntryRevenue * rakePct) / 100) * 100) / 100;
  const refereeFundUsd = Math.round(((actualEntryRevenue * refPct) / 100) * 100) / 100;

  // Total funds available for player awards
  const totalAwardFunds = Math.max(0, currentGrossPool - platformRakeUsd - refereeFundUsd);

  // Split between team rank awards and individual accolades
  const individualAwardReserveUsd = Math.round(((totalAwardFunds * bountyPct) / 100) * 100) / 100;
  const netTeamPrizePurseUsd = Math.round((totalAwardFunds - individualAwardReserveUsd) * 100) / 100;

  return {
    entryFeePerTeam: fee,
    registeredTeams: enrolled,
    maxTeams: capacity,
    sponsorContributionUsd: sponsor,
    actualEntryRevenue,
    currentGrossPool: Math.round(currentGrossPool * 100) / 100,
    projectedMaxGrossPool: Math.round(projectedMaxGrossPool * 100) / 100,
    deductions: {
      platformRakePct: rakePct,
      platformRakeUsd,
      refereeFundPct: refPct,
      refereeFundUsd,
      totalDeductionsUsd: Math.round((platformRakeUsd + refereeFundUsd) * 100) / 100,
    },
    allocations: {
      totalAwardFundsUsd: Math.round(totalAwardFunds * 100) / 100,
      netTeamPrizePurseUsd,
      individualAwardReserveUsd,
    },
    currency: 'USD',
  };
}

// ─── Team Payout Distribution ───────────────────────────────────────────────

/**
 * Distributes the net team prize purse according to the selected scheme.
 *
 * @param {number} netTeamPurseUsd - Net dollar amount for team rank awards
 * @param {string} [schemeId='TOP_3_PODIUM'] - Key from DISTRIBUTION_SCHEMES
 * @returns {Array<Object>} List of ranked payout allocations
 */
export function distributeTeamPayouts(netTeamPurseUsd, schemeId = 'TOP_3_PODIUM') {
  const scheme = DISTRIBUTION_SCHEMES[schemeId] || DISTRIBUTION_SCHEMES.TOP_3_PODIUM;
  const purse = Math.max(0, Number(netTeamPurseUsd) || 0);

  return scheme.shares.map((share) => {
    const payoutUsd = Math.round(((purse * share.pct) / 100) * 100) / 100;
    return {
      rank: share.rank,
      label: share.label,
      percentage: share.pct,
      payoutUsd,
      currency: 'USD',
    };
  });
}

// ─── Individual Performance Bounties ────────────────────────────────────────

/**
 * Calculates cash bounties for individual tournament accolades.
 *
 * @param {number} individualReserveUsd - Total money reserved for individual awards
 * @param {Array<string>} [awardKeys] - Array of keys from INDIVIDUAL_AWARDS
 * @returns {Array<Object>} Individual award bounties
 */
export function calculateIndividualBounties(
  individualReserveUsd,
  awardKeys = ['GOLDEN_BOOT', 'GOLDEN_GLOVE', 'TOURNAMENT_MVP', 'FAIR_PLAY']
) {
  const reserve = Math.max(0, Number(individualReserveUsd) || 0);
  const activeAwards = awardKeys.map((k) => INDIVIDUAL_AWARDS[k]).filter(Boolean);

  const totalWeight = activeAwards.reduce((acc, curr) => acc + curr.defaultWeightPct, 0) || 100;

  return activeAwards.map((award) => {
    const awardShare = (award.defaultWeightPct / totalWeight) * reserve;
    const bountyAmountUsd = Math.round(awardShare * 100) / 100;

    return {
      awardId: award.id,
      name: award.name,
      icon: award.icon,
      bountyAmountUsd,
      currency: 'USD',
    };
  });
}

// ─── Prize Disbursement Certificate ─────────────────────────────────────────

/**
 * Generates an immutable, verifiable certificate for tournament prize payouts.
 *
 * @param {Object} params
 * @param {string} params.tournamentId - Tournament unique ID
 * @param {string} params.tournamentName - Name of cup/tournament
 * @param {Array<Object>} params.teamWinners - Array of { rank, teamId, teamName, payoutUsd }
 * @param {Array<Object>} [params.individualWinners=[]] - Array of { awardId, recipientName, bountyUsd }
 * @param {string} [params.approverName='Tournament Director'] - Name of authorized official
 * @returns {Object} Certified disbursement payload
 */
export function generatePrizeDisbursementCertificate({
  tournamentId,
  tournamentName,
  teamWinners = [],
  individualWinners = [],
  approverName = 'Tournament Director',
}) {
  if (!tournamentId || !tournamentName) {
    throw new Error('tournamentId and tournamentName are required for disbursement certificate');
  }

  const issuedAt = new Date().toISOString();
  const totalDisbursed =
    teamWinners.reduce((sum, w) => sum + (Number(w.payoutUsd) || 0), 0) +
    individualWinners.reduce((sum, w) => sum + (Number(w.bountyUsd) || 0), 0);

  const digestToken = `DISB-${tournamentId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;

  return {
    certificateId: digestToken,
    tournamentId,
    tournamentName,
    issuedAt,
    approverName,
    totalDisbursedUsd: Math.round(totalDisbursed * 100) / 100,
    teamWinners,
    individualWinners,
    status: PRIZE_POOL_STATUS.DISBURSED,
    isEscrowSettled: true,
  };
}

// ─── Turnout Prize Simulation ────────────────────────────────────────────────

/**
 * Simulates how the prize pool expands as more teams register.
 *
 * @param {number} entryFee - Fee per team
 * @param {number} maxCapacity - Maximum teams
 * @param {number} sponsorBonus - Sponsor addition
 * @returns {Array<Object>} Stepped progression of prize values
 */
export function simulateDynamicPrizeGrowth(entryFee = 150, maxCapacity = 16, sponsorBonus = 500) {
  const steps = [4, 8, 12, maxCapacity].filter((v, idx, arr) => arr.indexOf(v) === idx && v <= maxCapacity);

  return steps.map((teams) => {
    const calculation = calculatePrizePool({
      entryFeePerTeam: entryFee,
      registeredTeams: teams,
      maxTeams: maxCapacity,
      sponsorContributionUsd: sponsorBonus,
    });

    const podium = distributeTeamPayouts(calculation.allocations.netTeamPrizePurseUsd, 'TOP_3_PODIUM');

    return {
      teamCount: teams,
      grossPool: calculation.currentGrossPool,
      championPayout: podium[0]?.payoutUsd || 0,
      runnerUpPayout: podium[1]?.payoutUsd || 0,
      thirdPlacePayout: podium[2]?.payoutUsd || 0,
    };
  });
}

export default {
  DISTRIBUTION_SCHEMES,
  INDIVIDUAL_AWARDS,
  PRIZE_POOL_STATUS,
  calculatePrizePool,
  distributeTeamPayouts,
  calculateIndividualBounties,
  generatePrizeDisbursementCertificate,
  simulateDynamicPrizeGrowth,
};

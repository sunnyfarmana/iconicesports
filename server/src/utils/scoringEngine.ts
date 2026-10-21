/**
 * ICONIC ESPORTS — BGMI Scoring & Tiebreaker Engine
 * Dedicated to Battlegrounds Mobile India Competitive Rules
 */

export interface ScoringConfiguration {
  placementPoints: Record<number, number>;
  killPointMultiplier: number;
}

// Official BGMI Esports Standard 10-Point Scoring System (BGIS / BMPS 2024-2026)
export const OFFICIAL_BGMI_10PT_SYSTEM: ScoringConfiguration = {
  placementPoints: {
    1: 10, // WWCD
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1,
    8: 1,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
    16: 0,
    17: 0,
    18: 0,
    19: 0,
    20: 0,
    21: 0,
    22: 0,
    23: 0,
    24: 0,
    25: 0
  },
  killPointMultiplier: 1
};

// Legacy 15-Point System (for historical season archives)
export const LEGACY_15PT_SYSTEM: ScoringConfiguration = {
  placementPoints: {
    1: 15,
    2: 12,
    3: 10,
    4: 8,
    5: 6,
    6: 4,
    7: 2,
    8: 1,
    9: 1,
    10: 1,
    11: 1,
    12: 1
  },
  killPointMultiplier: 1
};

/**
 * Resolves tournament scoring config from JSON string or defaults to Official BGMI 10-PT
 */
export function resolveScoringConfig(configJson?: string | null, pointSystem?: string | null): ScoringConfiguration {
  if (configJson) {
    try {
      const parsed = JSON.parse(configJson);
      if (parsed && typeof parsed.placementPoints === 'object') {
        return {
          placementPoints: parsed.placementPoints,
          killPointMultiplier: typeof parsed.killPointMultiplier === 'number' ? parsed.killPointMultiplier : 1
        };
      }
    } catch {
      // Fallback if parsing fails
    }
  }

  if (pointSystem === 'LEGACY_15PT') {
    return LEGACY_15PT_SYSTEM;
  }

  return OFFICIAL_BGMI_10PT_SYSTEM;
}

/**
 * Calculates placement points for a specific rank given a scoring configuration
 */
export function getPlacementPoints(placement: number, config: ScoringConfiguration): number {
  if (placement < 1) return 0;
  return config.placementPoints[placement] ?? 0;
}

/**
 * Calculates kill points for given number of finishes
 */
export function getKillPoints(kills: number, config: ScoringConfiguration): number {
  const count = Math.max(0, kills);
  return Math.round(count * config.killPointMultiplier);
}

/**
 * Calculates match team result
 */
export interface CalculatedTeamScore {
  placement: number;
  placementPoints: number;
  kills: number;
  killPoints: number;
  totalPoints: number;
  isWwcd: boolean;
}

export function calculateTeamMatchScore(
  placement: number,
  kills: number,
  config: ScoringConfiguration
): CalculatedTeamScore {
  const placementPoints = getPlacementPoints(placement, config);
  const killPoints = getKillPoints(kills, config);
  const totalPoints = placementPoints + killPoints;
  const isWwcd = placement === 1;

  return {
    placement,
    placementPoints,
    kills,
    killPoints,
    totalPoints,
    isWwcd
  };
}

export interface StandingsEntry {
  teamId: string;
  teamName: string;
  teamTag: string;
  teamLogo?: string | null;
  matchesPlayed: number;
  wwcdCount: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  bestPlacement?: number;
}

/**
 * Official BGMI Tiebreaker Ranking Hierarchy:
 * 1. Total Points (Highest First)
 * 2. Total WWCDs / First Place Finishes (Highest First)
 * 3. Total Placement Points (Highest First)
 * 4. Total Kill Points / Finishes (Highest First)
 * 5. Best Single Match Placement (Lowest Rank Number First)
 */
export function sortStandingsWithTiebreakers(entries: StandingsEntry[]): StandingsEntry[] {
  return [...entries].sort((a, b) => {
    // 1. Total Points
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    // 2. Total WWCDs
    if (b.wwcdCount !== a.wwcdCount) {
      return b.wwcdCount - a.wwcdCount;
    }
    // 3. Placement Points
    if (b.placementPoints !== a.placementPoints) {
      return b.placementPoints - a.placementPoints;
    }
    // 4. Kill Points
    if (b.killPoints !== a.killPoints) {
      return b.killPoints - a.killPoints;
    }
    // 5. Best placement (e.g. 1st is better than 2nd)
    if (a.bestPlacement !== undefined && b.bestPlacement !== undefined) {
      if (a.bestPlacement !== b.bestPlacement) {
        return a.bestPlacement - b.bestPlacement;
      }
    }
    // Stable alphabetical fallback
    return a.teamName.localeCompare(b.teamName);
  });
}

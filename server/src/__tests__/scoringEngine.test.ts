import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICIAL_BGMI_10PT_SYSTEM,
  LEGACY_15PT_SYSTEM,
  resolveScoringConfig,
  getPlacementPoints,
  getKillPoints,
  calculateTeamMatchScore,
  sortStandingsWithTiebreakers,
  StandingsEntry
} from '../utils/scoringEngine';

test('BGMI Scoring Engine - Official 10-Point Matrix Calculation', () => {
  const config = OFFICIAL_BGMI_10PT_SYSTEM;

  // Verify official 10-point placement points
  assert.equal(getPlacementPoints(1, config), 10, '1st place must award 10 placement points (WWCD)');
  assert.equal(getPlacementPoints(2, config), 6, '2nd place must award 6 placement points');
  assert.equal(getPlacementPoints(3, config), 5, '3rd place must award 5 placement points');
  assert.equal(getPlacementPoints(4, config), 4, '4th place must award 4 placement points');
  assert.equal(getPlacementPoints(5, config), 3, '5th place must award 3 placement points');
  assert.equal(getPlacementPoints(6, config), 2, '6th place must award 2 placement points');
  assert.equal(getPlacementPoints(7, config), 1, '7th place must award 1 placement point');
  assert.equal(getPlacementPoints(8, config), 1, '8th place must award 1 placement point');
  assert.equal(getPlacementPoints(9, config), 0, '9th place must award 0 placement points');
  assert.equal(getPlacementPoints(16, config), 0, '16th place must award 0 placement points');
  assert.equal(getPlacementPoints(25, config), 0, '25th place must award 0 placement points');
});

test('BGMI Scoring Engine - Match Team Score & WWCD Flag', () => {
  const config = OFFICIAL_BGMI_10PT_SYSTEM;

  // 1st place with 12 kills = 10 + 12 = 22 total points, WWCD = true
  const firstPlace = calculateTeamMatchScore(1, 12, config);
  assert.equal(firstPlace.placement, 1);
  assert.equal(firstPlace.placementPoints, 10);
  assert.equal(firstPlace.killPoints, 12);
  assert.equal(firstPlace.totalPoints, 22);
  assert.equal(firstPlace.isWwcd, true);

  // 2nd place with 15 kills = 6 + 15 = 21 total points, WWCD = false
  const secondPlace = calculateTeamMatchScore(2, 15, config);
  assert.equal(secondPlace.placement, 2);
  assert.equal(secondPlace.placementPoints, 6);
  assert.equal(secondPlace.killPoints, 15);
  assert.equal(secondPlace.totalPoints, 21);
  assert.equal(secondPlace.isWwcd, false);

  // 9th place with 4 kills = 0 + 4 = 4 total points, WWCD = false
  const ninthPlace = calculateTeamMatchScore(9, 4, config);
  assert.equal(ninthPlace.placement, 9);
  assert.equal(ninthPlace.placementPoints, 0);
  assert.equal(ninthPlace.killPoints, 4);
  assert.equal(ninthPlace.totalPoints, 4);
  assert.equal(ninthPlace.isWwcd, false);
});

test('BGMI Scoring Engine - Custom Tournament Scoring Config Resolution', () => {
  // Custom 15-pt configuration passed as JSON string
  const customConfigJson = JSON.stringify({
    placementPoints: {
      1: 15,
      2: 12,
      3: 10,
      4: 8,
      5: 6
    },
    killPointMultiplier: 2
  });

  const resolved = resolveScoringConfig(customConfigJson, 'CUSTOM');
  assert.equal(getPlacementPoints(1, resolved), 15);
  assert.equal(getPlacementPoints(2, resolved), 12);
  assert.equal(getKillPoints(5, resolved), 10, '5 kills with 2x multiplier must award 10 kill points');

  // Fallback to official 10-pt system when config is null
  const defaultResolved = resolveScoringConfig(null, 'BGMI_OFFICIAL_10PT');
  assert.equal(getPlacementPoints(1, defaultResolved), 10);
  assert.equal(getKillPoints(5, defaultResolved), 5);
});

test('BGMI Standings Engine - Tiebreaker Hierarchy Verification', () => {
  // Setup 4 teams with various ties
  const entries: StandingsEntry[] = [
    {
      teamId: 'team-c',
      teamName: 'Team C',
      teamTag: 'TC',
      matchesPlayed: 4,
      wwcdCount: 1, // Same points as Team B, but fewer WWCDs
      placementPoints: 20,
      killPoints: 10,
      totalPoints: 30,
      bestPlacement: 1
    },
    {
      teamId: 'team-b',
      teamName: 'Team B',
      teamTag: 'TB',
      matchesPlayed: 4,
      wwcdCount: 2, // Same points as Team C, but MORE WWCDs -> Should rank higher than Team C
      placementPoints: 18,
      killPoints: 12,
      totalPoints: 30,
      bestPlacement: 1
    },
    {
      teamId: 'team-a',
      teamName: 'Team A',
      teamTag: 'TA',
      matchesPlayed: 4,
      wwcdCount: 1,
      placementPoints: 25,
      killPoints: 20,
      totalPoints: 45, // Highest points -> Rank 1
      bestPlacement: 1
    },
    {
      teamId: 'team-d',
      teamName: 'Team D',
      teamTag: 'TD',
      matchesPlayed: 4,
      wwcdCount: 0,
      placementPoints: 10,
      killPoints: 10,
      totalPoints: 20,
      bestPlacement: 3
    }
  ];

  const sorted = sortStandingsWithTiebreakers(entries);

  // Assert correct ranking order
  assert.equal(sorted[0].teamName, 'Team A', 'Team A should be Rank 1 by highest total points (45)');
  assert.equal(sorted[1].teamName, 'Team B', 'Team B should be Rank 2 by WWCD tiebreaker (2 WWCDs vs 1 WWCD)');
  assert.equal(sorted[2].teamName, 'Team C', 'Team C should be Rank 3');
  assert.equal(sorted[3].teamName, 'Team D', 'Team D should be Rank 4');
});

test('BGMI Standings Engine - Placement Points Tiebreaker when Points and WWCD are Equal', () => {
  const entries: StandingsEntry[] = [
    {
      teamId: 'team-x',
      teamName: 'Team X',
      teamTag: 'TX',
      matchesPlayed: 3,
      wwcdCount: 1,
      placementPoints: 15, // Higher placement points -> Should rank higher
      killPoints: 10,
      totalPoints: 25,
      bestPlacement: 1
    },
    {
      teamId: 'team-y',
      teamName: 'Team Y',
      teamTag: 'TY',
      matchesPlayed: 3,
      wwcdCount: 1,
      placementPoints: 10,
      killPoints: 15,
      totalPoints: 25,
      bestPlacement: 1
    }
  ];

  const sorted = sortStandingsWithTiebreakers(entries);
  assert.equal(sorted[0].teamName, 'Team X', 'Team X must win tiebreaker by higher placement points (15 vs 10)');
});

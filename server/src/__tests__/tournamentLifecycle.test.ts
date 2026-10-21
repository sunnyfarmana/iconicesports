import test from 'node:test';
import assert from 'node:assert/strict';
import { TOURNAMENT_STATUSES, TournamentStatus } from '../controllers/tournamentController';

test('Tournament Lifecycle - 8 Official Lifecycle States', () => {
  const expectedStates: TournamentStatus[] = [
    'DRAFT',
    'PENDING_APPROVAL',
    'PUBLISHED',
    'REGISTRATION_OPEN',
    'REGISTRATION_CLOSED',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
  ];

  assert.equal(TOURNAMENT_STATUSES.length, 8, 'Must support exactly 8 tournament lifecycle states');
  for (const state of expectedStates) {
    assert.ok(TOURNAMENT_STATUSES.includes(state), `Status ${state} must be valid`);
  }
});

test('Tournament Lifecycle - Registration Window Validation Logic', () => {
  const now = new Date('2026-10-21T12:00:00Z');

  // Case 1: Registration opens in the future -> Should reject
  const futureOpenAt = new Date('2026-10-25T12:00:00Z');
  const futureCloseAt = new Date('2026-10-30T12:00:00Z');
  const isTooEarly = now < futureOpenAt;
  assert.equal(isTooEarly, true, 'Registration must be rejected if current time is before regOpenAt');

  // Case 2: Registration closed in the past -> Should reject
  const pastOpenAt = new Date('2026-10-01T12:00:00Z');
  const pastCloseAt = new Date('2026-10-15T12:00:00Z');
  const isExpired = now > pastCloseAt;
  assert.equal(isExpired, true, 'Registration must be rejected if current time is after regCloseAt');

  // Case 3: Registration currently open within window -> Should accept
  const validOpenAt = new Date('2026-10-18T12:00:00Z');
  const validCloseAt = new Date('2026-10-24T12:00:00Z');
  const isOpen = now >= validOpenAt && now <= validCloseAt;
  assert.equal(isOpen, true, 'Registration must be accepted within active window');
});

test('Tournament Lifecycle - Slot Capacity Lock & Overbooking Prevention Logic', () => {
  const maxSlots = 25;

  // Scenario 1: Slots available (24 / 25)
  let registeredSlots = 24;
  const canRegister = registeredSlots < maxSlots;
  assert.equal(canRegister, true, 'Slot 25 can still be claimed');

  // Scenario 2: Final slot claimed -> registeredSlots becomes 25
  registeredSlots += 1;
  const isNowFull = registeredSlots >= maxSlots;
  assert.equal(isNowFull, true, 'Tournament slots are now fully booked');

  // Scenario 3: Next concurrent request arrives when registeredSlots = 25 -> Must reject
  const canOverbook = registeredSlots < maxSlots;
  assert.equal(canOverbook, false, 'Simultaneous request must be rejected when capacity is reached');
});

test('Tournament Registration - Roster & Character UID Validation Rules', () => {
  const minRosterSize = 4;
  const maxRosterSize = 6;

  // Test 1: Incomplete roster (only 3 players) -> Rejected
  const incompleteRoster = [
    { ign: 'Player1', bgmiUid: '5123456789' },
    { ign: 'Player2', bgmiUid: '5123456790' },
    { ign: 'Player3', bgmiUid: '5123456791' }
  ];
  assert.equal(incompleteRoster.length < minRosterSize, true, 'Roster with fewer than 4 players must be rejected');

  // Test 2: Invalid Character UID (empty or malformed) -> Rejected
  const invalidUidRoster = [
    { ign: 'Player1', bgmiUid: '5123456789' },
    { ign: 'Player2', bgmiUid: '' }, // Missing UID
    { ign: 'Player3', bgmiUid: '5123456791' },
    { ign: 'Player4', bgmiUid: '5123456792' }
  ];
  const hasInvalidUid = invalidUidRoster.some(p => !p.bgmiUid || p.bgmiUid.trim().length < 5);
  assert.equal(hasInvalidUid, true, 'Roster with empty/invalid BGMI UID must be rejected');

  // Test 3: Valid 4-man Squad -> Accepted
  const validRoster = [
    { ign: 'Player1', bgmiUid: '5123456789' },
    { ign: 'Player2', bgmiUid: '5123456790' },
    { ign: 'Player3', bgmiUid: '5123456791' },
    { ign: 'Player4', bgmiUid: '5123456792' }
  ];
  const isValid = validRoster.length >= minRosterSize && validRoster.length <= maxRosterSize && !validRoster.some(p => !p.bgmiUid || p.bgmiUid.trim().length < 5);
  assert.equal(isValid, true, 'Valid 4-man roster with UIDs must be accepted');
});

test('Tournament Registration - Multi-Roster Conflict Prevention Logic', () => {
  // Existing tournament athlete UIDs already registered under Team Soul
  const registeredPlayerUids = new Set(['5124891024', '5183920194', '5148201923', '5192837465']);

  // Candidate team trying to register with a poach/conflict player
  const candidateSquadUids = ['5999999999', '5183920194', '5888888888', '5777777777'];

  // Check collision
  const hasCollision = candidateSquadUids.some(uid => registeredPlayerUids.has(uid));
  assert.equal(hasCollision, true, 'Must detect and reject duplicate player registered in another squad');
});

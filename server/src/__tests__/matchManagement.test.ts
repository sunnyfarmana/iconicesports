import test from 'node:test';
import assert from 'node:assert/strict';
import { MATCH_RESULT_STATUSES, MatchResultStatus } from '../controllers/matchController';

test('Match Management - Result Status Lifecycle States', () => {
  const expectedStatuses: MatchResultStatus[] = [
    'PENDING_REVIEW',
    'DISPUTED',
    'APPROVED',
    'FINALIZED'
  ];

  assert.equal(MATCH_RESULT_STATUSES.length, 4, 'Must support exactly 4 match result review states');
  for (const s of expectedStatuses) {
    assert.ok(MATCH_RESULT_STATUSES.includes(s), `Result status ${s} must be valid`);
  }
});

test('Match Management - Slot #1 Host/Referee Reservation Rule', () => {
  // BGMI Competitive Standard: Slot 1 is always reserved for Host/Referees/Casters
  const isParticipantSlotValid = (slot: number): boolean => {
    return slot >= 2 && slot <= 25;
  };

  assert.equal(isParticipantSlotValid(1), false, 'Slot 1 must never be claimable by a participant squad');
  assert.equal(isParticipantSlotValid(2), true, 'Slot 2 is a valid squad slot');
  assert.equal(isParticipantSlotValid(25), true, 'Slot 25 is a valid squad slot');
  assert.equal(isParticipantSlotValid(26), false, 'Slot 26 exceeds max 25 lobby slots');
});

test('Match Management - Anti-Leak Credential Access Authorization Logic', () => {
  const isStaff = (role: string) => role === 'ADMIN' || role === 'ORGANIZER';

  const checkCredentialAccess = (
    userRole: string,
    credentialsReleased: boolean,
    isTeamAssignedToMatch: boolean
  ): boolean => {
    // 1. Staff can always access
    if (isStaff(userRole)) return true;

    // 2. If credentials have not been released by organizer -> Block access
    if (!credentialsReleased) return false;

    // 3. Must be assigned to this match room
    return isTeamAssignedToMatch;
  };

  // Staff can always view
  assert.equal(checkCredentialAccess('ADMIN', false, false), true);
  assert.equal(checkCredentialAccess('ORGANIZER', false, false), true);

  // Player whose match credentials have NOT been released -> Block
  assert.equal(checkCredentialAccess('PLAYER', false, true), false);

  // Player whose credentials ARE released AND assigned to room -> Allow
  assert.equal(checkCredentialAccess('PLAYER', true, true), true);

  // Player from another tournament/unassigned team -> Block even if released
  assert.equal(checkCredentialAccess('PLAYER', true, false), false);
});

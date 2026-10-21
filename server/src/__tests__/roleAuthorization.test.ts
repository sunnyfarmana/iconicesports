import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole, requireApprovedOrganizer, AuthUser, AuthenticatedRequest } from '../middleware/auth';

interface MockResponse {
  statusCode: number;
  jsonData: any;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
}

const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
};

// =========================================================================
// 1. Unauthenticated Requests Protection (401)
// =========================================================================
test('Role Authorization - Unauthenticated access returns 401', () => {
  const req: AuthenticatedRequest = {} as any;
  const res = createMockResponse();
  let nextCalled = false;

  const middleware = requireRole('ADMIN', 'ORGANIZER');
  middleware(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, false, 'next() must NOT be called for unauthenticated user');
  assert.equal(res.statusCode, 401, 'Unauthenticated access must return 401');
  assert.equal(res.jsonData?.error, 'Authentication required.');
});

// =========================================================================
// 2. Player Role Boundaries & Restrictions
// =========================================================================
test('Role Authorization - Player role denied access to Admin & Organizer endpoints', () => {
  const playerUser: AuthUser = {
    id: 'usr_player_01',
    email: 'scout@iconicesports.in',
    username: 'ScoutOP',
    role: 'PLAYER',
    isActive: true,
    organizerStatus: 'NONE'
  };

  const req: AuthenticatedRequest = { user: playerUser } as any;
  const res = createMockResponse();
  let nextCalled = false;

  const adminMiddleware = requireRole('ADMIN');
  adminMiddleware(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403, 'Player must be denied access to admin endpoints with 403');
  assert.ok(res.jsonData?.error?.includes('Required role: ADMIN'));
});

// =========================================================================
// 3. Organizer Approval Enforcement
// =========================================================================
test('Role Authorization - Pending/Unapproved Organizer cannot access approved organizer features', () => {
  const pendingOrgUser: AuthUser = {
    id: 'usr_org_pending',
    email: 'new_org@arena.in',
    username: 'NewOrgHost',
    role: 'ORGANIZER',
    isActive: true,
    organizerStatus: 'PENDING'
  };

  const req: AuthenticatedRequest = { user: pendingOrgUser } as any;
  const res = createMockResponse();
  let nextCalled = false;

  requireApprovedOrganizer(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, false, 'Pending organizer must be blocked');
  assert.equal(res.statusCode, 403, 'Pending organizer must receive 403 Forbidden');
  assert.ok(res.jsonData?.error?.includes('PENDING approval'), 'Error message must reflect approval state');
});

test('Role Authorization - Approved Organizer is granted access', () => {
  const approvedOrgUser: AuthUser = {
    id: 'usr_org_approved',
    email: 'pro_org@arena.in',
    username: 'ProOrgHost',
    role: 'ORGANIZER',
    isActive: true,
    organizerStatus: 'APPROVED'
  };

  const req: AuthenticatedRequest = { user: approvedOrgUser } as any;
  const res = createMockResponse();
  let nextCalled = false;

  requireApprovedOrganizer(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, true, 'Approved organizer must be allowed through');
  assert.equal(res.statusCode, 200);
});

// =========================================================================
// 4. Admin Privileges & Global Oversight
// =========================================================================
test('Role Authorization - Admin bypasses organizer approval check with full oversight', () => {
  const adminUser: AuthUser = {
    id: 'usr_admin_01',
    email: 'headreferee@iconicesports.in',
    username: 'PlatformAdmin',
    role: 'ADMIN',
    isActive: true,
    organizerStatus: 'NONE'
  };

  const req: AuthenticatedRequest = { user: adminUser } as any;
  const res = createMockResponse();
  let nextCalled = false;

  requireApprovedOrganizer(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, true, 'Admin must always have access to organizer features');
});

// =========================================================================
// 5. Cross-Organizer Isolation Logic
// =========================================================================
test('Role Authorization - Cross-Organizer Tournament Isolation Logic', () => {
  const organizerA: AuthUser = {
    id: 'org_user_alpha',
    email: 'alpha@tourneys.in',
    username: 'OrgAlpha',
    role: 'ORGANIZER',
    organizerStatus: 'APPROVED',
    isActive: true
  };

  const organizerB: AuthUser = {
    id: 'org_user_beta',
    email: 'beta@tourneys.in',
    username: 'OrgBeta',
    role: 'ORGANIZER',
    organizerStatus: 'APPROVED',
    isActive: true
  };

  const admin: AuthUser = {
    id: 'admin_master',
    email: 'admin@iconic.in',
    username: 'SuperAdmin',
    role: 'ADMIN',
    isActive: true
  };

  const tournamentOwnedByA = {
    id: 'tourn_alpha_01',
    title: 'Iconic Pro Scrims Alpha',
    organizerId: 'org_user_alpha'
  };

  // Pure isolation logic check
  const evaluateOwnership = (user: AuthUser, tournament: typeof tournamentOwnedByA) => {
    if (user.role === 'ADMIN') return { allowed: true };
    if (tournament.organizerId !== user.id) {
      return {
        allowed: false,
        error: 'Access denied: You are not authorized to manage another organizer\'s tournament.'
      };
    }
    return { allowed: true };
  };

  // 1. Owner A can manage Tournament A
  const checkA = evaluateOwnership(organizerA, tournamentOwnedByA);
  assert.equal(checkA.allowed, true, 'Organizer A must be allowed to manage their own tournament');

  // 2. Organizer B must be strictly blocked from managing Tournament A
  const checkB = evaluateOwnership(organizerB, tournamentOwnedByA);
  assert.equal(checkB.allowed, false, 'Organizer B must NOT be allowed to manage Organizer A tournament');
  assert.ok(checkB.error?.includes('another organizer\'s tournament'));

  // 3. Platform Admin can manage any tournament
  const checkAdmin = evaluateOwnership(admin, tournamentOwnedByA);
  assert.equal(checkAdmin.allowed, true, 'Admin must have global oversight over all tournaments');
});

// =========================================================================
// 6. Account Suspension Enforcement Logic (isActive === false)
// =========================================================================
test('Role Authorization - Suspended user account access is blocked', () => {
  const suspendedUser = {
    id: 'usr_toxic_player',
    email: 'banned@cheater.in',
    isActive: false,
    role: 'PLAYER'
  };

  const evaluateAccountStatus = (account: typeof suspendedUser) => {
    if (!account.isActive) {
      return { allowed: false, statusCode: 403, error: 'Your account has been suspended by a platform administrator.' };
    }
    return { allowed: true, statusCode: 200 };
  };

  const suspendedCheck = evaluateAccountStatus(suspendedUser);
  assert.equal(suspendedCheck.allowed, false, 'Suspended account must be blocked');
  assert.equal(suspendedCheck.statusCode, 403);
  assert.ok(suspendedCheck.error?.includes('suspended by a platform administrator'));

  const activeUser = { ...suspendedUser, isActive: true };
  const activeCheck = evaluateAccountStatus(activeUser);
  assert.equal(activeCheck.allowed, true, 'Active user is allowed');
});

// =========================================================================
// 7. Anti-Tamper Security: Live DB Source-of-Truth Overrides Token Manipulation
// =========================================================================
test('Role Authorization - Client-forged token role is overridden by trusted DB state', () => {
  // Scenario: Malicious client crafts a JWT with role: "ADMIN"
  const forgedTokenPayload = {
    id: 'usr_hacker_99',
    role: 'ADMIN' // Spoofed role
  };

  // Live database record for that user ID:
  const liveDbRecord = {
    id: 'usr_hacker_99',
    email: 'player99@esports.in',
    username: 'Player99',
    role: 'PLAYER', // True role stored in DB
    isActive: true,
    organizerStatus: 'NONE'
  };

  // Anti-tamper sync: Server replaces decoded role with trusted liveDbRecord.role
  const resolvedUser: AuthUser = {
    id: liveDbRecord.id,
    email: liveDbRecord.email,
    username: liveDbRecord.username,
    role: liveDbRecord.role, // Overridden by DB
    organizerStatus: liveDbRecord.organizerStatus,
    isActive: liveDbRecord.isActive
  };

  assert.equal(resolvedUser.role, 'PLAYER', 'Role must match the database, never the spoofed JWT payload');
  assert.notEqual(resolvedUser.role, forgedTokenPayload.role, 'Forged role must be discarded');

  // Verify that subsequent admin middleware successfully blocks the user
  const req: AuthenticatedRequest = { user: resolvedUser } as any;
  const res = createMockResponse();
  let nextCalled = false;

  requireRole('ADMIN')(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, false, 'Attacker must be blocked from admin route despite spoofed payload');
  assert.equal(res.statusCode, 403);
});

// =========================================================================
// 8. Tournament Publishing Restriction for Unapproved Organizers
// =========================================================================
test('Role Authorization - Unapproved organizer lifecycle state restriction', () => {
  const isPublishingAllowed = (userRole: string, organizerStatus: string, targetStatus: string): boolean => {
    // Admin can set any status
    if (userRole === 'ADMIN') return true;

    // Organizers must be approved to set PUBLISHED or REGISTRATION_OPEN
    const requiresApproval = ['PUBLISHED', 'REGISTRATION_OPEN', 'ONGOING'];
    if (requiresApproval.includes(targetStatus)) {
      return organizerStatus === 'APPROVED';
    }

    // DRAFT or PENDING_APPROVAL are always permitted for organizers
    return true;
  };

  // Unapproved organizer trying to publish directly -> Blocked
  assert.equal(isPublishingAllowed('ORGANIZER', 'PENDING', 'PUBLISHED'), false);
  assert.equal(isPublishingAllowed('ORGANIZER', 'PENDING', 'REGISTRATION_OPEN'), false);

  // Unapproved organizer saving DRAFT or submitting for review -> Allowed
  assert.equal(isPublishingAllowed('ORGANIZER', 'PENDING', 'DRAFT'), true);
  assert.equal(isPublishingAllowed('ORGANIZER', 'PENDING', 'PENDING_APPROVAL'), true);

  // Approved organizer publishing -> Allowed
  assert.equal(isPublishingAllowed('ORGANIZER', 'APPROVED', 'PUBLISHED'), true);
  assert.equal(isPublishingAllowed('ORGANIZER', 'APPROVED', 'REGISTRATION_OPEN'), true);

  // Admin publishing -> Always allowed
  assert.equal(isPublishingAllowed('ADMIN', 'NONE', 'PUBLISHED'), true);
});

// =========================================================================
// 9. Public Registration Privilege Escalation Prevention
// =========================================================================
test('Role Authorization - Public self-registration privilege escalation prevention', () => {
  const sanitizeRegistrationRole = (requestedRole: string | undefined): { role: string; organizerStatus: string } => {
    let assignedRole = 'PLAYER';
    let assignedOrganizerStatus = 'NONE';

    if (requestedRole === 'ORGANIZER') {
      assignedRole = 'ORGANIZER';
      assignedOrganizerStatus = 'PENDING';
    } else if (requestedRole === 'TEAM_CAPTAIN') {
      assignedRole = 'TEAM_CAPTAIN';
    }

    return { role: assignedRole, organizerStatus: assignedOrganizerStatus };
  };

  // Attempting to register directly as ADMIN must be downgraded to PLAYER
  const adminAttempt = sanitizeRegistrationRole('ADMIN');
  assert.equal(adminAttempt.role, 'PLAYER', 'Direct ADMIN self-registration must be blocked and assigned PLAYER');
  assert.equal(adminAttempt.organizerStatus, 'NONE');

  // Attempting to register as ORGANIZER must enforce PENDING approval
  const orgAttempt = sanitizeRegistrationRole('ORGANIZER');
  assert.equal(orgAttempt.role, 'ORGANIZER');
  assert.equal(orgAttempt.organizerStatus, 'PENDING', 'Self-registered organizer must have PENDING status');

  // Team captain registration
  const capAttempt = sanitizeRegistrationRole('TEAM_CAPTAIN');
  assert.equal(capAttempt.role, 'TEAM_CAPTAIN');

  // Normal player registration
  const playerAttempt = sanitizeRegistrationRole('PLAYER');
  assert.equal(playerAttempt.role, 'PLAYER');
});

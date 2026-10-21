import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAdminStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [userCount, playerCount, teamCount, tournamentCount, matchCount] = await Promise.all([
      prisma.user.count(),
      prisma.playerProfile.count(),
      prisma.team.count(),
      prisma.tournament.count(),
      prisma.match.count()
    ]);

    const activeTournaments = await prisma.tournament.count({
      where: { status: { in: ['REGISTRATION_OPEN', 'ONGOING'] } }
    });

    const pendingRegistrations = await prisma.tournamentRegistration.count({
      where: { status: 'PENDING' }
    });

    const pendingOrganizers = await prisma.user.count({
      where: { organizerStatus: 'PENDING' }
    });

    res.json({
      stats: {
        userCount,
        playerCount,
        teamCount,
        tournamentCount,
        activeTournaments,
        matchCount,
        pendingRegistrations,
        pendingOrganizers
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
};

export const getUsers = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        playerProfile: true,
        captainedTeams: { select: { id: true, name: true, tag: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const safeUsers = users.map(({ password, ...u }) => u);
    res.json({ users: safeUsers });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'ORGANIZER', 'TEAM_CAPTAIN', 'PLAYER'].includes(role)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, username: true, email: true, role: true }
    });

    // Record in Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: req.user?.id || 'admin',
          actorName: req.user?.username || 'Admin',
          action: 'ROLE_CHANGE',
          targetType: 'USER',
          targetId: userId,
          details: `Role updated to ${role} for user ${updated.username}`
        }
      });
    } catch {}

    res.json({ message: 'User role updated.', user: updated });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
};

/**
 * User Suspension and Recovery Workflow
 */
export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'isActive must be a boolean.' });
      return;
    }

    if (req.user?.id === userId) {
      res.status(400).json({ error: 'Administrators cannot suspend their own account.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, username: true, email: true, role: true, isActive: true }
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorId: req.user?.id || 'admin',
          actorName: req.user?.username || 'Admin',
          action: isActive ? 'USER_REINSTATED' : 'USER_SUSPENDED',
          targetType: 'USER',
          targetId: userId,
          details: `User ${updated.username} status set to isActive=${isActive}`
        }
      });
    } catch {}

    res.json({
      message: `User account ${isActive ? 'reinstated' : 'suspended'} successfully.`,
      user: updated
    });
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to toggle user status.' });
  }
};

/**
 * Organizer Applications & Approvals
 */
export const getOrganizers = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const organizers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ORGANIZER' },
          { organizerStatus: { in: ['PENDING', 'APPROVED', 'REJECTED'] } }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        organizerStatus: true,
        organizerBio: true,
        organizerApprovedAt: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { organizedTournaments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ organizers });
  } catch (error: any) {
    console.error('Error fetching organizers:', error);
    res.status(500).json({ error: 'Failed to fetch organizers.' });
  }
};

export const verifyOrganizer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Status must be APPROVED or REJECTED.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        organizerStatus: status,
        ...(status === 'APPROVED' && {
          role: 'ORGANIZER',
          organizerApprovedAt: new Date()
        })
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        organizerStatus: true,
        organizerApprovedAt: true
      }
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorId: req.user?.id || 'admin',
          actorName: req.user?.username || 'Admin',
          action: status === 'APPROVED' ? 'ORGANIZER_APPROVED' : 'ORGANIZER_REJECTED',
          targetType: 'ORGANIZER',
          targetId: userId,
          details: `Organizer application ${status} for user ${updated.username}`
        }
      });
    } catch {}

    res.json({
      message: `Organizer status successfully updated to ${status}.`,
      organizer: updated
    });
  } catch (error: any) {
    console.error('Error verifying organizer:', error);
    res.status(500).json({ error: 'Failed to verify organizer.' });
  }
};

/**
 * Audit History
 */
export const getAuditLogs = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({ logs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};

export const assignSlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId, slotNumber, teamId } = req.body;

    if (!groupId || !slotNumber) {
      res.status(400).json({ error: 'groupId and slotNumber are required.' });
      return;
    }

    const slot = await prisma.groupSlot.upsert({
      where: {
        groupId_slotNumber: {
          groupId,
          slotNumber: parseInt(slotNumber)
        }
      },
      create: {
        groupId,
        slotNumber: parseInt(slotNumber),
        teamId: teamId || null
      },
      update: {
        teamId: teamId || null
      },
      include: {
        team: { select: { id: true, name: true, tag: true } }
      }
    });

    res.json({ message: `Slot ${slotNumber} assigned.`, slot });
  } catch (error: any) {
    console.error('Error assigning slot:', error);
    res.status(500).json({ error: 'Failed to assign slot.' });
  }
};

export const createMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      tournamentId,
      stageId,
      groupId,
      matchNumber,
      matchName,
      map,
      scheduledAt,
      roomId,
      roomPassword
    } = req.body;

    if (!tournamentId || !matchName || !scheduledAt) {
      res.status(400).json({ error: 'tournamentId, matchName, and scheduledAt are required.' });
      return;
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        stageId: stageId || null,
        groupId: groupId || null,
        matchNumber: parseInt(matchNumber || 1),
        matchName,
        map: map || 'ERANGEL',
        scheduledAt: new Date(scheduledAt),
        roomId: roomId || null,
        roomPassword: roomPassword || null,
        status: 'SCHEDULED'
      }
    });

    res.status(201).json({ message: 'Match created successfully.', match });
  } catch (error: any) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: error.message || 'Failed to create match.' });
  }
};

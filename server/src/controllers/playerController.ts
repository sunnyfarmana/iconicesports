import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getPlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search, sortBy } = req.query;

    const where: any = {};
    if (role && role !== 'ALL') {
      where.primaryRole = role as string;
    }
    if (search) {
      where.OR = [
        { ign: { contains: search as string } },
        { bgmiUid: { contains: search as string } }
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'wins') {
      orderBy.totalWins = 'desc';
    } else if (sortBy === 'mvp') {
      orderBy.mvpCount = 'desc';
    } else if (sortBy === 'matches') {
      orderBy.totalMatches = 'desc';
    } else {
      orderBy.totalKills = 'desc'; // Default leaderboard fraggers
    }

    const players = await prisma.playerProfile.findMany({
      where,
      orderBy,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        currentTeam: { select: { id: true, name: true, tag: true, logo: true } }
      },
      take: 50
    });

    res.json({ players });
  } catch (error: any) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players.' });
  }
};

export const getPlayerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const player = await prisma.playerProfile.findFirst({
      where: {
        OR: [{ id }, { bgmiUid: id }, { ign: id }]
      },
      include: {
        user: { select: { id: true, username: true, email: true, avatar: true, createdAt: true } },
        currentTeam: {
          select: {
            id: true,
            name: true,
            tag: true,
            logo: true,
            captain: { select: { username: true } }
          }
        },
        playerResults: {
          include: {
            match: {
              select: { id: true, matchName: true, map: true, scheduledAt: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!player) {
      res.status(404).json({ error: 'Player profile not found.' });
      return;
    }

    res.json({ player });
  } catch (error: any) {
    console.error('Error fetching player details:', error);
    res.status(500).json({ error: 'Failed to fetch player details.' });
  }
};

export const updatePlayer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { ign, bgmiUid, primaryRole, device, bio } = req.body;

    const existing = await prisma.playerProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Player profile not found.' });
      return;
    }

    if (bgmiUid && bgmiUid !== existing.bgmiUid) {
      const duplicateUid = await prisma.playerProfile.findUnique({
        where: { bgmiUid }
      });
      if (duplicateUid) {
        res.status(409).json({ error: 'This BGMI Character UID is already registered to another player.' });
        return;
      }
    }

    const updated = await prisma.playerProfile.update({
      where: { id: existing.id },
      data: {
        ...(ign && { ign }),
        ...(bgmiUid && { bgmiUid }),
        ...(primaryRole && { primaryRole }),
        ...(device !== undefined && { device }),
        ...(bio !== undefined && { bio })
      }
    });

    res.json({ message: 'Player profile updated.', player: updated });
  } catch (error: any) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player.' });
  }
};

/**
 * Complete Player Experience: profile, team, registrations, upcoming matches, history, stats, notices
 */
export const getPlayerDashboardData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        playerProfile: true,
        captainedTeams: {
          include: {
            members: {
              include: {
                player: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Determine all teams the user belongs to
    const teamIds: string[] = user.captainedTeams.map(t => t.id);

    let memberTeams: any[] = [];
    if (user.playerProfile) {
      const memberships = await prisma.teamMember.findMany({
        where: { playerId: user.playerProfile.id },
        include: {
          team: {
            include: {
              captain: { select: { id: true, username: true, email: true } },
              members: { include: { player: true } }
            }
          }
        }
      });
      memberTeams = memberships.map(m => m.team);
      for (const mt of memberTeams) {
        if (!teamIds.includes(mt.id)) {
          teamIds.push(mt.id);
        }
      }
    }

    // Active tournament registrations
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { teamId: { in: teamIds } },
      include: {
        tournament: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            scheduleStart: true,
            scheduleEnd: true,
            format: true,
            prizePool: true,
            banner: true
          }
        },
        team: {
          select: { id: true, name: true, tag: true }
        }
      },
      orderBy: { registeredAt: 'desc' }
    });

    // Assigned slots for player's teams
    const groupSlots = await prisma.groupSlot.findMany({
      where: { teamId: { in: teamIds } },
      include: {
        group: {
          include: {
            stage: {
              select: { tournamentId: true, stageName: true }
            }
          }
        }
      }
    });

    // Upcoming matches
    const tournamentIds = registrations.map(r => r.tournamentId);
    const upcomingMatches = await prisma.match.findMany({
      where: {
        tournamentId: { in: tournamentIds },
        status: { in: ['SCHEDULED', 'ROOM_OPEN', 'LIVE'] }
      },
      include: {
        tournament: {
          select: { id: true, title: true, slug: true }
        }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 8
    });

    // Safe match representations (hiding room password unless room is open)
    const safeUpcomingMatches = upcomingMatches.map(m => ({
      id: m.id,
      matchNumber: m.matchNumber,
      matchName: m.matchName,
      map: m.map,
      scheduledAt: m.scheduledAt,
      status: m.status,
      credentialsReleased: m.credentialsReleased,
      tournament: m.tournament
    }));

    // Recent Match Results History
    const matchResults = await prisma.matchTeamResult.findMany({
      where: { teamId: { in: teamIds } },
      include: {
        match: {
          select: {
            id: true,
            matchName: true,
            map: true,
            scheduledAt: true,
            status: true,
            tournament: { select: { title: true, slug: true } }
          }
        },
        team: { select: { name: true, tag: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Announcements
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: {
        author: { select: { username: true, role: true } }
      }
    });

    res.json({
      player: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        organizerStatus: user.organizerStatus,
        organizerBio: user.organizerBio,
        playerProfile: user.playerProfile,
        captainedTeams: user.captainedTeams,
        memberTeams
      },
      registrations,
      groupSlots,
      upcomingMatches: safeUpcomingMatches,
      matchResults,
      announcements
    });
  } catch (error: any) {
    console.error('Error fetching player dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch player panel data.' });
  }
};

/**
 * Apply to become a verified Tournament Organizer
 */
export const applyForOrganizer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { bio, experience } = req.body;

    const fullBio = `${bio || ''} ${experience ? `| Experience: ${experience}` : ''}`.trim();

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        organizerStatus: 'PENDING',
        organizerBio: fullBio
      },
      select: {
        id: true,
        username: true,
        email: true,
        organizerStatus: true
      }
    });

    // Record in Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: req.user.id,
          actorName: req.user.username,
          action: 'ORGANIZER_APPLIED',
          targetType: 'ORGANIZER',
          targetId: req.user.id,
          details: `User submitted organizer verification application: ${fullBio}`
        }
      });
    } catch {}

    res.json({
      message: 'Organizer application submitted successfully. An administrator will review your credentials.',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error applying for organizer:', error);
    res.status(500).json({ error: 'Failed to submit organizer application.' });
  }
};


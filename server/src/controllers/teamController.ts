import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        captain: { select: { id: true, username: true } },
        members: {
          include: {
            player: { select: { id: true, ign: true, bgmiUid: true, primaryRole: true } }
          }
        },
        teamResults: {
          include: {
            match: { select: { id: true, tournamentId: true } }
          }
        },
        _count: {
          select: { registrations: true, teamResults: true }
        }
      }
    });

    // Calculate aggregated stats and official Krafton BMPS 2026 ranking
    const enrichedTeams = teams.map((team) => {
      const totalPoints = team.teamResults.reduce((acc, r) => acc + r.totalPoints, 0);
      const wwcdCount = team.teamResults.filter((r) => r.isWwcd).length;
      const placementPoints = team.teamResults.reduce((acc, r) => acc + r.placementPoints, 0);
      const killPoints = team.teamResults.reduce((acc, r) => acc + r.killPoints, 0);
      return {
        ...team,
        totalPoints,
        wwcdCount,
        placementPoints,
        killPoints
      };
    });

    const officialNationalCircuitTags = [
      'GODL', 'DVN', 'VS', 'GR', 'APEX', 'OG', 'TT', 'VRS',
      'RKG', 'NEB', '8BIT', 'GEN', 'SOUL', '7G', 'TX', 'MYTH',
      'GE', 'GLAD', 'BB', 'CG', 'ENT', 'HYDRA', 'MEDAL', 'GT',
      'MG', 'WSB', 'VNMG', 'TLM', 'INS', 'FS', 'BLIND', 'NUMEN',
      'EG', 'HH', '4V', 'ABZ'
    ];

    // Sort by official Krafton BMPS 2026 points & national circuit hierarchy
    enrichedTeams.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wwcdCount !== a.wwcdCount) return b.wwcdCount - a.wwcdCount;
      if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
      if (b.killPoints !== a.killPoints) return b.killPoints - a.killPoints;
      const idxA = officialNationalCircuitTags.indexOf(a.tag);
      const idxB = officialNationalCircuitTags.indexOf(b.tag);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    const rankedTeams = enrichedTeams.map((team, idx) => ({
      ...team,
      rank: idx + 1
    }));

    res.json({ teams: rankedTeams });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams.' });
  }
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findFirst({
      where: {
        OR: [{ id }, { tag: id.toUpperCase() }]
      },
      include: {
        captain: { select: { id: true, username: true, email: true } },
        members: {
          include: {
            player: {
              select: {
                id: true,
                ign: true,
                bgmiUid: true,
                primaryRole: true,
                totalMatches: true,
                totalKills: true,
                mvpCount: true
              }
            }
          }
        },
        registrations: {
          include: {
            tournament: {
              select: { id: true, title: true, slug: true, status: true, prizePool: true }
            }
          }
        },
        teamResults: {
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

    if (!team) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    res.json({ team });
  } catch (error: any) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team.' });
  }
};

export const createTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { name, tag, logo, description } = req.body;

    if (!name || !tag) {
      res.status(400).json({ error: 'Team name and tag are required.' });
      return;
    }

    const cleanTag = tag.toUpperCase().trim();

    const existing = await prisma.team.findFirst({
      where: {
        OR: [{ name }, { tag: cleanTag }]
      }
    });

    if (existing) {
      res.status(409).json({ error: 'A team with this name or tag already exists.' });
      return;
    }

    // Ensure user has playerProfile
    let playerProfile = await prisma.playerProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!playerProfile) {
      playerProfile = await prisma.playerProfile.create({
        data: {
          userId: req.user.id,
          ign: req.user.username,
          bgmiUid: '0000000000',
          primaryRole: 'IGL'
        }
      });
    }

    const newTeam = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name,
          tag: cleanTag,
          logo: logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
          description,
          captainId: req.user!.id
        }
      });

      // Add captain as primary member
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          playerId: playerProfile!.id,
          role: 'CAPTAIN',
          status: 'ACTIVE'
        }
      });

      // Set user's current team
      await tx.playerProfile.update({
        where: { id: playerProfile!.id },
        data: { currentTeamId: team.id }
      });

      // Elevate role to TEAM_CAPTAIN if currently PLAYER
      if (req.user!.role === 'PLAYER') {
        await tx.user.update({
          where: { id: req.user!.id },
          data: { role: 'TEAM_CAPTAIN' }
        });
      }

      return team;
    });

    res.status(201).json({ message: 'Team created successfully.', team: newTeam });
  } catch (error: any) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: error.message || 'Failed to create team.' });
  }
};

export const addMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { teamId } = req.params;
    const { ignOrUid, role } = req.body; // BGMI Character UID or IGN

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    if (team.captainId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only team captain or admin can add members.' });
      return;
    }

    if (team.members.length >= 6) {
      res.status(400).json({ error: 'Team roster has reached the maximum size of 6 players (4 starters + 2 substitutes).' });
      return;
    }

    // Find player by UID or IGN
    const player = await prisma.playerProfile.findFirst({
      where: {
        OR: [{ bgmiUid: ignOrUid }, { ign: ignOrUid }]
      }
    });

    if (!player) {
      res.status(404).json({ error: 'Player with given BGMI UID or IGN not found.' });
      return;
    }

    // Check if already in team
    const alreadyMember = team.members.find(m => m.playerId === player.id);
    if (alreadyMember) {
      res.status(409).json({ error: 'Player is already a member of this team.' });
      return;
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        playerId: player.id,
        role: role || 'STARTER',
        status: 'ACTIVE'
      },
      include: {
        player: true
      }
    });

    // Update player's currentTeam
    await prisma.playerProfile.update({
      where: { id: player.id },
      data: { currentTeamId: teamId }
    });

    res.status(201).json({ message: 'Player added to team roster.', member });
  } catch (error: any) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member.' });
  }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { teamId, playerId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    if (team.captainId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only team captain or admin can remove roster members.' });
      return;
    }

    await prisma.teamMember.delete({
      where: {
        teamId_playerId: {
          teamId,
          playerId
        }
      }
    });

    await prisma.playerProfile.update({
      where: { id: playerId },
      data: { currentTeamId: null }
    });

    res.json({ message: 'Member removed from team.' });
  } catch (error: any) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member.' });
  }
};

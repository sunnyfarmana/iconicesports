import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest, verifyTournamentOwnership } from '../middleware/auth';
import { resolveScoringConfig, calculateTeamMatchScore } from '../utils/scoringEngine';

export const MATCH_RESULT_STATUSES = [
  'PENDING_REVIEW',
  'DISPUTED',
  'APPROVED',
  'FINALIZED'
] as const;

export type MatchResultStatus = typeof MATCH_RESULT_STATUSES[number];

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId } = req.params;

    const matches = await prisma.match.findMany({
      where: { tournamentId },
      include: {
        stage: true,
        group: {
          include: {
            slots: {
              include: {
                team: { select: { id: true, name: true, tag: true, logo: true } }
              },
              orderBy: { slotNumber: 'asc' }
            }
          }
        },
        _count: {
          select: { teamResults: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    // Strip credentials for public view
    const safeMatches = matches.map(m => {
      const { roomId, roomPassword, ...rest } = m;
      return {
        ...rest,
        hasCredentials: !!(roomId && roomPassword)
      };
    });

    res.json({ matches: safeMatches });
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches.' });
  }
};

export const getMatchDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            title: true,
            slug: true,
            pointSystem: true,
            scoringConfig: true
          }
        },
        stage: true,
        group: {
          include: {
            slots: {
              include: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    tag: true,
                    logo: true,
                    members: { include: { player: true } }
                  }
                }
              },
              orderBy: { slotNumber: 'asc' }
            }
          }
        },
        reviewedBy: {
          select: { id: true, username: true }
        },
        teamResults: {
          include: {
            team: { select: { id: true, name: true, tag: true, logo: true } }
          },
          orderBy: [{ totalPoints: 'desc' }, { placement: 'asc' }]
        },
        playerResults: {
          include: {
            player: { select: { id: true, ign: true, bgmiUid: true } },
            team: { select: { id: true, name: true, tag: true } }
          },
          orderBy: { kills: 'desc' }
        }
      }
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    const { roomId, roomPassword, ...safeMatch } = match;

    res.json({
      match: {
        ...safeMatch,
        hasCredentials: !!(match.roomId && match.roomPassword)
      }
    });
  } catch (error: any) {
    console.error('Error fetching match details:', error);
    res.status(500).json({ error: 'Failed to fetch match details.' });
  }
};

export const createMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'ORGANIZER')) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }

    const {
      tournamentId,
      stageId,
      groupId,
      matchNumber,
      matchName,
      map,
      scheduledAt
    } = req.body;

    if (!tournamentId || !matchName || !scheduledAt) {
      res.status(400).json({ error: 'tournamentId, matchName and scheduledAt are required.' });
      return;
    }

    // Cross-organizer security check
    const ownership = await verifyTournamentOwnership(req.user, tournamentId);
    if (!ownership.allowed) {
      res.status(403).json({ error: ownership.error || 'Access denied: You cannot create matches for another organizer\'s tournament.' });
      return;
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        stageId: stageId || null,
        groupId: groupId || null,
        matchNumber: matchNumber ? parseInt(matchNumber) : 1,
        matchName,
        map: map || 'ERANGEL',
        scheduledAt: new Date(scheduledAt),
        status: 'SCHEDULED',
        resultStatus: 'PENDING_REVIEW'
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('match_created', { tournamentId, matchId: match.id, matchName });
    }

    res.status(201).json({ message: 'Match scheduled successfully.', match });
  } catch (error: any) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to schedule match.' });
  }
};

export const getRoomCredentials = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required to view match room credentials.' });
      return;
    }

    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        group: {
          include: {
            slots: {
              include: {
                team: {
                  include: {
                    members: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    // Admins have full platform oversight; Organizers must own the tournament
    if (req.user.role === 'ADMIN') {
      // Allowed
    } else if (req.user.role === 'ORGANIZER') {
      const ownership = await verifyTournamentOwnership(req.user, match.tournamentId);
      if (!ownership.allowed) {
        res.status(403).json({ error: ownership.error || 'Access denied: You cannot access room credentials for another organizer\'s tournament.' });
        return;
      }
    } else {
      // Athletes & Team Captains
      if (!match.credentialsReleased) {
        res.status(403).json({
          error: 'Room credentials have not been released by the tournament organizer yet.'
        });
        return;
      }

      // Check if user is a member or captain of any assigned team in this match's group slots
      const userProfile = await prisma.playerProfile.findUnique({
        where: { userId: req.user.id }
      });

      const userTeams = await prisma.team.findMany({
        where: {
          OR: [
            { captainId: req.user.id },
            ...(userProfile ? [{ members: { some: { playerId: userProfile.id } } }] : [])
          ]
        },
        select: { id: true }
      });

      const userTeamIds = userTeams.map(t => t.id);

      const isTeamInMatch = match.group?.slots.some(
        slot => slot.teamId && userTeamIds.includes(slot.teamId)
      );

      const isRegisteredInTournament = await prisma.tournamentRegistration.findFirst({
        where: {
          tournamentId: match.tournamentId,
          teamId: { in: userTeamIds },
          status: 'APPROVED'
        }
      });

      if (!isTeamInMatch && !isRegisteredInTournament) {
        res.status(403).json({
          error: 'Access restricted: Your team is not assigned to this match room.'
        });
        return;
      }
    }

    res.json({
      roomId: match.roomId,
      roomPassword: match.roomPassword,
      credentialsReleased: match.credentialsReleased,
      matchName: match.matchName,
      map: match.map,
      scheduledAt: match.scheduledAt
    });
  } catch (error: any) {
    console.error('Error fetching room credentials:', error);
    res.status(500).json({ error: 'Failed to access room credentials.' });
  }
};

export const updateRoomCredentials = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { matchId } = req.params;
    const { roomId, roomPassword, credentialsReleased, status } = req.body;

    const targetMatch = await prisma.match.findUnique({ where: { id: matchId } });
    if (!targetMatch) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    // Cross-organizer security check
    const ownership = await verifyTournamentOwnership(req.user, targetMatch.tournamentId);
    if (!ownership.allowed) {
      res.status(403).json({ error: ownership.error || 'Access denied: You cannot update room credentials for another organizer\'s match.' });
      return;
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        ...(roomId !== undefined && { roomId }),
        ...(roomPassword !== undefined && { roomPassword }),
        ...(credentialsReleased !== undefined && { credentialsReleased }),
        ...(status && { status })
      }
    });

    // Notify connected clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${matchId}`).emit('room_credentials_updated', {
        matchId,
        credentialsReleased: updated.credentialsReleased,
        status: updated.status
      });
      io.emit('match_status_changed', {
        matchId,
        status: updated.status,
        credentialsReleased: updated.credentialsReleased
      });
    }

    res.json({ message: 'Room credentials updated successfully.', match: updated });
  } catch (error: any) {
    console.error('Error updating room credentials:', error);
    res.status(500).json({ error: 'Failed to update credentials.' });
  }
};

/**
 * Submit Match Results with dynamic tournament scoring configuration & evidence
 */
export const submitMatchResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;
    const { teamResults, playerResults, evidenceUrl, notes } = req.body;

    // teamResults: Array<{ teamId: string, placement: number, killPoints: number }>
    // playerResults: Array<{ teamId: string, playerId: string, kills: number, damage?: number, isMvp?: boolean }>

    if (!teamResults || !Array.isArray(teamResults)) {
      res.status(400).json({ error: 'teamResults array is required.' });
      return;
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            scoringConfig: true,
            pointSystem: true
          }
        }
      }
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    // Cross-organizer security check
    const ownership = await verifyTournamentOwnership(req.user, match.tournamentId);
    if (!ownership.allowed) {
      res.status(403).json({ error: ownership.error || 'Access denied: You cannot submit results for another organizer\'s tournament.' });
      return;
    }

    // Resolve tournament-specific scoring formula
    const scoringConfig = resolveScoringConfig(
      match.tournament.scoringConfig,
      match.tournament.pointSystem
    );

    await prisma.$transaction(async (tx) => {
      // 1. Clear any prior results for idempotency
      await tx.matchPlayerResult.deleteMany({ where: { matchId } });
      await tx.matchTeamResult.deleteMany({ where: { matchId } });

      // 2. Insert team results using dynamic scoring configuration
      for (const resItem of teamResults) {
        const placement = parseInt(resItem.placement);
        const kills = parseInt(resItem.killPoints || resItem.kills || 0);

        const score = calculateTeamMatchScore(placement, kills, scoringConfig);

        await tx.matchTeamResult.create({
          data: {
            matchId,
            teamId: resItem.teamId,
            placement: score.placement,
            placementPoints: score.placementPoints,
            killPoints: score.killPoints,
            totalPoints: score.totalPoints,
            isWwcd: score.isWwcd
          }
        });
      }

      // 3. Insert player results
      if (playerResults && Array.isArray(playerResults)) {
        for (const pRes of playerResults) {
          const kills = parseInt(pRes.kills || 0);
          const damage = parseInt(pRes.damage || 0);
          const isMvp = !!pRes.isMvp;

          await tx.matchPlayerResult.create({
            data: {
              matchId,
              teamId: pRes.teamId,
              playerId: pRes.playerId,
              kills,
              damage,
              isMvp
            }
          });
        }
      }

      // 4. Update match state and attach evidence
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          resultStatus: 'APPROVED',
          evidenceUrl: evidenceUrl || match.evidenceUrl,
          reviewNotes: notes || match.reviewNotes
        }
      });
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('match_results_submitted', {
        matchId,
        tournamentId: match.tournamentId
      });
      io.emit('standings_updated', {
        tournamentId: match.tournamentId
      });
    }

    res.json({
      message: 'Match results successfully recorded and point table updated according to tournament scoring rules.'
    });
  } catch (error: any) {
    console.error('Error submitting match results:', error);
    res.status(500).json({ error: error.message || 'Failed to submit match results.' });
  }
};

/**
 * Result Review, Correction, Approval and Finalization
 */
export const reviewMatchResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'ORGANIZER')) {
      res.status(403).json({ error: 'Unauthorized: Staff access required.' });
      return;
    }

    const { matchId } = req.params;
    const { resultStatus, reviewNotes, evidenceUrl } = req.body;

    if (!resultStatus || !MATCH_RESULT_STATUSES.includes(resultStatus)) {
      res.status(400).json({
        error: `Invalid resultStatus '${resultStatus}'. Must be one of: ${MATCH_RESULT_STATUSES.join(', ')}`
      });
      return;
    }

    const targetMatch = await prisma.match.findUnique({ where: { id: matchId } });
    if (!targetMatch) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    // Cross-organizer security check
    const ownership = await verifyTournamentOwnership(req.user, targetMatch.tournamentId);
    if (!ownership.allowed) {
      res.status(403).json({ error: ownership.error || 'Access denied: You cannot review match results for another organizer\'s tournament.' });
      return;
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        resultStatus,
        reviewedById: req.user.id,
        ...(reviewNotes !== undefined && { reviewNotes }),
        ...(evidenceUrl !== undefined && { evidenceUrl }),
        ...(resultStatus === 'FINALIZED' && { status: 'COMPLETED' })
      },
      include: {
        reviewedBy: { select: { id: true, username: true } }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('match_result_status_updated', {
        matchId,
        tournamentId: updated.tournamentId,
        resultStatus: updated.resultStatus
      });
    }

    res.json({
      message: `Match results status successfully updated to ${resultStatus}.`,
      match: updated
    });
  } catch (error: any) {
    console.error('Review match results error:', error);
    res.status(500).json({ error: error.message || 'Failed to review match results.' });
  }
};

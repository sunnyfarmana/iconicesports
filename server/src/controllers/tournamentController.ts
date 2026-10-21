import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest, verifyTournamentOwnership } from '../middleware/auth';
import { resolveScoringConfig, sortStandingsWithTiebreakers } from '../utils/scoringEngine';

// Valid BGMI Tournament Lifecycle states
export const TOURNAMENT_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'PUBLISHED',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED'
] as const;

export type TournamentStatus = typeof TOURNAMENT_STATUSES[number];

export const getTournaments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, format, season, visibility, organizerId } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (format && format !== 'ALL') {
      where.format = format as string;
    }
    if (season && season !== 'ALL') {
      where.season = season as string;
    }
    if (organizerId) {
      where.organizerId = organizerId as string;
    }
    if (visibility) {
      where.visibility = visibility as string;
    } else if (!organizerId) {
      // By default, hide draft and private tournaments unless explicitly filtered or queried by organizer
      where.visibility = { not: 'PRIVATE' };
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { scheduleStart: 'desc' },
      include: {
        organizer: {
          select: { id: true, username: true }
        },
        _count: {
          select: { registrations: true, matches: true }
        }
      }
    });

    res.json({ tournaments });
  } catch (error: any) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments.' });
  }
};

export const getTournamentBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const tournament = await prisma.tournament.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      },
      include: {
        organizer: {
          select: { id: true, username: true }
        },
        registrations: {
          include: {
            team: {
              select: { id: true, name: true, tag: true, logo: true }
            }
          }
        },
        stages: {
          include: {
            groups: {
              include: {
                slots: {
                  include: {
                    team: { select: { id: true, name: true, tag: true, logo: true } }
                  },
                  orderBy: { slotNumber: 'asc' }
                }
              }
            }
          },
          orderBy: { sequenceOrder: 'asc' }
        },
        matches: {
          orderBy: { scheduledAt: 'asc' }
        }
      }
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    res.json({ tournament });
  } catch (error: any) {
    console.error('Error fetching tournament details:', error);
    res.status(500).json({ error: 'Failed to fetch tournament.' });
  }
};

export const createTournament = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const {
      title,
      slug,
      banner,
      description,
      season,
      game,
      format,
      maxSlots,
      prizePool,
      prizeBreakdown,
      rules,
      scheduleStart,
      scheduleEnd,
      regOpenAt,
      regCloseAt,
      timezone,
      status,
      visibility,
      pointSystem,
      scoringConfig,
      mapsConfig,
      minRosterSize,
      maxRosterSize
    } = req.body;

    if (!title || !scheduleStart || !scheduleEnd) {
      res.status(400).json({ error: 'Title, start time and end time are required.' });
      return;
    }

    const generatedSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await prisma.tournament.findUnique({
      where: { slug: generatedSlug }
    });

    const finalSlug = existing ? `${generatedSlug}-${Date.now().toString().slice(-4)}` : generatedSlug;

    let validatedStatus = (status && TOURNAMENT_STATUSES.includes(status)) ? status : 'REGISTRATION_OPEN';

    if (req.user.role === 'ORGANIZER' && req.user.organizerStatus !== 'APPROVED') {
      if (validatedStatus !== 'DRAFT' && validatedStatus !== 'PENDING_APPROVAL') {
        res.status(403).json({
          error: 'Unapproved organizers cannot publish tournaments directly. Please submit your tournament as DRAFT or PENDING_APPROVAL for administrator review.'
        });
        return;
      }
    }

    const tournament = await prisma.tournament.create({
      data: {
        title,
        slug: finalSlug,
        banner: banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
        description: description || 'Official BGMI Competitive Tournament powered by ICONIC ESPORTS.',
        season: season || 'SEASON_2026',
        game: game || 'BATTLEGROUNDS MOBILE INDIA',
        format: format || 'SQUAD',
        maxSlots: maxSlots ? parseInt(maxSlots) : 25,
        prizePool: prizePool || '₹50,000',
        prizeBreakdown: typeof prizeBreakdown === 'object' ? JSON.stringify(prizeBreakdown) : prizeBreakdown,
        rules: rules || 'Official BGMI Rulebook & Standard Esports Regulations apply.',
        scheduleStart: new Date(scheduleStart),
        scheduleEnd: new Date(scheduleEnd),
        regOpenAt: regOpenAt ? new Date(regOpenAt) : null,
        regCloseAt: regCloseAt ? new Date(regCloseAt) : null,
        timezone: timezone || 'Asia/Kolkata',
        status: validatedStatus,
        visibility: visibility || 'PUBLIC',
        pointSystem: pointSystem || 'BGMI_OFFICIAL_10PT',
        scoringConfig: typeof scoringConfig === 'object' ? JSON.stringify(scoringConfig) : scoringConfig,
        mapsConfig: typeof mapsConfig === 'object' ? JSON.stringify(mapsConfig) : mapsConfig,
        minRosterSize: minRosterSize ? parseInt(minRosterSize) : 4,
        maxRosterSize: maxRosterSize ? parseInt(maxRosterSize) : 6,
        organizerId: req.user.id
      }
    });

    // Automatically initialize default Stage 1 and Lobby Group with 25 slots
    try {
      const stage = await prisma.tournamentStage.create({
        data: {
          tournamentId: tournament.id,
          stageName: 'Grand Finals',
          sequenceOrder: 1,
          stageType: 'LEAGUE'
        }
      });

      const group = await prisma.tournamentGroup.create({
        data: {
          stageId: stage.id,
          groupName: 'Finals Lobby'
        }
      });

      for (let i = 1; i <= Math.min(tournament.maxSlots, 25); i++) {
        await prisma.groupSlot.create({
          data: {
            groupId: group.id,
            slotNumber: i
          }
        });
      }
    } catch (initErr) {
      console.warn('Initial group slot auto-setup notice:', initErr);
    }

    res.status(201).json({ message: 'Tournament created successfully with full 25-slot lobby grid.', tournament });
  } catch (error: any) {
    console.error('Create tournament error:', error);
    res.status(500).json({ error: error.message || 'Failed to create tournament.' });
  }
};

export const updateTournament = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;

    // Cross-organizer security check
    const ownership = await verifyTournamentOwnership(req.user, id);
    if (!ownership.allowed) {
      res.status(403).json({ error: ownership.error || 'Access denied: You cannot manage another organizer\'s tournament.' });
      return;
    }
    const {
      status,
      title,
      prizePool,
      prizeBreakdown,
      rules,
      maxSlots,
      banner,
      season,
      game,
      format,
      scheduleStart,
      scheduleEnd,
      regOpenAt,
      regCloseAt,
      timezone,
      visibility,
      pointSystem,
      scoringConfig,
      mapsConfig,
      minRosterSize,
      maxRosterSize
    } = req.body;

    if (status && !TOURNAMENT_STATUSES.includes(status)) {
      res.status(400).json({
        error: `Invalid tournament status '${status}'. Must be one of: ${TOURNAMENT_STATUSES.join(', ')}`
      });
      return;
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(prizePool && { prizePool }),
        ...(prizeBreakdown !== undefined && {
          prizeBreakdown: typeof prizeBreakdown === 'object' ? JSON.stringify(prizeBreakdown) : prizeBreakdown
        }),
        ...(rules && { rules }),
        ...(maxSlots && { maxSlots: parseInt(maxSlots) }),
        ...(banner && { banner }),
        ...(season && { season }),
        ...(game && { game }),
        ...(format && { format }),
        ...(scheduleStart && { scheduleStart: new Date(scheduleStart) }),
        ...(scheduleEnd && { scheduleEnd: new Date(scheduleEnd) }),
        ...(regOpenAt !== undefined && { regOpenAt: regOpenAt ? new Date(regOpenAt) : null }),
        ...(regCloseAt !== undefined && { regCloseAt: regCloseAt ? new Date(regCloseAt) : null }),
        ...(timezone && { timezone }),
        ...(visibility && { visibility }),
        ...(pointSystem && { pointSystem }),
        ...(scoringConfig !== undefined && {
          scoringConfig: typeof scoringConfig === 'object' ? JSON.stringify(scoringConfig) : scoringConfig
        }),
        ...(mapsConfig !== undefined && {
          mapsConfig: typeof mapsConfig === 'object' ? JSON.stringify(mapsConfig) : mapsConfig
        }),
        ...(minRosterSize && { minRosterSize: parseInt(minRosterSize) }),
        ...(maxRosterSize && { maxRosterSize: parseInt(maxRosterSize) })
      }
    });

    // Realtime notification
    const io = req.app.get('io');
    if (io) {
      io.emit('tournament_updated', { tournamentId: id, status: updated.status });
    }

    res.json({ message: 'Tournament updated successfully.', tournament: updated });
  } catch (error: any) {
    console.error('Update tournament error:', error);
    res.status(500).json({ error: 'Failed to update tournament.' });
  }
};

/**
 * Atomic Team Registration with concurrency lock and roster verification
 */
export const registerTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { tournamentId } = req.params;
    const { teamId, slotNumber } = req.body;

    if (!teamId) {
      res.status(400).json({ error: 'teamId is required.' });
      return;
    }

    // 1. Verify Captain Rights or Staff
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        captainId: req.user.id
      },
      include: {
        members: {
          include: {
            player: true
          }
        }
      }
    });

    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'ORGANIZER';
    if (!team && !isStaff) {
      res.status(403).json({ error: 'Only the team captain or authorized admin can register this squad.' });
      return;
    }

    const targetTeam = team || (await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { player: true } } }
    }));

    if (!targetTeam) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    // 2. Fetch tournament configuration
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        stages: {
          include: {
            groups: {
              include: {
                slots: true
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    // 3. Lifecycle Status & Timing Verification
    if (tournament.status !== 'REGISTRATION_OPEN') {
      res.status(400).json({
        error: `Registration is currently closed for this event. (Status: ${tournament.status})`
      });
      return;
    }

    const now = new Date();
    if (tournament.regOpenAt && now < tournament.regOpenAt) {
      res.status(400).json({
        error: `Registration opens at ${tournament.regOpenAt.toISOString()}.`
      });
      return;
    }

    if (tournament.regCloseAt && now > tournament.regCloseAt) {
      res.status(400).json({
        error: `Registration closed at ${tournament.regCloseAt.toISOString()}.`
      });
      return;
    }

    // 4. Roster Limits and BGMI UID Validation
    const minRequired = tournament.minRosterSize || 4;
    const maxAllowed = tournament.maxRosterSize || 6;
    const activeMembers = targetTeam.members.filter(m => m.status === 'ACTIVE' || !m.status);

    if (activeMembers.length < minRequired) {
      res.status(400).json({
        error: `Squad roster requirement not met. At least ${minRequired} active athletes required. Current active: ${activeMembers.length}`
      });
      return;
    }

    if (activeMembers.length > maxAllowed) {
      res.status(400).json({
        error: `Squad exceeds maximum roster size of ${maxAllowed} players (including substitutes). Current: ${activeMembers.length}`
      });
      return;
    }

    // Verify all players have valid BGMI Character IDs
    for (const member of activeMembers) {
      if (!member.player.bgmiUid || member.player.bgmiUid.trim().length < 5) {
        res.status(400).json({
          error: `Player ${member.player.ign} is missing a verified BGMI Character UID. Please complete player profile.`
        });
        return;
      }
    }

    // 5. Multi-Roster Conflict Check: Ensure no athlete is already registered with another squad in this tournament
    const playerIds = activeMembers.map(m => m.player.id);
    const existingRegistrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        teamId: { not: teamId }
      },
      include: {
        team: {
          include: {
            members: {
              include: { player: true }
            }
          }
        }
      }
    });

    for (const reg of existingRegistrations) {
      for (const regMember of reg.team.members) {
        if (playerIds.includes(regMember.playerId)) {
          res.status(409).json({
            error: `Roster conflict: Athlete '${regMember.player.ign}' (UID: ${regMember.player.bgmiUid}) is already registered in this tournament under '${reg.team.name}' [${reg.team.tag}]. Multi-roster registration is prohibited.`
          });
          return;
        }
      }
    }

    // 6. Lobby Group and Slot Allocation Preparation
    let group = tournament.stages?.[0]?.groups?.[0];
    if (!group) {
      let stage = await prisma.tournamentStage.findFirst({ where: { tournamentId } });
      if (!stage) {
        stage = await prisma.tournamentStage.create({
          data: {
            tournamentId,
            stageName: 'Grand Finals',
            sequenceOrder: 1,
            stageType: 'LEAGUE'
          }
        });
      }
      group = await prisma.tournamentGroup.create({
        data: {
          stageId: stage.id,
          groupName: 'Finals Lobby'
        },
        include: { slots: true }
      });
      for (let i = 1; i <= 25; i++) {
        await prisma.groupSlot.create({
          data: { groupId: group.id, slotNumber: i }
        });
      }
      group = (await prisma.tournamentGroup.findUnique({
        where: { id: group.id },
        include: { slots: true }
      })) as any;
    }

    let allocatedSlotNumber: number | null = null;
    const requestedSlot = slotNumber ? parseInt(slotNumber) : undefined;

    if (requestedSlot) {
      if (requestedSlot === 1) {
        res.status(400).json({ error: 'Slot #1 is strictly reserved for Tournament Host & Official Referees.' });
        return;
      }
      if (requestedSlot < 1 || requestedSlot > 25) {
        res.status(400).json({ error: 'Slot number must be between 2 and 25.' });
        return;
      }
      const existingSlot = group?.slots.find(s => s.slotNumber === requestedSlot);
      if (existingSlot && existingSlot.teamId && existingSlot.teamId !== teamId) {
        res.status(409).json({
          error: `Slot #${requestedSlot} is already claimed by another squad. Please select an available slot.`
        });
        return;
      }
      allocatedSlotNumber = requestedSlot;
    } else {
      // Auto-assign first free slot between 2 and 25
      const freeSlot = group?.slots
        .filter(s => s.slotNumber >= 2 && s.slotNumber <= 25)
        .sort((a, b) => a.slotNumber - b.slotNumber)
        .find(s => !s.teamId);
      if (freeSlot) {
        allocatedSlotNumber = freeSlot.slotNumber;
      }
    }

    // Roster snapshot for historical audit trail
    const rosterSnapshot = JSON.stringify(
      activeMembers.map(m => ({
        playerId: m.player.id,
        ign: m.player.ign,
        bgmiUid: m.player.bgmiUid,
        role: m.role
      }))
    );

    // 7. Atomic Concurrency Lock: Check capacity & reserve slot within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch tournament inside transaction to guarantee fresh count and prevent race condition
      const liveTournament = await tx.tournament.findUnique({
        where: { id: tournamentId }
      });

      if (!liveTournament) {
        throw new Error('Tournament no longer exists.');
      }

      if (liveTournament.status !== 'REGISTRATION_OPEN') {
        throw new Error('Registration is no longer open for this tournament.');
      }

      if (liveTournament.registeredSlots >= liveTournament.maxSlots) {
        throw new Error('Tournament slots are full. Registration has reached capacity.');
      }

      // Check duplicate registration for same team inside transaction
      const existingReg = await tx.tournamentRegistration.findUnique({
        where: {
          tournamentId_teamId: {
            tournamentId,
            teamId
          }
        }
      });

      if (existingReg) {
        throw new Error('Team is already registered for this tournament.');
      }

      // Check slot occupancy inside transaction if requested
      if (allocatedSlotNumber && group) {
        const slotCheck = await tx.groupSlot.findUnique({
          where: {
            groupId_slotNumber: {
              groupId: group.id,
              slotNumber: allocatedSlotNumber
            }
          }
        });
        if (slotCheck && slotCheck.teamId && slotCheck.teamId !== teamId) {
          throw new Error(`Slot #${allocatedSlotNumber} was just claimed by another squad. Please choose a different slot.`);
        }
      }

      // Create Registration
      const reg = await tx.tournamentRegistration.create({
        data: {
          tournamentId,
          teamId,
          status: 'APPROVED',
          rosterSnapshot
        }
      });

      // Increment registered slots count
      const updatedTourney = await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          registeredSlots: { increment: 1 }
        }
      });

      // If capacity reached, automatically close registration
      if (updatedTourney.registeredSlots >= updatedTourney.maxSlots) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { status: 'REGISTRATION_CLOSED' }
        });
      }

      // Assign Slot
      if (allocatedSlotNumber && group) {
        await tx.groupSlot.upsert({
          where: {
            groupId_slotNumber: {
              groupId: group.id,
              slotNumber: allocatedSlotNumber
            }
          },
          create: {
            groupId: group.id,
            slotNumber: allocatedSlotNumber,
            teamId: targetTeam.id
          },
          update: {
            teamId: targetTeam.id
          }
        });
      }

      return { reg, updatedTourney };
    });

    // Realtime notification to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('tournament_registration_updated', {
        tournamentId,
        teamId,
        teamName: targetTeam.name,
        slotNumber: allocatedSlotNumber,
        registeredSlots: result.updatedTourney.registeredSlots,
        status: result.updatedTourney.status
      });
    }

    res.status(201).json({
      message: `Squad successfully registered! Assigned to Slot #${allocatedSlotNumber || 'auto'}.`,
      registration: result.reg,
      assignedSlot: allocatedSlotNumber,
      registeredSlots: result.updatedTourney.registeredSlots
    });
  } catch (error: any) {
    console.error('Register team error:', error);
    res.status(400).json({ error: error.message || 'Failed to register team.' });
  }
};

export const claimSlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { tournamentId } = req.params;
    const { teamId, slotNumber } = req.body;

    const parsedSlot = parseInt(slotNumber);
    if (!parsedSlot || parsedSlot < 2 || parsedSlot > 25) {
      res.status(400).json({ error: 'Valid participant slots are 2 to 25. Slot 1 is reserved for host/referees.' });
      return;
    }

    // Verify captain rights or staff
    const team = await prisma.team.findFirst({
      where: { id: teamId, captainId: req.user.id }
    });
    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'ORGANIZER';

    if (!team && !isStaff) {
      res.status(403).json({ error: 'Only team captain or organizer can claim or change a slot.' });
      return;
    }

    const reg = await prisma.tournamentRegistration.findUnique({
      where: { tournamentId_teamId: { tournamentId, teamId } }
    });
    if (!reg) {
      res.status(400).json({ error: 'Team must be registered in the tournament first.' });
      return;
    }

    let group = await prisma.tournamentGroup.findFirst({
      where: { stage: { tournamentId } },
      include: { slots: true }
    });

    if (!group) {
      res.status(404).json({ error: 'Tournament lobby group not found.' });
      return;
    }

    const targetSlot = group.slots.find(s => s.slotNumber === parsedSlot);
    if (targetSlot && targetSlot.teamId && targetSlot.teamId !== teamId) {
      res.status(409).json({ error: `Slot #${parsedSlot} is already occupied by another squad.` });
      return;
    }

    // Clear previous slot for this team if any in this group
    await prisma.groupSlot.updateMany({
      where: { groupId: group.id, teamId },
      data: { teamId: null }
    });

    // Assign new slot
    const updatedSlot = await prisma.groupSlot.upsert({
      where: {
        groupId_slotNumber: {
          groupId: group.id,
          slotNumber: parsedSlot
        }
      },
      create: {
        groupId: group.id,
        slotNumber: parsedSlot,
        teamId
      },
      update: {
        teamId
      },
      include: {
        team: { select: { id: true, name: true, tag: true, logo: true } }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('slot_claimed', {
        tournamentId,
        groupId: group.id,
        slotNumber: parsedSlot,
        teamId
      });
    }

    res.json({
      message: `Slot #${parsedSlot} successfully assigned to ${team?.name || 'team'}.`,
      slot: updatedSlot
    });
  } catch (err: any) {
    console.error('Claim slot error:', err);
    res.status(500).json({ error: err.message || 'Failed to claim slot.' });
  }
};

export const getRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId } = req.params;

    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId },
      include: {
        team: {
          include: {
            captain: { select: { id: true, username: true, email: true } },
            members: { include: { player: true } }
          }
        }
      },
      orderBy: { registeredAt: 'asc' }
    });

    res.json({ registrations });
  } catch (error: any) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
};

export const updateRegistrationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { registrationId } = req.params;
    const { status } = req.body; // APPROVED, REJECTED, DISQUALIFIED

    if (!['APPROVED', 'REJECTED', 'DISQUALIFIED'].includes(status)) {
      res.status(400).json({ error: 'Invalid registration status.' });
      return;
    }

    const reg = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId }
    });

    if (!reg) {
      res.status(404).json({ error: 'Registration not found.' });
      return;
    }

    // Cross-organizer security check
    const ownership = await verifyTournamentOwnership(req.user, reg.tournamentId);
    if (!ownership.allowed) {
      res.status(403).json({ error: ownership.error || 'Access denied: You cannot modify registrations for another organizer\'s tournament.' });
      return;
    }

    const updated = await prisma.tournamentRegistration.update({
      where: { id: registrationId },
      data: { status }
    });

    res.json({ message: `Registration status updated to ${status}.`, registration: updated });
  } catch (error: any) {
    console.error('Update registration status error:', error);
    res.status(500).json({ error: 'Failed to update registration status.' });
  }
};

/**
 * Tournament Format & Stage Advancement
 * Qualifies top N teams from fromStageId and assigns them to toStageId's group slots
 */
export const advanceStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'ORGANIZER')) {
      res.status(403).json({ error: 'Only admins or tournament organizers can advance stages.' });
      return;
    }

    const { tournamentId } = req.params;

    // Cross-organizer security check
    const ownership = await verifyTournamentOwnership(req.user, tournamentId);
    if (!ownership.allowed) {
      res.status(403).json({ error: ownership.error || 'Access denied: You cannot advance stages for another organizer\'s tournament.' });
      return;
    }

    const { fromStageId, toStageId, qualifyingCount } = req.body;

    const count = parseInt(qualifyingCount) || 16;

    // Fetch fromStage matches and calculate standings
    const fromStage = await prisma.tournamentStage.findUnique({
      where: { id: fromStageId },
      include: {
        matches: {
          where: { status: 'COMPLETED' },
          include: {
            teamResults: {
              include: {
                team: { select: { id: true, name: true, tag: true, logo: true } }
              }
            }
          }
        }
      }
    });

    if (!fromStage) {
      res.status(404).json({ error: 'Source stage not found.' });
      return;
    }

    const toStage = await prisma.tournamentStage.findUnique({
      where: { id: toStageId },
      include: {
        groups: {
          include: { slots: true }
        }
      }
    });

    if (!toStage) {
      res.status(404).json({ error: 'Target stage not found.' });
      return;
    }

    // Aggregate standings for fromStage
    const teamMap = new Map<string, any>();
    for (const match of fromStage.matches) {
      for (const resItem of match.teamResults) {
        let entry = teamMap.get(resItem.teamId);
        if (!entry) {
          entry = {
            teamId: resItem.teamId,
            teamName: resItem.team.name,
            teamTag: resItem.team.tag,
            teamLogo: resItem.team.logo,
            matchesPlayed: 0,
            wwcdCount: 0,
            placementPoints: 0,
            killPoints: 0,
            totalPoints: 0
          };
          teamMap.set(resItem.teamId, entry);
        }
        entry.matchesPlayed += 1;
        if (resItem.isWwcd) entry.wwcdCount += 1;
        entry.placementPoints += resItem.placementPoints;
        entry.killPoints += resItem.killPoints;
        entry.totalPoints += resItem.totalPoints;
      }
    }

    const rankedStandings = sortStandingsWithTiebreakers(Array.from(teamMap.values()));
    const qualifiedTeams = rankedStandings.slice(0, count);

    // Target group
    let targetGroup = toStage.groups[0];
    if (!targetGroup) {
      targetGroup = await prisma.tournamentGroup.create({
        data: {
          stageId: toStage.id,
          groupName: `${toStage.stageName} Lobby`
        },
        include: { slots: true }
      });
      for (let i = 1; i <= 25; i++) {
        await prisma.groupSlot.create({
          data: { groupId: targetGroup.id, slotNumber: i }
        });
      }
    }

    // Populate slots 2 through count + 1 with qualified teams
    for (let i = 0; i < qualifiedTeams.length; i++) {
      const slotNum = i + 2; // Slot 1 reserved for host
      if (slotNum <= 25) {
        await prisma.groupSlot.upsert({
          where: {
            groupId_slotNumber: {
              groupId: targetGroup.id,
              slotNumber: slotNum
            }
          },
          create: {
            groupId: targetGroup.id,
            slotNumber: slotNum,
            teamId: qualifiedTeams[i].teamId
          },
          update: {
            teamId: qualifiedTeams[i].teamId
          }
        });
      }
    }

    res.json({
      message: `Successfully advanced top ${qualifiedTeams.length} squads from ${fromStage.stageName} to ${toStage.stageName}.`,
      qualifiedTeams
    });
  } catch (error: any) {
    console.error('Advance stage error:', error);
    res.status(500).json({ error: error.message || 'Failed to advance stage.' });
  }
};

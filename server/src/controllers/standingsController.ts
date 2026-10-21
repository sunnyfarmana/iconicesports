import { Request, Response } from 'express';
import prisma from '../prisma';
import { sortStandingsWithTiebreakers, StandingsEntry } from '../utils/scoringEngine';

export interface TeamStandingRow extends StandingsEntry {
  rank: number;
}

export const getTournamentStandings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
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

    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    const teamStatsMap = new Map<string, StandingsEntry>();

    // Process all completed matches
    for (const match of tournament.matches) {
      for (const res of match.teamResults) {
        let stats = teamStatsMap.get(res.teamId);
        if (!stats) {
          stats = {
            teamId: res.teamId,
            teamName: res.team.name,
            teamTag: res.team.tag,
            teamLogo: res.team.logo,
            matchesPlayed: 0,
            wwcdCount: 0,
            placementPoints: 0,
            killPoints: 0,
            totalPoints: 0,
            bestPlacement: 25
          };
          teamStatsMap.set(res.teamId, stats);
        }

        stats.matchesPlayed += 1;
        if (res.isWwcd) stats.wwcdCount += 1;
        stats.placementPoints += res.placementPoints;
        stats.killPoints += res.killPoints;
        stats.totalPoints += res.totalPoints;
        if (res.placement < (stats.bestPlacement ?? 25)) {
          stats.bestPlacement = res.placement;
        }
      }
    }

    // Official BGMI Tiebreaker Ranking:
    // 1. Total Points
    // 2. Total WWCDs
    // 3. Placement Points
    // 4. Kill Points
    // 5. Best Placement
    const sortedEntries = sortStandingsWithTiebreakers(Array.from(teamStatsMap.values()));

    // Assign final ranks
    const standings: TeamStandingRow[] = sortedEntries.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    res.json({
      tournamentTitle: tournament.title,
      totalCompletedMatches: tournament.matches.length,
      tiebreakerRules: [
        '1. Total Overall Points',
        '2. Total WWCDs (Chicken Dinners)',
        '3. Total Placement Points',
        '4. Total Finish / Kill Points',
        '5. Best Single Match Placement'
      ],
      standings
    });
  } catch (error: any) {
    console.error('Error fetching tournament standings:', error);
    res.status(500).json({ error: 'Failed to fetch standings.' });
  }
};

export const getTournamentMvpLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tournamentId } = req.params;

    const matches = await prisma.match.findMany({
      where: { tournamentId, status: 'COMPLETED' },
      select: { id: true }
    });

    const matchIds = matches.map(m => m.id);

    const playerResults = await prisma.matchPlayerResult.findMany({
      where: { matchId: { in: matchIds } },
      include: {
        player: {
          select: {
            id: true,
            ign: true,
            bgmiUid: true,
            primaryRole: true,
            user: { select: { avatar: true } }
          }
        },
        team: {
          select: { id: true, name: true, tag: true }
        }
      }
    });

    const playerMap = new Map<string, any>();

    for (const pr of playerResults) {
      let item = playerMap.get(pr.playerId);
      if (!item) {
        item = {
          rank: 0,
          playerId: pr.playerId,
          ign: pr.player.ign,
          bgmiUid: pr.player.bgmiUid,
          role: pr.player.primaryRole,
          teamTag: pr.team.tag,
          teamName: pr.team.name,
          avatar: pr.player.user.avatar,
          matchesPlayed: 0,
          totalKills: 0,
          totalDamage: 0,
          mvpTitles: 0
        };
        playerMap.set(pr.playerId, item);
      }

      item.matchesPlayed += 1;
      item.totalKills += pr.kills;
      item.totalDamage += pr.damage;
      if (pr.isMvp) item.mvpTitles += 1;
    }

    // Rank players: 1. Total Kills -> 2. Total Damage -> 3. MVP Titles
    const leaderboard = Array.from(playerMap.values()).sort((a, b) => {
      if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
      if (b.totalDamage !== a.totalDamage) return b.totalDamage - a.totalDamage;
      return b.mvpTitles - a.mvpTitles;
    });

    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.json({
      tournamentId,
      totalFraggers: leaderboard.length,
      leaderboard
    });
  } catch (error: any) {
    console.error('Error fetching MVP leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
};

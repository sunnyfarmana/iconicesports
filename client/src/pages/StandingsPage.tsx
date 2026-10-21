import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Tournament, StandingRow, MVPLeaderboardRow } from '../types';
import { StandingsTable } from '../components/StandingsTable';
import { MVPLeaderboard } from '../components/MVPLeaderboard';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Trophy, Award, Filter, ShieldCheck } from 'lucide-react';

export const StandingsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [mvpLeaderboard, setMvpLeaderboard] = useState<MVPLeaderboardRow[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.get('/tournaments');
        const list: Tournament[] = res.data.tournaments;
        setTournaments(list);
        if (list.length > 0) {
          const bmps2026 = list.find((t) => t.slug.includes('bmps-2026'));
          const main = bmps2026 || list.find((t) => t.status === 'ONGOING') || list[0];
          setSelectedTournamentId(main.id);
        }
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      }
    };
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) return;

    const fetchStandingsData = async () => {
      setLoading(true);
      try {
        const [standRes, mvpRes] = await Promise.all([
          api.get(`/tournaments/${selectedTournamentId}/standings`),
          api.get(`/tournaments/${selectedTournamentId}/mvp-leaderboard`)
        ]);

        setStandings(standRes.data.standings);
        setTotalMatches(standRes.data.totalCompletedMatches || 0);
        setMvpLeaderboard(mvpRes.data.leaderboard);
      } catch (err) {
        console.error('Failed to load standings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandingsData();
  }, [selectedTournamentId]);

  const currentTournament = tournaments.find((t) => t.id === selectedTournamentId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Official BGMI Leaderboard & Results</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-wider mt-1">
            Championship Standings
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Live point table calculations powered by the official Battlegrounds Mobile India 10-point WWCD tournament scoring system.
          </p>
        </div>

        {/* Tournament Selector */}
        <div className="flex items-center space-x-2 bg-bgmi-surface border border-bgmi-border p-2.5 rounded-xl">
          <Filter className="w-4 h-4 text-amber-400" />
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer font-display"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id} className="bg-bgmi-card text-white">
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Column */}
        <div className="lg:col-span-2 space-y-6">
          <StandingsTable
            standings={standings}
            tournamentTitle={currentTournament?.title}
            totalMatches={totalMatches}
          />

          {/* Scoring Rules Explanation */}
          <Card className="p-5 space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Official 10-Point Scoring & Tiebreaker Matrix</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                <span className="text-amber-400 font-bold block">1st (WWCD)</span>
                <span>10 Points</span>
              </div>
              <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                <span className="text-slate-300 font-bold block">2nd Place</span>
                <span>6 Points</span>
              </div>
              <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                <span className="text-slate-300 font-bold block">3rd Place</span>
                <span>5 Points</span>
              </div>
              <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                <span className="text-slate-300 font-bold block">4th Place</span>
                <span>4 Points</span>
              </div>
              <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                <span className="text-slate-300 font-bold block">5th Place</span>
                <span>3 Points</span>
              </div>
              <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                <span className="text-slate-300 font-bold block">6th Place</span>
                <span>2 Points</span>
              </div>
              <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                <span className="text-slate-300 font-bold block">7th - 8th</span>
                <span>1 Point</span>
              </div>
              <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                <span className="text-red-400 font-bold block">Each Finish</span>
                <span>1 Point</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              * In case of ties, priority order: 1) Total Points, 2) Total WWCDs, 3) Total Placement Points, 4) Total Finish Points.
            </p>
          </Card>
        </div>

        {/* Sidebar: Top Fraggers / MVPs */}
        <div>
          <MVPLeaderboard leaderboard={mvpLeaderboard} />
        </div>

      </div>

    </div>
  );
};

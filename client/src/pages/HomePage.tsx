import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Tournament, Match, StandingRow, Announcement, Team } from '../types';
import { TournamentCard } from '../components/TournamentCard';
import { MatchRoomCard } from '../components/MatchRoomCard';
import { StandingsTable } from '../components/StandingsTable';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import {
  Trophy,
  Shield,
  Radio,
  Flame,
  ArrowRight,
  Crosshair,
  Award,
  Users,
  CheckCircle,
  Bell,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [featuredTeams, setFeaturedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [tournRes, announceRes, teamsRes] = await Promise.all([
          api.get('/tournaments'),
          api.get('/announcements'),
          api.get('/teams')
        ]);

        const allTournaments: Tournament[] = tournRes.data.tournaments;
        setTournaments(allTournaments);
        setAnnouncements(announceRes.data.announcements.slice(0, 3));
        setFeaturedTeams(teamsRes.data.teams.slice(0, 4));

        // Find primary active tournament or BMPS 2026 for standings and matches
        const main =
          allTournaments.find((t) => t.slug.includes('bmps-2026')) ||
          allTournaments.find((t) => t.status === 'ONGOING') ||
          allTournaments[0];

        if (main) {
          const [matchRes, standRes] = await Promise.all([
            api.get(`/tournaments/${main.id}/matches`),
            api.get(`/tournaments/${main.id}/standings`)
          ]);
          setLiveMatches(
            matchRes.data.matches
              .filter(
                (m: Match) =>
                  m.status === 'ROOM_OPEN' || m.status === 'LIVE' || m.status === 'SCHEDULED'
              )
              .slice(0, 2)
          );
          setStandings(standRes.data.standings.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-12">
      
      {/* Cinematic Hero Section */}
      <section className="relative -mt-6 pt-24 pb-20 overflow-hidden bg-radial-gradient from-amber-500/10 via-bgmi-dark to-bgmi-dark border-b border-bgmi-border">
        {/* Tactical Grid Background Overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Live Competition Tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>BGMI COMPETITIVE CIRCUIT • 2026 EDITION</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-white uppercase leading-none">
              WHERE LEGENDS DROP. <br />
              <span className="text-amber-500 text-glow">CHAMPIONS RISE.</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              India's premier Battlegrounds Mobile India tournament ecosystem. Verified team rosters, anti-leak custom match room distribution, and official 10-point WWCD calculations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <Button
                to="/tournaments"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Enter Tournaments
              </Button>
              <Button
                to="/teams"
                variant="secondary"
                size="lg"
                leftIcon={<Shield className="w-4 h-4 text-amber-400" />}
              >
                Manage Clan Roster
              </Button>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-bgmi-border/60 max-w-3xl mx-auto">
              <div className="p-3 bg-bgmi-surface/60 border border-bgmi-border rounded-xl">
                <p className="text-2xl sm:text-3xl font-black font-display text-amber-400 text-glow">₹8,50,000+</p>
                <p className="text-[11px] text-slate-400 font-mono uppercase mt-0.5">Active Prize Pool</p>
              </div>
              <div className="p-3 bg-bgmi-surface/60 border border-bgmi-border rounded-xl">
                <p className="text-2xl sm:text-3xl font-black font-display text-white">25 SLOTS</p>
                <p className="text-[11px] text-slate-400 font-mono uppercase mt-0.5">Full Lobby System</p>
              </div>
              <div className="p-3 bg-bgmi-surface/60 border border-bgmi-border rounded-xl">
                <p className="text-2xl sm:text-3xl font-black font-display text-amber-400">10-POINT</p>
                <p className="text-[11px] text-slate-400 font-mono uppercase mt-0.5">Official WWCD Matrix</p>
              </div>
              <div className="p-3 bg-bgmi-surface/60 border border-bgmi-border rounded-xl">
                <p className="text-2xl sm:text-3xl font-black font-display text-white">100%</p>
                <p className="text-[11px] text-slate-400 font-mono uppercase mt-0.5">Verified In-Game UIDs</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Live Action Strip */}
      {liveMatches.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-red-950/40 via-bgmi-surface to-bgmi-surface border border-red-500/40 rounded-2xl p-6 shadow-tactical">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-white">
                  Active Match Hub • Live Lobby Tracker
                </h2>
              </div>
              <Link
                to="/tournaments/iconic-bgmi-pro-championship-2026"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-mono uppercase"
              >
                <span>Full Match Schedule & Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map((m) => (
                <MatchRoomCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Major Tournaments Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Championship Arena</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-wider mt-1">
              Active & Upcoming Tournaments
            </h2>
          </div>
          <Link
            to="/tournaments"
            className="text-xs font-bold font-mono text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 uppercase"
          >
            <span>View All Tournaments ({tournaments.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-bgmi-card rounded-xl animate-pulse border border-bgmi-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.slice(0, 3).map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </section>

      {/* Verified Indian Esports Organizations Highlight */}
      {featuredTeams.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>Verified Organizations</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-wider mt-1">
                Elite Squad Roster Spotlight
              </h2>
            </div>
            <Link
              to="/teams"
              className="text-xs font-bold font-mono text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 uppercase"
            >
              <span>Explore All Teams</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredTeams.map((team) => (
              <Card key={team.id} tacticalHover className="p-5 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-bgmi-surface border border-bgmi-border flex items-center justify-center font-display font-black text-amber-400 text-sm overflow-hidden">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      team.tag
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-white text-base truncate">
                      {team.name}
                    </h3>
                    <Badge variant="gold" size="sm">
                      TAG: {team.tag}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t border-bgmi-border/60 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Starters: {team.members?.length || 4}</span>
                  <Link
                    to={`/teams/${team.id}`}
                    className="text-amber-400 hover:text-amber-300 flex items-center font-bold"
                  >
                    <span>Roster</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Two-Column Showcase: Standings & Official Announcements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Tournament Point Table Snapshot */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-xl text-white uppercase tracking-wider">
                  Pro Championship Standings
                </h3>
              </div>
              <Link
                to="/standings"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 uppercase font-mono"
              >
                Full Standings Table
              </Link>
            </div>

            <StandingsTable standings={standings} />
          </div>

          {/* Announcements & Official Bulletins */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wider">
                Official Bulletins
              </h3>
            </div>

            <div className="space-y-3">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-bgmi-card border border-bgmi-border rounded-xl p-4 hover:border-amber-500/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-white line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>

            <Button
              to="/announcements"
              variant="secondary"
              fullWidth
              size="sm"
            >
              Read All Notices & Rulebooks
            </Button>
          </div>

        </div>
      </section>

      {/* Roster Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-600 to-amber-700 p-8 sm:p-12 text-black shadow-gold-lg">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h3 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight leading-none">
              READY TO COMPETE WITH INDIA'S BEST BGMI TEAMS?
            </h3>
            <p className="text-sm font-semibold text-black/85 leading-relaxed">
              Create your squad profile, register your 4 starters and substitutes with verified BGMI Character UIDs, and secure your slot for upcoming tournaments.
            </p>
            <div className="pt-2">
              <Button
                to="/register"
                variant="gold"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-black text-amber-400 hover:bg-slate-900 border-black"
              >
                Register Squad Today
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

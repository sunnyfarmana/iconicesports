import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Tournament, Match, StandingRow, MVPLeaderboardRow, GroupSlot } from '../types';
import { MatchRoomCard } from '../components/MatchRoomCard';
import { StandingsTable } from '../components/StandingsTable';
import { MVPLeaderboard } from '../components/MVPLeaderboard';
import { SlotListModal } from '../components/SlotListModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { socket } from '../socket';
import {
  Trophy,
  Calendar,
  Users,
  Shield,
  FileText,
  Radio,
  CheckCircle,
  AlertCircle,
  Crosshair,
  Award
} from 'lucide-react';

export const TournamentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const toast = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [mvpLeaderboard, setMvpLeaderboard] = useState<MVPLeaderboardRow[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'mvp' | 'teams' | 'rules'>('matches');
  const [loading, setLoading] = useState(true);

  // Slot modal state
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<GroupSlot[]>([]);
  const [claimingSlot, setClaimingSlot] = useState<number | null>(null);

  // Registration modal state
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);
  const [autoAssignSlot, setAutoAssignSlot] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const fetchTournamentData = async () => {
    try {
      const res = await api.get(`/tournaments/${slug}`);
      const t: Tournament = res.data.tournament;
      setTournament(t);

      const [matchRes, standRes, mvpRes] = await Promise.all([
        api.get(`/tournaments/${t.id}/matches`),
        api.get(`/tournaments/${t.id}/standings`),
        api.get(`/tournaments/${t.id}/mvp-leaderboard`)
      ]);

      setMatches(matchRes.data.matches);
      setStandings(standRes.data.standings);
      setMvpLeaderboard(mvpRes.data.leaderboard);

      // Collect slots if available
      if (t.stages?.[0]?.groups?.[0]?.slots) {
        setSelectedSlots(t.stages[0].groups[0].slots);
      }
    } catch (err) {
      console.error('Failed to load tournament detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, [slug]);

  // Realtime WebSocket synchronization with cleanup
  useEffect(() => {
    if (!tournament?.id) return;

    const handleTournamentUpdate = (data: any) => {
      if (!data || data.tournamentId === tournament.id) {
        fetchTournamentData();
      }
    };

    socket.on('tournament_registration_updated', handleTournamentUpdate);
    socket.on('slot_claimed', handleTournamentUpdate);
    socket.on('match_results_submitted', handleTournamentUpdate);
    socket.on('match_status_changed', handleTournamentUpdate);
    socket.on('standings_updated', handleTournamentUpdate);
    socket.on('tournament_updated', handleTournamentUpdate);

    return () => {
      socket.off('tournament_registration_updated', handleTournamentUpdate);
      socket.off('slot_claimed', handleTournamentUpdate);
      socket.off('match_results_submitted', handleTournamentUpdate);
      socket.off('match_status_changed', handleTournamentUpdate);
      socket.off('standings_updated', handleTournamentUpdate);
      socket.off('tournament_updated', handleTournamentUpdate);
    };
  }, [tournament?.id]);

  // Set default captained team if available
  useEffect(() => {
    if (user?.captainedTeams && user.captainedTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(user.captainedTeams[0].id);
    }
  }, [user]);

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !tournament) return;

    setRegLoading(true);
    setRegError(null);

    try {
      const payload: any = { teamId: selectedTeamId };
      if (!autoAssignSlot && selectedSlotNumber) {
        payload.slotNumber = selectedSlotNumber;
      }

      const res = await api.post(`/tournaments/${tournament.id}/register`, payload);
      toast.success(
        res.data.message || 'Squad successfully registered and slot confirmed!',
        'Slot Reserved'
      );
      fetchTournamentData();
      setRegModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed.';
      setRegError(msg);
      toast.error(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleClaimSlot = async (slotNumber: number) => {
    if (!tournament || !user) return;
    const captainTeam = user.captainedTeams?.find((t) =>
      tournament.registrations?.some((r) => r.teamId === t.id)
    );
    if (!captainTeam) {
      toast.warning('Your squad must be registered in this tournament to claim a slot.');
      return;
    }

    setClaimingSlot(slotNumber);
    try {
      await api.post(`/tournaments/${tournament.id}/claim-slot`, {
        teamId: captainTeam.id,
        slotNumber
      });
      toast.success(`Slot #${slotNumber} successfully claimed for ${captainTeam.name}!`);
      fetchTournamentData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to claim slot.');
    } finally {
      setClaimingSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 font-mono animate-pulse">
        Loading tournament arena...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Trophy className="w-12 h-12 mx-auto text-slate-600" />
        <h2 className="text-xl font-bold text-white font-display">Tournament Not Found</h2>
        <Button to="/tournaments" variant="secondary" size="sm">
          Return to Tournaments
        </Button>
      </div>
    );
  }

  const isFull = tournament.registeredSlots >= tournament.maxSlots;
  const userCaptainTeam = user?.captainedTeams?.find((ct) =>
    tournament.registrations?.some((r) => r.teamId === ct.id)
  );
  const isRegistered = !!userCaptainTeam;

  let prizeBreakdownObj: Record<string, string> = {};
  try {
    if (tournament.prizeBreakdown) {
      prizeBreakdownObj = JSON.parse(tournament.prizeBreakdown);
    }
  } catch {
    // Ignored
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner & Tournament Header */}
      <div className="relative rounded-2xl overflow-hidden border border-bgmi-border bg-bgmi-card shadow-tactical">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
          <img
            src={tournament.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bgmi-card via-bgmi-card/60 to-transparent" />
          
          {/* Top Floating Status */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  tournament.status === 'ONGOING'
                    ? 'live'
                    : tournament.status === 'REGISTRATION_OPEN'
                    ? 'emerald'
                    : tournament.status === 'REGISTRATION_CLOSED'
                    ? 'slate'
                    : tournament.status === 'PUBLISHED'
                    ? 'gold'
                    : tournament.status === 'CANCELLED'
                    ? 'red'
                    : 'slate'
                }
                size="sm"
                dot={tournament.status === 'ONGOING' || tournament.status === 'REGISTRATION_OPEN'}
                pulse={tournament.status === 'ONGOING'}
              >
                {tournament.status.replace(/_/g, ' ')}
              </Badge>
              {tournament.season && (
                <Badge variant="gold" size="sm">
                  {tournament.season === 'SEASON_1_2023'
                    ? 'S1 (2023)'
                    : tournament.season === 'SEASON_2_2024'
                    ? 'S2 (2024)'
                    : tournament.season === 'SEASON_3_2025'
                    ? 'S3 (2025)'
                    : tournament.season === 'SEASON_2026'
                    ? 'S4 (2026)'
                    : tournament.season.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
            <Badge variant="slate" size="sm">
              FORMAT: {tournament.format}
            </Badge>
          </div>

          {/* Bottom Title & Action */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-black font-display text-white uppercase tracking-wider text-glow">
                {tournament.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {new Date(tournament.scheduleStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(tournament.scheduleEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Slots: <strong className="text-amber-400">{tournament.registeredSlots}</strong> / {tournament.maxSlots}
                  </span>
                </span>
              </div>
            </div>

            {/* Registration CTA Button */}
            {tournament.status === 'REGISTRATION_OPEN' && (
              <div>
                {isRegistered ? (
                  <Badge variant="emerald" size="lg" dot>
                    Your Squad is Registered
                  </Badge>
                ) : isFull ? (
                  <Badge variant="red" size="lg">
                    Slots Filled (25/25)
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        toast.warning('Please sign in or register to enter your squad into the tournament.');
                        return;
                      }
                      setRegModalOpen(true);
                    }}
                  >
                    Register Squad Slot
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prize Pool Spotlight Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-bgmi-surface to-bgmi-card border-t border-bgmi-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-mono text-slate-400">Total Prize Pool</p>
              <p className="text-2xl sm:text-3xl font-black font-display text-amber-400 text-glow">
                {tournament.prizePool}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Crosshair className="w-4 h-4 text-amber-400" />}
              onClick={() => setSlotModalOpen(true)}
            >
              View Slot Mapping (1-25)
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-bgmi-border gap-2 overflow-x-auto pb-1">
        {[
          { key: 'matches', label: `Matches & Live Rooms (${matches.length})`, icon: Radio },
          { key: 'standings', label: 'Overall Standings', icon: Trophy },
          { key: 'mvp', label: 'Top Fraggers / MVPs', icon: Award },
          { key: 'teams', label: `Registered Teams (${tournament.registeredSlots})`, icon: Users },
          { key: 'rules', label: 'Rules & Prize Pool', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-display whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                active
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Areas */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
              Match Schedule & Custom Rooms
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Credentials release 15 mins prior to drop
            </span>
          </div>

          {matches.length === 0 ? (
            <Card className="p-8 text-center text-slate-400 font-mono text-sm">
              No matches scheduled yet for this tournament.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <MatchRoomCard
                  key={m.id}
                  match={m}
                  onOpenSlots={() => setSlotModalOpen(true)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="space-y-4">
          <StandingsTable
            standings={standings}
            tournamentTitle={tournament.title}
            totalMatches={matches.filter((m) => m.status === 'COMPLETED').length}
          />
        </div>
      )}

      {activeTab === 'mvp' && (
        <div className="space-y-4">
          <MVPLeaderboard leaderboard={mvpLeaderboard} />
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
            Approved Squad Rosters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournament.registrations?.map((reg) => (
              <Card key={reg.id} className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-bgmi-surface border border-bgmi-border flex items-center justify-center text-xs font-bold text-amber-400 overflow-hidden">
                    {reg.team.logo ? (
                      <img src={reg.team.logo} alt={reg.team.name} className="w-full h-full object-cover" />
                    ) : (
                      reg.team.tag
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{reg.team.name}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded">
                      TAG: {reg.team.tag}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-bgmi-border/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Status:</span>
                  <Badge variant="emerald" size="sm">
                    {reg.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rules Section */}
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Official Tournament Rulebook</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {tournament.rules}
            </p>
            <div className="p-3 bg-bgmi-surface rounded border border-bgmi-border text-xs text-slate-400 space-y-1">
              <p className="text-amber-400 font-bold uppercase font-mono">Critical Anti-Cheat Policies:</p>
              <p>• Only mobile/tablet devices are permitted. Emulators are strictly prohibited.</p>
              <p>• Players must use the exact BGMI Character UID registered on their profile.</p>
              <p>• Teams must be present in their allocated slot 5 minutes before scheduled match start.</p>
            </div>
          </Card>

          {/* Prize Pool Breakdown */}
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Prize Pool Distribution</span>
            </h3>
            {Object.keys(prizeBreakdownObj).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(prizeBreakdownObj).map(([position, amount]) => (
                  <div
                    key={position}
                    className="flex items-center justify-between p-3 rounded-lg bg-bgmi-surface border border-bgmi-border text-xs font-mono"
                  >
                    <span className="font-bold text-slate-200">{position}</span>
                    <span className="font-bold text-amber-400">{amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 font-mono">Total Prize Pool: {tournament.prizePool}</p>
            )}

            {/* Official Scoring Matrix & Tiebreakers */}
            <div className="pt-4 border-t border-bgmi-border/60 space-y-3">
              <h4 className="text-xs font-bold uppercase font-mono text-amber-400">
                Official Scoring Matrix & Tiebreaker Regulations
              </h4>
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono text-center">
                <div className="p-1.5 bg-slate-900 rounded border border-bgmi-border">#1: 10 pts</div>
                <div className="p-1.5 bg-slate-900 rounded border border-bgmi-border">#2: 6 pts</div>
                <div className="p-1.5 bg-slate-900 rounded border border-bgmi-border">#3: 5 pts</div>
                <div className="p-1.5 bg-slate-900 rounded border border-bgmi-border">#4: 4 pts</div>
                <div className="p-1.5 bg-slate-900 rounded border border-bgmi-border">#5: 3 pts</div>
                <div className="p-1.5 bg-slate-900 rounded border border-bgmi-border">#6: 2 pts</div>
                <div className="p-1.5 bg-slate-900 rounded border border-bgmi-border">#7: 1 pt</div>
                <div className="p-1.5 bg-slate-900 rounded border border-bgmi-border">#8: 1 pt</div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                • <strong>Finishes:</strong> 1 Point per confirmed finish.
              </p>
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <p className="text-slate-300 font-bold font-mono">Tiebreaker Hierarchy:</p>
                <p>1. Total Overall Points</p>
                <p>2. Total Chicken Dinners (WWCDs)</p>
                <p>3. Total Placement Points</p>
                <p>4. Total Kill Points</p>
                <p>5. Best Single Match Finish</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Slot Mapping Modal */}
      <SlotListModal
        isOpen={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        slots={selectedSlots}
        userTeamId={userCaptainTeam?.id}
        onClaimSlot={handleClaimSlot}
        claimingSlot={claimingSlot}
      />

      {/* Team Registration Modal with Interactive Slot Selector */}
      {regModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg bg-bgmi-surface border border-bgmi-border rounded-xl p-6 shadow-tactical space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bgmi-border pb-3">
              <div>
                <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
                  Register Squad & Reserve Slot
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Official BGMI 25-Slot Custom Lobby
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded"
              >
                ✕
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-xs text-red-400 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase font-bold mb-2">
                  Select Your Squad (You Must Be Captain)
                </label>
                {user?.captainedTeams && user.captainedTeams.length > 0 ? (
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-bgmi-card border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {user.captainedTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} [{t.tag}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-bgmi-dark rounded border border-bgmi-border text-xs text-slate-400 space-y-2">
                    <p>You haven't created a squad yet or are not assigned as captain.</p>
                    <Link
                      to="/teams"
                      onClick={() => setRegModalOpen(false)}
                      className="text-amber-400 font-bold underline block"
                    >
                      + Create Squad Profile Now
                    </Link>
                  </div>
                )}
              </div>

              {/* Interactive Slot Selector */}
              <div className="space-y-2 pt-1 border-t border-bgmi-border/60">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-slate-300 uppercase font-bold">
                    Choose Custom Room Slot (Slots 2–25)
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-amber-400 font-mono cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAssignSlot}
                      onChange={(e) => {
                        setAutoAssignSlot(e.target.checked);
                        if (e.target.checked) setSelectedSlotNumber(null);
                      }}
                      className="rounded text-amber-500"
                    />
                    <span>Auto-Assign Slot</span>
                  </label>
                </div>

                {!autoAssignSlot && (
                  <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-bgmi-dark/60 rounded-lg border border-bgmi-border">
                    {Array.from({ length: 25 }, (_, i) => {
                      const slotNum = i + 1;
                      const isHost = slotNum === 1;
                      const assignedSlot = selectedSlots.find((s) => s.slotNumber === slotNum);
                      const isOccupied = !isHost && assignedSlot && assignedSlot.teamId;
                      const isSelected = selectedSlotNumber === slotNum;

                      return (
                        <button
                          key={slotNum}
                          type="button"
                          disabled={isHost || !!isOccupied}
                          onClick={() => setSelectedSlotNumber(slotNum)}
                          className={`p-2 rounded text-center font-mono text-xs transition-all ${
                            isHost
                              ? 'bg-red-950/20 border border-red-500/20 text-red-500 cursor-not-allowed opacity-50'
                              : isOccupied
                              ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                              : isSelected
                              ? 'bg-amber-500 text-black font-black border border-amber-400 shadow-gold-sm scale-105'
                              : 'bg-bgmi-surface border border-bgmi-border text-slate-300 hover:border-amber-500/60 hover:text-white'
                          }`}
                        >
                          <div className="text-[10px] font-bold">#{slotNum}</div>
                          <div className="text-[9px] truncate">
                            {isHost ? 'HOST' : isOccupied ? 'TAKEN' : isSelected ? 'PICK' : 'OPEN'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedSlotNumber && !autoAssignSlot && (
                  <p className="text-xs text-amber-400 font-mono">
                    Selected: <strong>Slot #{selectedSlotNumber}</strong>
                  </p>
                )}
              </div>

              <div className="p-3 bg-bgmi-dark rounded border border-bgmi-border text-xs text-slate-400 space-y-1">
                <p className="font-bold text-white">Roster Requirement:</p>
                <p>• Your squad must have minimum 4 active starters registered.</p>
                <p>• Official Character UIDs are locked upon registration approval.</p>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                loading={regLoading}
                disabled={!selectedTeamId || (!autoAssignSlot && !selectedSlotNumber)}
              >
                Confirm & Reserve Slot
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

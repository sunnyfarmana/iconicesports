import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Tournament, Match, Team, TournamentRegistration } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import {
  Trophy,
  Users,
  Shield,
  Radio,
  FileText,
  Plus,
  Lock,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  ExternalLink
} from 'lucide-react';

export const OrganizerDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'tournaments' | 'registrations' | 'matches' | 'scores' | 'analytics'>('tournaments');
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [selectedTournId, setSelectedTournId] = useState<string>('');
  const [tournMatches, setTournMatches] = useState<Match[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Application form state (if not approved)
  const [appExperience, setAppExperience] = useState('');
  const [appBio, setAppBio] = useState('');
  const [appSubmitting, setAppSubmitting] = useState(false);

  // Create Tournament state
  const [newTitle, setNewTitle] = useState('');
  const [newPrize, setNewPrize] = useState('₹50,000');
  const [newSlots, setNewSlots] = useState(25);
  const [newFormat, setNewFormat] = useState('SQUAD');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newRules, setNewRules] = useState('Official BGMI 10-point scoring matrix. Emulators banned.');
  const [newStatus, setNewStatus] = useState('REGISTRATION_OPEN');
  const [tournSubmitting, setTournSubmitting] = useState(false);

  // Match room state
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [credentialsReleased, setCredentialsReleased] = useState(true);
  const [matchStatus, setMatchStatus] = useState('ROOM_OPEN');
  const [roomSubmitting, setRoomSubmitting] = useState(false);

  // New Match Schedule state
  const [newMatchNum, setNewMatchNum] = useState(1);
  const [newMatchName, setNewMatchName] = useState('');
  const [newMatchMap, setNewMatchMap] = useState('ERANGEL');
  const [newMatchTime, setNewMatchTime] = useState('');
  const [matchScheduling, setMatchScheduling] = useState(false);

  // Score Entry state
  const [scoreTeamResults, setScoreTeamResults] = useState<Array<{ teamId: string; placement: number; killPoints: number }>>([]);
  const [scoreEvidenceUrl, setScoreEvidenceUrl] = useState('');
  const [scoreReviewNotes, setScoreReviewNotes] = useState('');
  const [scoreSubmitting, setScoreSubmitting] = useState(false);

  const fetchOrganizerData = async () => {
    try {
      if (!user) return;

      // Query only tournaments owned by this organizer (or all if ADMIN)
      const params: any = {};
      if (user.role !== 'ADMIN') {
        params.organizerId = user.id;
      }

      const [tournRes, teamsRes] = await Promise.all([
        api.get('/tournaments', { params }),
        api.get('/teams')
      ]);

      const tList: Tournament[] = tournRes.data.tournaments;
      setMyTournaments(tList);
      setTeams(teamsRes.data.teams);

      if (tList.length > 0 && !selectedTournId) {
        setSelectedTournId(tList[0].id);
      }
    } catch (err) {
      console.error('Failed to load organizer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerData();
  }, [user]);

  // When selected tournament changes, load its matches & registrations
  useEffect(() => {
    if (!selectedTournId) return;

    const fetchMatchesAndRegs = async () => {
      try {
        const [matchRes, regRes] = await Promise.all([
          api.get(`/tournaments/${selectedTournId}/matches`),
          api.get(`/tournaments/${selectedTournId}/registrations`)
        ]);

        const mList: Match[] = matchRes.data.matches;
        setTournMatches(mList);
        setRegistrations(regRes.data.registrations);

        if (mList.length > 0) {
          setSelectedMatchId(mList[0].id);
        }
      } catch (err) {
        console.error('Failed to load tournament subdata:', err);
      }
    };

    fetchMatchesAndRegs();
  }, [selectedTournId]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Trophy className="w-12 h-12 mx-auto text-slate-600" />
        <h2 className="text-xl font-bold text-white font-display uppercase tracking-wider">Authentication Required</h2>
        <p className="text-xs text-slate-400 font-mono">Please sign in with your organizer account.</p>
        <Button to="/login" variant="primary" size="sm">
          Sign In
        </Button>
      </div>
    );
  }

  const isApproved = user.role === 'ADMIN' || (user.role === 'ORGANIZER' && user.organizerStatus === 'APPROVED');
  const isPending = user.organizerStatus === 'PENDING';
  const isRejected = user.organizerStatus === 'REJECTED';

  const handleApplyOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppSubmitting(true);
    try {
      const res = await api.post('/player/apply-organizer', {
        bio: appBio,
        experience: appExperience
      });
      toast.success(res.data.message || 'Application submitted successfully!');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setAppSubmitting(false);
    }
  };

  // Unapproved State
  if (!isApproved) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <Card className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black font-display text-white uppercase tracking-wider">
              Tournament Organizer Portal
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Battlegrounds Mobile India Official Event Host Verification
            </p>
          </div>

          {isPending ? (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-2 text-left">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase font-display">
                <Clock className="w-4 h-4" />
                <span>Application Under Administrative Review</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your application to become a verified Tournament Organizer has been received. Platform administrators verify organizer credentials, anti-cheat policy compliance, and previous hosting experience. You will gain access once approved.
              </p>
            </div>
          ) : isRejected ? (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2 text-left">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase font-display">
                <AlertCircle className="w-4 h-4" />
                <span>Application Not Approved</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your previous application was not approved. You can submit an updated proposal detailing your hosting background and community standing below.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-bgmi-surface border border-bgmi-border rounded-xl space-y-2 text-left">
              <div className="flex items-center space-x-2 text-white font-bold text-xs uppercase font-display">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Verified Organizer Privileges</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Create and host custom BGMI tournaments with up to 25 slots</li>
                <li>Control anti-leak custom match room credentials (ID & Password)</li>
                <li>Submit official match results and point tables</li>
                <li>Inspect player Character UIDs and manage registrations</li>
              </ul>
            </div>
          )}

          {!isPending && (
            <form onSubmit={handleApplyOrganizer} className="space-y-4 text-left pt-2 border-t border-bgmi-border">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Hosting & Competitive Experience *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organized 10+ Tier-2 BGMI scrims / Clan Leader"
                  value={appExperience}
                  onChange={(e) => setAppExperience(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Tournament Proposal & Anti-Cheat Plan
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your planned tournaments, prize structure, and refereeing methods..."
                  value={appBio}
                  onChange={(e) => setAppBio(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={appSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit Organizer Application
              </Button>
            </form>
          )}
        </Card>
      </div>
    );
  }

  // Handle Create Tournament
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setTournSubmitting(true);
    try {
      await api.post('/tournaments', {
        title: newTitle,
        prizePool: newPrize,
        maxSlots: newSlots,
        format: newFormat,
        scheduleStart: newStart || new Date().toISOString(),
        scheduleEnd: newEnd || new Date(Date.now() + 7 * 86400000).toISOString(),
        status: newStatus,
        rules: newRules
      });
      toast.success('Tournament created successfully under your organizer account!');
      fetchOrganizerData();
      setNewTitle('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create tournament.');
    } finally {
      setTournSubmitting(false);
    }
  };

  // Handle Schedule Match
  const handleScheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournId) return;
    setMatchScheduling(true);
    try {
      await api.post(`/tournaments/${selectedTournId}/matches`, {
        tournamentId: selectedTournId,
        matchNumber: newMatchNum,
        matchName: newMatchName || `Match ${newMatchNum} - ${newMatchMap}`,
        map: newMatchMap,
        scheduledAt: newMatchTime || new Date().toISOString()
      });
      toast.success('Match scheduled successfully for your tournament!');
      const matchRes = await api.get(`/tournaments/${selectedTournId}/matches`);
      setTournMatches(matchRes.data.matches);
      setNewMatchName('');
      setNewMatchNum((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to schedule match.');
    } finally {
      setMatchScheduling(false);
    }
  };

  // Handle Update Room Credentials
  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;
    setRoomSubmitting(true);
    try {
      await api.put(`/matches/${selectedMatchId}/credentials`, {
        roomId,
        roomPassword,
        status: matchStatus,
        credentialsReleased
      });
      toast.success('Room credentials updated & released to assigned squads!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update credentials.');
    } finally {
      setRoomSubmitting(false);
    }
  };

  // Handle Registration Status Update
  const handleUpdateRegStatus = async (regId: string, status: 'APPROVED' | 'REJECTED' | 'DISQUALIFIED') => {
    try {
      await api.put(`/tournaments/registrations/${regId}`, { status });
      toast.success(`Registration updated to ${status}.`);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status } : r))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update registration status.');
    }
  };

  // Pre-fill score table with registered teams
  const initScoreTable = () => {
    if (!teams || teams.length === 0) return;
    const initial = teams.slice(0, 8).map((t, i) => ({
      teamId: t.id,
      placement: i + 1,
      killPoints: Math.floor(Math.random() * 8) + 2
    }));
    setScoreTeamResults(initial);
    toast.info('Loaded squads into scoring table.');
  };

  // Submit Match Scores
  const handleSubmitScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;
    setScoreSubmitting(true);
    try {
      await api.post(`/matches/${selectedMatchId}/results`, {
        teamResults: scoreTeamResults,
        evidenceUrl: scoreEvidenceUrl || null,
        notes: scoreReviewNotes || null
      });
      toast.success('Match results submitted and point table updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit match scores.');
    } finally {
      setScoreSubmitting(false);
    }
  };

  const selectedTourn = myTournaments.find((t) => t.id === selectedTournId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Tournament Organizer Control Panel</span>
          </div>
          <h1 className="text-3xl font-black font-display text-white uppercase tracking-wider mt-1">
            Organizer Operations
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            HOST: <span className="text-amber-400">{user.username}</span> • PERMITTED EVENTS: {myTournaments.length}
          </p>
        </div>

        {myTournaments.length > 0 && (
          <div className="flex items-center space-x-2 bg-bgmi-surface p-1.5 rounded-lg border border-bgmi-border">
            <span className="text-xs font-mono text-slate-400 font-bold ml-1.5 uppercase">Managing:</span>
            <select
              value={selectedTournId}
              onChange={(e) => setSelectedTournId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2 max-w-xs truncate"
            >
              {myTournaments.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Organizer Navigation Tabs */}
      <div className="flex border-b border-bgmi-border gap-2 overflow-x-auto pb-1">
        {[
          { key: 'tournaments', label: `My Tournaments (${myTournaments.length})`, icon: Trophy },
          { key: 'registrations', label: `Rosters & Slots (${registrations.length})`, icon: Shield },
          { key: 'matches', label: 'Match Scheduling & Rooms', icon: Lock },
          { key: 'scores', label: 'Score Entry & Evidence', icon: Award },
          { key: 'analytics', label: 'Tournament Overview', icon: FileText }
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

      {/* Tab 1: My Tournaments */}
      {activeTab === 'tournaments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Tournament Form */}
          <Card className="p-6 lg:col-span-1 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create New BGMI Tournament</span>
            </h3>

            <form onSubmit={handleCreateTournament} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICONIC WINTER CLAN WARS"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Prize Pool *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPrize}
                    onChange={(e) => setNewPrize(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Max Slots *
                  </label>
                  <input
                    type="number"
                    required
                    value={newSlots}
                    onChange={(e) => setNewSlots(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Format
                  </label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="SQUAD">SQUAD (4v4)</option>
                    <option value="DUO">DUO</option>
                    <option value="SOLO">SOLO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                  Start Schedule
                </label>
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                fullWidth
                loading={tournSubmitting}
              >
                Create Tournament
              </Button>
            </form>
          </Card>

          {/* List of Owned Tournaments */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
              Your Managed Championships
            </h3>

            {myTournaments.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 font-mono text-xs">
                You have not created any tournaments yet. Launch your first tournament above.
              </Card>
            ) : (
              <div className="space-y-3">
                {myTournaments.map((t) => (
                  <Card key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            t.status === 'ONGOING'
                              ? 'live'
                              : t.status === 'REGISTRATION_OPEN'
                              ? 'emerald'
                              : 'slate'
                          }
                          size="xs"
                        >
                          {t.status}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">Slots: {t.registeredSlots}/{t.maxSlots}</span>
                      </div>
                      <h4 className="font-bold text-white text-base font-display mt-1">{t.title}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Prize: {t.prizePool} • Format: {t.format}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        to={`/tournaments/${t.slug || t.id}`}
                        variant="secondary"
                        size="xs"
                        rightIcon={<ExternalLink className="w-3 h-3" />}
                      >
                        Public Page
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Registrations & Rosters */}
      {activeTab === 'registrations' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
              Squad Registrations for {selectedTourn?.title || 'Selected Tournament'}
            </h3>
            <span className="text-xs font-mono text-amber-400">
              Total: {registrations.length} Squads
            </span>
          </div>

          {registrations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No squads registered for this tournament yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-bgmi-border rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bgmi-dark text-slate-400 border-b border-bgmi-border">
                  <tr>
                    <th className="p-3.5">Squad</th>
                    <th className="p-3.5">Captain</th>
                    <th className="p-3.5">Roster Character IDs</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bgmi-border/40">
                  {registrations.map((reg) => {
                    let roster: Array<{ ign: string; bgmiUid: string }> = [];
                    try {
                      if (reg.rosterSnapshot) roster = JSON.parse(reg.rosterSnapshot);
                    } catch {}

                    return (
                      <tr key={reg.id} className="hover:bg-slate-800/30">
                        <td className="p-3.5">
                          <div className="font-bold text-white font-sans">{reg.team.name}</div>
                          <span className="text-[10px] text-amber-400 font-mono">[{reg.team.tag}]</span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {reg.team.captain?.username}
                        </td>
                        <td className="p-3.5">
                          {roster.length > 0 ? (
                            <div className="space-y-0.5 text-[11px] text-slate-300 font-mono">
                              {roster.map((p, idx) => (
                                <div key={idx}>
                                  • {p.ign} <span className="text-slate-500">({p.bgmiUid})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500">4 Verified Athletes</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={reg.status === 'APPROVED' ? 'emerald' : reg.status === 'REJECTED' ? 'red' : 'gold'}
                            size="sm"
                          >
                            {reg.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex space-x-1.5">
                            {reg.status !== 'APPROVED' && (
                              <Button
                                variant="success"
                                size="xs"
                                onClick={() => handleUpdateRegStatus(reg.id, 'APPROVED')}
                              >
                                Approve
                              </Button>
                            )}
                            {reg.status !== 'REJECTED' && (
                              <Button
                                variant="danger"
                                size="xs"
                                onClick={() => handleUpdateRegStatus(reg.id, 'REJECTED')}
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Match Scheduling & Room Credentials */}
      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedule Match Form */}
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Schedule New Official Match</span>
            </h3>

            <form onSubmit={handleScheduleMatch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Match Number *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newMatchNum}
                    onChange={(e) => setNewMatchNum(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Map *
                  </label>
                  <select
                    value={newMatchMap}
                    onChange={(e) => setNewMatchMap(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ERANGEL">ERANGEL</option>
                    <option value="MIRAMAR">MIRAMAR</option>
                    <option value="SANHOK">SANHOK</option>
                    <option value="VIKENDI">VIKENDI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                  Match Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Finals Match 1 - Erangel"
                  value={newMatchName}
                  onChange={(e) => setNewMatchName(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                  Drop Schedule *
                </label>
                <input
                  type="datetime-local"
                  value={newMatchTime}
                  onChange={(e) => setNewMatchTime(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="sm"
                fullWidth
                loading={matchScheduling}
              >
                Schedule Match
              </Button>
            </form>
          </Card>

          {/* Update Room Credentials Form */}
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Match Room Credentials (Anti-Leak)</span>
            </h3>

            <form onSubmit={handleUpdateRoom} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                  Select Match to Update
                </label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {tournMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      #{m.matchNumber} - {m.matchName} [{m.map}] ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Custom Room ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="8910243"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Room Password
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DROP2026"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Match Status
                  </label>
                  <select
                    value={matchStatus}
                    onChange={(e) => setMatchStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ROOM_OPEN">ROOM_OPEN (Lobby Live)</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="releaseCheck"
                    checked={credentialsReleased}
                    onChange={(e) => setCredentialsReleased(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                  />
                  <label htmlFor="releaseCheck" className="text-xs text-slate-300 font-bold cursor-pointer">
                    Release to Players
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                fullWidth
                loading={roomSubmitting}
              >
                Release Room Credentials
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 4: Scores & Evidence */}
      {activeTab === 'scores' && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
                Official Match Results & Point Verification
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Points are calculated automatically according to the tournament's point matrix.
              </p>
            </div>

            <Button variant="secondary" size="xs" onClick={initScoreTable}>
              Load Registered Squads
            </Button>
          </div>

          <form onSubmit={handleSubmitScores} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Select Match to Submit Results
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {tournMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.matchNumber} - {m.matchName} [{m.map}]
                  </option>
                ))}
              </select>
            </div>

            {scoreTeamResults.length > 0 && (
              <div className="overflow-x-auto border border-bgmi-border rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-bgmi-dark text-slate-400">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Squad Name</th>
                      <th className="p-3">Finishes (Kills)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bgmi-border/40">
                    {scoreTeamResults.map((item, idx) => {
                      const t = teams.find((tm) => tm.id === item.teamId);
                      return (
                        <tr key={item.teamId}>
                          <td className="p-3 font-bold text-amber-400">
                            #{item.placement} {item.placement === 1 && '🍗 WWCD'}
                          </td>
                          <td className="p-3 font-sans font-bold text-white">
                            {t?.name} [{t?.tag}]
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              value={item.killPoints}
                              onChange={(e) => {
                                const newScores = [...scoreTeamResults];
                                newScores[idx].killPoints = parseInt(e.target.value) || 0;
                                setScoreTeamResults(newScores);
                              }}
                              className="w-20 px-2 py-1 bg-bgmi-surface border border-bgmi-border rounded text-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Match Result Evidence URL (Screenshot / VOD)
                </label>
                <input
                  type="url"
                  placeholder="https://... (screenshot / VOD link)"
                  value={scoreEvidenceUrl}
                  onChange={(e) => setScoreEvidenceUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Referee / Scorer Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official result verification completed."
                  value={scoreReviewNotes}
                  onChange={(e) => setScoreReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={scoreSubmitting}
              disabled={scoreTeamResults.length === 0}
            >
              Submit Results & Update Points Table
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 5: Analytics */}
      {activeTab === 'analytics' && selectedTourn && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Registered Slots</p>
              <p className="text-2xl font-black font-display text-amber-400 mt-1">
                {selectedTourn.registeredSlots} / {selectedTourn.maxSlots}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Completed Matches</p>
              <p className="text-2xl font-black font-display text-white mt-1">
                {tournMatches.filter((m) => m.status === 'COMPLETED').length} / {tournMatches.length}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Prize Pool</p>
              <p className="text-2xl font-black font-display text-amber-400 mt-1">
                {selectedTourn.prizePool}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Format</p>
              <p className="text-2xl font-black font-display text-white mt-1">
                {selectedTourn.format}
              </p>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
};

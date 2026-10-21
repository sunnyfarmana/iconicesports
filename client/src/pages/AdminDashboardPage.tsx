import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Tournament, Match, Team, User, TournamentRegistration, AuditLog } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import {
  Settings,
  Trophy,
  Users,
  Shield,
  FileText,
  Plus,
  AlertCircle,
  Lock,
  Award,
  History,
  Check,
  X,
  ExternalLink,
  Ban,
  CheckCircle2
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'tournaments' | 'organizers' | 'users' | 'registrations' | 'matches' | 'scores' | 'audits' | 'notices'
  >('overview');

  const [stats, setStats] = useState<any>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New Tournament Form state
  const [newTournTitle, setNewTournTitle] = useState('');
  const [newTournPrize, setNewTournPrize] = useState('₹1,00,000');
  const [newTournSlots, setNewTournSlots] = useState(25);
  const [newTournFormat, setNewTournFormat] = useState('SQUAD');
  const [newTournSeason, setNewTournSeason] = useState('SEASON_2026');
  const [newTournStatus, setNewTournStatus] = useState('REGISTRATION_OPEN');
  const [newTournStart, setNewTournStart] = useState('');
  const [newTournEnd, setNewTournEnd] = useState('');
  const [newTournRegOpen, setNewTournRegOpen] = useState('');
  const [newTournRegClose, setNewTournRegClose] = useState('');
  const [newTournRules, setNewTournRules] = useState('Official BGMI 10-point scoring matrix. Emulator strictly prohibited.');
  const [tournSubmitting, setTournSubmitting] = useState(false);

  // Registrations state
  const [selectedTournId, setSelectedTournId] = useState('');
  const [tournMatches, setTournMatches] = useState<Match[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [updatingRegId, setUpdatingRegId] = useState<string | null>(null);

  // Match Room Form state
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [matchStatus, setMatchStatus] = useState('ROOM_OPEN');
  const [credentialsReleased, setCredentialsReleased] = useState(true);
  const [roomSubmitting, setRoomSubmitting] = useState(false);

  // Match Creation state
  const [newMatchNum, setNewMatchNum] = useState(1);
  const [newMatchName, setNewMatchName] = useState('');
  const [newMatchMap, setNewMatchMap] = useState('ERANGEL');
  const [newMatchTime, setNewMatchTime] = useState('');
  const [matchSubmitting, setMatchSubmitting] = useState(false);

  // Score Entry state
  const [scoreTeamResults, setScoreTeamResults] = useState<Array<{ teamId: string; placement: number; killPoints: number }>>([]);
  const [scoreEvidenceUrl, setScoreEvidenceUrl] = useState('');
  const [scoreReviewNotes, setScoreReviewNotes] = useState('');
  const [scoreSubmitting, setScoreSubmitting] = useState(false);

  // New Notice state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('NOTICE');
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [statsRes, tournRes, teamRes, userRes, orgRes, logRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/tournaments'),
        api.get('/teams'),
        api.get('/admin/users'),
        api.get('/admin/organizers'),
        api.get('/admin/audit-logs')
      ]);

      setStats(statsRes.data.stats);
      const tList: Tournament[] = tournRes.data.tournaments;
      setTournaments(tList);
      setTeams(teamRes.data.teams);
      setUsersList(userRes.data.users);
      setOrganizers(orgRes.data.organizers || []);
      setAuditLogs(logRes.data.logs || []);

      if (tList.length > 0 && !selectedTournId) {
        setSelectedTournId(tList[0].id);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // When selected tournament changes, fetch its matches and registrations
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
        if (mList.length > 0) {
          setSelectedMatchId(mList[0].id);
        }
        setRegistrations(regRes.data.registrations || []);
      } catch (err) {
        console.error('Error fetching matches/registrations:', err);
      }
    };

    fetchMatchesAndRegs();
  }, [selectedTournId]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
        <h2 className="text-xl font-bold text-white font-display uppercase tracking-wider">Access Denied</h2>
        <p className="text-xs text-slate-400">
          This portal strictly requires Administrator credentials.
        </p>
        <Button to="/" variant="secondary" size="sm">
          Return to Arena
        </Button>
      </div>
    );
  }

  // Handle Create Tournament
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setTournSubmitting(true);
    try {
      await api.post('/tournaments', {
        title: newTournTitle,
        prizePool: newTournPrize,
        maxSlots: newTournSlots,
        format: newTournFormat,
        season: newTournSeason,
        status: newTournStatus,
        scheduleStart: newTournStart || new Date().toISOString(),
        scheduleEnd: newTournEnd || new Date(Date.now() + 7 * 86400000).toISOString(),
        regOpenAt: newTournRegOpen || null,
        regCloseAt: newTournRegClose || null,
        rules: newTournRules
      });
      toast.success('Tournament launched successfully with full 25-slot lobby grid!');
      fetchAdminData();
      setNewTournTitle('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create tournament.');
    } finally {
      setTournSubmitting(false);
    }
  };

  // Handle Quick Tournament Status Update
  const handleUpdateTournamentStatus = async (tournamentId: string, status: string) => {
    try {
      await api.put(`/tournaments/${tournamentId}`, { status });
      toast.success(`Tournament status changed to ${status}.`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update tournament status.');
    }
  };

  // Handle Schedule New Match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournId) return;
    setMatchSubmitting(true);
    try {
      await api.post(`/tournaments/${selectedTournId}/matches`, {
        tournamentId: selectedTournId,
        matchNumber: newMatchNum,
        matchName: newMatchName || `Match ${newMatchNum} - ${newMatchMap}`,
        map: newMatchMap,
        scheduledAt: newMatchTime || new Date().toISOString()
      });
      toast.success('New official match scheduled successfully!');
      const matchRes = await api.get(`/tournaments/${selectedTournId}/matches`);
      setTournMatches(matchRes.data.matches);
      setNewMatchName('');
      setNewMatchNum((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to schedule match.');
    } finally {
      setMatchSubmitting(false);
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
      toast.success('Match room credentials updated & released to verified players!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update credentials.');
    } finally {
      setRoomSubmitting(false);
    }
  };

  // Handle Update Registration Status
  const handleUpdateRegStatus = async (regId: string, status: 'APPROVED' | 'REJECTED' | 'DISQUALIFIED') => {
    setUpdatingRegId(regId);
    try {
      await api.put(`/tournaments/registrations/${regId}`, { status });
      toast.success(`Registration status updated to ${status}.`);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status } : r))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update registration status.');
    } finally {
      setUpdatingRegId(null);
    }
  };

  // Handle Submit Scores with Evidence
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
      toast.success('Match results recorded! Point table updated according to tournament scoring rules.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit match scores.');
    } finally {
      setScoreSubmitting(false);
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
    toast.info('Loaded squads for 10-point scoring table.');
  };

  // Handle Update User Role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role successfully updated.');
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role.');
    }
  };

  // Handle Toggle User Suspension
  const handleToggleUserSuspension = async (userId: string, currentActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !currentActive });
      toast.success(`User account ${!currentActive ? 'reinstated' : 'suspended'}.`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to toggle account status.');
    }
  };

  // Handle Verify Organizer Application
  const handleVerifyOrganizer = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/admin/organizers/${userId}`, { status });
      toast.success(`Organizer application ${status}.`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to verify organizer.');
    }
  };

  // Handle Create Notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeSubmitting(true);
    try {
      await api.post('/announcements', {
        title: noticeTitle,
        content: noticeContent,
        category: noticeCategory,
        isPinned: noticePinned
      });
      toast.success('Official bulletin published successfully!');
      setNoticeTitle('');
      setNoticeContent('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to post bulletin.');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Administrative Command Center</span>
          </div>
          <h1 className="text-3xl font-black font-display text-white uppercase tracking-wider mt-1">
            Platform Administration
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            LOGGED IN AS: <span className="text-amber-400">{user.username}</span> [{user.role}]
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-bgmi-border gap-2 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Dashboard Overview', icon: Trophy },
          { key: 'tournaments', label: `Tournaments & Lifecycle (${tournaments.length})`, icon: Plus },
          { key: 'organizers', label: `Organizer Approvals (${organizers.filter((o) => o.organizerStatus === 'PENDING').length})`, icon: Shield },
          { key: 'users', label: `User Management (${usersList.length})`, icon: Users },
          { key: 'registrations', label: `Registrations (${registrations.length})`, icon: Shield },
          { key: 'matches', label: 'Match Rooms', icon: Lock },
          { key: 'scores', label: 'Scoring & Disputes', icon: Award },
          { key: 'audits', label: `Audit Log (${auditLogs.length})`, icon: History },
          { key: 'notices', label: 'Bulletins', icon: FileText }
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

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Total Users</p>
              <p className="text-2xl font-black font-display text-white mt-1">{stats.userCount}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Athletes</p>
              <p className="text-2xl font-black font-display text-amber-400 mt-1">{stats.playerCount}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Registered Squads</p>
              <p className="text-2xl font-black font-display text-white mt-1">{stats.teamCount}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Tournaments</p>
              <p className="text-2xl font-black font-display text-amber-400 mt-1">{stats.tournamentCount}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Pending Organizers</p>
              <p className="text-2xl font-black font-display text-amber-400 mt-1">{stats.pendingOrganizers || 0}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Total Matches</p>
              <p className="text-2xl font-black font-display text-white mt-1">{stats.matchCount}</p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Tournaments & Lifecycle */}
      {activeTab === 'tournaments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-1 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
              Launch Tournament
            </h3>
            <form onSubmit={handleCreateTournament} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTournTitle}
                  onChange={(e) => setNewTournTitle(e.target.value)}
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
                    value={newTournPrize}
                    onChange={(e) => setNewTournPrize(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Slots *
                  </label>
                  <input
                    type="number"
                    required
                    value={newTournSlots}
                    onChange={(e) => setNewTournSlots(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Season
                  </label>
                  <select
                    value={newTournSeason}
                    onChange={(e) => setNewTournSeason(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="SEASON_2026">Season 4 (2026)</option>
                    <option value="SEASON_3_2025">Season 3 (2025)</option>
                    <option value="SEASON_2_2024">Season 2 (2024)</option>
                    <option value="SEASON_1_2023">Season 1 (2023)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Status
                  </label>
                  <select
                    value={newTournStatus}
                    onChange={(e) => setNewTournStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                fullWidth
                loading={tournSubmitting}
              >
                Launch Tournament
              </Button>
            </form>
          </Card>

          <Card className="p-6 lg:col-span-2 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
              Global Tournament Lifecycle Oversight
            </h3>
            <div className="space-y-3">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-bgmi-surface border border-bgmi-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-white text-sm font-display">{t.title}</h5>
                    <div className="flex items-center space-x-2 text-slate-400 mt-0.5 font-mono text-[11px]">
                      <span>Slots: {t.registeredSlots}/{t.maxSlots}</span>
                      <span>•</span>
                      <span>{t.format}</span>
                      {t.season && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400">{t.season}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">Status:</span>
                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateTournamentStatus(t.id, e.target.value)}
                      className="px-2 py-1.5 bg-slate-900 border border-bgmi-border rounded text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
                      <option value="REGISTRATION_CLOSED">REGISTRATION_CLOSED</option>
                      <option value="ONGOING">ONGOING (Live)</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Organizer Approvals */}
      {activeTab === 'organizers' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
            Organizer Verification & Administrative Approvals
          </h3>

          {organizers.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono text-center py-8">
              No organizer applications currently pending.
            </p>
          ) : (
            <div className="overflow-x-auto border border-bgmi-border rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bgmi-dark text-slate-400 border-b border-bgmi-border">
                  <tr>
                    <th className="p-3.5">Organizer</th>
                    <th className="p-3.5">Experience & Proposal</th>
                    <th className="p-3.5">Events Hosted</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bgmi-border/40">
                  {organizers.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <div className="font-bold text-white font-sans">{org.username}</div>
                        <div className="text-[10px] text-slate-400">{org.email}</div>
                      </td>
                      <td className="p-3.5 max-w-sm text-slate-300">
                        {org.organizerBio || 'Standard verification requested.'}
                      </td>
                      <td className="p-3.5">{org._count?.organizedTournaments || 0}</td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            org.organizerStatus === 'APPROVED'
                              ? 'emerald'
                              : org.organizerStatus === 'REJECTED'
                              ? 'red'
                              : 'gold'
                          }
                          size="sm"
                        >
                          {org.organizerStatus || 'PENDING'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex space-x-1.5">
                          {org.organizerStatus !== 'APPROVED' && (
                            <Button
                              variant="success"
                              size="xs"
                              leftIcon={<Check className="w-3.5 h-3.5" />}
                              onClick={() => handleVerifyOrganizer(org.id, 'APPROVED')}
                            >
                              Approve
                            </Button>
                          )}
                          {org.organizerStatus !== 'REJECTED' && (
                            <Button
                              variant="danger"
                              size="xs"
                              leftIcon={<X className="w-3.5 h-3.5" />}
                              onClick={() => handleVerifyOrganizer(org.id, 'REJECTED')}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: User Management & Suspensions */}
      {activeTab === 'users' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
            User Accounts, Role Promotion & Suspension Controls
          </h3>

          <div className="overflow-x-auto border border-bgmi-border rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bgmi-dark text-slate-400 border-b border-bgmi-border">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Character UID / IGN</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bgmi-border/40">
                {usersList.map((u) => {
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <div className="font-bold text-white font-sans">{u.username}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-3.5 text-amber-400">
                        {u.playerProfile ? `${u.playerProfile.ign} (${u.playerProfile.bgmiUid})` : 'Unlinked'}
                      </td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="bg-bgmi-surface border border-bgmi-border rounded px-2 py-1 text-slate-200 cursor-pointer"
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="TEAM_CAPTAIN">TEAM_CAPTAIN</option>
                          <option value="ORGANIZER">ORGANIZER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <Badge variant={isActive ? 'emerald' : 'red'} size="xs">
                          {isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        {u.id !== user.id && (
                          <Button
                            variant={isActive ? 'danger' : 'success'}
                            size="xs"
                            leftIcon={isActive ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            onClick={() => handleToggleUserSuspension(u.id, isActive)}
                          >
                            {isActive ? 'Suspend' : 'Reinstate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 5: Squad Registrations */}
      {activeTab === 'registrations' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
              Squad Registrations for Selected Tournament
            </h3>
            <select
              value={selectedTournId}
              onChange={(e) => setSelectedTournId(e.target.value)}
              className="px-3 py-1.5 bg-bgmi-surface border border-bgmi-border rounded text-xs font-bold text-white focus:outline-none"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {registrations.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono text-center py-8">
              No squads registered for this tournament.
            </p>
          ) : (
            <div className="overflow-x-auto border border-bgmi-border rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bgmi-dark text-slate-400 border-b border-bgmi-border">
                  <tr>
                    <th className="p-3.5">Squad</th>
                    <th className="p-3.5">Captain</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bgmi-border/40">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{reg.team.name}</div>
                        <span className="text-[10px] text-amber-400">[{reg.team.tag}]</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{reg.team.captain?.username}</td>
                      <td className="p-3.5">
                        <Badge variant={reg.status === 'APPROVED' ? 'emerald' : 'gold'} size="sm">
                          {reg.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex space-x-1.5">
                          {reg.status !== 'APPROVED' && (
                            <Button
                              variant="success"
                              size="xs"
                              loading={updatingRegId === reg.id}
                              onClick={() => handleUpdateRegStatus(reg.id, 'APPROVED')}
                            >
                              Approve
                            </Button>
                          )}
                          {reg.status !== 'REJECTED' && (
                            <Button
                              variant="danger"
                              size="xs"
                              loading={updatingRegId === reg.id}
                              onClick={() => handleUpdateRegStatus(reg.id, 'REJECTED')}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 6: Match Rooms */}
      {activeTab === 'matches' && (
        <Card className="p-6 max-w-2xl space-y-4">
          <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
            Room Credentials & Anti-Leak Release
          </h3>

          <form onSubmit={handleUpdateRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Select Tournament
              </label>
              <select
                value={selectedTournId}
                onChange={(e) => setSelectedTournId(e.target.value)}
                className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Select Match
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {tournMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.matchNumber} - {m.matchName} [{m.map}] ({m.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Room ID
                </label>
                <input
                  type="text"
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Password
                </label>
                <input
                  type="text"
                  required
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" loading={roomSubmitting}>
              Update Credentials
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 7: Scoring & Disputes */}
      {activeTab === 'scores' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
              Result Review & Scoring Finalization
            </h3>
            <Button variant="secondary" size="xs" onClick={initScoreTable}>
              Load Squads
            </Button>
          </div>

          <form onSubmit={handleSubmitScores} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Tournament
                </label>
                <select
                  value={selectedTournId}
                  onChange={(e) => setSelectedTournId(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded text-xs text-white"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Match
                </label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded text-xs text-white"
                >
                  {tournMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      #{m.matchNumber} - {m.matchName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {scoreTeamResults.length > 0 && (
              <div className="overflow-x-auto border border-bgmi-border rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-bgmi-dark text-slate-400">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Squad</th>
                      <th className="p-3">Finishes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bgmi-border/40">
                    {scoreTeamResults.map((item, idx) => {
                      const t = teams.find((tm) => tm.id === item.teamId);
                      return (
                        <tr key={item.teamId}>
                          <td className="p-3 font-bold text-amber-400">#{item.placement}</td>
                          <td className="p-3 text-white">{t?.name} [{t?.tag}]</td>
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={scoreSubmitting}
              disabled={scoreTeamResults.length === 0}
            >
              Commit Final Results
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 8: Audit Logs */}
      {activeTab === 'audits' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
            Platform Security & Event Audit Trail
          </h3>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono text-center py-8">
              No audit records generated yet.
            </p>
          ) : (
            <div className="overflow-x-auto border border-bgmi-border rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bgmi-dark text-slate-400 border-b border-bgmi-border">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bgmi-border/40">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-white">{log.actorName}</td>
                      <td className="p-3.5">
                        <Badge variant="gold" size="xs">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-400">{log.targetType}</td>
                      <td className="p-3.5 max-w-md text-slate-300 truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 9: Notices */}
      {activeTab === 'notices' && (
        <Card className="p-6 max-w-2xl space-y-4">
          <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
            Publish Official Bulletin
          </h3>
          <form onSubmit={handleCreateNotice} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Title *
              </label>
              <input
                type="text"
                required
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Content *
              </label>
              <textarea
                rows={4}
                required
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <Button type="submit" variant="primary" size="md" loading={noticeSubmitting}>
              Post Bulletin
            </Button>
          </form>
        </Card>
      )}

    </div>
  );
};

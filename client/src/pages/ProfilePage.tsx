import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { PlayerDashboardData } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import {
  User as UserIcon,
  Shield,
  Trophy,
  Calendar,
  Radio,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Award,
  Crosshair,
  Lock,
  LogOut,
  Send
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'identity' | 'team' | 'tournaments' | 'matches' | 'settings'>('overview');
  const [dashboardData, setDashboardData] = useState<PlayerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Identity Form State
  const [ign, setIgn] = useState('');
  const [bgmiUid, setBgmiUid] = useState('');
  const [primaryRole, setPrimaryRole] = useState<'IGL' | 'ASSAULTER' | 'SUPPORT' | 'SNIPER' | 'ENTRY'>('ASSAULTER');
  const [device, setDevice] = useState('');
  const [bio, setBio] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Organizer Application State
  const [organizerBio, setOrganizerBio] = useState('');
  const [organizerExperience, setOrganizerExperience] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/player/dashboard');
      setDashboardData(res.data);

      if (res.data.player?.playerProfile) {
        const p = res.data.player.playerProfile;
        setIgn(p.ign || '');
        setBgmiUid(p.bgmiUid || '');
        setPrimaryRole(p.primaryRole || 'ASSAULTER');
        setDevice(p.device || '');
        setBio(p.bio || '');
      }
    } catch (err) {
      console.error('Failed to load player panel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <UserIcon className="w-12 h-12 mx-auto text-slate-600" />
        <h2 className="text-xl font-bold text-white font-display uppercase tracking-wider">Authentication Required</h2>
        <p className="text-xs text-slate-400 font-mono">Please sign in to access your athlete profile, squad slots, and match schedules.</p>
        <Button to="/login" variant="primary" size="sm">
          Sign In
        </Button>
      </div>
    );
  }

  const handleUpdateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      await api.put('/auth/profile', {
        ign,
        bgmiUid,
        primaryRole,
        device,
        bio
      });
      toast.success('In-game credentials and player profile updated!');
      await refreshUser();
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update credentials.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleApplyOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true);
    try {
      const res = await api.post('/player/apply-organizer', {
        bio: organizerBio,
        experience: organizerExperience
      });
      toast.success(res.data.message || 'Application submitted for administrative verification!');
      await refreshUser();
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setApplyLoading(false);
    }
  };

  const copyUidToClipboard = () => {
    if (bgmiUid) {
      navigator.clipboard.writeText(bgmiUid);
      toast.info(`Character UID ${bgmiUid} copied to clipboard!`);
    }
  };

  const profile = user.playerProfile;
  const kdRatio = profile?.totalMatches ? (profile.totalKills / Math.max(1, profile.totalMatches - profile.totalWins)).toFixed(2) : '0.00';

  const myTeam = user.captainedTeams?.[0] || dashboardData?.player?.memberTeams?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Player Hero Identity Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-bgmi-border bg-bgmi-card shadow-tactical p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 font-display font-black text-3xl shadow-gold-sm">
              {profile?.ign ? profile.ign.slice(0, 2).toUpperCase() : user.username.slice(0, 2).toUpperCase()}
              {user.role === 'ADMIN' && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-red-600 text-[9px] font-black uppercase text-white rounded">
                  ADM
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-wider">
                  {profile?.ign || user.username}
                </h1>
                <Badge variant="gold" size="sm">
                  {user.role}
                </Badge>
                {profile?.primaryRole && (
                  <Badge variant="slate" size="sm">
                    {profile.primaryRole}
                  </Badge>
                )}
                {user.organizerStatus === 'APPROVED' && (
                  <Badge variant="emerald" size="sm">
                    VERIFIED ORGANIZER
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                <span className="text-slate-300">USER: {user.username}</span>
                <span>•</span>
                <span className="text-slate-300">{user.email}</span>
                {profile?.bgmiUid && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={copyUidToClipboard}
                      className="inline-flex items-center space-x-1 text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      <span>UID: {profile.bgmiUid}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-3 gap-3 self-stretch sm:self-auto">
            <div className="p-3 bg-bgmi-surface rounded-xl border border-bgmi-border text-center">
              <p className="text-[10px] font-mono uppercase text-slate-400">Matches</p>
              <p className="text-xl font-black font-display text-white">{profile?.totalMatches || 0}</p>
            </div>
            <div className="p-3 bg-bgmi-surface rounded-xl border border-bgmi-border text-center">
              <p className="text-[10px] font-mono uppercase text-slate-400">Finishes</p>
              <p className="text-xl font-black font-display text-amber-400">{profile?.totalKills || 0}</p>
            </div>
            <div className="p-3 bg-bgmi-surface rounded-xl border border-bgmi-border text-center">
              <p className="text-[10px] font-mono uppercase text-slate-400">K/D Ratio</p>
              <p className="text-xl font-black font-display text-emerald-400">{kdRatio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-bgmi-border gap-2 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Athlete Dashboard', icon: Trophy },
          { key: 'identity', label: 'In-Game Identity', icon: Crosshair },
          { key: 'team', label: `Clan & Squad (${myTeam?.name || 'None'})`, icon: Shield },
          { key: 'tournaments', label: `My Tournaments (${dashboardData?.registrations?.length || 0})`, icon: Calendar },
          { key: 'matches', label: `Matches & History (${dashboardData?.upcomingMatches?.length || 0})`, icon: Radio },
          { key: 'settings', label: 'Account & Organizer', icon: Lock }
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Verified Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">WWCD (Wins)</p>
              <p className="text-2xl font-black font-display text-amber-400 mt-1">{profile?.totalWins || 0}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">MVP Accolades</p>
              <p className="text-2xl font-black font-display text-white mt-1">{profile?.mvpCount || 0}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Registered Clan</p>
              <p className="text-base font-bold font-display text-white mt-2 truncate">
                {myTeam?.name || 'Free Agent'}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase font-mono">Status</p>
              <div className="mt-2">
                <Badge variant="emerald" size="sm">
                  Active Athlete
                </Badge>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Matches Alert */}
            <Card className="p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>Upcoming Match Drop Schedule</span>
                </h3>
                <Link to="/tournaments" className="text-xs text-amber-400 hover:underline font-mono">
                  Browse All
                </Link>
              </div>

              {dashboardData?.upcomingMatches && dashboardData.upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.upcomingMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-bgmi-surface border border-bgmi-border rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                          {m.tournament.title}
                        </span>
                        <h4 className="font-bold text-white text-sm font-display">
                          #{m.matchNumber} - {m.matchName} [{m.map}]
                        </h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Drop Time: {new Date(m.scheduledAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <Button
                        to={`/tournaments/${m.tournament.slug || m.tournament.id}`}
                        variant="secondary"
                        size="xs"
                        rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Match Room
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  No upcoming matches scheduled for your registered squads.
                </div>
              )}
            </Card>

            {/* Official Announcements */}
            <Card className="p-6 space-y-4">
              <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Circuit Notices</span>
              </h3>
              <div className="space-y-3">
                {dashboardData?.announcements?.map((a) => (
                  <div key={a.id} className="p-3 bg-bgmi-surface border border-bgmi-border rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-amber-400 font-bold uppercase">{a.category}</span>
                      <span className="text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h5 className="font-bold text-white text-xs">{a.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{a.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: In-Game Identity Form */}
      {activeTab === 'identity' && (
        <Card className="p-6 sm:p-8 max-w-2xl space-y-6">
          <div className="border-b border-bgmi-border/60 pb-3">
            <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider">
              Verified Athlete In-Game Identity
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Your Character ID is validated by official referees during custom room check-ins.
            </p>
          </div>

          <form onSubmit={handleUpdateIdentity} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  In-Game Name (IGN) *
                </label>
                <input
                  type="text"
                  required
                  value={ign}
                  onChange={(e) => setIgn(e.target.value)}
                  placeholder="e.g. SOUL Manya"
                  className="w-full px-3 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  BGMI Character UID (10 Digits) *
                </label>
                <input
                  type="text"
                  required
                  value={bgmiUid}
                  onChange={(e) => setBgmiUid(e.target.value)}
                  placeholder="5124891024"
                  className="w-full px-3 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Primary Tactical Role
                </label>
                <select
                  value={primaryRole}
                  onChange={(e) => setPrimaryRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="IGL">IGL (In-Game Leader)</option>
                  <option value="ASSAULTER">Assaulter</option>
                  <option value="ENTRY">Entry Fragger</option>
                  <option value="SUPPORT">Support</option>
                  <option value="SNIPER">Sniper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Tournament Device Model
                </label>
                <input
                  type="text"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro Max"
                  className="w-full px-3 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                Competitive Bio & Achievements
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Competitive BGMI tournament history, previous podium finishes, scrim experience..."
                className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saveLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Credentials
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Squad & Clan Membership */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {myTeam ? (
            <Card className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bgmi-border/60 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-bgmi-surface border border-bgmi-border flex items-center justify-center text-amber-400 font-bold font-display text-xl overflow-hidden">
                    {myTeam.logo ? (
                      <img src={myTeam.logo} alt={myTeam.name} className="w-full h-full object-cover" />
                    ) : (
                      myTeam.tag
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-white">{myTeam.name}</h3>
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                      <span className="text-amber-400">TAG: [{myTeam.tag}]</span>
                      <span>•</span>
                      <span>CAPTAIN: {myTeam.captain?.username}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {myTeam.captainId === user.id && (
                    <Badge variant="gold" size="sm">
                      Squad Captain
                    </Badge>
                  )}
                  <Button to={`/teams/${myTeam.id}`} variant="secondary" size="xs">
                    View Team Page
                  </Button>
                </div>
              </div>

              {/* Roster Athletes */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">
                  Registered Squad Roster (Starters & Substitutes)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {myTeam.members?.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-bgmi-surface border border-bgmi-border rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{m.player.ign}</span>
                        <Badge variant="slate" size="xs">
                          {m.role}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400">UID: {m.player.bgmiUid}</p>
                      <p className="text-[10px] font-mono text-amber-400">{m.player.primaryRole}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center space-y-4">
              <Shield className="w-12 h-12 mx-auto text-slate-600" />
              <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
                No Squad Affiliation
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You are currently a free agent. Form your own competitive 4-man squad or join an existing organization to register for championships.
              </p>
              <div className="flex justify-center gap-3">
                <Button to="/teams" variant="primary" size="sm">
                  Browse Teams
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab 4: My Tournaments & Registrations */}
      {activeTab === 'tournaments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
              Enrolled Tournaments & Slot Allocations
            </h3>
            <Button to="/tournaments" variant="secondary" size="xs">
              Find New Tournaments
            </Button>
          </div>

          {dashboardData?.registrations && dashboardData.registrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.registrations.map((reg) => {
                const assignedSlot = dashboardData.groupSlots?.find(
                  (gs) => gs.group?.stage?.tournamentId === reg.tournament.id
                );

                return (
                  <Card key={reg.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge
                          variant={
                            reg.tournament.status === 'ONGOING'
                              ? 'live'
                              : reg.tournament.status === 'REGISTRATION_OPEN'
                              ? 'emerald'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {reg.tournament.status}
                        </Badge>
                        <h4 className="font-display font-bold text-white text-base mt-2">
                          {reg.tournament.title}
                        </h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          Format: {reg.tournament.format} • Prize Pool: {reg.tournament.prizePool}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Registration</span>
                        <Badge
                          variant={reg.status === 'APPROVED' ? 'emerald' : 'gold'}
                          size="sm"
                        >
                          {reg.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-3 bg-bgmi-surface rounded-lg border border-bgmi-border flex items-center justify-between text-xs font-mono">
                      <span>
                        Assigned Slot:{' '}
                        <strong className="text-amber-400">
                          {assignedSlot ? `Slot #${assignedSlot.slotNumber}` : 'Auto-Allocating'}
                        </strong>
                      </span>
                      <Button
                        to={`/tournaments/${reg.tournament.slug || reg.tournament.id}`}
                        variant="secondary"
                        size="xs"
                        rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Lobby & Matches
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-4">
              <Calendar className="w-12 h-12 mx-auto text-slate-600" />
              <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
                No Active Registrations
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You have not registered for any active BGMI tournaments. Join open qualifiers today!
              </p>
              <Button to="/tournaments" variant="primary" size="sm">
                Explore Tournaments
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Tab 5: Matches & History */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Recent Match Results & Placements</span>
            </h3>

            {dashboardData?.matchResults && dashboardData.matchResults.length > 0 ? (
              <div className="overflow-x-auto border border-bgmi-border rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-bgmi-dark text-slate-400">
                    <tr>
                      <th className="p-3">Tournament / Match</th>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Placement Pts</th>
                      <th className="p-3">Finishes</th>
                      <th className="p-3">Total Score</th>
                      <th className="p-3">WWCD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bgmi-border/40">
                    {dashboardData.matchResults.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-800/30">
                        <td className="p-3">
                          <div className="font-bold text-white">{res.match.matchName}</div>
                          <span className="text-[10px] text-slate-400">{res.match.tournament?.title}</span>
                        </td>
                        <td className="p-3 font-bold text-amber-400">#{res.placement}</td>
                        <td className="p-3">{res.placementPoints}</td>
                        <td className="p-3">{res.killPoints}</td>
                        <td className="p-3 font-bold text-white">{res.totalPoints} pts</td>
                        <td className="p-3">
                          {res.isWwcd ? (
                            <Badge variant="live" size="xs">
                              🍗 WWCD
                            </Badge>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono text-center py-6">
                No competitive match history recorded yet.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 6: Account Security & Organizer Application */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Settings */}
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Account Credentials & Security</span>
            </h3>
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-bgmi-surface border border-bgmi-border rounded-lg">
                <span className="text-slate-400 block text-[10px]">Email Address</span>
                <span className="text-white font-bold">{user.email}</span>
              </div>
              <div className="p-3 bg-bgmi-surface border border-bgmi-border rounded-lg">
                <span className="text-slate-400 block text-[10px]">Registered Platform Role</span>
                <span className="text-amber-400 font-bold">{user.role}</span>
              </div>
            </div>

            <Button
              variant="danger"
              size="sm"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={logout}
            >
              Log Out Session
            </Button>
          </Card>

          {/* Organizer Verification Card */}
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Tournament Organizer Verification</span>
            </h3>

            {user.role === 'ADMIN' ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                You have Administrator privileges with global oversight over all tournaments and organizers.
              </div>
            ) : user.organizerStatus === 'APPROVED' ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase font-display">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verified Tournament Organizer</span>
                </div>
                <p className="text-xs text-slate-300">
                  Your organizer application has been approved by platform administration. You can create and manage official BGMI tournaments in your Organizer Panel.
                </p>
                <Button to="/organizer" variant="secondary" size="sm">
                  Go to Organizer Panel
                </Button>
              </div>
            ) : user.organizerStatus === 'PENDING' ? (
              <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-lg space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase font-display">
                  <AlertCircle className="w-4 h-4" />
                  <span>Application Under Administrative Review</span>
                </div>
                <p className="text-xs text-slate-300">
                  Your application to host and manage official BGMI tournaments is currently being reviewed by administrators. You will be notified once verified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplyOrganizer} className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Apply to become an approved ICONIC ESPORTS tournament organizer. Approved organizers can create customized championships, control anti-leak match rooms, and manage slots.
                </p>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Organization / Clan Experience *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hosted 5+ semi-pro scrims / Clan Leader of 40 players"
                    value={organizerExperience}
                    onChange={(e) => setOrganizerExperience(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1 font-bold">
                    Organizer Bio / Proposal
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details about intended tournaments and anti-cheat enforcement..."
                    value={organizerBio}
                    onChange={(e) => setOrganizerBio(e.target.value)}
                    className="w-full px-3 py-2 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={applyLoading}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Submit Application
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}

    </div>
  );
};

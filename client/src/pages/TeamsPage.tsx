import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Team } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import {
  Shield,
  Users,
  Search,
  Plus,
  Trophy,
  Award,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const TeamsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data.teams);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tag) return;

    setCreateLoading(true);
    setErrorMsg(null);

    try {
      await api.post('/teams', {
        name,
        tag,
        logo: logo || undefined,
        description: description || undefined
      });
      toast.success('Squad profile registered successfully! You are assigned as Team Captain.');
      fetchTeams();
      refreshUser();
      setModalOpen(false);
      setName('');
      setTag('');
      setLogo('');
      setDescription('');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create team.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Competitive BGMI Organizations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-wider mt-1">
            Registered Squads & Clans
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Verified Indian BGMI rosters, official clan tags, active starters, and tournament achievements.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            if (!user) {
              toast.warning('Please sign in or register to create a team squad.');
              return;
            }
            setModalOpen(true);
          }}
        >
          Register New Squad
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search team name or clan tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-bgmi-card rounded-xl animate-pulse border border-bgmi-border" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 space-y-3">
          <Shield className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-lg font-bold text-white font-display uppercase tracking-wider">No Teams Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No squads match your query. Create your own team squad to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              tacticalHover
              className="p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {/* Team Top Card */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 rounded-xl bg-bgmi-surface border border-bgmi-border flex items-center justify-center font-display font-black text-amber-400 text-base shadow-sm overflow-hidden flex-shrink-0">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      team.tag
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white font-display truncate">
                        {team.name}
                      </h3>
                      {team.rank && (
                        <Badge
                          variant={team.rank === 1 ? 'gold' : team.rank <= 3 ? 'emerald' : 'slate'}
                          size="xs"
                        >
                          #{team.rank} {team.rank === 1 ? 'CHAMPION' : team.rank <= 3 ? 'PODIUM' : 'RANK'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" size="xs">
                        TAG: {team.tag}
                      </Badge>
                      {team.totalPoints !== undefined && team.totalPoints > 0 && (
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          {team.totalPoints} PTS • {team.wwcdCount ?? 0} WWCD
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {team.description || 'Verified Indian BGMI esports squad roster.'}
                </p>

                {/* Member Roster Preview */}
                {team.members && team.members.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-bgmi-border/60">
                    <p className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                      Active Starters ({team.members.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {team.members.slice(0, 4).map((m) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded bg-bgmi-surface border border-bgmi-border text-[11px] font-mono text-slate-300"
                        >
                          {m.player.ign}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2">
                <Button
                  to={`/teams/${team.id}`}
                  variant="secondary"
                  size="sm"
                  fullWidth
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  View Full Roster
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md bg-bgmi-surface border border-bgmi-border rounded-xl p-6 shadow-tactical space-y-5">
            <div className="flex items-center justify-between border-b border-bgmi-border pb-3">
              <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
                Register New BGMI Squad
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-xs text-red-400 flex items-center space-x-2 font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Team / Clan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Team Soul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-card border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Clan Tag (2 - 6 Chars) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. SOUL"
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-bgmi-card border border-bgmi-border rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-card border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Team Bio / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief history of competitive achievements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-card border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                loading={createLoading}
              >
                Register Squad Profile
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

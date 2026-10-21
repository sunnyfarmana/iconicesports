import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Trophy,
  UserPlus,
  Trash2,
  Calendar,
  AlertCircle,
  Crown
} from 'lucide-react';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Add member modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [ignOrUid, setIgnOrUid] = useState('');
  const [memberRole, setMemberRole] = useState('STARTER');
  const [addLoading, setAddLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTeam = async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data.team);
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    setAddLoading(true);
    setErrorMsg(null);

    try {
      await api.post(`/teams/${team.id}/members`, {
        ignOrUid,
        role: memberRole
      });
      toast.success('Player added to roster successfully!');
      fetchTeam();
      setAddModalOpen(false);
      setIgnOrUid('');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to add member.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (playerId: string) => {
    if (!team) return;
    try {
      await api.delete(`/teams/${team.id}/members/${playerId}`);
      toast.success('Player removed from roster.');
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 font-mono animate-pulse">
        Loading squad profile...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Shield className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h2 className="text-xl font-bold text-white font-display uppercase tracking-wider">Squad Not Found</h2>
        <Button to="/teams" variant="secondary" size="sm">
          Return to Teams Directory
        </Button>
      </div>
    );
  }

  const isCaptainOrAdmin = user?.id === team.captainId || user?.role === 'ADMIN';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Team Header Banner */}
      <Card className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-bgmi-surface border-2 border-amber-500/40 flex items-center justify-center text-2xl sm:text-3xl font-black text-amber-400 font-display overflow-hidden shadow-gold-sm flex-shrink-0">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              team.tag
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-4xl font-black font-display text-white uppercase tracking-wider text-glow">
                {team.name}
              </h1>
              <Badge variant="gold" size="sm">
                [{team.tag}]
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              {team.description || 'Verified Indian BGMI esports organization.'}
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-300 font-mono pt-1">
              <span className="flex items-center space-x-1 text-amber-400 font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>Captain: {team.captain?.username}</span>
              </span>
              <span>•</span>
              <span>Members: {team.members?.length || 0}/6</span>
            </div>
          </div>
        </div>

        {isCaptainOrAdmin && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Roster Player
          </Button>
        )}
      </Card>

      {/* Roster Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-display uppercase tracking-wider text-white">
              Official Competitive Roster (Starters & Subs)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Max 6 Players</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.members?.map((member) => (
            <Card
              key={member.id}
              tacticalHover
              className="p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-bold text-base text-white">
                      {member.player.ign}
                    </h3>
                    {member.role === 'CAPTAIN' && (
                      <Badge variant="gold" size="sm">
                        CAPTAIN
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Character UID: <span className="text-amber-400 font-bold">{member.player.bgmiUid}</span>
                  </p>
                </div>

                {isCaptainOrAdmin && member.role !== 'CAPTAIN' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.playerId)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-red-950/20 transition-colors"
                    title="Remove from roster"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Player Stats Ribbon */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-bgmi-border/60 text-center font-mono">
                <div className="bg-bgmi-surface p-1.5 rounded border border-bgmi-border">
                  <p className="text-[10px] text-slate-500 uppercase">Role</p>
                  <p className="text-xs font-bold text-white">{member.player.primaryRole}</p>
                </div>
                <div className="bg-bgmi-surface p-1.5 rounded border border-bgmi-border">
                  <p className="text-[10px] text-slate-500 uppercase">Kills</p>
                  <p className="text-xs font-bold text-red-400">{member.player.totalKills}</p>
                </div>
                <div className="bg-bgmi-surface p-1.5 rounded border border-bgmi-border">
                  <p className="text-[10px] text-slate-500 uppercase">MVPs</p>
                  <p className="text-xs font-bold text-amber-400">{member.player.mvpCount}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      {addModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md bg-bgmi-surface border border-bgmi-border rounded-xl p-6 shadow-tactical space-y-5">
            <div className="flex items-center justify-between border-b border-bgmi-border pb-3">
              <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
                Add Player to Roster
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
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

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Player In-Game Name or Character UID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOUL Nakul or 5183920194"
                  value={ignOrUid}
                  onChange={(e) => setIgnOrUid(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-card border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-bold">
                  Squad Slot Type
                </label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full px-3 py-2 bg-bgmi-card border border-bgmi-border rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="STARTER">Starter (Playing 4)</option>
                  <option value="SUBSTITUTE">Substitute</option>
                </select>
              </div>

              <div className="p-3 bg-bgmi-dark rounded border border-bgmi-border text-xs text-slate-400 font-mono">
                Player must have an active ICONIC ESPORTS profile registered with their verified BGMI Character UID.
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                loading={addLoading}
              >
                Add to Active Roster
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

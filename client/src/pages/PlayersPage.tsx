import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PlayerProfile } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Users, Search, Flame, Award, Crosshair, ChevronRight } from 'lucide-react';

export const PlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [sortBy, setSortBy] = useState('kills');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedRole !== 'ALL') params.role = selectedRole;
        if (sortBy) params.sortBy = sortBy;
        if (searchQuery) params.search = searchQuery;

        const res = await api.get('/players', { params });
        setPlayers(res.data.players);
      } catch (err) {
        console.error('Failed to load players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [selectedRole, sortBy, searchQuery]);

  const roles = ['ALL', 'IGL', 'ASSAULTER', 'ENTRY', 'SUPPORT', 'SNIPER'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <Users className="w-4 h-4" />
          <span>Verified Athlete Circuit</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-wider mt-1">
          Player Leaderboard & Directory
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
          National rankings of Indian BGMI competitive athletes. Verified in-game character UIDs, tactical roles, total finishes, and MVP awards.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        
        {/* Role Tabs */}
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => setSelectedRole(role)}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </Button>
          ))}
        </div>

        {/* Search and Sort controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-bgmi-border/60">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by In-Game Name (IGN) or Character UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono uppercase font-bold">Rank By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="kills">Total Finishes (Kills)</option>
              <option value="mvp">MVP Titles</option>
              <option value="wins">Tournament Wins</option>
              <option value="matches">Matches Played</option>
            </select>
          </div>
        </div>

      </Card>

      {/* Players Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-48 bg-bgmi-card rounded-xl animate-pulse border border-bgmi-border" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 space-y-3">
          <Crosshair className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-lg font-bold text-white font-display uppercase tracking-wider">No Athletes Found</h3>
          <p className="text-xs text-slate-500">
            No player profiles matched your search or role filter.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {players.map((p, idx) => (
            <Card
              key={p.id}
              tacticalHover
              className="p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={idx < 3 ? 'gold' : 'slate'} size="sm">
                    RANK #{idx + 1}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {p.primaryRole}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white font-display truncate">
                    {p.ign}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    UID: <span className="text-amber-400 font-bold">{p.bgmiUid}</span>
                  </p>
                </div>

                {p.currentTeam && (
                  <div className="text-xs text-slate-300 font-mono truncate">
                    Squad: <strong className="text-white">{p.currentTeam.name}</strong> [{p.currentTeam.tag}]
                  </div>
                )}

                {/* Stats Matrix */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-bgmi-border/60 text-center font-mono">
                  <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                    <p className="text-[10px] text-slate-500 uppercase">Finishes</p>
                    <p className="text-base font-black text-red-400">{p.totalKills}</p>
                  </div>
                  <div className="bg-bgmi-surface p-2 rounded border border-bgmi-border">
                    <p className="text-[10px] text-slate-500 uppercase">MVPs</p>
                    <p className="text-base font-black text-amber-400">{p.mvpCount}</p>
                  </div>
                </div>
              </div>

              <Button
                to={`/players/${p.id}`}
                variant="secondary"
                size="sm"
                fullWidth
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Profile & Stats
              </Button>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};

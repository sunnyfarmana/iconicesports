import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { PlayerProfile } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Users, Trophy, Flame, Award, Shield, CheckCircle, Crosshair } from 'lucide-react';

export const PlayerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await api.get(`/players/${id}`);
        setPlayer(res.data.player);
      } catch (err) {
        console.error('Failed to load player:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 font-mono animate-pulse">
        Loading player profile...
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h2 className="text-xl font-bold text-white font-display uppercase tracking-wider">Player Profile Not Found</h2>
        <Button to="/players" variant="secondary" size="sm">
          Return to Leaderboard
        </Button>
      </div>
    );
  }

  const kdRatio = player.totalMatches > 0 ? (player.totalKills / player.totalMatches).toFixed(2) : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Player Header Card */}
      <Card className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-bgmi-surface border-2 border-amber-500/40 flex items-center justify-center text-2xl font-black text-amber-400 font-display overflow-hidden shadow-gold-sm flex-shrink-0">
            {player.user?.avatar ? (
              <img src={player.user.avatar} alt={player.ign} className="w-full h-full object-cover" />
            ) : (
              player.ign.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-4xl font-black font-display text-white uppercase tracking-wider text-glow">
                {player.ign}
              </h1>
              <Badge variant="emerald" size="sm" dot>
                VERIFIED UID
              </Badge>
            </div>

            <p className="text-xs sm:text-sm font-mono text-slate-400">
              BGMI Character UID: <span className="text-amber-400 font-bold">{player.bgmiUid}</span>
            </p>

            <div className="flex items-center space-x-3 text-xs pt-1">
              <Badge variant="gold" size="sm">
                ROLE: {player.primaryRole}
              </Badge>
              {player.currentTeam && (
                <Link
                  to={`/teams/${player.currentTeam.id}`}
                  className="text-slate-300 hover:text-amber-400 font-semibold flex items-center space-x-1"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>{player.currentTeam.name} [{player.currentTeam.tag}]</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Lifetime Stats Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 text-center space-y-1">
          <p className="text-xs uppercase font-mono text-slate-400">Finishes (Kills)</p>
          <p className="text-3xl font-black font-display text-red-400 text-glow-red">
            {player.totalKills}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">Confirmed frags</p>
        </Card>

        <Card className="p-5 text-center space-y-1">
          <p className="text-xs uppercase font-mono text-slate-400">Avg Kills / Match</p>
          <p className="text-3xl font-black font-display text-amber-400 text-glow">
            {kdRatio}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">Finish efficiency</p>
        </Card>

        <Card className="p-5 text-center space-y-1">
          <p className="text-xs uppercase font-mono text-slate-400">MVP Titles</p>
          <p className="text-3xl font-black font-display text-amber-400">
            {player.mvpCount}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">Top fragger awards</p>
        </Card>

        <Card className="p-5 text-center space-y-1">
          <p className="text-xs uppercase font-mono text-slate-400">Matches Played</p>
          <p className="text-3xl font-black font-display text-white">
            {player.totalMatches}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">Tournament drops</p>
        </Card>
      </div>

      {/* Recent Matches */}
      <Card className="p-6 space-y-4">
        <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider flex items-center space-x-2">
          <Crosshair className="w-5 h-5 text-amber-400" />
          <span>Recent Competitive Match Drops</span>
        </h3>

        {player.playerResults && player.playerResults.length > 0 ? (
          <div className="space-y-2">
            {player.playerResults.map((pr: any) => (
              <div
                key={pr.id}
                className="flex items-center justify-between p-3.5 rounded-lg bg-bgmi-surface border border-bgmi-border font-mono text-xs"
              >
                <div>
                  <p className="font-bold text-white font-sans text-sm">{pr.match.matchName}</p>
                  <p className="text-slate-400 text-[11px]">Map: {pr.match.map}</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div>
                    <span className="text-slate-500 block text-[10px]">DAMAGE</span>
                    <span className="text-slate-300 font-bold">{pr.damage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">FINISHES</span>
                    <span className="text-red-400 font-bold text-sm">{pr.kills}</span>
                  </div>
                  {pr.isMvp && (
                    <Badge variant="gold" size="sm">
                      MVP
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic font-mono">No recent match results logged yet.</p>
        )}
      </Card>

    </div>
  );
};

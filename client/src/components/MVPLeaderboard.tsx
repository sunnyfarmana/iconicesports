import React from 'react';
import { MVPLeaderboardRow } from '../types';
import { Flame, Crosshair, Award } from 'lucide-react';

interface MVPLeaderboardProps {
  leaderboard: MVPLeaderboardRow[];
}

export const MVPLeaderboard: React.FC<MVPLeaderboardProps> = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-bgmi-card border border-bgmi-border rounded-xl p-6 text-center text-slate-400">
        <Flame className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p className="text-sm">No player fragger data recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-bgmi-card border border-bgmi-border rounded-xl p-5 shadow-tactical space-y-4">
      <div className="flex items-center justify-between border-b border-bgmi-border/60 pb-3">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
            Top Fraggers & MVPs
          </h3>
        </div>
        <span className="text-xs text-amber-400 font-mono font-bold">Finishes Leaderboard</span>
      </div>

      <div className="space-y-2.5">
        {leaderboard.slice(0, 5).map((player) => (
          <div
            key={player.playerId}
            className="flex items-center justify-between p-3 rounded-lg bg-bgmi-surface border border-bgmi-border hover:border-amber-500/40 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span
                className={`w-6 h-6 rounded flex items-center justify-center font-mono font-black text-xs ${
                  player.rank === 1
                    ? 'bg-amber-500 text-black'
                    : player.rank === 2
                    ? 'bg-slate-300 text-black'
                    : player.rank === 3
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                #{player.rank}
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">{player.ign}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-amber-400 font-mono rounded">
                    {player.teamTag}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  UID: {player.bgmiUid} • {player.role}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-right">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono">Damage</p>
                <p className="text-xs font-mono font-semibold text-slate-300">{player.totalDamage}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono">Kills</p>
                <p className="text-base font-black font-mono text-red-400 text-glow-red">
                  {player.totalKills}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

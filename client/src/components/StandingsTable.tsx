import React from 'react';
import { StandingRow } from '../types';
import { Trophy, Flame, Shield, Award } from 'lucide-react';

interface StandingsTableProps {
  standings: StandingRow[];
  tournamentTitle?: string;
  totalMatches?: number;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  tournamentTitle,
  totalMatches
}) => {
  if (!standings || standings.length === 0) {
    return (
      <div className="bg-bgmi-card border border-bgmi-border rounded-xl p-8 text-center text-slate-400">
        <Trophy className="w-10 h-10 mx-auto text-slate-600 mb-2" />
        <p className="font-semibold">No match results recorded yet.</p>
        <p className="text-xs text-slate-500 mt-1">Standings will automatically compute as matches conclude.</p>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-black text-xs flex items-center justify-center shadow-gold-sm">
            1
          </div>
        );
      case 2:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-300 text-black font-black text-xs flex items-center justify-center">
            2
          </div>
        );
      case 3:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center">
            3
          </div>
        );
      default:
        return (
          <span className="font-mono text-sm font-semibold text-slate-400">
            #{rank}
          </span>
        );
    }
  };

  return (
    <div className="bg-bgmi-card border border-bgmi-border rounded-xl overflow-hidden shadow-tactical">
      {/* Table Header Details */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-bgmi-card to-slate-900 border-b border-bgmi-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-bold text-white text-base uppercase tracking-wider">
              {tournamentTitle ? `${tournamentTitle} - Overall Standings` : 'Official Standings'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by: Total Points $\rightarrow$ WWCDs $\rightarrow$ Placement Points $\rightarrow$ Finishes
          </p>
        </div>

        {totalMatches !== undefined && (
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400 font-mono font-bold self-start sm:self-auto">
            Matches Completed: {totalMatches}
          </div>
        )}
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-bgmi-dark text-[11px] font-mono uppercase text-slate-400 border-b border-bgmi-border">
            <tr>
              <th className="py-3.5 px-4 text-center w-14">#</th>
              <th className="py-3.5 px-4">Squad Name</th>
              <th className="py-3.5 px-3 text-center">MP</th>
              <th className="py-3.5 px-3 text-center">WWCD</th>
              <th className="py-3.5 px-3 text-center">Place Pts</th>
              <th className="py-3.5 px-3 text-center">Finish Pts</th>
              <th className="py-3.5 px-4 text-right font-black text-amber-400">Total Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bgmi-border/40 font-mono">
            {standings.map((team, idx) => (
              <tr
                key={team.teamId}
                className={`transition-colors hover:bg-slate-800/40 ${
                  idx === 0
                    ? 'bg-amber-500/5'
                    : idx === 1
                    ? 'bg-slate-300/5'
                    : idx === 2
                    ? 'bg-amber-700/5'
                    : ''
                }`}
              >
                {/* Rank */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {getRankBadge(team.rank)}
                  </div>
                </td>

                {/* Team Info */}
                <td className="py-3 px-4 font-sans">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-bgmi-surface border border-bgmi-border flex items-center justify-center text-xs font-bold text-amber-400 overflow-hidden flex-shrink-0">
                      {team.teamLogo ? (
                        <img src={team.teamLogo} alt={team.teamName} className="w-full h-full object-cover" />
                      ) : (
                        team.teamTag
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center space-x-1.5">
                        <span>{team.teamName}</span>
                        <span className="text-[10px] px-1 py-0.2 bg-slate-800 text-amber-400 rounded font-mono">
                          {team.teamTag}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Matches Played */}
                <td className="py-3 px-3 text-center text-slate-300 font-semibold">
                  {team.matchesPlayed}
                </td>

                {/* WWCD */}
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${
                      team.wwcdCount > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    {team.wwcdCount > 0 ? `🍗 ${team.wwcdCount}` : '0'}
                  </span>
                </td>

                {/* Placement Points */}
                <td className="py-3 px-3 text-center text-slate-300">
                  {team.placementPoints}
                </td>

                {/* Kill Points */}
                <td className="py-3 px-3 text-center text-red-400 font-semibold">
                  {team.killPoints}
                </td>

                {/* Total Points */}
                <td className="py-3 px-4 text-right">
                  <span className="text-base font-black text-amber-400 text-glow">
                    {team.totalPoints}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

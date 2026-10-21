import React from 'react';
import { Link } from 'react-router-dom';
import { Tournament } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Trophy, Users, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return (
          <Badge variant="live" size="sm" dot pulse>
            LIVE NOW
          </Badge>
        );
      case 'REGISTRATION_OPEN':
        return (
          <Badge variant="emerald" size="sm" dot>
            REGISTRATION OPEN
          </Badge>
        );
      case 'REGISTRATION_CLOSED':
        return (
          <Badge variant="slate" size="sm">
            REGISTRATION CLOSED
          </Badge>
        );
      case 'PUBLISHED':
        return (
          <Badge variant="gold" size="sm">
            ANNOUNCED
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge variant="gold" size="sm">
            PENDING APPROVAL
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge variant="slate" size="sm">
            DRAFT
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="slate" size="sm">
            COMPLETED
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="red" size="sm">
            CANCELLED
          </Badge>
        );
      default:
        return (
          <Badge variant="gold" size="sm">
            {status.replace(/_/g, ' ')}
          </Badge>
        );
    }
  };

  const formatSeasonLabel = (season?: string) => {
    if (!season) return null;
    if (season === 'SEASON_1_2023') return 'S1 (2023)';
    if (season === 'SEASON_2_2024') return 'S2 (2024)';
    if (season === 'SEASON_3_2025') return 'S3 (2025)';
    if (season === 'SEASON_2026') return 'S4 (2026)';
    return season.replace(/_/g, ' ');
  };

  const slotPercent = Math.min(100, Math.round((tournament.registeredSlots / tournament.maxSlots) * 100));
  const startDate = new Date(tournament.scheduleStart).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-bgmi-card border border-bgmi-border hover:border-amber-500/50 rounded-xl overflow-hidden shadow-tactical transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        {/* Banner Image */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-900">
          <img
            src={tournament.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}
            alt={tournament.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bgmi-card via-bgmi-card/40 to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1">
            {getStatusBadge(tournament.status)}
            <div className="flex items-center space-x-1">
              {tournament.season && (
                <Badge variant="gold" size="sm">
                  {formatSeasonLabel(tournament.season)}
                </Badge>
              )}
              <Badge variant="slate" size="sm">
                {tournament.format}
              </Badge>
            </div>
          </div>

          {/* Prize Pool Spotlight */}
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300 uppercase font-display tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Prize Pool</span>
            </div>
            <p className="text-2xl font-black text-amber-400 font-display tracking-tight text-glow">
              {tournament.prizePool}
            </p>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 font-display">
              {tournament.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {tournament.description}
            </p>
          </div>

          {/* Slots & Registration Progress */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Squad Slots</span>
              </span>
              <span className="font-mono font-bold text-white">
                <span className="text-amber-400">{tournament.registeredSlots}</span> / {tournament.maxSlots}
              </span>
            </div>
            <div className="w-full h-1.5 bg-bgmi-surface rounded-full overflow-hidden border border-bgmi-border">
              <div
                className={`h-full transition-all duration-500 ${
                  slotPercent >= 90
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
                style={{ width: `${slotPercent}%` }}
              />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-bgmi-border/60">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{startDate}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Official 10-Pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action */}
      <div className="p-5 pt-0">
        <Button
          to={`/tournaments/${tournament.slug || tournament.id}`}
          variant="secondary"
          size="sm"
          fullWidth
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="group-hover:border-amber-500/50 group-hover:text-amber-400"
        >
          View Tournament & Slots
        </Button>
      </div>
    </div>
  );
};

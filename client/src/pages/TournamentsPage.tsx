import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Tournament } from '../types';
import { TournamentCard } from '../components/TournamentCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Trophy, Search, History, Calendar, CheckCircle } from 'lucide-react';

export const TournamentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialSeason = searchParams.get('season') || 'ALL';

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedSeason, setSelectedSeason] = useState<string>(initialSeason);
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedStatus !== 'ALL') params.status = selectedStatus;
        if (selectedFormat !== 'ALL') params.format = selectedFormat;
        if (selectedSeason !== 'ALL') params.season = selectedSeason;

        const res = await api.get('/tournaments', { params });
        setTournaments(res.data.tournaments);
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [selectedStatus, selectedFormat, selectedSeason]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    if (season === 'ALL') {
      searchParams.delete('season');
    } else {
      searchParams.set('season', season);
    }
    setSearchParams(searchParams);
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statuses = [
    { label: 'All Events', value: 'ALL' },
    { label: 'Live Now', value: 'ONGOING' },
    { label: 'Registration Open', value: 'REGISTRATION_OPEN' },
    { label: 'Registration Closed', value: 'REGISTRATION_CLOSED' },
    { label: 'Completed Archive', value: 'COMPLETED' }
  ];

  const seasons = [
    { label: 'All Seasons', value: 'ALL' },
    { label: 'Season 4 (2026 - Active)', value: 'SEASON_2026' },
    { label: 'Season 3 (2025 Archive)', value: 'SEASON_3_2025' },
    { label: 'Season 2 (2024 Archive)', value: 'SEASON_2_2024' },
    { label: 'Season 1 (2023 Archive)', value: 'SEASON_1_2023' }
  ];

  const isHistoricalView = selectedSeason.includes('2023') || selectedSeason.includes('2024') || selectedSeason.includes('2025');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <Trophy className="w-4 h-4" />
          <span>Competitive BGMI Circuit</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-wider">
              Tournament Arena
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed mt-1">
              Browse active championships, open qualifier registrations, and verified historical archives. All matches are managed under official BGMI point matrices with custom anti-leak lobby rooms.
            </p>
          </div>

          {/* Quick Season Switcher */}
          <div className="flex items-center space-x-2 bg-bgmi-surface/80 p-1.5 rounded-lg border border-bgmi-border self-start sm:self-auto">
            <History className="w-4 h-4 text-amber-400 ml-1.5" />
            <select
              value={selectedSeason}
              onChange={(e) => handleSeasonChange(e.target.value)}
              aria-label="Filter tournaments by season"
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
            >
              {seasons.map((s) => (
                <option key={s.value} value={s.value} className="bg-slate-900 text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Historical Season Banner Notice */}
      {isHistoricalView && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3.5">
          <History className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center space-x-2">
              <span>Verified Historical Season Archive</span>
              <Badge variant="gold" size="sm">Immutable Record</Badge>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are currently viewing authentic historical season records. All past champions, final leaderboards, MVP awards, and scores are permanently locked and cannot be edited.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((tab) => {
            const active = selectedStatus === tab.value;
            return (
              <Button
                key={tab.value}
                variant={active ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleStatusChange(tab.value)}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Search, Season and Format Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-bgmi-border/60">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tournament title or format..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono uppercase font-bold">Format:</span>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              aria-label="Filter tournaments by format"
              className="px-3 py-2.5 bg-bgmi-surface border border-bgmi-border rounded-lg text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">ALL FORMATS</option>
              <option value="SQUAD">SQUAD (4v4)</option>
              <option value="DUO">DUO (2v2)</option>
              <option value="SOLO">SOLO (1v1)</option>
            </select>
          </div>
        </div>

      </Card>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-bgmi-card rounded-xl animate-pulse border border-bgmi-border" />
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 space-y-3">
          <Trophy className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-lg font-bold text-white font-display uppercase tracking-wider">No Tournaments Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No tournaments match your current filter criteria. Try resetting the status, season, or format filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { Match } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Lock, Unlock, Copy, Check, Clock, Eye, CheckCircle } from 'lucide-react';

interface MatchRoomCardProps {
  match: Match;
  onOpenSlots?: () => void;
}

export const MatchRoomCard: React.FC<MatchRoomCardProps> = ({ match, onOpenSlots }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [credentials, setCredentials] = useState<{ roomId?: string; roomPassword?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [squadReady, setSquadReady] = useState(false);

  const fetchCredentials = async () => {
    if (!user) {
      toast.warning('Please sign in to access custom room credentials.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get(`/matches/${match.id}/credentials`);
      setCredentials(res.data);
      toast.success('Room credentials decrypted and verified.');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Unable to retrieve room credentials.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field === 'all' ? 'Room ID & Password' : field} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getMapBadge = (map: string) => {
    switch (map) {
      case 'ERANGEL':
        return <Badge variant="emerald" size="sm">{map}</Badge>;
      case 'MIRAMAR':
        return <Badge variant="gold" size="sm">{map}</Badge>;
      case 'SANHOK':
        return <Badge variant="slate" size="sm">{map}</Badge>;
      case 'VIKENDI':
        return <Badge variant="blue" size="sm">{map}</Badge>;
      default:
        return <Badge variant="slate" size="sm">{map}</Badge>;
    }
  };

  const matchTime = new Date(match.scheduledAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-bgmi-card border border-bgmi-border rounded-xl p-5 hover:border-amber-500/40 transition-all space-y-4 shadow-tactical">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-display font-bold text-amber-400 text-sm">
            #{match.matchNumber}
          </span>
          <div>
            <h4 className="font-display font-bold text-white text-base leading-tight">
              {match.matchName}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Drop Time: {matchTime}</span>
            </div>
          </div>
        </div>

        {/* Map Badge */}
        {getMapBadge(match.map)}
      </div>

      {/* Match Status & Slot Info */}
      <div className="flex items-center justify-between py-2 border-y border-bgmi-border/60 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-mono">Status:</span>
          {match.status === 'ROOM_OPEN' && (
            <Badge variant="live" size="sm" dot pulse>
              ROOM OPEN
            </Badge>
          )}
          {match.status === 'LIVE' && (
            <Badge variant="gold" size="sm" dot>
              IN PROGRESS
            </Badge>
          )}
          {match.status === 'COMPLETED' && (
            <Badge variant="slate" size="sm">
              COMPLETED
            </Badge>
          )}
          {match.status === 'SCHEDULED' && (
            <Badge variant="blue" size="sm">
              SCHEDULED
            </Badge>
          )}
        </div>

        {onOpenSlots && (
          <button
            type="button"
            onClick={onOpenSlots}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 font-mono text-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Slot List (1-25)</span>
          </button>
        )}
      </div>

      {/* Room Credentials Section */}
      <div className="bg-bgmi-surface rounded-lg p-3.5 border border-bgmi-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {credentials?.roomId ? (
              <Unlock className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide font-display">
              Custom Room Credentials
            </span>
          </div>

          {!credentials && (
            <Button
              variant="primary"
              size="xs"
              loading={loading}
              onClick={fetchCredentials}
            >
              Unlock Room ID
            </Button>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-500/20 font-mono">
            {errorMsg}
          </p>
        )}

        {credentials && (
          <div className="space-y-2 pt-2 border-t border-bgmi-border">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-bgmi-dark p-2 rounded border border-bgmi-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Room ID</p>
                  <p className="text-sm font-bold font-mono text-amber-400">{credentials.roomId || 'N/A'}</p>
                </div>
                {credentials.roomId && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.roomId!, 'Room ID')}
                    className="p-1 hover:text-amber-400 text-slate-400"
                    aria-label="Copy Room ID"
                  >
                    {copiedField === 'Room ID' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <div className="bg-bgmi-dark p-2 rounded border border-bgmi-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Password</p>
                  <p className="text-sm font-bold font-mono text-amber-400">{credentials.roomPassword || 'N/A'}</p>
                </div>
                {credentials.roomPassword && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.roomPassword!, 'Password')}
                    className="p-1 hover:text-amber-400 text-slate-400"
                    aria-label="Copy Password"
                  >
                    {copiedField === 'Password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {credentials.roomId && credentials.roomPassword && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    copyToClipboard(
                      `BGMI Custom Room | ID: ${credentials.roomId} | Password: ${credentials.roomPassword}`,
                      'all'
                    )
                  }
                  leftIcon={<Copy className="w-3 h-3" />}
                >
                  Copy All Credentials
                </Button>
              )}

              {/* In-Lobby Confirmation Toggle */}
              <button
                type="button"
                onClick={() => {
                  setSquadReady(!squadReady);
                  toast.info(
                    squadReady
                      ? 'Lobby presence status reset.'
                      : 'Squad marked ready in assigned custom room slot.'
                  );
                }}
                className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded border transition-colors flex items-center space-x-1 ${
                  squadReady
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{squadReady ? 'Squad Ready in Slot' : 'Confirm In-Lobby'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { GroupSlot } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { X, Shield, Users, Crosshair, CheckCircle } from 'lucide-react';

interface SlotListModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: GroupSlot[];
  groupName?: string;
  userTeamId?: string;
  onClaimSlot?: (slotNumber: number) => void;
  claimingSlot?: number | null;
}

export const SlotListModal: React.FC<SlotListModalProps> = ({
  isOpen,
  onClose,
  slots,
  groupName = 'Finals Lobby',
  userTeamId,
  onClaimSlot,
  claimingSlot
}) => {
  if (!isOpen) return null;

  // Generate 1-25 slots mapping
  const slotList = Array.from({ length: 25 }, (_, i) => {
    const slotNumber = i + 1;
    const assigned = slots.find((s) => s.slotNumber === slotNumber);
    return {
      slotNumber,
      team: assigned?.team || null
    };
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-bgmi-surface border border-bgmi-border rounded-xl shadow-tactical flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-bgmi-border flex items-center justify-between bg-bgmi-card/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">
                Official Match Slot Mapping (Slots 1 - 25)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {groupName} • In-Game Custom Room Seatings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close slot list"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Grid */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 leading-relaxed font-sans">
            <strong className="uppercase font-mono">Host Rule:</strong> Teams must strictly sit in their designated slot number. Entering incorrect slots or failing to sit within 10 minutes of custom room distribution leads to immediate referee kick or disqualification.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {slotList.map(({ slotNumber, team }) => {
              const isUserTeam = userTeamId && team?.id === userTeamId;
              const isClaiming = claimingSlot === slotNumber;

              return (
                <div
                  key={slotNumber}
                  className={`p-3.5 rounded-lg border transition-all ${
                    slotNumber === 1
                      ? 'bg-red-950/20 border-red-500/30'
                      : isUserTeam
                      ? 'bg-amber-500/10 border-amber-500 shadow-gold-sm'
                      : team
                      ? 'bg-bgmi-card border-bgmi-border hover:border-amber-500/40'
                      : 'bg-bgmi-dark/50 border-bgmi-border/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        slotNumber === 1
                          ? 'bg-red-600 text-white'
                          : isUserTeam
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-800 text-amber-400'
                      }`}
                    >
                      Slot #{slotNumber}
                    </span>
                    {slotNumber === 1 ? (
                      <span className="text-[10px] uppercase font-bold text-red-400 font-mono">
                        HOST / OBSERVER
                      </span>
                    ) : isUserTeam ? (
                      <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>YOUR SQUAD</span>
                      </span>
                    ) : null}
                  </div>

                  {slotNumber === 1 ? (
                    <p className="text-xs text-slate-400 font-sans italic">
                      ICONIC Official Broadcast & Referees
                    </p>
                  ) : team ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0">
                          {team.tag}
                        </div>
                        <p className="text-sm font-bold text-white truncate font-sans">
                          {team.name}
                        </p>
                      </div>

                      {team.members && team.members.length > 0 && (
                        <div className="text-[10px] text-slate-400 space-y-0.5 pl-1.5 border-l-2 border-amber-500/30 font-mono">
                          {team.members.slice(0, 4).map((m) => (
                            <div key={m.id} className="truncate">
                              {m.player.ign} <span className="text-slate-500">({m.player.primaryRole})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-mono italic">
                        Open Slot (Unassigned)
                      </p>
                      {onClaimSlot && userTeamId && (
                        <Button
                          variant="outline"
                          size="xs"
                          loading={isClaiming}
                          onClick={() => onClaimSlot(slotNumber)}
                        >
                          Claim Slot #{slotNumber}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-bgmi-border bg-bgmi-card/90 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close Slot List
          </Button>
        </div>
      </div>
    </div>
  );
};

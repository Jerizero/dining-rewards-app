import React from 'react';
import { Sparkles, EyeOff, Navigation, CreditCard } from 'lucide-react';

interface HeaderProps {
  userLocation: { lat: number; lng: number } | null;
  locationLoading: boolean;
  onLocateMe: () => void;
  isRentDay: boolean;
  onToggleRentDay: () => void;
  hiddenCount: number;
  onOpenHiddenModal: () => void;
  onOpenWalletModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userLocation,
  locationLoading,
  onLocateMe,
  isRentDay,
  onToggleRentDay,
  hiddenCount,
  onOpenHiddenModal,
  onOpenWalletModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-white/[0.08] px-4 pt-4 pb-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-2xl tracking-normal text-white italic">
              Dining Arbitrage
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
              NYC
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 tracking-tight">
            inKind • Seated • Bilt Dining • Blackbird
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Wallet Setup Button */}
          <button
            onClick={onOpenWalletModal}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition active:scale-95"
            title="Configure cards"
          >
            <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Wallet</span>
          </button>

          {/* Hidden Count Button */}
          {hiddenCount > 0 && (
            <button
              onClick={onOpenHiddenModal}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition active:scale-95"
              title="Manage hidden venues"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>{hiddenCount}</span>
            </button>
          )}

          {/* Near Me GPS Button */}
          <button
            onClick={onLocateMe}
            disabled={locationLoading}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition active:scale-95 ${
              userLocation
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-zinc-200'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} />
            <span>{locationLoading ? 'Locating...' : userLocation ? 'Near Me' : 'Near Me'}</span>
          </button>
        </div>
      </div>

      {/* Rent Day Alert Banner */}
      <div className="mt-3">
        <button
          onClick={onToggleRentDay}
          className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition active:scale-[0.99] ${
            isRentDay
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-sm'
              : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs">
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isRentDay ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
            <div>
              <span className="font-semibold text-white tracking-tight">
                {isRentDay ? 'Bilt Rent Day Active (Double Points)' : 'Bilt Rent Day Multiplier'}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isRentDay ? 'Dining partner points doubled up to 16x today.' : 'Spikes on 1st of month. Tap to preview.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isRentDay ? 'bg-amber-400 animate-ping' : 'bg-zinc-600'}`} />
            <span>{isRentDay ? 'ACTIVE' : 'OFF'}</span>
          </div>
        </button>
      </div>
    </header>
  );
};

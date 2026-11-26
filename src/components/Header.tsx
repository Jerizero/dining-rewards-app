import React from 'react';
import { Sparkles, EyeOff, Navigation, CreditCard, MessageSquarePlus } from 'lucide-react';

interface HeaderProps {
  userLocation: { lat: number; lng: number } | null;
  locationLoading: boolean;
  onLocateMe: () => void;
  isRentDay: boolean;
  onToggleRentDay: () => void;
  hiddenCount: number;
  onOpenHiddenModal: () => void;
  onOpenWalletModal: () => void;
  onOpenImprove: () => void;
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
  onOpenImprove,
}) => {
  return (
    <header className="sticky top-0 z-40 h-14 bg-[#0B0E14]/95 backdrop-blur-md border-b border-slate-800/90 px-3 sm:px-4 flex items-center justify-between gap-2">
      <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0">
        <h1 className="font-display text-lg sm:text-2xl tracking-normal text-slate-50 italic truncate">
          Dining Arbitrage
        </h1>
        <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
          NYC
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          onClick={onToggleRentDay}
          className={`flex items-center gap-1 text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-lg border transition active:scale-95 ${
            isRentDay
              ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
              : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Bilt Rent Day (1st of month: 2x points up to 1,000 bonus pts)"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isRentDay ? 'text-amber-300' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">{isRentDay ? 'Rent Day 2x' : 'Rent Day'}</span>
          <span className="sm:hidden">2x</span>
        </button>

        <button
          onClick={onOpenWalletModal}
          className="flex items-center gap-1.5 text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95"
          title="Configure cards"
        >
          <CreditCard className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Wallet</span>
        </button>

        <button
          type="button"
          onClick={onOpenImprove}
          className="flex items-center gap-1.5 text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
          title="Improve app / report an issue"
          aria-label="Improve"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Improve</span>
        </button>

        {hiddenCount > 0 && (
          <button
            onClick={onOpenHiddenModal}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/80 text-slate-300 hover:text-white transition active:scale-95"
            title="Manage hidden venues"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>{hiddenCount}</span>
          </button>
        )}

        <button
          onClick={onLocateMe}
          disabled={locationLoading}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg border transition active:scale-95 ${
            userLocation
              ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
              : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-100'
          }`}
        >
          <Navigation className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} />
          <span>{locationLoading ? '...' : 'Near Me'}</span>
        </button>
      </div>
    </header>
  );
};

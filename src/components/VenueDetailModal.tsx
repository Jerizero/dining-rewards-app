import React, { useEffect } from 'react';
import { X, MapPin, Clock, Star, ExternalLink, ChevronRight } from 'lucide-react';
import { Venue, CardProfile } from '../types';
import { isOpenNow, formatHours, calculateBestStack } from '../utils/calculator';
import { freshnessState, rewardTermsLine } from '../utils/freshness';
import { CATALOG_AS_OF } from '../data/venues';
import { venueNextActions } from '../utils/nextActions';

interface VenueDetailModalProps {
  venue: Venue | null;
  userCards: CardProfile[];
  isRentDay: boolean;
  onClose: () => void;
}

export const VenueDetailModal: React.FC<VenueDetailModalProps> = ({
  venue,
  userCards,
  isRentDay,
  onClose,
}) => {
  useEffect(() => {
    if (!venue) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [venue, onClose]);

  if (!venue) return null;

  const open = isOpenNow(venue.hours);
  const stack = calculateBestStack(venue, userCards, isRentDay);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + ' ' + venue.address)}`;
  const actions = venueNextActions(venue, mapsUrl);
  const freshness = freshnessState(CATALOG_AS_OF);
  const termsLine = rewardTermsLine(
    CATALOG_AS_OF,
    [
      venue.inKind?.available && 'inKind',
      venue.seated?.available && 'Seated',
      venue.bilt?.available && 'Bilt',
      venue.blackbird?.available && 'Blackbird',
      venue.resy?.available && 'Resy Rewards',
    ].filter(Boolean) as string[]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-start justify-between gap-3">
          <div>
            <h3 id="venue-detail-title" className="font-bold text-white text-base">{venue.name}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {venue.cuisine} · {venue.priceRange} · {venue.neighborhood}
            </p>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {venue.address}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* Status + hours */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 font-semibold ${open ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <Clock className="w-3.5 h-3.5" /> {open ? 'Open now' : 'Closed'}
            </span>
            <span className="text-zinc-500">{formatHours(venue.hours)}</span>
            {venue.rating !== undefined && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold ml-auto">
                <Star className="w-3.5 h-3.5 fill-current" /> {venue.rating}
                {venue.reviewCount !== undefined && <span className="text-zinc-500 font-normal">({venue.reviewCount})</span>}
              </span>
            )}
          </div>

          {venue.description && <p className="text-xs text-zinc-300 leading-relaxed">{venue.description}</p>}

          {/* Best stack */}
          <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Best way to pay</p>
            <p className="text-sm font-bold text-white">{stack.headline}</p>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">{stack.effectiveValue}</p>
          </div>

          {/* One next action per program */}
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Next actions</p>
            {freshness === 'hidden' ? (
              <p className="text-[11px] text-zinc-500 italic">{termsLine}</p>
            ) : (
              <ul className="space-y-1.5">
                {actions.map((a) => (
                  <li key={a.program}>
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-zinc-200 hover:text-white bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-2 transition"
                      >
                        <span className="shrink-0 w-16 font-bold text-zinc-400">{a.program}</span>
                        <span className="flex-1">{a.action}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-zinc-200 bg-zinc-800/40 border border-zinc-800 rounded-lg px-3 py-2">
                        <span className="shrink-0 w-16 font-bold text-zinc-400">{a.program}</span>
                        <span className="flex-1">{a.action}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-600" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {freshness !== 'hidden' && (
              <p className={`text-[10px] mt-2 ${freshness === 'muted' ? 'text-amber-500/80' : 'text-zinc-600'}`}>
                {termsLine}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  EyeOff, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  Navigation,
  Smartphone,
  Camera,
  Radio,
  Check
} from 'lucide-react';
import { Venue, CardProfile } from '../types';
import { isOpenNow, formatHours, formatDistance, calculateBestStack } from '../utils/calculator';
import { freshnessState, rewardTermsLine } from '../utils/freshness';
import { CATALOG_AS_OF } from '../data/venues';

interface VenueCardProps {
  venue: Venue;
  userCards: CardProfile[];
  isRentDay: boolean;
  distance?: number;
  onHideVenue: (id: string) => void;
  onShowDetails?: (venue: Venue) => void;
}

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  userCards,
  isRentDay,
  distance,
  onHideVenue,
  onShowDetails,
}) => {
  const [expanded, setExpanded] = useState(false);
  const open = isOpenNow(venue.hours);
  const stack = calculateBestStack(venue, userCards, isRentDay);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + ' ' + venue.address)}`;

  // Determine the primary payment/claim mechanic
  const getMechanicBadge = () => {
    switch (stack.primaryPlatform) {
      case 'inKind':
        return {
          icon: <Smartphone className="w-3 h-3 text-emerald-400" />,
          label: 'Pay In-App at Table',
          desc: 'Open inKind when check arrives, enter check #, and pay balance',
          bg: 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300',
        };
      case 'Seated':
        return {
          icon: <Camera className="w-3 h-3 text-sky-400" />,
          label: venue.seated?.bookingRequired ? 'Book Ahead + Upload Receipt' : 'Walk-in + Upload Receipt',
          desc: 'Pay bill normally with card, then upload photo of receipt in Seated app',
          bg: 'bg-sky-950/60 border-sky-800/40 text-sky-300',
        };
      case 'Bilt':
        return {
          icon: <CreditCard className="w-3 h-3 text-amber-400" />,
          label: 'Swipe Any Linked Card',
          desc: 'Automatic background earn. No in-app booking or scanning required',
          bg: 'bg-amber-950/60 border-amber-800/40 text-amber-300',
        };
      case 'Blackbird':
        return {
          icon: <Radio className="w-3 h-3 text-purple-400" />,
          label: 'NFC Puck Tap / In-App Pay',
          desc: 'Tap phone to Blackbird puck at host/table or pay via Blackbird Pay',
          bg: 'bg-purple-950/60 border-purple-800/40 text-purple-300',
        };
      default:
        return {
          icon: <CreditCard className="w-3 h-3 text-zinc-400" />,
          label: 'Pay Directly with Card',
          desc: 'Standard dining transaction',
          bg: 'bg-zinc-800/60 border-zinc-700/40 text-zinc-300',
        };
    }
  };

  const mechanic = getMechanicBadge();

  // JER-788: reward numbers always carry their data age and source; too-stale terms
  // are withheld instead of shown as bare numbers.
  const rewardPrograms = [
    venue.inKind?.available && 'inKind',
    venue.seated?.available && 'Seated',
    venue.bilt?.available && 'Bilt',
    venue.blackbird?.available && 'Blackbird',
  ].filter(Boolean) as string[];
  const freshness = freshnessState(CATALOG_AS_OF);
  const termsLine = rewardTermsLine(CATALOG_AS_OF, rewardPrograms);
  // Hide synthetic boilerplate descriptions that just echo name, neighborhood, cuisine, and rating.
  const isTemplateEcho = /\boffering signature .+ fare\.\s*Rated\s+\d/i.test(venue.description || '');
  const editorialDesc = isTemplateEcho ? '' : (venue.description || '').trim();
  const compactTerms = freshness === 'hidden'
    ? termsLine
    : `Terms ${CATALOG_AS_OF.slice(5).replace('-', '/')}${freshness === 'muted' ? ' · re-verify' : ''}`;

  return (
    <div className="bg-[#141417] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm transition hover:border-white/[0.16]">
      {/* Top Banner: Venue & Meta */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-left font-display text-2xl tracking-wide text-white leading-tight hover:text-amber-300 underline decoration-white/20 underline-offset-4 hover:decoration-amber-300 transition"
                title={`Open ${venue.name} in Google Maps`}
              >
                {venue.name}
              </a>
              <span className="text-xs text-zinc-500 font-mono font-medium">{venue.priceRange}</span>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
                {venue.cuisine}
              </span>
              {venue.rating && (
                <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  ★ {venue.rating.toFixed(1)} {venue.reviewCount ? `(${venue.reviewCount})` : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 flex-wrap">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-zinc-200 hover:text-amber-300 font-medium inline-flex items-center gap-1 underline decoration-white/20 underline-offset-2 hover:decoration-amber-300 transition"
                title={`Open ${venue.name} in Google Maps`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                {venue.neighborhood}
              </a>

              {distance !== undefined && (
                <>
                  <span className="text-zinc-700">•</span>
                  <span className="text-zinc-300 font-mono text-[11px]">{formatDistance(distance)}</span>
                </>
              )}

              <span className="text-zinc-700">•</span>
              <span className={`inline-flex items-center gap-1.5 font-medium ${open ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                {open ? 'Open Now' : 'Closed'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onHideVenue(venue.id)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] rounded-lg transition active:scale-95 shrink-0"
            title="Hide this place"
            aria-label={`Hide ${venue.name}`}
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>

        {editorialDesc && (
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-2">
            {editorialDesc}
          </p>
        )}

        {/* Platform Offer Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-white/[0.06]">
          {freshness === 'hidden' ? (
            <span className="text-[11px] text-zinc-500 italic">{termsLine}</span>
          ) : (
          <>
          {venue.inKind?.available && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
              inKind {venue.inKind.bonusPercentage}%
            </span>
          )}

          {venue.seated?.available && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-800/40">
              Seated {venue.seated.rewardPercentage}%
            </span>
          )}

          {venue.bilt?.available && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
              isRentDay
                ? 'bg-amber-950/80 text-amber-200 border-amber-600 font-bold'
                : 'bg-amber-950/30 text-amber-300 border-amber-800/40'
            }`}>
              Bilt {isRentDay ? `${venue.bilt.baseMultiplier + 6}x Rent Day` : `${venue.bilt.baseMultiplier + 3}x`}
            </span>
          )}

          {venue.blackbird?.available && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-950/30 text-purple-300 border border-purple-800/40">
              Blackbird {venue.blackbird.flyEarn} $FLY
            </span>
          )}
          <span
            className={`ml-auto text-[10px] font-mono ${freshness === 'muted' ? 'text-amber-500/75' : 'text-zinc-600'}`}
            title={termsLine}
          >
            {compactTerms}
          </span>
          </>
          )}
        </div>
      </div>

      {/* Recommended Strategy Box */}
      <div className="bg-[#0e0e11] border-t border-white/[0.06] p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Headline & Value */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs font-bold text-white tracking-tight">
                {stack.headline}
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                {stack.effectiveValue}
              </span>
            </div>

            {/* How to Claim / Payment Mechanic Badge */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded border ${mechanic.bg}`}>
                {mechanic.icon}
                <span>{mechanic.label}</span>
              </div>

              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-zinc-500" />
                Card: <strong className="text-zinc-200 font-medium">{stack.recommendedCard}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/[0.05] transition shrink-0"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable Step-by-Step Breakdown (streamlined, zero redundant echo) */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 text-xs text-zinc-300">
            <p className="text-zinc-200 text-xs leading-relaxed">
              {mechanic.desc}
            </p>

            <div className="space-y-1">
              {stack.details
                .filter((d) => !/^Walk-ins accepted|^Requires reservation booking/i.test(d))
                .map((detail, idx) => (
                  <p key={idx} className="flex items-start gap-1.5 text-zinc-400 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-amber-400/90 shrink-0 mt-0.5" />
                    <span>{detail.replace(/^⚡ Arbitrage Overlap:\s*/i, 'Also on: ')}</span>
                  </p>
                ))}
            </div>

            <div className="pt-2.5 flex items-center justify-between border-t border-white/[0.06] text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                {formatHours(venue.hours)}
              </span>

              {onShowDetails && (
                <button
                  type="button"
                  onClick={() => onShowDetails(venue)}
                  className="inline-flex items-center gap-1 font-semibold text-zinc-200 hover:text-white px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/[0.12] transition active:scale-95"
                >
                  All programs
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Venue, CardProfile } from '../types';
import { calculateDistance, calculateBestStack } from '../utils/calculator';
import { Radio, Navigation, ExternalLink, Sparkles, X, BellOff } from 'lucide-react';

interface PresenceRadarProps {
  venues: Venue[];
  userLocation: { lat: number; lng: number } | null;
  onLocationUpdate: (loc: { lat: number; lng: number }) => void;
  cards: CardProfile[];
  isRentDay: boolean;
  onSelectVenue?: (venue: Venue) => void;
}

export const PresenceRadar: React.FC<PresenceRadarProps> = ({
  venues,
  userLocation,
  onLocationUpdate,
  cards,
  isRentDay,
}) => {
  const [isLiveWatching, setIsLiveWatching] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [mutedUntil, setMutedUntil] = useState<number | null>(null);
  const [dismissedVenueId, setDismissedVenueId] = useState<string | null>(null);
  const [simulatedVenue, setSimulatedVenue] = useState<Venue | null>(null);

  // Toggle Live Tracking via watchPosition
  const toggleLiveTracking = () => {
    if (isLiveWatching) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsLiveWatching(false);
      setSimulatedVenue(null);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLiveWatching(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onLocationUpdate(newLoc);
      },
      (err) => {
        console.warn('WatchPosition error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
    setWatchId(id);
  };

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Determine current active location (either GPS or simulation)
  const activeLoc = simulatedVenue 
    ? { lat: simulatedVenue.lat, lng: simulatedVenue.lng }
    : userLocation;

  // Find closest venue and distance
  let closestVenue: Venue | null = null;
  let closestDistanceMiles = Infinity;

  if (activeLoc) {
    for (const v of venues) {
      const d = calculateDistance(activeLoc.lat, activeLoc.lng, v.lat, v.lng);
      if (d < closestDistanceMiles) {
        closestDistanceMiles = d;
        closestVenue = v;
      }
    }
  }

  // Tight threshold: strictly inside or at table/doorstep only (<= 120 feet)
  // Zero ambient alerts when walking past restaurants on the sidewalk
  const distanceFeet = Math.round(closestDistanceMiles * 5280);
  const isInsideVenue = closestDistanceMiles <= 0.022; // ~116 feet
  const isMuted = mutedUntil !== null && Date.now() < mutedUntil;

  // Haptic feedback when walking into a venue (one-time buzz)
  useEffect(() => {
    if (isInsideVenue && closestVenue && closestVenue.id !== dismissedVenueId && !isMuted) {
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([80, 40, 80]);
        }
      } catch {
        // ignore
      }
    }
  }, [isInsideVenue, closestVenue?.id, dismissedVenueId, isMuted]);

  const stack = closestVenue ? calculateBestStack(closestVenue, cards, isRentDay) : null;

  return (
    <div className="mb-4">
      {/* Live Radar Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Radio className={`w-3.5 h-3.5 ${isLiveWatching || simulatedVenue ? 'text-emerald-400' : 'text-zinc-500'}`} />
            {(isLiveWatching || simulatedVenue) && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div>
            <span className="font-medium text-zinc-200">
              {isLiveWatching ? 'Table Presence: Active' : simulatedVenue ? 'Simulating Presence' : 'Table Presence'}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              Silent on sidewalks • Alerts only when seated
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Demo Simulator */}
          <select
            value={simulatedVenue?.id || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setSimulatedVenue(null);
              } else {
                const found = venues.find((v) => v.id === val);
                if (found) {
                  setSimulatedVenue(found);
                  setDismissedVenueId(null);
                }
              }
            }}
            className="text-[11px] bg-black/40 border border-white/[0.1] text-zinc-400 rounded px-2 py-1 outline-none"
            title="Preview arrival at a venue"
          >
            <option value="">Simulate arrival...</option>
            <option value="cote-korean-steakhouse">Seated at COTE</option>
            <option value="the-hunterian">Seated at The Hunterian</option>
            <option value="madam-ji">Seated at Madam Ji</option>
            <option value="sushi-by-bou-nomad">Seated at Sushi By Bou</option>
            <option value="boqueria-flatiron">Seated at Boqueria</option>
          </select>

          <button
            onClick={toggleLiveTracking}
            className={`px-2.5 py-1 rounded-lg font-medium transition active:scale-95 ${
              isLiveWatching
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/[0.06] text-zinc-300 hover:text-white border border-white/[0.1]'
            }`}
          >
            {isLiveWatching ? 'ON' : 'Turn ON'}
          </button>
        </div>
      </div>

      {/* ONLY FIRES WHEN ACTUALLY SEATED / INSIDE (< 120 ft) - Zero Sidewalk Noise */}
      {closestVenue && isInsideVenue && closestVenue.id !== dismissedVenueId && !isMuted && stack && (
        <div className="mt-2.5 relative overflow-hidden rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-black p-4 shadow-xl shadow-emerald-950/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                You're At {closestVenue.name} ({distanceFeet < 40 ? 'Inside' : `${distanceFeet} ft`})
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMutedUntil(Date.now() + 2 * 60 * 60 * 1000)}
                className="text-zinc-500 hover:text-zinc-300 text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] flex items-center gap-1"
                title="Snooze alerts for 2 hours"
              >
                <BellOff className="w-3 h-3" />
                <span>Mute 2h</span>
              </button>
              <button
                onClick={() => setDismissedVenueId(closestVenue.id)}
                className="text-zinc-500 hover:text-zinc-300 p-1 -mr-1"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {closestVenue.name}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {closestVenue.neighborhood} • {closestVenue.cuisine} • {closestVenue.priceRange}
                {closestVenue.rating ? ` • ★ ${closestVenue.rating.toFixed(1)}` : ''}
              </p>
            </div>
            <span className="text-sm font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0">
              {stack.effectiveValue}
            </span>
          </div>

          {/* Action Checklist for this exact spot */}
          <div className="mt-3.5 bg-black/50 border border-white/[0.08] rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              How to Pay & Claim Rewards Here:
            </p>

            {closestVenue.blackbird?.available && (
              <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-orange-950/30 border border-orange-500/30 text-orange-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  <strong>1. Tap Blackbird:</strong> Claim 200 $FLY tokens at the table puck.
                </span>
                <span className="font-mono text-[10px] text-orange-400 font-bold">+200 $FLY</span>
              </div>
            )}

            {closestVenue.seated?.available && (
              <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <strong>2. Open Seated:</strong> Log walk-in now for receipt submission.
                </span>
                <span className="font-mono text-[10px] text-blue-300 font-bold">
                  {closestVenue.seated.rewardPercentage}% Back
                </span>
              </div>
            )}

            {closestVenue.bilt?.available && (
              <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <strong>3. Pay Check:</strong> Use Bilt Card on terminal for max points.
                </span>
                <span className="font-mono text-[10px] text-emerald-300 font-bold">
                  {closestVenue.bilt.baseMultiplier + (isRentDay ? 6 : 3)}x Points
                </span>
              </div>
            )}

            {closestVenue.inKind?.available && !closestVenue.seated?.available && (
              <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <strong>1. Pay via inKind App:</strong> Connect check code for upfront discount.
                </span>
                <span className="font-mono text-[10px] text-purple-300 font-bold">
                  {closestVenue.inKind.bonusPercentage}% Off
                </span>
              </div>
            )}
          </div>

          {/* Quick External Links */}
          <div className="mt-3 flex items-center gap-2">
            {closestVenue.mapsUrl && (
              <a
                href={closestVenue.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-white transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </a>
            )}
            {closestVenue.bookingUrl && (
              <a
                href={closestVenue.bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Reserve / Book</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// JER-788 piece 3: collapse duplicate venue records in the data layer.
// Two rows are the same place when their normalized names match and either they sit
// within 300m of each other, or one of them has no street address (a name-as-address
// row is a geocoded centroid and carries no location value) within 2 miles - chains
// keep separate records because real locations have real street addresses.
// The richer record wins: a real street address beats a name-as-address row, then
// more reward programs, then the longer description. venues.json stays untouched
// (the generator owns it); the dropped rows are reported, never silently lost.

import { Venue } from '../types';
import { calculateDistance } from './calculator';

const DUPLICATE_RADIUS_MILES = 300 / 1609.34;
const CENTROID_RADIUS_MILES = 2;

export function normalizeVenueName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ nyc$/, '');
}

function hasStreetAddress(v: Venue): boolean {
  return /^\d+\s/.test(v.address.trim());
}

function programCount(v: Venue): number {
  return [v.inKind, v.seated, v.bilt, v.blackbird].filter(Boolean).length;
}

export function richerVenue(a: Venue, b: Venue): Venue {
  const street = Number(hasStreetAddress(b)) - Number(hasStreetAddress(a));
  if (street !== 0) return street > 0 ? b : a;
  const programs = programCount(b) - programCount(a);
  if (programs !== 0) return programs > 0 ? b : a;
  return (b.description || '').length > (a.description || '').length ? b : a;
}

export interface DedupeDrop {
  keptId: string;
  droppedId: string;
  name: string;
}

export function dedupeVenues(venues: Venue[]): { venues: Venue[]; dropped: DedupeDrop[] } {
  const kept: Venue[] = [];
  const dropped: DedupeDrop[] = [];
  for (const v of venues) {
    const norm = normalizeVenueName(v.name);
    const twinIndex = kept.findIndex((k) => {
      if (normalizeVenueName(k.name) !== norm) return false;
      const miles = calculateDistance(k.lat, k.lng, v.lat, v.lng);
      if (miles <= DUPLICATE_RADIUS_MILES) return true;
      return (!hasStreetAddress(k) || !hasStreetAddress(v)) && miles <= CENTROID_RADIUS_MILES;
    });
    if (twinIndex === -1) {
      kept.push(v);
      continue;
    }
    const winner = richerVenue(kept[twinIndex], v);
    const loser = winner === kept[twinIndex] ? v : kept[twinIndex];
    kept[twinIndex] = winner;
    dropped.push({ keptId: winner.id, droppedId: loser.id, name: winner.name });
  }
  return { venues: kept, dropped };
}

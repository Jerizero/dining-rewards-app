import { Venue, CardProfile } from '../types';
import venuesJson from './venues.json';
import { dedupeVenues, DedupeDrop } from '../utils/dedupe';

/**
 * Date the venue catalog's reward terms were last verified/refreshed, matching the
 * last real change to venues.json. The catalog generator (scripts/generate_full_catalog.cjs)
 * and any manual refresh MUST bump this constant; the freshness line on every card
 * (JER-788) reads it. Never bump without an actual data pass - it is a claim, not a timer.
 */
export const CATALOG_AS_OF = '2026-10-25';

export const USER_CARDS: CardProfile[] = [
  {
    id: 'bilt',
    name: 'Bilt Mastercard',
    diningMultiplier: 3,
    rentDayMultiplier: 6,
    pointType: 'Bilt Points',
  },
  {
    id: 'csr',
    name: 'Chase Sapphire Reserve',
    diningMultiplier: 3,
    pointType: 'Chase UR',
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold',
    diningMultiplier: 4,
    pointType: 'Amex MR',
  },
  {
    id: 'robinhood',
    name: 'Robinhood Gold Card',
    diningMultiplier: 3,
    pointType: 'Cash Back',
  },
];

// JER-788 piece 3: duplicate venue records collapse at load (same normalized name within
// 300m; the richer record wins). The dropped rows stay visible in VENUE_DEDUPE_DROPS.
const catalogDedupe = dedupeVenues(venuesJson as Venue[]);
export const VENUES: Venue[] = catalogDedupe.venues;
export const VENUE_DEDUPE_DROPS: DedupeDrop[] = catalogDedupe.dropped;

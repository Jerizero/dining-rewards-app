import { Venue, CardProfile } from '../types';
import venuesJson from './venues.json';

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

export const VENUES: Venue[] = venuesJson as Venue[];

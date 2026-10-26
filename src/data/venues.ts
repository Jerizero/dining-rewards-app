import { Venue, CardProfile } from '../types';
import venuesJson from './venues.json';

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

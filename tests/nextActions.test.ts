import { test } from 'node:test';
import assert from 'node:assert/strict';
import { venueNextActions } from '../src/utils/nextActions';
import { Venue } from '../src/types';

const base = {
  id: 'v1',
  name: 'Le Pavillon',
  neighborhood: 'Midtown' as never,
  address: '702 2nd Ave',
  lat: 40.7485,
  lng: -73.9725,
  cuisine: 'French' as never,
  priceRange: '$$$' as const,
  description: 'Le Pavillon in Midtown offering signature French fare.',
  hours: [],
};

test('Resy Rewards venue gets an 8x Amex Gold directive via the Rewards tab', () => {
  const venue = {
    ...base,
    resyRewards: { available: true, bonusMultiplier: 4 },
  } as unknown as Venue;
  const actions = venueNextActions(venue, 'https://maps.example.com');
  const resy = actions.find((a) => a.program === 'Resy Rewards');
  assert.ok(resy, 'missing Resy Rewards action');
  assert.match(resy.action, /Rewards tab/);
  assert.match(resy.action, /8x MR total/);
  assert.match(resy.action, /4x Resy Rewards bonus/);
});

test('venue without Resy Rewards gets no Resy action', () => {
  const actions = venueNextActions(base as unknown as Venue, 'https://maps.example.com');
  assert.ok(!actions.some((a) => a.program === 'Resy Rewards'));
});

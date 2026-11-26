import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOpenNow,
  formatHours,
  calculateDistance,
  formatDistance,
  calculateBestStack,
} from '../src/utils/calculator';
import {
  getHiddenVenueIds,
  hideVenue,
  unhideVenue,
  resetHiddenVenues,
} from '../src/utils/storage';
import type { CardProfile, Venue } from '../src/types';

const baseVenue: Venue = {
  id: 'v-1',
  name: 'Test Bistro',
  neighborhood: 'West Village',
  cuisine: 'Bistro',
  priceRange: '$$',
  address: '123 Bleecker St',
  lat: 40.7306,
  lng: -74.0021,
  tags: [],
};

const cards: CardProfile[] = [
  { id: 'amex-gold', name: 'Amex Gold', diningMultiplier: 4, pointType: 'MR', enabled: true },
  { id: 'bilt', name: 'Bilt', diningMultiplier: 3, rentDayMultiplier: 6, pointType: 'Bilt', enabled: true },
];

test('isOpenNow respects standard and overnight carry-over windows', () => {
  const fridayHours = [{ days: [5], openHour: 17, closeHour: 26 }]; // Friday 5 PM -> Sat 2 AM
  const fri8pm = new Date(2026, 10, 13, 20, 0); // Friday Nov 13 2026
  const sat1am = new Date(2026, 10, 14, 1, 0);  // Saturday Nov 14 2026
  const sat11am = new Date(2026, 10, 14, 11, 0);
  assert.equal(isOpenNow(fridayHours, fri8pm), true);
  assert.equal(isOpenNow(fridayHours, sat1am), true);
  assert.equal(isOpenNow(fridayHours, sat11am), false);
});

test('formatHours formats afternoon and midnight-crossing schedules', () => {
  assert.equal(formatHours([]), 'Hours variable');
  assert.equal(formatHours([{ days: [1], openHour: 17.5, closeHour: 23 }]), '5:30 PM to 11:00 PM');
});

test('calculateDistance and formatDistance compute miles and walk hints', () => {
  assert.equal(calculateDistance(40.73, -74.0, 40.73, -74.0), 0);
  assert.equal(formatDistance(0.05), 'Steps away');
  assert.equal(formatDistance(0.5), '0.5 mi (10 min walk)');
  assert.equal(formatDistance(1.8), '1.8 mi');
});

test('calculateBestStack picks highest arbitrage platform and applies Rent Day boost', () => {
  const overlapped: Venue = {
    ...baseVenue,
    inKind: { available: true, bonusPercentage: 20 },
    seated: { available: true, rewardPercentage: 15, bookingRequired: false },
    bilt: { available: true, baseMultiplier: 5 },
  };
  const regular = calculateBestStack(overlapped, cards, false);
  assert.equal(regular.primaryPlatform, 'inKind');
  assert.equal(regular.rawPercentValue, 26);
  assert.ok(regular.details.some((d) => d.includes('Arbitrage Overlap')));

  const rentDayOnlyBilt = calculateBestStack(
    { ...baseVenue, bilt: { available: true, baseMultiplier: 5 } },
    cards,
    true
  );
  assert.equal(rentDayOnlyBilt.primaryPlatform, 'Bilt');
  assert.match(rentDayOnlyBilt.headline, /Rent Day Peak: Earn 11x/);
});

test('calculateBestStack falls back to Direct Card when no platform enrolled', () => {
  const direct = calculateBestStack(baseVenue, cards, false);
  assert.equal(direct.primaryPlatform, 'Direct Card');
  assert.equal(direct.rawPercentValue, 6);
});

test('storage helpers hide, unhide, and reset venues in localStorage', () => {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  };
  assert.deepEqual(resetHiddenVenues(), []);
  assert.deepEqual(hideVenue('v-1'), ['v-1']);
  assert.deepEqual(hideVenue('v-1'), ['v-1']);
  assert.deepEqual(getHiddenVenueIds(), ['v-1']);
  assert.deepEqual(unhideVenue('v-1'), []);
});

// JER-788: reward terms freshness thresholds and captions
import {
  freshnessState,
  catalogAgeDays,
  rewardTermsLine,
} from '../src/utils/freshness';

test('freshness thresholds: fresh to 14d, muted to 45d, hidden after', () => {
  const now = new Date('2026-11-26T12:00:00Z');
  assert.equal(freshnessState('2026-11-26', now), 'fresh');
  assert.equal(freshnessState('2026-11-12', now), 'fresh');   // exactly 14d
  assert.equal(freshnessState('2026-11-11', now), 'muted');   // 15d
  assert.equal(freshnessState('2026-10-12', now), 'muted');   // exactly 45d
  assert.equal(freshnessState('2026-10-11', now), 'hidden');  // 46d
  assert.equal(catalogAgeDays('2026-12-01', now), 0);         // clock skew never negative
});

test('terms line: muted flags staleness, hidden withholds numbers and names the date', () => {
  const now = new Date('2026-11-26T12:00:00Z');
  const fresh = rewardTermsLine('2026-11-20', ['inKind', 'Bilt'], now);
  assert.match(fresh, /as of Nov 20, 2026/);
  assert.match(fresh, /inKind \/ Bilt/);
  assert.doesNotMatch(fresh, /stale/);
  const muted = rewardTermsLine('2026-10-25', ['Seated'], now);
  assert.match(muted, /may be stale/);
  const hidden = rewardTermsLine('2026-09-01', ['Seated'], now);
  assert.match(hidden, /too stale to show/);
  assert.match(hidden, /Sep 1, 2026/);
});

// JER-788 piece 2: Near Me never invents a position
import { locationOutcome, requestLocation, LOCATION_OFF_NOTICE } from '../src/utils/location';

test('granted location sorts closest with no notice', () => {
  const o = locationOutcome({ kind: 'granted', lat: 40.7, lng: -74.0 });
  assert.deepEqual(o.userLocation, { lat: 40.7, lng: -74.0 });
  assert.equal(o.setClosest, true);
  assert.equal(o.notice, null);
});

test('denied, unavailable and error keep the list and say so', () => {
  for (const kind of ['denied', 'unavailable', 'error'] as const) {
    const o = locationOutcome({ kind });
    assert.equal(o.userLocation, null);
    assert.equal(o.setClosest, false);
    assert.equal(o.notice, LOCATION_OFF_NOTICE);
  }
});

test('requestLocation maps browser outcomes, never fabricates coordinates', async () => {
  const granted = await requestLocation({
    getCurrentPosition: (ok) => ok({ coords: { latitude: 1, longitude: 2 } }),
  });
  assert.deepEqual(granted, { kind: 'granted', lat: 1, lng: 2 });
  const denied = await requestLocation({
    getCurrentPosition: (_ok, err) => err({ code: 1, PERMISSION_DENIED: 1 }),
  });
  assert.deepEqual(denied, { kind: 'denied' });
  const failed = await requestLocation({
    getCurrentPosition: (_ok, err) => err({ code: 2, PERMISSION_DENIED: 1 }),
  });
  assert.deepEqual(failed, { kind: 'error' });
  assert.deepEqual(await requestLocation(undefined), { kind: 'unavailable' });
});

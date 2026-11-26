// JER-788 piece 2: Near Me never invents a position. A denied, unavailable or failed
// lookup keeps the full list and the current sort, and the UI says so - no silent
// fallback point, no 0-of-0.

export type LocationResult =
  | { kind: 'granted'; lat: number; lng: number }
  | { kind: 'denied' }
  | { kind: 'unavailable' }
  | { kind: 'error' };

export interface LocationOutcome {
  userLocation: { lat: number; lng: number } | null;
  setClosest: boolean;
  notice: string | null;
}

export const LOCATION_OFF_NOTICE =
  'Location is off - the full list stays in its current order. Allow location access and try again to sort by what is nearest.';

export function locationOutcome(result: LocationResult): LocationOutcome {
  if (result.kind === 'granted') {
    return { userLocation: { lat: result.lat, lng: result.lng }, setClosest: true, notice: null };
  }
  return { userLocation: null, setClosest: false, notice: LOCATION_OFF_NOTICE };
}

export interface GeoLike {
  getCurrentPosition(
    ok: (pos: { coords: { latitude: number; longitude: number } }) => void,
    err: (e: { code: number; PERMISSION_DENIED: number }) => void,
    opts: { timeout: number; enableHighAccuracy: boolean }
  ): void;
}

export function requestLocation(geo: GeoLike | undefined, timeoutMs = 8000): Promise<LocationResult> {
  if (!geo) return Promise.resolve({ kind: 'unavailable' });
  return new Promise((resolve) => {
    geo.getCurrentPosition(
      (pos) => resolve({ kind: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (e) => resolve(e.code === e.PERMISSION_DENIED ? { kind: 'denied' } : { kind: 'error' }),
      { timeout: timeoutMs, enableHighAccuracy: true }
    );
  });
}

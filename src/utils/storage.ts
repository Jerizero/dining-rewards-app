const HIDDEN_KEY = 'dining_arbitrage_hidden_venues_v1';

export function getHiddenVenueIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read hidden venues from localStorage', e);
    return [];
  }
}

export function hideVenue(venueId: string): string[] {
  try {
    const current = getHiddenVenueIds();
    if (!current.includes(venueId)) {
      const updated = [...current, venueId];
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch (e) {
    console.error('Failed to save hidden venue', e);
    return [];
  }
}

export function unhideVenue(venueId: string): string[] {
  try {
    const current = getHiddenVenueIds();
    const updated = current.filter((id) => id !== venueId);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to unhide venue', e);
    return [];
  }
}

export function resetHiddenVenues(): string[] {
  try {
    localStorage.removeItem(HIDDEN_KEY);
    return [];
  } catch (e) {
    return [];
  }
}

const NEIGHBORHOOD_KEY = 'dining_arbitrage_neighborhood_v1';

// JER-788 piece 5: the neighborhood filter survives reloads. Read side never throws
// and only ever returns a plain string; the caller validates it against the catalog.
export function getSavedNeighborhood(): string | null {
  try {
    const raw = localStorage.getItem(NEIGHBORHOOD_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v === 'string' && v.length > 0 ? v : null;
  } catch (e) {
    console.error('Failed to read saved neighborhood from localStorage', e);
    return null;
  }
}

export function saveNeighborhood(neighborhood: string): void {
  try {
    localStorage.setItem(NEIGHBORHOOD_KEY, JSON.stringify(neighborhood));
  } catch (e) {
    console.error('Failed to save neighborhood', e);
  }
}

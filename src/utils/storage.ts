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

/**
 * JER-788: every reward number carries its data age and source, and stale terms
 * are never shown as a bare number. Thresholds (from the build spec): fresh up to
 * 14 days, muted (flagged, still shown) up to 45, hidden (numbers withheld) after.
 */

export type Freshness = 'fresh' | 'muted' | 'hidden';

export const FRESH_DAYS = 14;
export const STALE_DAYS = 45;
const DAY_MS = 86_400_000;

export function catalogAgeDays(asOf: string | Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(asOf).getTime()) / DAY_MS));
}

export function freshnessState(asOf: string | Date, now: Date = new Date()): Freshness {
  const age = catalogAgeDays(asOf, now);
  if (age <= FRESH_DAYS) return 'fresh';
  if (age <= STALE_DAYS) return 'muted';
  return 'hidden';
}

/** "Oct 25, 2026" */
export function formatAsOf(asOf: string | Date): string {
  return new Date(asOf).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** The one-line source/freshness caption shown with a venue's reward numbers. */
export function rewardTermsLine(asOf: string | Date, programs: string[], now?: Date): string {
  const state = freshnessState(asOf, now);
  const src = programs.length ? ` · ${programs.join(' / ')}` : '';
  if (state === 'hidden') {
    return `Reward terms last verified ${formatAsOf(asOf)} - too stale to show. Re-verify before relying.${src}`;
  }
  const stale = state === 'muted' ? ' (may be stale - re-verify)' : '';
  return `Reward terms as of ${formatAsOf(asOf)}${stale}${src}`;
}

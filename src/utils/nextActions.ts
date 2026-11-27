// JER-788 piece 4: one concrete next action per available program on the detail view.
// Every action copy states the mechanic (book, pay, check in) and the number the
// catalog claims; the freshness line beside it carries the terms' age (piece 1), so
// a muted catalog reads as possibly stale here too. Actions only point at flows the
// venue record itself supports - bookingUrl / mapsUrl, never an invented deep link.

import { Venue } from '../types';

export interface ProgramAction {
  program: string;
  action: string;
  url?: string;
}

export function venueNextActions(venue: Venue, mapsUrl: string): ProgramAction[] {
  const out: ProgramAction[] = [];
  if (venue.inKind?.available) {
    out.push({
      program: 'inKind',
      action: `Pay with the inKind app to get ${venue.inKind.bonusPercentage}% back in credit.`,
    });
  }
  if (venue.seated?.available) {
    out.push({
      program: 'Seated',
      action: venue.seated.bookingRequired
        ? `Book through Seated to earn ${venue.seated.rewardPercentage}% back on the check.`
        : `Pay with Seated linked to earn ${venue.seated.rewardPercentage}% back on the check.`,
      url: venue.bookingUrl,
    });
  }
  if (venue.bilt?.available) {
    out.push({
      program: 'Bilt',
      action: venue.bilt.isNeighborhoodPartner
        ? `Pay with a Bilt-linked card (neighborhood partner) to earn ${venue.bilt.baseMultiplier}x Bilt Dining bonus (+3x on Bilt Card = ${venue.bilt.baseMultiplier + 3}x total).`
        : `Pay with a Bilt-linked card to earn ${venue.bilt.baseMultiplier}x Bilt Dining bonus (+3x on Bilt Card = ${venue.bilt.baseMultiplier + 3}x total).`,
      url: venue.bookingUrl,
    });
  }
  if (venue.resyRewards?.available) {
    out.push({
      program: 'Resy Rewards',
      action: `Book through the Rewards tab in the Resy app and pay with an enrolled Amex Gold to earn 8x MR total (${venue.resyRewards.bonusMultiplier}x Resy Rewards bonus stacks on the card's dining rate).`,
      url: venue.bookingUrl,
    });
  }
  if (venue.blackbird?.available) {
    out.push({
      program: 'Blackbird',
      action: `Check in on Blackbird when you arrive to earn ${venue.blackbird.flyEarn} $FLY.`,
    });
  }
  // The venue itself: directions always work, reservation only when the record carries a link.
  out.push({ program: 'Go', action: 'Get directions.', url: mapsUrl });
  if (venue.bookingUrl) {
    out.push({ program: 'Book', action: 'Grab a table on the venue booking page.', url: venue.bookingUrl });
  }
  return out;
}

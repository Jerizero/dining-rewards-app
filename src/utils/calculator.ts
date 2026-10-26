import { Venue, OperatingHours, CardProfile, Recommendation } from '../types';

export function isOpenNow(hours: OperatingHours[], date: Date = new Date()): boolean {
  if (!hours || hours.length === 0) return true;

  const dayOfWeek = date.getDay();
  const currentHourDecimal = date.getHours() + date.getMinutes() / 60;

  for (const schedule of hours) {
    if (schedule.days.includes(dayOfWeek)) {
      if (currentHourDecimal >= schedule.openHour && currentHourDecimal <= schedule.closeHour) {
        return true;
      }
    }
    const yesterday = (dayOfWeek + 6) % 7;
    if (schedule.days.includes(yesterday) && schedule.closeHour > 24.0) {
      const carriedOverClose = schedule.closeHour - 24.0;
      if (currentHourDecimal <= carriedOverClose) {
        return true;
      }
    }
  }

  return false;
}

export function formatHours(hours: OperatingHours[]): string {
  if (!hours || hours.length === 0) return 'Hours variable';
  const first = hours[0];
  const fmt = (h: number) => {
    const norm = h >= 24 ? h - 24 : h;
    const hour = Math.floor(norm);
    const min = Math.round((norm - hour) * 60);
    const period = h >= 12 && h < 24 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${min < 10 ? '0' : ''}${min} ${period}`;
  };
  return `${fmt(first.openHour)} to ${fmt(first.closeHour)}`;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return 'Steps away';
  if (miles < 1.0) {
    const mins = Math.round(miles * 20);
    return `${miles.toFixed(1)} mi (${mins} min walk)`;
  }
  return `${miles.toFixed(1)} mi`;
}

export function calculateBestStack(
  venue: Venue,
  cards: CardProfile[],
  isRentDay: boolean
): Recommendation {
  const activeCards = cards.filter((c) => c.enabled !== false);
  const pool = activeCards.length > 0 ? activeCards : cards;

  const bestBiltCard = pool.find((c) => c.id === 'bilt');
  const bestAmex = pool.find((c) => c.id === 'amex-gold');
  const bestChase = pool.find((c) => c.id === 'csr');
  const bestRobinhood = pool.find((c) => c.id === 'robinhood');

  const biltCardMultiplier = isRentDay ? (bestBiltCard?.rentDayMultiplier || 6) : (bestBiltCard?.diningMultiplier || 3);
  const defaultCardUsed = bestAmex?.name || bestChase?.name || bestRobinhood?.name || 'Amex Gold / Chase Sapphire';
  const defaultCardPoints = bestAmex ? `${bestAmex.diningMultiplier}x ${bestAmex.pointType}` : '3x Points';

  const candidates: Recommendation[] = [];

  // 1. inKind
  if (venue.inKind?.available) {
    const bonus = venue.inKind.bonusPercentage;
    const rawVal = bonus + 6;
    candidates.push({
      primaryPlatform: 'inKind',
      headline: `Save ${bonus}% upfront with inKind`,
      effectiveValue: `~${rawVal}% Total Return`,
      rawPercentValue: rawVal,
      recommendedCard: defaultCardUsed,
      details: [
        `Pay check with inKind House Account for ${bonus}% bonus credit`,
        `Stack with ${defaultCardUsed} to earn ${defaultCardPoints} on credit purchase`,
      ],
    });
  }

  // 2. Seated
  if (venue.seated?.available) {
    const reward = venue.seated.rewardPercentage;
    const rawVal = reward + 6;
    candidates.push({
      primaryPlatform: 'Seated',
      headline: `Get ${reward}% back via Seated`,
      effectiveValue: `~${rawVal}% Total Return`,
      rawPercentValue: rawVal,
      recommendedCard: defaultCardUsed,
      details: [
        `Upload receipt or book via Seated for ${reward}% back in brand gift cards (Amazon, Lyft)`,
        `Pay with ${defaultCardUsed} for an additional ${defaultCardPoints}`,
        venue.seated.bookingRequired ? 'Requires reservation booking through Seated' : 'Walk-ins accepted (upload receipt)',
      ],
    });
  }

  // 3. Bilt
  if (venue.bilt?.available) {
    const basePts = venue.bilt.baseMultiplier;
    const totalPts = basePts + biltCardMultiplier;
    // Bilt points valued conservatively at 1.8c each
    const rawVal = Math.round(totalPts * 1.8);
    candidates.push({
      primaryPlatform: 'Bilt',
      headline: isRentDay 
        ? `Rent Day Peak: Earn ${totalPts}x Bilt Points today!`
        : `Earn ${totalPts}x total Bilt Points on dining`,
      effectiveValue: `${totalPts}x Points (~${rawVal}%)`,
      rawPercentValue: rawVal,
      recommendedCard: 'Bilt Mastercard (or any linked card in Bilt Wallet)',
      details: [
        `Earns ${basePts}x Bilt Dining bonus points`,
        `Earns ${biltCardMultiplier}x from Bilt Card (${isRentDay ? 'Double Points on Rent Day!' : '3x standard dining'})`,
        'Points transfer 1:1 to Hyatt, United, and top airline programs',
      ],
    });
  }

  // 4. Blackbird
  if (venue.blackbird?.available) {
    const fly = venue.blackbird.flyEarn;
    candidates.push({
      primaryPlatform: 'Blackbird',
      headline: `Earn ${fly} $FLY + In-app perk`,
      effectiveValue: `${fly} $FLY + Perk (~12%)`,
      rawPercentValue: 12,
      recommendedCard: defaultCardUsed,
      details: [
        `Check-in via Blackbird at table/counter to earn ${fly} $FLY tokens`,
        venue.blackbird.perkTitle ? `Perk: ${venue.blackbird.perkTitle}` : 'Qualifies for status level tier advancement',
        `Pay directly with ${defaultCardUsed} for max points`,
      ],
    });
  }

  // If no platform, direct card
  if (candidates.length === 0) {
    return {
      primaryPlatform: 'Direct Card',
      headline: 'Pay directly with highest multiplier card',
      effectiveValue: '4x Points / 3% Cash',
      rawPercentValue: 6,
      recommendedCard: bestAmex?.name || 'Amex Gold (4x Dining)',
      details: [
        'Not currently enrolled on inKind, Seated, or Bilt',
        'Use Amex Gold for 4x Membership Rewards or Chase Sapphire for 3x Ultimate Rewards',
      ],
    };
  }

  // Sort candidates by highest rawPercentValue
  candidates.sort((a, b) => b.rawPercentValue - a.rawPercentValue);
  const winner = candidates[0];

  // If there are other available platforms, append arbitrage comparison note!
  if (candidates.length > 1) {
    const runnersUp = candidates.slice(1).map((c) => `${c.primaryPlatform} (${c.effectiveValue})`).join(', ');
    winner.details.push(`⚡ Arbitrage Overlap: Also listed on ${runnersUp}.`);
  }

  return winner;
}

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
  const amexMult = bestAmex?.diningMultiplier || 4;
  // On non-Rent Days, Amex Gold (4x MR ~8%) beats Bilt Card (3x ~5.4%) and STILL triggers Bilt Neighborhood Dining if linked!
  const useBiltCard = Boolean(bestBiltCard && (isRentDay || !bestAmex));
  const bestDiningCard = useBiltCard
    ? (bestBiltCard?.name || 'Bilt Mastercard')
    : (bestAmex?.name || bestChase?.name || bestRobinhood?.name || 'Amex Gold');
  const bestDiningCardShort = useBiltCard ? 'Bilt Card' : (bestAmex ? 'Amex Gold' : bestChase ? 'Chase Sapphire' : bestDiningCard);
  const bestDiningCardPct = useBiltCard ? Math.round(biltCardMultiplier * 1.8) : (bestAmex ? Math.round(amexMult * 2) : 6);
  const defaultCardPoints = useBiltCard
    ? `${biltCardMultiplier}x Bilt Points${isRentDay ? ' (Rent Day 2x, 1k pt cap)' : ''}`
    : (bestAmex ? `${amexMult}x ${bestAmex.pointType}` : '3x Points');

  const biltDiningBonusPts = venue.bilt?.available ? venue.bilt.baseMultiplier : 0;
  const biltDiningBonusPct = Math.round(biltDiningBonusPts * 1.8);

  const candidates: Recommendation[] = [];

  // 1. inKind
  if (venue.inKind?.available) {
    const bonus = venue.inKind.bonusPercentage;
    const rawVal = bonus + 6;
    candidates.push({
      primaryPlatform: 'inKind',
      headline: `Save ${bonus}% upfront with inKind`,
      directive: `Pay in-app with inKind credit (${bonus}% bonus + card earn on credit purchase)`,
      effectiveValue: `~${rawVal}% back`,
      rawPercentValue: rawVal,
      recommendedCard: bestDiningCard,
      details: [
        `Pay check in the inKind app for ${bonus}% bonus credit`,
        `Buy discounted inKind credit (e.g. Costco / promos) with ${bestDiningCardShort} to stack upfront savings`,
      ],
    });
  }

  // 2. Seated (stacks automatically with card earn + Bilt Neighborhood Dining when linked!)
  if (venue.seated?.available) {
    const reward = venue.seated.rewardPercentage;
    const stackBilt = biltDiningBonusPts > 0;
    const rawVal = reward + bestDiningCardPct + (stackBilt ? biltDiningBonusPct : 0);
    const cardClause = stackBilt
      ? `${bestDiningCardShort} (linked in Bilt for +${biltDiningBonusPts}x)`
      : bestDiningCardShort;
    const directive = venue.seated.bookingRequired
      ? `Book via Seated, pay with ${cardClause}, upload receipt`
      : `Pay with ${cardClause}, then upload receipt to Seated`;
    const details = [
      `${reward}% back via Seated in brand gift cards (Amazon, Lyft, Uber)`,
      `${defaultCardPoints} from ${bestDiningCardShort}`,
    ];
    if (stackBilt) {
      details.push(`+${biltDiningBonusPts}x Bilt Neighborhood Dining bonus auto-stacks when ${bestDiningCardShort} is linked in Bilt Wallet`);
    }
    candidates.push({
      primaryPlatform: 'Seated',
      headline: `Get ${reward}% back via Seated`,
      directive,
      effectiveValue: `~${rawVal}% back`,
      rawPercentValue: rawVal,
      recommendedCard: bestDiningCard,
      details,
    });
  }

  // 3. Resy Rewards (+4x MR with enrolled Amex Gold = 8x total, stackable with Bilt Neighborhood Dining)
  if (venue.resyRewards?.available) {
    const resyBonus = venue.resyRewards.bonusMultiplier || 4;
    const totalMr = (bestAmex ? amexMult : 4) + resyBonus;
    const rawVal = Math.round(totalMr * 2) + (biltDiningBonusPts > 0 ? biltDiningBonusPct : 0);
    const biltClause = biltDiningBonusPts > 0 ? ` (+${biltDiningBonusPts}x Bilt if linked)` : '';
    candidates.push({
      primaryPlatform: 'Resy Rewards',
      headline: `Earn ${totalMr}x Amex MR via Resy Rewards`,
      directive: `Book in Resy iOS Rewards tab, pay with enrolled Amex Gold${biltClause}`,
      effectiveValue: `${totalMr}x MR (~${rawVal}%)`,
      rawPercentValue: rawVal,
      recommendedCard: 'American Express Gold',
      details: [
        `Enroll Amex Gold in Resy Rewards and book via the Resy Rewards tab for +${resyBonus}x bonus MR on food & beverage`,
        `Stacks with standard 4x Amex Gold dining = ${totalMr}x Membership Rewards`,
      ],
    });
  }

  // 4. Bilt Neighborhood Dining (auto-stacks with ANY linked card — Amex Gold 4x + Bilt bonus beats Bilt Card 3x on non-Rent Days!)
  if (venue.bilt?.available) {
    const basePts = venue.bilt.baseMultiplier;
    const cardMult = useBiltCard ? biltCardMultiplier : amexMult;
    const totalPts = basePts + cardMult;
    const rawVal = Math.round(basePts * 1.8) + bestDiningCardPct;
    const directive = useBiltCard
      ? `Pay with Bilt Card (${isRentDay ? 'Rent Day 2x, 1k bonus pt cap' : `${totalPts}x total Bilt pts`})`
      : `Pay with ${bestDiningCardShort} linked in Bilt Wallet (${amexMult}x MR + ${basePts}x Bilt)`;
    candidates.push({
      primaryPlatform: 'Bilt',
      headline: isRentDay
        ? `Rent Day Peak: ${totalPts}x Bilt Points`
        : `${totalPts}x combined (${bestDiningCardShort} + Bilt Dining)`,
      directive,
      effectiveValue: `${totalPts}x (~${rawVal}%)`,
      rawPercentValue: rawVal,
      recommendedCard: bestDiningCard,
      details: [
        `+${basePts}x Bilt Neighborhood Dining bonus automatically via linked card`,
        useBiltCard
          ? `Earns ${biltCardMultiplier}x from Bilt Card (${isRentDay ? 'Double Points on Rent Day, capped at 1,000 bonus pts / ~$333 spend' : '3x standard dining'})`
          : `Earns ${amexMult}x Amex MR from linked Amex Gold (beats 3x Bilt Card on non-Rent Days)`,
      ],
    });
  }

  // 5. Blackbird
  if (venue.blackbird?.available) {
    const fly = venue.blackbird.flyEarn;
    const rawVal = 12 + (biltDiningBonusPts > 0 ? biltDiningBonusPct : 0);
    candidates.push({
      primaryPlatform: 'Blackbird',
      headline: `Earn ${fly} $FLY + In-app perk`,
      directive: `Tap Blackbird puck at host/table, pay with ${bestDiningCardShort}`,
      effectiveValue: `${fly} $FLY (~${rawVal}%)`,
      rawPercentValue: rawVal,
      recommendedCard: bestDiningCard,
      details: [
        `Check in via Blackbird at table/counter to earn ${fly} $FLY`,
        venue.blackbird.perkTitle ? `Perk: ${venue.blackbird.perkTitle}` : 'Counts toward Blackbird status perks',
      ],
    });
  }

  // If no platform, direct card
  if (candidates.length === 0) {
    return {
      primaryPlatform: 'Direct Card',
      headline: 'Pay directly with highest multiplier card',
      directive: `Pay directly with ${bestDiningCardShort} (${defaultCardPoints})`,
      effectiveValue: `~${bestDiningCardPct}% back`,
      rawPercentValue: bestDiningCardPct,
      recommendedCard: bestDiningCard,
      details: [
        'Not currently enrolled on inKind, Seated, Bilt, or Blackbird',
        `Use ${bestDiningCardShort} for ${defaultCardPoints}`,
      ],
    };
  }

  // Sort candidates by highest rawPercentValue
  candidates.sort((a, b) => b.rawPercentValue - a.rawPercentValue);
  const winner = candidates[0];

  // If there are other available platforms, append arbitrage comparison note!
  if (candidates.length > 1) {
    const runnersUp = candidates.slice(1).map((c) => `${c.primaryPlatform} (${c.effectiveValue})`).join(', ');
    winner.details.push(`Also on: ${runnersUp}.`);
  }

  return winner;
}

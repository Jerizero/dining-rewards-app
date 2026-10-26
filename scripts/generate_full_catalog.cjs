const fs = require('fs');
const path = require('path');

const inkindPath = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-re/inkind/all_locations.json';
const seatedPath = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-re/seated/all_seated_nyc.json';
const biltPath = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-re/bilt/all_bilt_nyc.json';
const blackbirdPath = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-re/blackbird/harvested_blackbird.json';
const curatedPath = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-app/scripts/curated_72_full.ts';

const inkindRaw = fs.existsSync(inkindPath) ? JSON.parse(fs.readFileSync(inkindPath, 'utf8')) : { locations: [], brands: [], tags: [] };
const seatedRaw = fs.existsSync(seatedPath) ? JSON.parse(fs.readFileSync(seatedPath, 'utf8')) : [];
const biltRaw = fs.existsSync(biltPath) ? JSON.parse(fs.readFileSync(biltPath, 'utf8')) : [];
const blackbirdRaw = fs.existsSync(blackbirdPath) ? JSON.parse(fs.readFileSync(blackbirdPath, 'utf8')) : [];

const brandsMap = new Map((inkindRaw.brands || []).map(b => [b.slug, b]));
const tagsMap = new Map((inkindRaw.tags || []).map(t => [t.id, t.name]));

function getNeighborhood(lat, lng, address = '', city = '') {
  const addr = (address || '').toLowerCase();
  const c = (city || '').toLowerCase();

  // Manhattan
  if (lat >= 40.700 && lat <= 40.880 && lng >= -74.025 && lng <= -73.910 && (c.includes('new york') || c.includes('manhattan') || c === '')) {
    if (lat < 40.718) return 'Tribeca & FiDi';
    if (lat >= 40.718 && lat < 40.728 && lng < -73.998) return 'SoHo';
    if (lat >= 40.718 && lat < 40.728 && lng >= -73.998 && lng < -73.992) return 'Nolita';
    if (lat >= 40.712 && lat < 40.725 && lng >= -73.992) return 'Lower East Side';
    if (lat >= 40.728 && lat < 40.738 && lng < -73.998) return 'West Village';
    if (lat >= 40.725 && lat < 40.738 && lng >= -73.998) return 'East Village';
    if (lat >= 40.738 && lat < 40.750 && lng < -73.995) return 'Chelsea';
    if (lat >= 40.738 && lat < 40.750 && lng >= -73.995) return 'Flatiron & NoMad';
    if (lat >= 40.750 && lat < 40.772 && lng < -73.985) return "Hell's Kitchen";
    if (lat >= 40.750 && lat < 40.772 && lng >= -73.985) return 'Midtown';
    if (lat >= 40.772 && lat < 40.820 && lng < -73.960) return 'Upper West Side';
    if (lat >= 40.772 && lat < 40.820 && lng >= -73.960) return 'Upper East Side';
    if (lat >= 40.820) return 'Harlem';
    return 'Midtown';
  }

  // Brooklyn
  if (c.includes('brooklyn') || (lat >= 40.570 && lat < 40.740 && lng >= -74.040 && lng < -73.850)) {
    if (lat >= 40.722 && lat <= 40.740 && lng >= -73.965 && lng <= -73.935) return 'Greenpoint';
    if (lat >= 40.700 && lat < 40.722 && lng >= -73.970 && lng <= -73.935) return 'Williamsburg';
    if (lat >= 40.690 && lat < 40.710 && lng < -73.985) return 'DUMBO & Heights';
    if (lat >= 40.660 && lat < 40.690 && lng < -73.960) return 'Park Slope & Boerum Hill';
    if (lat >= 40.675 && lat < 40.710 && lng >= -73.945 && lng < -73.900) return 'Bushwick';
    return 'Brooklyn';
  }

  // Queens
  if (c.includes('astoria') || (lat >= 40.750 && lat <= 40.785 && lng >= -73.940 && lng <= -73.900)) return 'Astoria';
  if (c.includes('long island city') || (lat >= 40.735 && lat < 40.755 && lng >= -73.960 && lng <= -73.925)) return 'Long Island City';
  if (c.includes('queens') || (lat >= 40.700 && lat <= 40.780 && lng >= -73.920 && lng <= -73.720)) return 'Queens';

  if (c.includes('bronx')) return 'The Bronx';
  if (c.includes('staten island')) return 'Staten Island';

  return 'Midtown';
}

function getCuisine(text = '') {
  const t = text.toLowerCase();
  if (t.includes('sushi') || t.includes('japanese') || t.includes('ramen') || t.includes('omakase') || t.includes('izakaya')) return 'Japanese';
  if (t.includes('pasta') || t.includes('italian') || t.includes('pizza') || t.includes('trattoria') || t.includes('gelato')) return 'Italian';
  if (t.includes('taco') || t.includes('mexican') || t.includes('cantina') || t.includes('burrito') || t.includes('taqueria') || t.includes('latin')) return 'Mexican';
  if (t.includes('french') || t.includes('bistro') || t.includes('brasserie') || t.includes('crepe')) return 'French';
  if (t.includes('korean') || t.includes('k-bbq') || t.includes('kbbq')) return 'Korean';
  if (t.includes('greek') || t.includes('mediterranean') || t.includes('tapas') || t.includes('spanish') || t.includes('hummus') || t.includes('falafel') || t.includes('middle eastern')) return 'Mediterranean';
  if (t.includes('coffee') || t.includes('cafe') || t.includes('bakery') || t.includes('pastry') || t.includes('donut') || t.includes('bagel')) return 'Bakery & Coffee';
  if (t.includes('cocktail') || t.includes('wine bar') || t.includes('speakeasy') || t.includes('brewery') || t.includes('bar ') || t.endsWith(' bar') || t.includes('pub') || t.includes('lounge')) return 'Cocktails & Bar';
  return 'American';
}

function getPriceRange(ratingOrStr) {
  if (typeof ratingOrStr === 'number') {
    if (ratingOrStr <= 1) return '$';
    if (ratingOrStr === 2) return '$$';
    if (ratingOrStr === 3) return '$$$';
    if (ratingOrStr >= 4) return '$$$$';
  }
  if (ratingOrStr === '$' || ratingOrStr === '$$' || ratingOrStr === '$$$' || ratingOrStr === '$$$$') return ratingOrStr;
  if (ratingOrStr === 'very_low' || ratingOrStr === 'low') return '$';
  if (ratingOrStr === 'mid') return '$$';
  if (ratingOrStr === 'high') return '$$$';
  if (ratingOrStr === 'very_high') return '$$$$';
  return '$$';
}

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

// 1. Initial curated venues
const currentFileContent = fs.readFileSync(curatedPath, 'utf8');
const existingVenuesMatch = currentFileContent.match(/export const VENUES: Venue\[\] = (\[[\s\S]*\]);?\s*$/);
let existingVenues = [];
if (existingVenuesMatch) {
  try {
    existingVenues = eval(existingVenuesMatch[1]);
  } catch (err) {
    console.warn('Could not eval existing:', err.message);
  }
}

const seenIds = new Set();
const finalVenues = [];
const venuesByNormName = new Map();

for (const v of existingVenues) {
  seenIds.add(v.id);
  const norm = normalizeName(v.name);
  venuesByNormName.set(norm, v);
  finalVenues.push(v);
}

// 2. inKind (1,306 venues)
const nycInKind = (inkindRaw.locations || []).filter(loc => {
  if (!loc.address) return false;
  const isNY = loc.address.state_code === 'NY';
  const lat = loc.address.latitude;
  const lng = loc.address.longitude;
  const inNYC = lat >= 40.50 && lat <= 40.95 && lng >= -74.25 && lng <= -73.65;
  return isNY && inNYC && loc.status === 'active';
});

console.log(`Processing ${nycInKind.length} inKind NYC locations...`);

for (const loc of nycInKind) {
  const brand = brandsMap.get(loc.brand_slug);
  let cleanName = loc.name || (brand ? brand.name : 'NYC Dining');
  cleanName = cleanName.replace(/\s*-\s*(New York|NYC|Manhattan|Brooklyn)\s*$/i, '').trim();

  const norm = normalizeName(cleanName);
  const brandNorm = brand ? normalizeName(brand.name) : '';

  const match = venuesByNormName.get(norm) || (brandNorm ? venuesByNormName.get(brandNorm) : null);
  const bonusRate = (loc.pbs && loc.pbs[0]) ? Math.round(loc.pbs[0] * 100) : 20;

  if (match) {
    if (!match.inKind) {
      match.inKind = {
        available: true,
        bonusPercentage: bonusRate,
        tierNote: `${bonusRate}% bonus credit on food and beverage via inKind House Account`,
      };
    }
    if (loc.rating && !match.rating) match.rating = loc.rating;
    if (loc.review_count && !match.reviewCount) match.reviewCount = loc.review_count;
    continue;
  }

  let baseId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!baseId) baseId = `inkind-${loc.id}`;
  let uniqueId = baseId;
  let counter = 1;
  while (seenIds.has(uniqueId)) {
    uniqueId = `${baseId}-${counter++}`;
  }
  seenIds.add(uniqueId);

  const lat = loc.address.latitude;
  const lng = loc.address.longitude;
  const address = `${loc.address.street}, ${loc.address.city}, NY ${loc.address.zip_code || ''}`.trim();
  const neighborhood = getNeighborhood(lat, lng, loc.address.street, loc.address.city);
  const brandTagsText = (brand && brand.tags ? brand.tags.map(t => tagsMap.get(t.id)).join(' ') : '');
  const cuisine = getCuisine(cleanName + ' ' + brandTagsText);
  const priceRange = getPriceRange(brand ? brand.check_average : 'mid');

  const tags = [];
  if (brand && brand.tags) {
    brand.tags.slice(0, 3).forEach(t => {
      const name = tagsMap.get(t.id);
      if (name && !tags.includes(name)) tags.push(name);
    });
  }
  if (!tags.includes(neighborhood)) tags.push(neighborhood);

  const newV = {
    id: uniqueId,
    name: cleanName,
    neighborhood,
    address,
    lat,
    lng,
    cuisine,
    priceRange,
    description: `${cleanName} in ${neighborhood} offering signature ${cuisine} fare. Rated ${loc.rating || 4.5}★.`,
    hours: [{ days: [0, 1, 2, 3, 4, 5, 6], openHour: 11.5, closeHour: 23.0 }],
    inKind: {
      available: true,
      bonusPercentage: bonusRate,
      tierNote: `${bonusRate}% bonus credit on food and beverage via inKind House Account`,
    },
    tags,
    rating: loc.rating || undefined,
    reviewCount: loc.review_count || undefined,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + address)}`,
  };

  finalVenues.push(newV);
  venuesByNormName.set(norm, newV);
}

// 3. Seated (804 venues)
console.log(`Processing ${seatedRaw.length} Seated NYC locations...`);
let seatedMerged = 0;
let seatedAdded = 0;

for (const s of seatedRaw) {
  const cleanName = (s.name || '').trim();
  const norm = normalizeName(cleanName);
  const match = venuesByNormName.get(norm);

  const rewardRate = s.maxReward || s.baseReward || 15;
  const seatedReward = {
    available: true,
    rewardPercentage: Math.round(rewardRate),
    bookingRequired: s.isDineIn !== true,
    notes: `${Math.round(rewardRate)}% back via Seated (gift cards for Amazon/Lyft)`,
  };

  if (match) {
    match.seated = seatedReward;
    if (s.placesRating && !match.rating) match.rating = s.placesRating;
    if (s.placesReviewCount && !match.reviewCount) match.reviewCount = s.placesReviewCount;
    if (s.primaryBookingProvider && !match.bookingUrl) match.bookingUrl = s.primaryBookingProvider.url;
    seatedMerged++;
    continue;
  }

  let baseId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!baseId) baseId = `seated-${s.id}`;
  let uniqueId = baseId;
  let counter = 1;
  while (seenIds.has(uniqueId)) {
    uniqueId = `${baseId}-${counter++}`;
  }
  seenIds.add(uniqueId);

  const lat = s.latitude;
  const lng = s.longitude;
  const address = s.address || 'New York, NY';
  const neighborhood = getNeighborhood(lat, lng, address, s.neighborhood?.name || '');
  const cuisine = getCuisine((s.primaryCuisine?.name || '') + ' ' + (s.tags ? s.tags.map(t => t.name).join(' ') : ''));
  const priceRange = getPriceRange(s.priceRating);

  const tags = (s.tags || []).slice(0, 3).map(t => t.name);
  if (!tags.includes(neighborhood)) tags.push(neighborhood);

  const newV = {
    id: uniqueId,
    name: cleanName,
    neighborhood,
    address,
    lat,
    lng,
    cuisine,
    priceRange,
    description: s.thoughts ? s.thoughts.replace(/[\r\n]+/g, ' ').slice(0, 150) + '...' : `${cleanName} in ${neighborhood} offering ${cuisine} dining. Rated ${s.placesRating || 4.4}★.`,
    hours: [{ days: [0, 1, 2, 3, 4, 5, 6], openHour: 12.0, closeHour: 23.0 }],
    seated: seatedReward,
    tags,
    rating: s.placesRating || s.yelpRating || undefined,
    reviewCount: s.placesReviewCount || s.yelpReviewCount || undefined,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + address)}`,
    bookingUrl: s.primaryBookingProvider?.url || undefined,
  };

  finalVenues.push(newV);
  venuesByNormName.set(norm, newV);
  seatedAdded++;
}

// 4. Bilt Rewards (2,000 venues)
console.log(`Processing ${biltRaw.length} Bilt Rewards NYC locations...`);
let biltMerged = 0;
let biltAdded = 0;

for (const b of biltRaw) {
  const cleanName = (b.name || '').trim();
  const norm = normalizeName(cleanName);
  const match = venuesByNormName.get(norm);

  const maxBenefit = (b.benefits || []).reduce((max, item) => {
    const val = parseInt(item.value, 10);
    return !isNaN(val) && val > max ? val : max;
  }, 3);

  const biltReward = {
    available: true,
    baseMultiplier: maxBenefit,
    isNeighborhoodPartner: true,
  };

  if (match) {
    match.bilt = biltReward;
    if (b.details?.rating?.overallRating && !match.rating) match.rating = b.details.rating.overallRating;
    if (b.details?.rating?.numberOfRatings && !match.reviewCount) match.reviewCount = b.details.rating.numberOfRatings;
    biltMerged++;
    continue;
  }

  const loc = b.location || {};
  const lat = loc.latitude;
  const lng = loc.longitude;
  if (!lat || !lng) continue;

  let baseId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!baseId) baseId = `bilt-${b.id}`;
  let uniqueId = baseId;
  let counter = 1;
  while (seenIds.has(uniqueId)) {
    uniqueId = `${baseId}-${counter++}`;
  }
  seenIds.add(uniqueId);

  const addrObj = loc.address || {};
  const address = `${addrObj.address1 || ''}, ${addrObj.city || 'New York'}, NY ${addrObj.zip || ''}`.trim();
  const neighborhood = getNeighborhood(lat, lng, address, loc.neighborhood || '');
  const cuisinesList = b.details?.cuisines || [];
  const cuisine = getCuisine(cleanName + ' ' + cuisinesList.join(' '));
  const priceRange = getPriceRange(b.details?.priceRange);

  const tags = [...cuisinesList.slice(0, 2)];
  if (!tags.includes(neighborhood)) tags.push(neighborhood);

  const newV = {
    id: uniqueId,
    name: cleanName,
    neighborhood,
    address,
    lat,
    lng,
    cuisine,
    priceRange,
    description: `${cleanName} in ${neighborhood} offering ${cuisine} cuisine. Earns ${maxBenefit}x Bilt points with any linked card.`,
    hours: [{ days: [0, 1, 2, 3, 4, 5, 6], openHour: 11.0, closeHour: 23.0 }],
    bilt: biltReward,
    tags,
    rating: b.details?.rating?.overallRating || undefined,
    reviewCount: b.details?.rating?.numberOfRatings || undefined,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + address)}`,
  };

  finalVenues.push(newV);
  venuesByNormName.set(norm, newV);
  biltAdded++;
}

// 5. Blackbird (152 harvested venues)
console.log(`Processing ${blackbirdRaw.length} Blackbird NYC locations...`);
let blackbirdMerged = 0;
let blackbirdAdded = 0;

for (const bb of blackbirdRaw) {
  const cleanName = (bb.name || '').trim();
  const norm = normalizeName(cleanName);
  const match = venuesByNormName.get(norm);

  const bbReward = {
    available: true,
    flyEarn: 200,
    perkTitle: '200 $FLY per visit + Tier Rewards',
    hasResyHook: true,
  };

  if (match) {
    match.blackbird = bbReward;
    blackbirdMerged++;
    continue;
  }

  let baseId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!baseId) baseId = `bb-${finalVenues.length}`;
  let uniqueId = baseId;
  let counter = 1;
  while (seenIds.has(uniqueId)) {
    uniqueId = `${baseId}-${counter++}`;
  }
  seenIds.add(uniqueId);

  const neighborhood = bb.neighborhood || 'Midtown';
  const cuisine = getCuisine(cleanName + ' ' + (bb.cuisine || ''));
  const priceRange = getPriceRange(bb.price);

  const newV = {
    id: uniqueId,
    name: cleanName,
    neighborhood,
    address: `${cleanName}, ${neighborhood}, New York, NY`,
    lat: 40.7580, // Default midtown coords for map clustering if exact coords not in UI dump
    lng: -73.9855,
    cuisine,
    priceRange,
    description: `${cleanName} in ${neighborhood}. Pay or check in via Blackbird for 200 $FLY points and exclusive loyalty perks.`,
    hours: [{ days: [0, 1, 2, 3, 4, 5, 6], openHour: 11.0, closeHour: 23.0 }],
    blackbird: bbReward,
    tags: [neighborhood, cuisine, '10X Club'].filter(Boolean),
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + neighborhood + ' New York')}`,
  };

  finalVenues.push(newV);
  venuesByNormName.set(norm, newV);
  blackbirdAdded++;
}

console.log(`\n=== CATALOG SUMMARY ===`);
console.log(`Total Venues in Directory: ${finalVenues.length}`);
console.log(`inKind Active: ${finalVenues.filter(v => v.inKind?.available).length}`);
console.log(`Seated Active: ${finalVenues.filter(v => v.seated?.available).length}`);
console.log(`Bilt Active: ${finalVenues.filter(v => v.bilt?.available).length}`);
console.log(`Blackbird Active: ${finalVenues.filter(v => v.blackbird?.available).length}`);

const multiPlatform = finalVenues.filter(v => {
  const count = (v.inKind ? 1 : 0) + (v.seated ? 1 : 0) + (v.bilt ? 1 : 0) + (v.blackbird ? 1 : 0);
  return count >= 2;
});
console.log(`Multi-Platform Arbitrage Spots: ${multiPlatform.length}`);

// Write final combined venues.json
const jsonOutputPath = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-app/src/data/venues.json';
fs.writeFileSync(jsonOutputPath, JSON.stringify(finalVenues, null, 2), 'utf8');
console.log(`Wrote ${finalVenues.length} venues to ${jsonOutputPath}`);

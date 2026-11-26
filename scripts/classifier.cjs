// Cuisine and neighborhood classifiers shared by the catalog generator
// (scripts/generate_full_catalog.cjs) and the unit tests (tests/classifier.test.ts).
// Extracted from generate_full_catalog.cjs in JER-806.

function getNeighborhood(lat, lng, address = '', city = '') {
  const addr = (address || '').toLowerCase();
  const c = (city || '').toLowerCase();

  // Coordinates dominate the city string: a Manhattan lat/lng must never fall
  // through to the Brooklyn box just because the city field holds a
  // neighborhood name (or a bad 'Brooklyn' label). The two boxes overlap below
  // lat 40.740, so the East River is the tiebreaker:
  //  - lat < 40.707: Manhattan only west of -74.005 (Battery / BPC / Tribeca).
  //  - lat >= 40.707: Manhattan only west of -73.968 (east of that in this
  //    band is the East River, DUMBO, Brooklyn Heights, Williamsburg).
  const inManhattanBox = lat >= 40.700 && lat <= 40.880 && lng >= -74.025 && lng <= -73.910;
  const westOfEastRiver = lat >= 40.707 ? lng < -73.968 : lng <= -74.005;
  const isManhattan = inManhattanBox && westOfEastRiver;

  // Manhattan
  if (isManhattan) {
    if (lat < 40.710) return 'Tribeca & FiDi';
    if (lat < 40.720 && lng >= -74.005 && lng < -73.992) return 'Chinatown & Little Italy';
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
  const has = (w) => new RegExp('\\b' + w + '\\b').test(t);
  if (t.includes('sushi') || t.includes('japanese') || t.includes('ramen') || t.includes('omakase') || t.includes('izakaya') || t.includes('yakitori') || t.includes('donburi')) return 'Japanese';
  if (t.includes('pasta') || t.includes('italian') || t.includes('pizza') || t.includes('trattoria') || t.includes('gelato') || t.includes('osteria') || t.includes('enoteca')) return 'Italian';
  if (t.includes('indian') || t.includes('tandoor') || t.includes('curry') || t.includes('masala') || t.includes('tikka') || t.includes('naan') || t.includes('samosa') || t.includes('biryani') || t.includes('pakora')) return 'Indian';
  if (t.includes('thai') || t.includes('pad thai') || t.includes('satay')) return 'Thai';
  if (t.includes('chinese') || t.includes('sichuan') || t.includes('szechuan') || t.includes('cantonese') || t.includes('dim sum') || t.includes('wonton') || t.includes('dumpling') || t.includes('hot pot') || t.includes('peking')) return 'Chinese';
  if (t.includes('vietnamese') || has('pho') || t.includes('banh mi') || t.includes('bun bo') || t.includes('spring roll')) return 'Vietnamese';
  if (t.includes('korean') || t.includes('k-bbq') || t.includes('kbbq')) return 'Korean';
  if (t.includes('steakhouse') || has('steak') || t.includes('chophouse') || t.includes('chop house') || t.includes('wagyu')) return 'Steakhouse';
  if (t.includes('seafood') || t.includes('oyster') || t.includes('raw bar') || t.includes('lobster') || t.includes('clam') || t.includes('crab')) return 'Seafood';
  if (t.includes('greek') || t.includes('souvlaki') || t.includes('taverna')) return 'Greek';
  if (t.includes('spanish') || t.includes('tapas') || t.includes('paella') || t.includes('pintxos') || t.includes('asador')) return 'Spanish';
  if (t.includes('middle eastern') || t.includes('hummus') || t.includes('falafel') || t.includes('shawarma') || t.includes('kebab') || t.includes('kabab') || t.includes('turkish') || t.includes('israeli') || t.includes('persian') || t.includes('levantine') || t.includes('afghan') || t.includes('pita')) return 'Middle Eastern';
  if (t.includes('mediterranean')) return 'Mediterranean';
  if (t.includes('taco') || t.includes('mexican') || t.includes('cantina') || t.includes('burrito') || t.includes('taqueria') || t.includes('latin')) return 'Mexican';
  if (t.includes('french') || t.includes('bistro') || t.includes('brasserie') || t.includes('crepe')) return 'French';
  if (t.includes('coffee') || t.includes('cafe') || t.includes('bakery') || t.includes('pastry') || t.includes('donut') || t.includes('bagel')) return 'Bakery & Coffee';
  if (t.includes('cocktail') || t.includes('wine bar') || t.includes('speakeasy') || t.includes('brewery') || t.includes('bar ') || t.endsWith(' bar') || t.includes('pub') || t.includes('lounge')) return 'Cocktails & Bar';
  return 'American';
}

module.exports = { getNeighborhood, getCuisine };

const fs = require('fs');

const venuesPath = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-app/src/data/venues.json';
const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));

// High precision landmark coordinates for key Blackbird venues
const exactCoords = {
  "le bernardin": { lat: 40.7615, lng: -73.9818, address: "155 W 51st St, New York, NY 10019", neighborhood: "Midtown" },
  "le bernardin prive": { lat: 40.7615, lng: -73.9818, address: "155 W 51st St, New York, NY 10019", neighborhood: "Midtown" },
  "le bernardin salon": { lat: 40.7615, lng: -73.9818, address: "155 W 51st St, New York, NY 10019", neighborhood: "Midtown" },
  "bad roman": { lat: 40.7685, lng: -73.9830, address: "10 Columbus Cir, New York, NY 10019", neighborhood: "Columbus Circle" },
  "bar masa": { lat: 40.7685, lng: -73.9830, address: "10 Columbus Cir, New York, NY 10019", neighborhood: "Columbus Circle" },
  "momofuku noodle bar": { lat: 40.7685, lng: -73.9830, address: "10 Columbus Cir, New York, NY 10019", neighborhood: "Columbus Circle" },
  "bang bar": { lat: 40.7685, lng: -73.9830, address: "10 Columbus Cir, New York, NY 10019", neighborhood: "Columbus Circle" },
  "twin tails": { lat: 40.7685, lng: -73.9830, address: "10 Columbus Cir, New York, NY 10019", neighborhood: "Columbus Circle" },
  "locanda verde": { lat: 40.7530, lng: -74.0005, address: "500 W 33rd St, New York, NY 10001", neighborhood: "Hudson Yards" },
  "bar primi": { lat: 40.7533, lng: -74.0012, address: "348 11th Ave, New York, NY 10001", neighborhood: "Hudson Yards" },
  "zou zou's": { lat: 40.7523, lng: -73.9984, address: "385 9th Ave, New York, NY 10001", neighborhood: "Hudson Yards" },
  "greywind": { lat: 40.7563, lng: -74.0003, address: "451 10th Ave, New York, NY 10018", neighborhood: "Hudson Yards" },
  "the bakery at greywind": { lat: 40.7563, lng: -74.0003, address: "451 10th Ave, New York, NY 10018", neighborhood: "Hudson Yards" },
  "spygold": { lat: 40.7563, lng: -74.0003, address: "451 10th Ave, New York, NY 10018", neighborhood: "Hudson Yards" },
  "arthur and sons": { lat: 40.7495, lng: -73.9805, address: "246 Madison Ave, New York, NY 10016", neighborhood: "Murray Hill" },
  "marseille": { lat: 40.7594, lng: -73.9912, address: "630 9th Ave, New York, NY 10036", neighborhood: "Hell's Kitchen" },
  "tonchin": { lat: 40.7505, lng: -73.9845, address: "36 W 36th St, New York, NY 10018", neighborhood: "Midtown" },
  "veselka grand central": { lat: 40.7527, lng: -73.9772, address: "89 E 42nd St, New York, NY 10017", neighborhood: "Grand Central" },
  "le pavillon": { lat: 40.7531, lng: -73.9785, address: "One Vanderbilt Ave, New York, NY 10017", neighborhood: "Midtown" },
  "cafe boulud": { lat: 40.7654, lng: -73.9687, address: "100 E 63rd St, New York, NY 10065", neighborhood: "Upper East Side" },
  "sushi yasuda": { lat: 40.7511, lng: -73.9734, address: "204 E 43rd St, New York, NY 10017", neighborhood: "Midtown East" },
  "talea": { lat: 40.7528, lng: -73.9838, address: "22 W 40th St, New York, NY 10018", neighborhood: "Bryant Park" },
  "black tap craft burgers and beer": { lat: 40.7634, lng: -73.9806, address: "136 W 55th St, New York, NY 10019", neighborhood: "Midtown" },
  "roberta's": { lat: 40.7540, lng: -73.9765, address: "230 Park Ave, New York, NY 10169", neighborhood: "Midtown" },
  "milk bar": { lat: 40.7454, lng: -73.9882, address: "1196 Broadway, New York, NY 10001", neighborhood: "NoMad" },
  "mark's off madison": { lat: 40.7424, lng: -73.9870, address: "41 Madison Ave, New York, NY 10010", neighborhood: "Flatiron" },
  "orwashers bakery": { lat: 40.7845, lng: -73.9772, address: "440 Amsterdam Ave, New York, NY 10024", neighborhood: "Upper West Side" },
  "maman": { lat: 40.7788, lng: -73.9815, address: "429 Amsterdam Ave, New York, NY 10024", neighborhood: "Upper West Side" },
  "momoya": { lat: 40.7865, lng: -73.9768, address: "427 Amsterdam Ave, New York, NY 10024", neighborhood: "Upper West Side" },
  "caledonia bar": { lat: 40.7852, lng: -73.9770, address: "424 Amsterdam Ave, New York, NY 10024", neighborhood: "Upper West Side" },
  "bareburger": { lat: 40.7832, lng: -73.9790, address: "795 Columbus Ave, New York, NY 10025", neighborhood: "Upper West Side" },
  "padoca bakery - 86": { lat: 40.7770, lng: -73.9515, address: "210 E 86th St, New York, NY 10028", neighborhood: "Upper East Side" },
  "padoca bakery - 67": { lat: 40.7665, lng: -73.9610, address: "359 E 68th St, New York, NY 10065", neighborhood: "Upper East Side" },
  "sandro's": { lat: 40.7725, lng: -73.9555, address: "306 E 81st St, New York, NY 10028", neighborhood: "Upper East Side" },
  "tacombi": { lat: 40.7805, lng: -73.9798, address: "384 Amsterdam Ave, New York, NY 10024", neighborhood: "Upper West Side" },
  "amarena": { lat: 40.7728, lng: -73.9560, address: "151 E 82nd St, New York, NY 10028", neighborhood: "Upper East Side" },
  "flex mussels": { lat: 40.7735, lng: -73.9550, address: "174 E 82nd St, New York, NY 10028", neighborhood: "Upper East Side" },
  "pappardella": { lat: 40.7801, lng: -73.9760, address: "316 Columbus Ave, New York, NY 10023", neighborhood: "Upper West Side" },
  "salumeria rosi": { lat: 40.7785, lng: -73.9805, address: "283 Amsterdam Ave, New York, NY 10023", neighborhood: "Upper West Side" },
  "blt prime": { lat: 40.7675, lng: -73.9605, address: "1032 Lexington Ave, New York, NY 10021", neighborhood: "Upper East Side" },
  "la goulue new york": { lat: 40.7645, lng: -73.9680, address: "29 E 61st St, New York, NY 10065", neighborhood: "Upper East Side" },
  "hutong new york": { lat: 40.7620, lng: -73.9705, address: "731 Lexington Ave, New York, NY 10022", neighborhood: "Midtown East" },
  "indian accent": { lat: 40.7640, lng: -73.9790, address: "123 W 56th St, New York, NY 10019", neighborhood: "Midtown" },
  "il mulino new york": { lat: 40.7625, lng: -73.9715, address: "37 E 60th St, New York, NY 10065", neighborhood: "Upper East Side" },
  "raku": { lat: 40.7610, lng: -73.9880, address: "48th St & 9th Ave, New York, NY 10036", neighborhood: "Hell's Kitchen" },
  "aldo sohm wine bar": { lat: 40.7615, lng: -73.9820, address: "151 W 51st St, New York, NY 10019", neighborhood: "Midtown" },
  "le rock": { lat: 40.7588, lng: -73.9785, address: "45 Rockefeller Plaza, New York, NY 10111", neighborhood: "Rockefeller Center" },
  "other half": { lat: 40.7588, lng: -73.9785, address: "Rockefeller Plaza, New York, NY 10111", neighborhood: "Rockefeller Center" },
  "black seed bagels": { lat: 40.7588, lng: -73.9785, address: "Rockefeller Plaza, New York, NY 10111", neighborhood: "Rockefeller Center" },
  "fieldtrip": { lat: 40.7588, lng: -73.9785, address: "Rockefeller Plaza, New York, NY 10111", neighborhood: "Rockefeller Center" },
  "chili": { lat: 40.7490, lng: -73.9775, address: "13 E 37th St, New York, NY 10016", neighborhood: "Midtown East" },
  "jajaja mexicana": { lat: 40.7540, lng: -74.0005, address: "450 W 33rd St, New York, NY 10001", neighborhood: "Hudson Yards" },
  "hupo": { lat: 40.7455, lng: -73.9535, address: "10-07 50th Ave, Long Island City, NY 11101", neighborhood: "Long Island City" },
  "finback brewery": { lat: 40.7490, lng: -73.9390, address: "29-37 41st Ave, Long Island City, NY 11101", neighborhood: "Long Island City" },
  "r40": { lat: 40.7445, lng: -73.9540, address: "47-16 Vernon Blvd, Long Island City, NY 11101", neighborhood: "Long Island City" },
  "jora": { lat: 40.7448, lng: -73.9538, address: "47-46 11th St, Long Island City, NY 11101", neighborhood: "Long Island City" },
  "deploy coffee": { lat: 40.7460, lng: -73.9520, address: "43-05 24th St, Long Island City, NY 11101", neighborhood: "Long Island City" },
  "paper coffee": { lat: 40.7450, lng: -73.9890, address: "1224 Broadway, New York, NY 10001", neighborhood: "NoMad" },
  "debajo": { lat: 40.7450, lng: -73.9890, address: "1224 Broadway, New York, NY 10001", neighborhood: "NoMad" },
  "the tusk bar": { lat: 40.7445, lng: -73.9880, address: "1198 Broadway, New York, NY 10001", neighborhood: "NoMad" },
  "brass": { lat: 40.7445, lng: -73.9880, address: "1198 Broadway, New York, NY 10001", neighborhood: "NoMad" }
};

// Neighborhood centroids for fallback with micro-spread
const neighborhoodCentroids = {
  "Upper West Side": { lat: 40.7870, lng: -73.9754 },
  "Upper East Side": { lat: 40.7736, lng: -73.9566 },
  "Lenox Hill": { lat: 40.7675, lng: -73.9610 },
  "Columbus Circle": { lat: 40.7681, lng: -73.9819 },
  "Midtown": { lat: 40.7549, lng: -73.9840 },
  "Midtown East": { lat: 40.7555, lng: -73.9720 },
  "Hell's Kitchen": { lat: 40.7638, lng: -73.9918 },
  "Rockefeller Center": { lat: 40.7587, lng: -73.9787 },
  "Long Island City": { lat: 40.7447, lng: -73.9485 },
  "Grand Central": { lat: 40.7527, lng: -73.9772 },
  "Bryant Park": { lat: 40.7536, lng: -73.9832 },
  "Murray Hill": { lat: 40.7479, lng: -73.9757 },
  "Hudson Yards": { lat: 40.7538, lng: -74.0010 },
  "Garment District": { lat: 40.7530, lng: -73.9895 },
  "Flatiron": { lat: 40.7410, lng: -73.9897 },
  "NoMad": { lat: 40.7448, lng: -73.9875 },
  "Chelsea": { lat: 40.7465, lng: -74.0014 },
  "Gramercy": { lat: 40.7368, lng: -73.9845 },
  "West Village": { lat: 40.7358, lng: -74.0036 },
  "East Village": { lat: 40.7265, lng: -73.9815 },
  "Williamsburg": { lat: 40.7145, lng: -73.9571 },
  "Lower East Side": { lat: 40.7150, lng: -73.9843 }
};

function normalizeName(str) {
  return (str || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

function cleanNeighborhoodName(raw) {
  const n = (raw || '').trim();
  if (n.startsWith('Upper West Side')) return 'Upper West Side';
  if (n.startsWith('Upper East Side')) return 'Upper East Side';
  if (n.includes('Lenox Hill')) return 'Lenox Hill';
  if (n.includes('Columbus Circle')) return 'Columbus Circle';
  if (n.includes('Midtown East') || n.includes('The Hugh')) return 'Midtown East';
  if (n.includes("Hell's Kitchen") || n.includes('Midtown West')) return "Hell's Kitchen";
  if (n.includes('Rockefeller Center')) return 'Rockefeller Center';
  if (n.includes('Long Island City')) return 'Long Island City';
  if (n.includes('Grand Central')) return 'Grand Central';
  if (n.includes('Bryant Park')) return 'Bryant Park';
  if (n.includes('Murray Hill')) return 'Murray Hill';
  if (n.toLowerCase().includes('hudson yards') || n.toLowerCase().includes('husdon') || n.toLowerCase().includes('hudon')) return 'Hudson Yards';
  if (n.includes('Garment District')) return 'Garment District';
  if (n.includes('Flatiron')) return 'Flatiron';
  if (n.includes('NoMad')) return 'NoMad';
  if (n.includes('Chelsea')) return 'Chelsea';
  if (n.includes('Gramercy')) return 'Gramercy';
  return 'Midtown';
}

let geocodedCount = 0;
let exactCount = 0;

venues.forEach((v, idx) => {
  if (v.blackbird && v.lat === 40.758 && v.lng === -73.9855) {
    const norm = normalizeName(v.name);
    
    // Check exact match
    let matchedExact = null;
    for (const [key, val] of Object.entries(exactCoords)) {
      if (norm.includes(normalizeName(key)) || normalizeName(key).includes(norm)) {
        matchedExact = val;
        break;
      }
    }

    if (matchedExact) {
      v.lat = matchedExact.lat;
      v.lng = matchedExact.lng;
      v.address = matchedExact.address;
      v.neighborhood = matchedExact.neighborhood;
      exactCount++;
    } else {
      const cleanNeigh = cleanNeighborhoodName(v.neighborhood);
      v.neighborhood = cleanNeigh;
      const centroid = neighborhoodCentroids[cleanNeigh] || neighborhoodCentroids["Midtown"];
      // Micro jitter by index so spots in the same neighborhood don't stack on 1 pixel
      const jitterLat = ((idx % 7) - 3) * 0.0018;
      const jitterLng = (((idx * 3) % 7) - 3) * 0.0022;
      v.lat = parseFloat((centroid.lat + jitterLat).toFixed(6));
      v.lng = parseFloat((centroid.lng + jitterLng).toFixed(6));
      v.address = `${v.name}, ${cleanNeigh}, New York, NY`;
    }
    
    v.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + ' ' + v.neighborhood + ' New York')}`;
    geocodedCount++;
  }
});

console.log(`Geocoded ${geocodedCount} Blackbird venues (${exactCount} high-precision exact addresses, ${geocodedCount - exactCount} neighborhood street blocks)`);

fs.writeFileSync(venuesPath, JSON.stringify(venues, null, 2), 'utf8');
console.log('Saved updated venues.json');

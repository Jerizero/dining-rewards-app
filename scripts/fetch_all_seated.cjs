const fs = require('fs');
const https = require('https');
const path = require('path');

const outputPath = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-re/seated/all_seated_nyc.json';

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const url = `https://api.seatedapp.io/v1/search/map?city=2&size=50&page=${page}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching all 804 Seated NYC restaurants...');
  const allRestaurants = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      console.log(`Fetching page ${page}...`);
      const res = await fetchPage(page);
      if (res && res.restaurants && res.restaurants.length > 0) {
        allRestaurants.push(...res.restaurants);
        console.log(`  Page ${page} fetched: +${res.restaurants.length} spots (Total: ${allRestaurants.length} / ${res.metaData?.totalCount})`);
        hasMore = res.metaData?.hasMoreItems === true;
        page++;
        // Polite delay
        await new Promise(r => setTimeout(r, 200));
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.error(`Error on page ${page}:`, err.message);
      break;
    }
  }

  console.log(`\nSuccessfully downloaded ${allRestaurants.length} Seated NYC restaurants.`);
  fs.writeFileSync(outputPath, JSON.stringify(allRestaurants, null, 2), 'utf8');
  console.log('Saved to:', outputPath);
}

run();

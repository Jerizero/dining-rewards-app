const fs = require('fs');
const https = require('https');
const path = require('path');

const OUTPUT_FILE = '/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-re/bilt/all_bilt_nyc.json';
const PAGE_SIZE = 50;

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const url = `https://aadvantagedining.com/api/v2/Merchants/Search?location=New%20York%2C%20NY&pageNo=${page}&pageSize=${PAGE_SIZE}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

async function main() {
  console.log('Fetching first page to determine total results...');
  const first = await fetchPage(1);
  const totalPages = first.totalPages;
  const totalResultSize = first.totalResultSize;
  console.log(`Total merchants: ${totalResultSize}, Total pages: ${totalPages}`);

  const allMerchants = [...first.merchants];

  for (let p = 2; p <= totalPages; p++) {
    process.stdout.write(`Fetching page ${p}/${totalPages}... `);
    try {
      const res = await fetchPage(p);
      allMerchants.push(...(res.merchants || []));
      console.log(`+${res.merchants?.length || 0} (total: ${allMerchants.length})`);
    } catch (err) {
      console.error(`Error page ${p}:`, err.message);
    }
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\nSuccessfully downloaded ${allMerchants.length} Bilt / Rewards Network venues!`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allMerchants, null, 2), 'utf8');
  console.log('Saved to:', OUTPUT_FILE);
}

main().catch(console.error);

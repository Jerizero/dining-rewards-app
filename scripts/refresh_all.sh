#!/usr/bin/env bash
set -euo pipefail
export PATH="/Users/jerielacosta/.nvm/versions/node/v25.2.1/bin:/opt/homebrew/bin:/Users/jerielacosta/.local/bin:$PATH"
export NO_UPDATE_NOTIFIER=1

DIR="/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-app"
cd "$DIR"

echo "[dining-refresh] Fetching live Bilt & Seated NYC catalogs..."
node scripts/fetch_all_bilt.cjs
node scripts/fetch_all_seated.cjs
node scripts/generate_full_catalog.cjs

TODAY=$(date +%Y-%m-%d)
sed -i '' "s/export const CATALOG_AS_OF = '[^']*';/export const CATALOG_AS_OF = '$TODAY';/" src/data/venues.ts

npm test
npm run build

if ! git diff --quiet src/data/venues.json src/data/venues.ts; then
  git add src/data/venues.json src/data/venues.ts
  git commit -m "data: scheduled weekly NYC catalog refresh ($TODAY)

Verified: npm test passed; npm run build succeeded"
  git push origin main
  vercel --prod --yes
fi
echo "[dining-refresh] Complete ($TODAY)"

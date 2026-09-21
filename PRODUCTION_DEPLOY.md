# NXBC Production Deployment

## What was hardened in this build
- Home global presale statistics now use completed verified `buy_presale` database transactions first; if an older deployment has phase counters but no historical transaction rows, the UI shows the PostgreSQL phase totals instead of incorrectly showing zero.
- User dashboard earnings, level income, matrix income, withdrawals, purchases and transaction history are DB/API authoritative; browser localStorage is no longer used as the source for those financial values.
- Removed the broken `/api/presale/sync-legacy-data` browser migration path.
- Fallback phase prices/supplies in the frontend match the deployed NXBC presale contract: P1 $0.01 / 1,000,000; P2 $0.10 / 2,500,000; P3 $1 / 7,000,000; P4 $10 / 19,500,000; P5 $100 / 40,000,000.
- CORS is no longer `*`; set `CORS_ORIGIN` only when the API is intentionally served from a different frontend origin.
- Removed the literal private key from diagnostic scripts; use environment variables only.
- Presale on-chain USDT verification now parses the full 18-decimal amount.
- Production simulation/demo handlers are disabled when `import.meta.env.PROD` is true.
- Home header includes icon-only X, YouTube, Facebook and Telegram buttons; no links are configured yet.

## Important
The deployed presale smart contract was not changed by this build.
The existing purchase flow remains: buyer USDT -> treasury and presale-contract NXBC -> buyer in the same BSC transaction.

## Deploy
1. Configure `.env` on the server with the existing production database/RPC/payout settings.
2. If frontend and API use different origins, set `CORS_ORIGIN=https://your-frontend-domain`.
3. Install dependencies: `npm ci` (or `npm install` if no lockfile is available).
4. Build: `npm run build`.
5. Start/restart: `npm start` (or restart the existing PM2 process after the build).
6. Check `/api/health` and then test one small real presale purchase before opening the site publicly.

Do not put private keys in source files, test scripts, Git history, or the browser.

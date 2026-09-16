# NXBC MLM - Final Logic & Deployment Guide

## Included logic

### Unilevel
- 10 levels.
- Unlimited members can exist under a sponsor at any level through the referral/sponsor chain.
- Commission percentages remain admin-configurable from `referralLevels`.

### Matrix
- Fixed 2x2 placement tree.
- Maximum 2 matrix children per user.
- Placement income base: `$1.00`.
- Matrix upline share: `10% of placement income per level`.
- Therefore, with `$1.00` placement income, each of 10 matrix upline levels receives `$0.10`.
- The calculation is percentage-based, not a hard-coded `$0.10`.

### Rank Rewards
Admin can dynamically add as many rank rewards as needed.
Each rank has three qualification/reward boxes:
1. Direct Business
2. Total Team Business
3. Reward Value (USDT)

Rank rewards are stored in `system_configs` under `rankRewards` and are applied by the server when qualifying business is recorded. A rank is not repeatedly paid after it has already been achieved.

### FIFO
- Normal orders are FIFO: oldest order first.
- Admin can reorder sale queue priority.
- Admin can use the Instant Fulfill control for a specific sale order.
- Admin FIFO actions are authenticated and persisted server-side.
- Existing on-chain purchase flow is not changed.

## Important deployment rule
Do NOT upload `.env` from your local machine unless it is the correct production secret file. Keep production secrets on the VPS.

Do NOT upload `node_modules/` or `dist/` from the ZIP.

## Recommended VPS deployment (Git)
```bash
cd /root/app
git pull
npm install
npm run build
pm2 restart nxbc-app --update-env
pm2 status
pm2 logs nxbc-app --lines 100
```

If dependencies are already installed and package-lock/bun lock has not changed, `npm install` can be skipped.

## Manual ZIP deployment
Upload the whole project ZIP to the VPS, extract it into a temporary directory, then copy project files into `/root/app` while preserving the production `.env`.

Example:
```bash
cd /root
mkdir -p nxbc-update
unzip -o NXBC-MLM-10Level-Unilevel-2x2-Matrix-10Percent-Final.zip -d nxbc-update
cd /root/nxbc-update
npm install
npm run build
```

Then replace the application source with the extracted project, but keep the existing production `.env`, database connection, and server secrets. Finally:
```bash
cd /root/app
npm run build
pm2 restart nxbc-app --update-env
pm2 status
```

## Main source files changed for this final logic
- `server.ts` - MLM/rank/FIFO server logic.
- `src/App.tsx` - main application state/config integration.
- `src/components/SecretAdminPage.tsx` - dynamic Rank Reward Add/Delete/Edit controls and admin configuration UI.
- `src/components/ScreenTeam.tsx` - live team/matrix display.
- `src/components/ScreenTwoAssets.tsx` - sale order display.
- `src/types/crypto.ts` - MLM/config types.

## Existing database
Do not reset, drop, truncate, or recreate the production database.
The rank reward configuration uses the existing `system_configs` table and rank achievement records use the existing rank achievement table.

Before any production migration, take a database backup.

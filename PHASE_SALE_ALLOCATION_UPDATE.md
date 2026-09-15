# NXBC Phase Sale Allocation Update

User can allocate purchased NXBC by exact token count, including Phase 1 and Phase 2. Example: 100 purchased -> 30 Phase 1 + 70 Phase 2.

The plan is persisted in the existing PostgreSQL `sell_orders` table only after `/api/presale/buy` verifies the on-chain purchase. No USDT earnings are credited when an allocation is created.

Deployment: replace the project files, then run `npm run build` and `pm2 restart nxbc-app --update-env`. No schema migration is required.

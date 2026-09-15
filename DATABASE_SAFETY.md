# NXBC Production Database Safety

## Golden rule
Code deployments must use the existing production `DATABASE_URL`. Never reset, drop, truncate, or recreate the production database to deploy frontend/backend changes.

## Before every production deployment
1. Set `DATABASE_URL` in the server environment. Never commit `.env` or secrets.
2. Run `npm run db:predeploy-check`.
3. Run `npm run db:backup` and keep the generated `.dump` file outside GitHub/off-site.
4. Deploy the application code.
5. If a schema migration is required, review it first and make it additive/backward-compatible where possible.
6. Smoke-test login, token balances, purchase history, withdrawal ledger, and admin functions.

## Restore
Restore only after confirming the correct backup and database target:

`npm run db:restore -- ./backups/<backup>.dump --confirm`

A restore can overwrite data. Do not run it casually.

## Purchased NXBC records
Purchased-token totals are stored in `users.total_purchased_tokens`; purchase transactions are stored in `transactions.token_amount`. Do not delete or rebuild these tables during an application deployment.

## Secrets
Never commit `.env`, private keys, database passwords, or wallet seed phrases. If a secret has ever been committed, rotate it immediately.

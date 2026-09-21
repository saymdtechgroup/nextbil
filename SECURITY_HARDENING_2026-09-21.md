# NXBC Production Security Hardening — 2026-09-21

Applied to the current production project source.

## 1. Atomic presale finalization

Verified BSC purchases are now finalized inside one PostgreSQL transaction. The purchase row and user row are locked first. User investment, qualification, sponsor/team volumes, rank rewards, MLM commissions, matrix placement, matrix earnings, phase bookkeeping, and purchase completion are committed together.

If any database operation fails, the transaction rolls back instead of leaving a partially credited purchase.

The blockchain verification remains outside the DB transaction; BSC itself cannot be rolled back.

## 2. Duplicate purchase protection

A verified purchase now remains `pending_finalization` until all database side-effects succeed. The transaction is marked `completed` only as the final DB operation.

The existing unique BSC purchase transaction index remains in place. The finalizer also locks the purchase row and returns without crediting again if another worker has already completed it.

Background verification now retries both `pending_verification` and `pending_finalization` purchases.

FIFO matching is only performed when the finalizer actually performed a new settlement, preventing duplicate FIFO credits during concurrent/retry processing.

## 3. MLM withdrawal reservation

MLM withdrawals now reserve the PostgreSQL `available_usdt` balance before the BSC payout. The user row is locked during reservation, so two concurrent requests cannot spend the same balance.

The reservation is recorded as a durable withdrawal transaction with a unique request key derived from the signed wallet request. This survives PM2/server restarts.

- payout never broadcast -> reservation is restored
- payout confirmed successfully -> transaction becomes `completed`
- payout broadcast but confirmation is uncertain -> balance remains reserved and the request remains `pending_payout`; the server does not automatically issue a second payout

LocalStorage is not used as a financial authority.

## 4. Database migration

Startup safety migration creates:

- `transactions.withdrawal_request_key`
- unique partial index on `withdrawal_request_key`

No existing user/transaction rows are deleted.

## Deployment safety

Before deploying to the VPS, take a PostgreSQL backup:

```bash
cd /root/app
npm run db:backup
```

Then deploy/build/restart only `nxbc-app`:

```bash
cd /root/app
git pull
npm install
npm run build
pm2 restart nxbc-app --update-env
pm2 status
pm2 logs nxbc-app --lines 50
```

Do not stop or restart the separate TetherPlus process.

The ZIP does not contain production `.env` secrets.

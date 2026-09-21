# NXBC Wallet Separation + Dynamic FIFO + LIVE/HOLD Update

## What changed

1. **Two independent USDT wallets**
   - **Token Sale Wallet:** only FIFO/token-sale settlement proceeds from `token_sell_ledgers`.
   - **MLM Wallet:** sponsor, unilevel, matrix, rank and other MLM earnings in `users.available_usdt`.
   - Token-sale matching no longer credits `users.available_usdt` or MLM `totalEarnedUsdt`.
   - Token-sale withdrawal debits only token-sale ledger rows; MLM withdrawal debits only `users.available_usdt`.

2. **One-time production balance migration**
   - On server startup, `wallet_separation_v1` reconciles legacy mixed balances by subtracting outstanding token-sale ledger balances from the old mixed `available_usdt` balance.
   - After migration, `available_usdt` is treated as MLM-only.

3. **Dynamic FIFO 20/80 control**
   - Default seller/FIFO share: **20%**.
   - Default company/admin share: **80%**.
   - Admin can change seller share to **30% / 70%**, **50% / 50%**, etc.
   - Server validates seller share from 0–100% and derives company share as `100 - sellerShare`.
   - Both normal FIFO and Direct Buyer Match use the same live admin setting.

4. **Dynamic withdrawal fee**
   - Withdrawal fee is read server-side from the admin `systemConfig`.
   - Admin can change it from 0% to 100%; browser values are not trusted.

5. **LIVE / HOLD allocation is not a presale phase**
   - Removed the old DEX/Phase-6 concept from allocation UI.
   - LIVE/HOLD tokens remain in the user's wallet.
   - Backend presale allocation accepts only **P2–P5** sell orders.
   - LIVE/HOLD is never inserted into `sell_orders`, never enters FIFO, and cannot be sold as a presale allocation.
   - P1 is also blocked from FIFO allocation; P1 tokens stay outside the P2–P5 presale sale queue.

6. **Token Sale balance API/UI**
   - `/api/users/:walletAddress` and `/api/users/sync` now expose the token-sale available balance separately.
   - Withdrawal screen receives token-sale balance independently from MLM balance.

## Live contract compatibility

The deployed on-chain presale remains the source of truth for the real five phases. No smart-contract redeployment is required for these wallet/FIFO/LIVE-HOLD changes.

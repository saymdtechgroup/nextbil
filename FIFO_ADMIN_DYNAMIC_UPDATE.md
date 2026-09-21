# FIFO Admin Dynamic Share

The FIFO seller-share percentage is an approved admin-only dynamic setting.

- Default: 20% seller / 80% company.
- Admin can change seller share from 0% to 100%.
- Company share is always calculated as `100 - sellerSharePercent`.
- The authoritative value is stored in PostgreSQL under `systemConfig.sellQueueSharePercent`.
- FIFO settlement reads the current approved setting from PostgreSQL.
- The setting is intentionally not exposed by `/api/presale/config`, so the public user dashboard does not display or edit it.
- Changing the setting does not rewrite completed token-sale ledgers or historical settlement records.

Replace these production files:
- server.ts
- src/App.tsx
- src/components/BuyTokenModal.tsx
- src/utils/web3Helper.ts

One-time recovery script:
- scripts/reconcile-20-nxbc.js

The recovery script is intentionally safety-locked to the two verified 10-NXBC
blockchain transaction hashes and will stop without changes if the database rows
do not match the expected failed 0.10-USDT / 10-NXBC purchases.

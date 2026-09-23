# NXBC Phase Live Data Fix

## Fixed

1. User dashboard phase data now comes from `GET /api/presale/config` only.
2. `/api/admin/configs` is no longer used by normal users for phase financial data.
3. The public presale endpoint reads all 5 phase rows directly from the deployed BSC presale contract using `phases(uint256)`.
4. Phase price, allocation, sold amount, remaining amount and active/completed status are therefore on-chain values.
5. Screen 1 total supply is calculated from the live phase allocations instead of a hardcoded 70,000,000 value.
6. The retired presale address is no longer used by the buy modal.
7. The active NXBC token address is synchronized to `0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1` in the live frontend helpers.
8. `.env.example` now points to the current presale contract `0x0C4a86691B3937549BFa688211EbF56520B64981`.

## Current contracts used by this build

- NXBC: `0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1`
- Presale: `0x0C4a86691B3937549BFa688211EbF56520B64981`
- BSC USDT: `0x55d398326f99059fF775485246999027B3197955`

## Deployment

Build a fresh `dist` directory before restarting the production process. Do not reuse an old `dist` directory.

```bash
cd /root/app
rm -rf dist
npm install
npm run build
pm2 restart nxbc-app --update-env
pm2 status
```

After deployment, reload the website with a hard refresh.

Expected example after 2 NXBC has actually been sold in Phase 1:

- Phase 1 Sold: `2`
- Phase 1 Remaining: `999,998`

The UI must not calculate these values from browser localStorage or an admin phase baseline.

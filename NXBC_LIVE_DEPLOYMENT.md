# NXBC Live Contract Deployment Notes

## Live BSC Mainnet contracts

- NXBC token: `0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1`
- NXBC Presale: `0x0C4a86691B3937549BFa688211EbF56520B64981`
- BSC USDT: `0x55d398326f99059fF775485246999027B3197955`
- Presale/admin wallet: `0x8d1abCa8Cf0f42799b9a76254710e979bd59c261`
- Chain ID: `56`

## Presale phases (authoritative on-chain values)

| Phase | NXBC allocation | Price |
|---|---:|---:|
| P1 | 1,000,000 | $0.01 |
| P2 | 2,500,000 | $0.10 |
| P3 | 7,000,000 | $1.00 |
| P4 | 19,500,000 | $10.00 |
| P5 | 40,000,000 | $100.00 |

The deployed Presale contract automatically advances to the next phase only when the current phase is completely sold. The website/backend reads the live phase from BSC; the database is not the authority for price or phase progression.

## Buy flow

1. User connects a BSC Mainnet wallet.
2. Website reads live phase/price/remaining supply from the Presale contract.
3. User approves BSC USDT to the Presale contract.
4. Website calls `buyTokens(uint256 usdtAmount)` on the deployed Presale contract.
5. The contract sends USDT directly to the configured admin wallet and NXBC directly from the Presale contract to the buyer.
6. Backend verifies the same BSC receipt before applying database MLM/matrix/queue effects.

## Token-sale withdrawal flow

1. User chooses Token Sell withdrawal.
2. Website calculates the exact NXBC amount represented by the user's completed token-sale ledger entries.
3. User sends NXBC directly from their wallet to the configured admin/treasury wallet.
4. Backend verifies the exact ERC-20 Transfer event on BSC.
5. Only after verification does the backend send the user's net USDT payout from the payout hot wallet.
6. The ledger and user balance are finalized only after the USDT payout confirms.

## MLM / matrix

The existing database MLM engine remains responsible for referral commissions, rank rewards and 2x2 forced-matrix placement. The live presale contract is used only for the actual token sale and on-chain token delivery. The current default qualification threshold and commission percentages remain admin-configurable in PostgreSQL; this build does not silently replace those business rules.

## VPS environment

Copy `.env.example` to `.env` on the VPS and fill in the real PostgreSQL connection string and payout wallet private key. Never commit `.env` or a private key to GitHub.

Required live values:

```env
RPC_URL="https://bsc-dataseed.binance.org/"
NXBC_TOKEN_ADDRESS="0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1"
NXBC_PRESALE_CONTRACT_ADDRESS="0x0C4a86691B3937549BFa688211EbF56520B64981"
USDT_CONTRACT_ADDRESS="0x55d398326f99059fF775485246999027B3197955"
PRESALE_RECEIVING_WALLET="0x8d1abCa8Cf0f42799b9a76254710e979bd59c261"
NXBC_RETURN_TREASURY_ADDRESS="0x8d1abCa8Cf0f42799b9a76254710e979bd59c261"
```

The payout wallet must have enough BNB for gas and enough USDT to cover withdrawals.

## Build

```bash
npm ci
npm run build
npm start
```

Do not upload `node_modules/`, `.env`, or stale generated `dist/` files to GitHub. Build `dist/` fresh on the VPS.

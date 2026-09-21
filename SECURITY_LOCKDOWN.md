# NXBC Production Security Lockdown

## Current on-chain addresses
- NXBC token: `0x94D064AFDB04E3489C313054260929588b38dF85`
- Current live presale: `0x0C4a86691B3937549BFa688211EbF56520B64981`
- Admin / treasury / NXBC return wallet: `0x8d1abCa8Cf0f42799b9a76254710e979bd59c261`
- BSC USDT: `0x55d398326f99059fF775485246999027B3197955`

## Production rule
Keep `ENABLE_UNVERIFIED_INTERNAL_SETTLEMENTS` unset or set to `false`.

The following browser-driven financial write endpoints are fail-closed unless a future implementation adds real on-chain verification:
- `/api/wallet/token-sell-ledger/record`
- `/api/swap/convert`
- `/api/p2p/sell`

This prevents a normal user from inventing a database balance, fake swap completion, or fake P2P sell entitlement by editing browser requests.

## Presale verification
`/api/presale/buy` never treats a merely formatted transaction hash as payment proof. Before completing a purchase it verifies on BSC:
1. chain is BSC Mainnet (56)
2. transaction is mined and successful
3. transaction sender equals the buyer wallet
4. exact/greater USDT Transfer goes from buyer to the configured treasury
5. expected NXBC Transfer comes from the current presale contract to the buyer
6. the same transaction hash has not already been recorded

No MLM/phase side-effects are applied until this verification succeeds.

## Withdrawal verification
Token-sell withdrawals require:
- wallet signature
- valid and fresh signed request
- exact NXBC return transaction
- sender = withdrawing wallet
- token contract = canonical NXBC token
- recipient = admin/treasury return wallet
- exact server-calculated token amount
- one-time transaction hash
- successful real USDT payout confirmation

## Database safety
Before deploying code changes:
1. run `npm run db:predeploy-check`
2. run `npm run db:backup`
3. deploy application code
4. never drop, truncate, or recreate production tables as part of a normal deploy

No application update can honestly guarantee zero risk. The safety design is fail-closed and backup-first, and production database credentials must remain outside GitHub.

## Important
The current live presale smart contract is kept unchanged by this security patch. The security patch does not replace the live presale contract.

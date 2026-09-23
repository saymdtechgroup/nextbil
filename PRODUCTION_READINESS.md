# NXBC Production Readiness

## Authoritative live contracts
- NXBC: `0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1`
- NXBC Presale: `0x0C4a86691B3937549BFa688211EbF56520B64981`
- BSC USDT: `0x55d398326f99059fF775485246999027B3197955`
- Presale treasury / NXBC return treasury: `0x8d1abCa8Cf0f42799b9a76254710e979bd59c261`
- Chain ID: `56`

## Live phase plan
- P1: 1,000,000 NXBC @ $0.01
- P2: 2,500,000 NXBC @ $0.10
- P3: 7,000,000 NXBC @ $1.00
- P4: 19,500,000 NXBC @ $10.00
- P5: 40,000,000 NXBC @ $100.00

The deployed presale contract is the source of truth for current phase, price, sold amount and remaining supply.

## Purchase allocation rule
A purchase lot can only be allocated to future phases or DEX/LIVE:
- P1 purchase -> P2/P3/P4/P5/DEX-LIVE
- P2 purchase -> P3/P4/P5/DEX-LIVE
- P3 purchase -> P4/P5/DEX-LIVE
- P4 purchase -> P5/DEX-LIVE
- P5 purchase -> DEX/LIVE only

Same-phase and past-phase allocations are rejected by the server. Each purchase lot is tied to its verified purchase transaction hash. Every lot must be fully allocated between future-phase FIFO orders and/or DEX/LIVE reservation.

## FIFO and Direct Buyer
- FIFO numbers are permanent and generated from a database sequence.
- Matching order is `priority -> createdAt -> id`, and public queue ordering uses the same order.
- Direct Buyer links are phase-specific, single-use and expire after 24 hours.
- Multiple active Direct Buyer links can exist for the same seller order.
- Direct Buyer Match consumes the same configured seller-share capacity; it is not a FIFO bypass.
- Direct Buyer links are allowed only while the linked phase is the live presale phase.

## Financial safety
- Presale purchase verification requires the official presale contract as the transaction target, exact USDT treasury payment and exact NXBC delivery to the buyer.
- Token-sale withdrawals require exact NXBC return verification on BSC before USDT payout.
- Token Sale Wallet and MLM Wallet remain separate.
- Withdrawal fee is read server-side from the live system configuration.
- Browser localStorage is not authoritative for NXBC/USDT balances or production financial data.
- Initial admin PIN is never hard-coded; it is stored only as a salted hash.
- Production startup rejects unsafe settlement flags and missing required secrets.

## Deployment
1. Copy `.env.example` to `.env` and fill all real secrets.
2. Never commit `.env` or any private key.
3. Run `npm ci`.
4. Run `npm run lint`.
5. Run `npm run build`.
6. Run `npm run db:predeploy-check` and take a database backup before deployment.
7. Start with `npm start` (or the existing process manager).
8. Check `/api/health`.
9. Verify the BSC RPC reports chain ID 56.
10. Test one small real purchase from a controlled wallet before opening public traffic.

## Important operational note
The codebase contains an Express server with a persistent PostgreSQL connection pool and a 60-second background verification job. It should be deployed on a runtime that supports a long-lived Node process. If using a serverless platform, move the background verification job to a scheduled worker before relying on it for production reconciliation.

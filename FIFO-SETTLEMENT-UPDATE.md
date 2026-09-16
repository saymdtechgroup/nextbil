# NXBC FIFO Phase Sale Settlement Update

Implemented behavior:

1. A verified presale purchase keeps the existing on-chain buy flow unchanged.
2. For the purchased phase, 20% of the buyer's NXBC amount is used to fill seller orders in FIFO order.
3. The remaining 80% is the admin portion.
4. Seller order matching is server-side and uses oldest `createdAt`, then `priority`.
5. A seller's own purchase cannot self-match their own sell order.
6. When a seller order is matched, the seller receives a database ledger credit in `availableUsdt`; no token is moved at this point.
7. The seller's NXBC stays in the seller wallet until withdrawal.
8. Token-sell withdrawal must pass the existing exact on-chain NXBC return verification before the USDT payout is sent.
9. The Assets dashboard now shows the user's personal FIFO sale orders with order amount, sold, remaining, rate, expected USDT, realized USDT, and status.
10. Pending presale transactions that later become verified also go through the same FIFO matcher.

Example: a 100 NXBC buyer purchase gives 20 NXBC seller-match capacity and 80 NXBC admin portion. If User A's Phase 2 order is 20 NXBC at $0.15 and is matched first, User A gets a $3.00 withdrawable ledger credit. User A still holds the 20 NXBC in their wallet. On withdrawal, the system verifies the 20 NXBC return to treasury and then pays the corresponding USDT (minus the configured withdrawal fee, if any).

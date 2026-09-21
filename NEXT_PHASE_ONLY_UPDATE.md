# NXBC Next-Phase-Only Allocation Update

## Rule
Each verified presale purchase is treated as its own purchase lot using its BSC purchase transaction hash.

- Phase 1 purchase -> P2/P3/P4/P5 or DEX/LIVE
- Phase 2 purchase -> P3/P4/P5 or DEX/LIVE
- Phase 3 purchase -> P4/P5 or DEX/LIVE
- Phase 4 purchase -> P5 or DEX/LIVE
- Phase 5 purchase -> DEX/LIVE only
- Same-phase and past-phase FIFO allocation is rejected by the backend.
- DEX/LIVE is stored as a persistent hold and is never inserted into FIFO.
- LIVE-only allocation is persisted even when there are no P2-P5 orders.
- Allocation capacity is calculated from the selected purchase lot, not the user's lifetime token total.
- Manual `/api/p2p/sell` also requires a verified purchase transaction and rejects same/past phase.
- FIFO price is taken from the deployed/live phase table, not a user-supplied price.

## Database
`purchase_tx_hash` was added to `sell_orders`. The server also runs a safe `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` on allocation requests so an existing production database can add the column without deleting data.

## Verification note
Source-level checks were completed. Full TypeScript/Vite production build could not be completed in this environment because the dependency tree was incomplete and package installation timed out; no claim of a successful production build is made.

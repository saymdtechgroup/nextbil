# NXBC Dashboard / Purchase / Allocation Fixes

Applied fixes:

1. User dashboard now maps backend `levelIncomeUsdt`, `matrixIncomeUsdt`, `tokenSaleAvailableUsdt`, and `tokenSaleWithdrawnUsdt` into the correct frontend state.
2. Withdraw screen now uses the separate token-sale wallet balance instead of the MLM `availableUsdt` balance.
3. Home shortcut buttons (Assets, Team, Withdraw, Mine) now receive the navigation callback and open the correct screen.
4. The active source app (`src/`) Buy Token modal now executes the real BSC presale transaction through the existing `executeSmartContractBuy()` helper and passes the confirmed transaction hash to the backend.
5. Phase allocation persistence now sends `purchaseTxHash` and `liveHoldTokens` to `/api/presale/allocation`, matching the backend validation rules.
6. Post-purchase NXBC and USDT balances are immediately re-read from BSC instead of waiting for the 15-second polling cycle.
7. ScreenOne props were made compatible with the current `src/App.tsx` usage.

Important:
- The backend remains the authority for purchase verification and allocation records.
- The blockchain transaction must confirm successfully before the database purchase/allocation is accepted.
- Install dependencies on the deployment machine with `npm ci`, then run `npm run build` before deploying.

# NXBC — No Dashboard Signature Popup Update

## User experience
- No wallet `signMessage()` is requested on landing page load.
- No wallet `signMessage()` is requested when opening the dashboard.
- No dashboard signature is requested on normal navigation/page changes.
- `NXBC-DASHBOARD-V1` dashboard authentication flow is not present in this production source.

## Financial security retained
- Wallet confirmation remains for real blockchain transactions initiated by the user.
- Withdrawal authorization remains protected by a wallet-signed withdrawal message.
- The withdrawal message includes wallet address, amount, wallet type and timestamp.
- The backend verifies the withdrawal signature before processing the payout.
- Token-sale withdrawal continues to require verified NXBC return on BSC.
- Existing database and payout hardening from the production-hardened build is retained.

## Important deployment note
The VPS source previously inspected during this conversation contained an older dashboard-signature flow in `src/App.tsx`. This ZIP does not contain that automatic dashboard-signature flow. Deploy the complete project together; do not manually delete only the `signMessage()` line from the VPS source.

Do not copy production `.env` secrets from the ZIP. Keep the existing VPS `.env` and database configuration.

Recommended deployment sequence:
1. Back up the database.
2. Replace/update the application source as a complete project.
3. Keep `/root/app/.env` unchanged.
4. Build the project.
5. Restart only `nxbc-app` with `--update-env`.
6. Verify the app and withdrawal flow.
7. Do not restart TetherPlus.

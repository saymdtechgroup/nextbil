# Admin Safe Controls Update

This production update removes admin/user-facing controls that can create phase, FIFO, or payout-rule confusion.

## Removed / locked
- Manual phase activation/switching.
- Admin editing of phase price, allocation/supply, and sold baseline.
- FIFO reorder / VIP priority controls.
- FIFO Instant Fulfill.
- Admin/user-facing FIFO 20%/80% split configuration.
- Revenue simulator / test purchase controls from the admin page.
- Legacy AdminPanelModal with unsafe phase/FIFO controls.
- Admin reset-to-default action that could overwrite production configuration.
- User dashboard display of the FIFO 20%/80% split.

## Kept as dynamic admin controls
- MLM qualification threshold.
- Direct sponsor commission.
- 10-level commission percentages and direct requirements.
- 2x2 matrix configuration.
- Rank / royalty configuration.
- Withdrawal fee.
- Social media links.
- Emergency presale pause.
- Admin PIN.

## Production-safety changes
- Presale phase state remains authoritative from live/server-verified purchase allocation.
- FIFO share is now a fixed internal 20%/80% rule and is not read from admin configuration.
- Public presale config no longer exposes the FIFO split setting.
- Legacy admin requests attempting to modify phases are rejected.
- Legacy sellQueueSharePercent is ignored/removed when saving admin configuration.
- Admin config writes now use a database transaction and report save failures instead of silently reporting success.
- Removed the legacy AdminPanelModal component from the app.

## Verification
- TypeScript/TSX syntax/transpile validation passed for all 26 project TS/TSX source files available in the working copy.
- Full `npm run build` could not be executed in this environment because the Vite/esbuild binaries were unavailable and dependency installation timed out. No source syntax errors were found by the TypeScript transpile check.

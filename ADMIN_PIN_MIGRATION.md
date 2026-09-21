# Admin PIN Migration

This release preserves an existing installation's legacy `ADMIN_SECRET_PIN`, including a legacy 4-digit PIN, on first startup by hashing it into the PostgreSQL `systemConfigs.admin_pin` record.

- Existing database `admin_pin` record: used as-is.
- Existing legacy `ADMIN_SECRET_PIN` with 4+ numeric digits and no database record: migrated and hashed automatically.
- New installation with no legacy PIN: `ADMIN_PIN_INITIAL` must be 6+ numeric digits.
- After login, change the PIN from the Admin Panel to a 6+ digit PIN.
- Do not commit `.env` or real secrets to GitHub.

The startup validator no longer rejects a legacy installation merely because `ADMIN_PIN_INITIAL` is absent or because the legacy PIN is 4 digits. The stricter 6+ digit requirement applies to brand-new initialization and to PIN changes.

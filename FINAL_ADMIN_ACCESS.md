# Final Admin Access

Production admin entry point:

`https://YOUR-DOMAIN/admin`

Only the exact `/admin` route opens the admin authentication screen. Alternate URL forms such as `#admin`, `?admin=true`, and `?panel=admin` are disabled.

## Admin PIN

Set the initial PIN through the server environment variable:

`ADMIN_PIN_INITIAL=YOUR_6_DIGIT_OR_LONGER_PIN`

Do not commit the real PIN to GitHub. The PIN is stored server-side as a hash and can be changed from the authenticated Admin Panel.

The deployed production contracts remain configured through environment variables; do not put private keys or the real admin PIN in frontend source code.

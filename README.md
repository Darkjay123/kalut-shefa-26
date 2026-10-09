# Kalut-Shefa '26 · Elijah & Mary-Ann

Wedding site for Elijah Ijabor & Mary-Ann Nwakor. Traditional Wedding 21 Nov 2026, White Wedding 28 Nov 2026.
Live: https://kalut-shefa-26.vercel.app (Vercel, auto-deploys from `main`). Admin: `/admin.html`.

- `index.html`, `styles.css`, `app.js` – the site
- `config.js` – event dates, bank details, Paystack PUBLIC key, pre-wedding portraits list
- `admin.html`, `admin.js` – admin portal (visits, RSVPs, gifts, hearts, love-jar approvals, CSV export)
- `api/` – Vercel functions on Upstash Redis (keys prefixed `ks26:`): `rsvp`, `visit`, `love`, `gift`, `admin`

## Vercel environment variables
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` – set by the Upstash integration
- `ADMIN_PASSWORD` – admin portal password
- `PAYSTACK_SECRET_KEY` – optional; when set, every card gift is confirmed with Paystack before it is recorded

## Turning on card gifts
1. Elijah opens a Paystack account and adds his Fidelity settlement account.
2. Put his PUBLIC key (`pk_live_...`) in `config.js`.
3. Put his SECRET key (`sk_live_...`) in Vercel as `PAYSTACK_SECRET_KEY` (never in the code), then redeploy.

## Pre-wedding portraits
Drop photos in `assets/img/shoot/` and list them in `config.js` → `PORTRAITS`.

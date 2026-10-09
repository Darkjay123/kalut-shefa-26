# Kalut-Shefa '26 · Elijah & Mary-ann

Wedding site for Elijah Ijabor & Mary-ann Nwakor. Traditional Wedding 21 Nov 2026, White Wedding 28 Nov 2026.

- `index.html` – the site (envelope intro, countdown, story, scratch reveal, films, events, colours, gallery, RSVP, gifts)
- `admin.html` – admin portal (visits, RSVPs, gifts, CSV export)
- `config.js` – Supabase + Paystack keys, event times, bank details
- `supabase.sql` – run once in Supabase SQL editor

## Go live
1. Create a free Supabase project, run `supabase.sql`, add admin emails to `public.admins`.
2. Supabase > Authentication > Users > Add user (email + password) for each admin.
3. Put the project URL and anon key in `config.js`.
4. Put the Paystack PUBLIC key (pk_live_...) in `config.js` once the groom's Paystack account is approved.

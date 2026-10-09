/* Kalut-Shefa '26 site settings. */
window.KS_CONFIG = {
  // RSVPs, gift notes and visits go to the site's own /api routes (Vercel + Upstash). Admin: /admin.html

  // Paystack PUBLIC key (pk_live_... or pk_test_...). Never put the secret key here.
  PAYSTACK_PUBLIC_KEY: "pk_live_12bf0a0d5131a348a8e7518e8db7da6ebc2dd522",

  // Countdown targets (WAT). Update the times once the couple confirm start times.
  EVENTS: {
    trad:  { name: "Traditional Wedding", date: "2026-11-21T00:00:00+01:00", label: "Saturday, 21 November 2026" },
    white: { name: "White Wedding",       date: "2026-11-28T00:00:00+01:00", label: "Saturday, 28 November 2026" }
  },

  // Pre-wedding shoot: drop photos in assets/img/shoot/ and list them here. Empty = elegant "coming soon" frames.
  PORTRAITS: [
    // "assets/img/shoot/01.webp",
  ],

  BANK: { bank: "Fidelity Bank", number: "6680975235", name: "Elijah Oghenerona Ijabor" }
};

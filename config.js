/* Kalut-Shefa '26 site settings. Fill these in to switch on live RSVPs, visit tracking and card gifts. */
window.KS_CONFIG = {
  // Supabase project (Settings > API). The anon key is safe to publish; security comes from the policies in supabase.sql.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Paystack PUBLIC key (pk_live_... or pk_test_...). Never put the secret key here.
  PAYSTACK_PUBLIC_KEY: "",

  // Countdown targets (WAT). Update the times once the couple confirm start times.
  EVENTS: {
    trad:  { name: "Traditional Wedding", date: "2026-11-21T00:00:00+01:00", label: "Saturday, 21 November 2026" },
    white: { name: "White Wedding",       date: "2026-11-28T00:00:00+01:00", label: "Saturday, 28 November 2026" }
  },

  BANK: { bank: "Fidelity Bank", number: "6680975235", name: "Elijah Oghenerona Ijabor" }
};

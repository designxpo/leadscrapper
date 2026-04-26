// ─── Motive registry ─────────────────────────────────────────────────────────
// A "motive" is a high-level intent (e.g. "find event sponsors") that maps to
// the right scraper + pre-filled query template + on-screen guidance.
// Picking a motive auto-configures the technical inputs in the sidebar so users
// don't need to know about Apify actors or query keys.

export type Motive = {
  id: string;
  label: string;
  description: string;
  icon: string;
  scraper: string; // SCRAPER_REGISTRY key
  // Pre-filled values keyed by RegistryField.key (UI key, not Apify key).
  // Empty strings mean "leave blank, user fills it in".
  prefill: Record<string, string>;
  hint: string;
};

export const MOTIVES: Motive[] = [
  {
    id: "event_sponsors",
    label: "Find Event Sponsors",
    description: "Agencies & brands with sponsorship budget",
    icon: "🎟️",
    scraper: "google_maps",
    prefill: {
      searchTerms:
        "marketing agencies, branding agencies, advertising firms, PR agencies, event management companies, corporate sponsors",
    },
    hint:
      "Pick the country/state/city where you want sponsors from — leave State and City blank for a country-wide " +
      "search. The pre-filled niches target companies with active sponsorship budgets (agencies, PR firms, event " +
      "managers). Add industries that match your event's audience for higher fit (e.g. fintech for a finance event).",
  },
  {
    id: "local_b2b",
    label: "Local B2B Outreach",
    description: "Brick-and-mortar businesses by niche",
    icon: "🏪",
    scraper: "google_maps",
    prefill: {},
    hint: "Enter the niche (e.g. dentists, plumbers, gyms) and the city to scrape.",
  },
  {
    id: "decision_makers",
    label: "B2B Decision Makers",
    description: "LinkedIn companies for exec outreach",
    icon: "🤝",
    scraper: "linkedin_companies",
    prefill: {},
    hint: "Paste a LinkedIn company search URL plus your li_at cookie.",
  },
  {
    id: "hiring_signals",
    label: "Hiring / Budget Signals",
    description: "Companies actively hiring = active budget",
    icon: "💼",
    scraper: "indeed_jobs",
    prefill: {},
    hint: "Companies posting jobs are spending money. Great time to pitch.",
  },
  {
    id: "real_estate",
    label: "Real Estate Leads",
    description: "Property listings on Zillow",
    icon: "🏡",
    scraper: "zillow",
    prefill: {},
    hint: "Search by city, neighborhood, or ZIP code.",
  },
  {
    id: "influencers",
    label: "Influencer Outreach",
    description: "Instagram profiles by handle",
    icon: "📸",
    scraper: "instagram",
    prefill: {},
    hint: "Comma-separated Instagram usernames.",
  },
  {
    id: "web_search",
    label: "Custom Web Search",
    description: "Free-form Google search → ranked URLs",
    icon: "🔍",
    scraper: "google_search",
    prefill: {},
    hint: "Type any Google search query — works for niche use cases.",
  },
];

export function findMotiveByScraper(scraperKey: string): Motive | null {
  return MOTIVES.find((m) => m.scraper === scraperKey) ?? null;
}

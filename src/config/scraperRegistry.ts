// ─── Production Scraper Registry ──────────────────────────────────────────────
//
// Each entry maps one Apify actor to the UI fields it needs.
//
// IMPORTANT FIELD PROPERTIES:
//   key      — internal name used by the frontend (dynamicPayload[key])
//   apifyKey — exact key the Apify actor expects in its input JSON
//   default  — value used when the user leaves the field blank
//
// To add a new data source: add an entry here + a normalizeData case in
// src/app/api/scrape/route.ts. No other files need to change.

export type FieldType = "text" | "number" | "select" | "password";

export type SelectOption = string | { value: string; label: string };

export type RegistryField = {
  key: string;
  apifyKey: string;              // exact Apify actor input key
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  default?: string | number;
  options?: SelectOption[];      // for type: "select"
  hint?: string;                 // small helper text under the field
};

export type ScraperDef = {
  id: string;
  category: string;
  name: string;
  apifyActorId: string;
  inputs: RegistryField[];
};

// ─── Country list ────────────────────────────────────────────────────────────
// ISO-3166 alpha-2 codes (lowercase) — what compass/google-maps-extractor expects.
// Ordered by the markets event sponsorships most commonly target.

const COUNTRY_OPTIONS: SelectOption[] = [
  { value: "us", label: "United States" },
  { value: "in", label: "India" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "sg", label: "Singapore" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "nl", label: "Netherlands" },
  { value: "ie", label: "Ireland" },
  { value: "br", label: "Brazil" },
  { value: "mx", label: "Mexico" },
  { value: "jp", label: "Japan" },
  { value: "kr", label: "South Korea" },
  { value: "za", label: "South Africa" },
  { value: "ng", label: "Nigeria" },
  { value: "ke", label: "Kenya" },
  { value: "id", label: "Indonesia" },
  { value: "ph", label: "Philippines" },
  { value: "th", label: "Thailand" },
  { value: "my", label: "Malaysia" },
  { value: "se", label: "Sweden" },
  { value: "no", label: "Norway" },
  { value: "dk", label: "Denmark" },
  { value: "fi", label: "Finland" },
  { value: "pl", label: "Poland" },
  { value: "tr", label: "Turkey" },
  { value: "sa", label: "Saudi Arabia" },
  { value: "il", label: "Israel" },
  { value: "ar", label: "Argentina" },
  { value: "cl", label: "Chile" },
  { value: "co", label: "Colombia" },
  { value: "nz", label: "New Zealand" },
];

export const SCRAPER_REGISTRY: Record<string, ScraperDef> = {

  // ── 1. LOCAL B2B ────────────────────────────────────────────────────────────
  google_maps: {
    id:           "google_maps",
    category:     "Local B2B",
    name:         "Google Maps Extractor",
    apifyActorId: "compass/google-maps-extractor",
    inputs: [
      {
        key: "searchTerms", apifyKey: "searchStringsArray",
        label: "Niche / Keywords", type: "text", required: true,
        placeholder: "Marketing agencies, PR firms...",
        hint: "Comma-separated. Each term runs as a separate Google Maps search.",
      },
      {
        key: "country", apifyKey: "countryCode",
        label: "Country", type: "select", required: true,
        options: COUNTRY_OPTIONS,
        default: "us",
      },
      {
        key: "state", apifyKey: "state",
        label: "State / Region", type: "text",
        placeholder: "California, Maharashtra, Bavaria...",
        hint: "Optional — narrows the search within the country.",
      },
      {
        key: "city", apifyKey: "city",
        label: "City", type: "text",
        placeholder: "Austin, Mumbai, Berlin...",
        hint: "Optional — most precise. Leave blank to search the whole country/state.",
      },
      {
        key: "maxResults", apifyKey: "maxCrawledPlacesPerSearch",
        label: "Max Leads (per search)", type: "number", required: true,
        default: 50,
      },
    ],
  },

  // ── 2. B2B DECISION MAKERS ──────────────────────────────────────────────────
  linkedin_companies: {
    id:           "linkedin_companies",
    category:     "B2B Decision Makers",
    name:         "LinkedIn Companies",
    apifyActorId: "epctex/linkedin-company-scraper",
    inputs: [
      {
        key: "keyword", apifyKey: "searchUrl",
        label: "LinkedIn Search URL", type: "text", required: true,
        placeholder: "https://www.linkedin.com/search/results/companies/...",
      },
      {
        key: "cookie", apifyKey: "cookie",
        label: "li_at Cookie (Required)", type: "password", required: true,
        placeholder: "AQEDAS...",
      },
      {
        key: "maxResults", apifyKey: "maxItems",
        label: "Max Companies", type: "number", required: true,
        default: 20,
      },
    ],
  },

  // ── 3. HIRING & BUDGET ──────────────────────────────────────────────────────
  indeed_jobs: {
    id:           "indeed_jobs",
    category:     "Hiring & Budget",
    name:         "Indeed Active Jobs",
    apifyActorId: "hynek/indeed-scraper",
    inputs: [
      {
        key: "position", apifyKey: "position",
        label: "Job Title", type: "text", required: true,
        placeholder: "Software Engineer, Marketing...",
      },
      {
        key: "location", apifyKey: "location",
        label: "Location", type: "text", required: true,
        placeholder: "New York, NY",
      },
      {
        key: "maxResults", apifyKey: "maxItems",
        label: "Max Jobs", type: "number", required: true,
        default: 50,
      },
    ],
  },

  // ── 4. REAL ESTATE ──────────────────────────────────────────────────────────
  zillow_properties: {
    id:           "zillow_properties",
    category:     "Real Estate",
    name:         "Zillow Properties",
    apifyActorId: "apify/zillow-api-scraper",
    inputs: [
      {
        key: "location", apifyKey: "search",
        label: "City, Zip, or Neighborhood", type: "text", required: true,
        placeholder: "Beverly Hills, CA",
      },
      {
        key: "status", apifyKey: "status",
        label: "Property Status", type: "select", required: true,
        options: ["forSale", "forRent", "recentlySold"],
        default: "forSale",
      },
      {
        key: "maxResults", apifyKey: "maxItems",
        label: "Max Listings", type: "number", required: true,
        default: 100,
      },
    ],
  },

  // ── 5. SOCIAL MEDIA ─────────────────────────────────────────────────────────
  instagram_profiles: {
    id:           "instagram_profiles",
    category:     "Social Media",
    name:         "Instagram Profiles",
    apifyActorId: "apify/instagram-profile-scraper",
    inputs: [
      {
        key: "usernames", apifyKey: "usernames",
        label: "Usernames (comma-separated)", type: "text", required: true,
        placeholder: "nike, apple, google",
      },
    ],
  },

  // ── 6. SEO & WEB ────────────────────────────────────────────────────────────
  google_search: {
    id:           "google_search",
    category:     "SEO & Web",
    name:         "Google Search (SERP)",
    apifyActorId: "apify/google-search-scraper",
    inputs: [
      {
        key: "queries", apifyKey: "queries",
        label: "Search Queries", type: "text", required: true,
        placeholder: "Top marketing agencies in UK",
      },
      {
        key: "resultsPerPage", apifyKey: "resultsPerPage",
        label: "Results Per Page", type: "number", required: true,
        default: 10,
      },
    ],
  },

};

// Ordered unique categories for sidebar grouping
export const SCRAPER_CATEGORIES = [
  ...new Set(Object.values(SCRAPER_REGISTRY).map((s) => s.category)),
] as const;

export type ScraperCategory = (typeof SCRAPER_CATEGORIES)[number];

export const SCRAPER_IDS = Object.keys(SCRAPER_REGISTRY);

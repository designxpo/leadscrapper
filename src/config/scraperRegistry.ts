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

export type RegistryField = {
  key: string;
  apifyKey: string;              // exact Apify actor input key
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  default?: string | number;
  options?: string[];            // for type: "select"
};

export type ScraperDef = {
  id: string;
  category: string;
  name: string;
  apifyActorId: string;
  inputs: RegistryField[];
};

export const SCRAPER_REGISTRY: Record<string, ScraperDef> = {

  // ── 1. LOCAL B2B ────────────────────────────────────────────────────────────
  google_maps: {
    id:           "google_maps",
    category:     "Local B2B",
    name:         "Google Maps Extractor",
    apifyActorId: "compass/google-maps-extractor",
    inputs: [
      {
        key: "searchTerms", apifyKey: "searchTerms",
        label: "Niche / Keywords", type: "text", required: true,
        placeholder: "Dentists, Plumbers...",
      },
      {
        key: "location", apifyKey: "location",
        label: "City & State", type: "text", required: true,
        placeholder: "Austin, TX",
      },
      {
        key: "maxResults", apifyKey: "maxResults",
        label: "Max Leads", type: "number", required: true,
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

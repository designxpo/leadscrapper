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
  // "apify"  → runs via Apify, apifyActorId is the actor slug
  // "direct" → custom server-side handler, apifyActorId is the handler key
  provider?: "apify" | "direct";
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

  // ── OLX India property buyers ──────────────────────────────────────────────
  // Direct scraper — no Apify needed. Buyers post "property wanted" ads with
  // budget and requirements. Contact via the OLX listing URL.
  olx_india_buyers: {
    id:           "olx_india_buyers",
    category:     "Real Estate India",
    name:         "OLX India — Property Wanted Ads",
    provider:     "direct",
    apifyActorId: "direct/olx-india",
    inputs: [
      {
        key: "olxCity", apifyKey: "startUrls",
        label: "City", type: "select", required: true,
        options: [
          { value: "mumbai",     label: "Mumbai"         },
          { value: "delhi",      label: "Delhi / NCR"    },
          { value: "bangalore",  label: "Bangalore"      },
          { value: "hyderabad",  label: "Hyderabad"      },
          { value: "chennai",    label: "Chennai"        },
          { value: "pune",       label: "Pune"           },
          { value: "kolkata",    label: "Kolkata"        },
          { value: "ahmedabad",  label: "Ahmedabad"      },
          { value: "jaipur",     label: "Jaipur"         },
          { value: "lucknow",    label: "Lucknow"        },
          { value: "surat",      label: "Surat"          },
          { value: "noida",      label: "Noida"          },
          { value: "gurgaon",    label: "Gurgaon"        },
          { value: "chandigarh", label: "Chandigarh"     },
          { value: "kochi",      label: "Kochi"          },
          { value: "coimbatore", label: "Coimbatore"     },
          { value: "bhopal",     label: "Bhopal"         },
          { value: "indore",     label: "Indore"         },
          { value: "nagpur",     label: "Nagpur"         },
          { value: "vadodara",   label: "Vadodara"       },
        ],
        default: "mumbai",
        hint: "Select the city you want to find property buyers in.",
      },
      {
        key: "olxIntent", apifyKey: "_intent",
        label: "Intent", type: "select", required: true,
        options: [
          { value: "buy",  label: "Wants to Buy"  },
          { value: "rent", label: "Wants to Rent" },
        ],
        default: "buy",
        hint: "Buy = purchase seekers. Rent = tenants looking for a flat/house.",
      },
      {
        key: "olxArea", apifyKey: "_area",
        label: "Area / Neighbourhood (optional)", type: "text",
        placeholder: "Andheri, Whitefield, Banjara Hills...",
        hint: "Narrows results to a specific area. Leave blank for city-wide.",
      },
      {
        key: "maxResults", apifyKey: "maxItems",
        label: "Max Listings", type: "number", required: true,
        default: 50,
      },
    ],
  },

  // ── MagicBricks — Buyer Requirements ───────────────────────────────────────
  // India's largest property portal. Buyers publicly post purchase/rent
  // requirements with budget, BHK preference, and locality.
  // Requires Apify (headless rendering). Actor: epctex/magicbricks-scraper
  magicbricks_buyers: {
    id:           "magicbricks_buyers",
    category:     "Real Estate India",
    name:         "MagicBricks — Buyer Requirements",
    apifyActorId: "epctex/magicbricks-scraper",
    inputs: [
      {
        key: "startUrl", apifyKey: "startUrls",
        label: "Requirements Page URL", type: "text", required: true,
        placeholder: "https://www.magicbricks.com/buyer-requirements-in-mumbai",
        hint: "Go to magicbricks.com → Buyer Requirements → select your city. Paste the URL here.",
      },
      {
        key: "maxResults", apifyKey: "maxItems",
        label: "Max Requirements", type: "number", required: true,
        default: 50,
      },
    ],
  },

  // ── 99acres — Buyer Requirements ───────────────────────────────────────────
  // India's 2nd-largest portal. Buyers post requirements with budget, area,
  // and BHK. Blocks direct scraping; Apify headless actor needed.
  // Actor: epctex/99acres-scraper
  acres99_buyers: {
    id:           "acres99_buyers",
    category:     "Real Estate India",
    name:         "99acres — Buyer Requirements",
    apifyActorId: "epctex/99acres-scraper",
    inputs: [
      {
        key: "startUrl", apifyKey: "startUrls",
        label: "Requirements Page URL", type: "text", required: true,
        placeholder: "https://www.99acres.com/requirement-search.html?city=4&intentType=B",
        hint: "Go to 99acres.com → Post Requirement or search requirements for your city. Paste the URL.",
      },
      {
        key: "maxResults", apifyKey: "maxItems",
        label: "Max Requirements", type: "number", required: true,
        default: 50,
      },
    ],
  },

  // ── Google Search — India Property Buyers ──────────────────────────────────
  // Surfaces buyer-intent posts from forums, Facebook groups, and community
  // threads that major portals don't index. No Apify key needed for this
  // approach — uses the existing Google Search actor with pre-set queries.
  google_india_property_buyers: {
    id:           "google_india_property_buyers",
    category:     "Real Estate India",
    name:         "Google — India Property Buyer Posts",
    apifyActorId: "apify/google-search-scraper",
    inputs: [
      {
        key: "queries", apifyKey: "queries",
        label: "Search Query", type: "text", required: true,
        placeholder: "looking for 2BHK flat to buy in Mumbai budget 80 lakhs",
        hint: 'Be specific — e.g. "want to buy 3BHK flat in Pune under 1 crore". Also try "property wanted in [city]".',
      },
      {
        key: "resultsPerPage", apifyKey: "resultsPerPage",
        label: "Results Per Page", type: "number", required: true,
        default: 20,
      },
    ],
  },

  // Scrapes the "real estate wanted" section of Craigslist — these are posts
  // from actual buyers/tenants who have self-identified with their budget,
  // location preference, and requirements. Reply via the Craigslist relay.
  craigslist_buyers: {
    id:           "craigslist_buyers",
    category:     "Real Estate",
    name:         "Craigslist — Property Buyers",
    apifyActorId: "apify/craigslist-scraper",
    inputs: [
      {
        key: "searchUrl", apifyKey: "startUrls",
        label: "Craigslist Search URL", type: "text", required: true,
        placeholder: "https://newyork.craigslist.org/d/real-estate-wanted/search/rea",
        hint: "Go to craigslist.org → Real Estate → Real Estate Wanted. Copy the full URL. Change 'newyork' to your city's Craigslist subdomain.",
      },
      {
        key: "maxResults", apifyKey: "maxItems",
        label: "Max Listings", type: "number", required: true,
        default: 50,
      },
    ],
  },

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

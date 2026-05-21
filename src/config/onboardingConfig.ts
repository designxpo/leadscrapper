// ─── Onboarding config ────────────────────────────────────────────────────────
// Roles → Goals → Dashboard presets.
// Picking a goal in the wizard atomically pre-configures the scraper,
// search terms, quality strategy, and signal threshold on the dashboard.

export type Role = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export type DashboardPreset = {
  motive: string;                    // motive id in motiveRegistry
  scraper: string;                   // key in SCRAPER_REGISTRY
  prefill: Record<string, string>;   // pre-filled field values (by RegistryField.key)
  strategy: "strict" | "balanced" | "broad";
  minSignals: "any" | "1+" | "2+" | "3+";
};

export type Goal = {
  id: string;
  roleId: string;
  label: string;
  description: string;
  icon: string;
  preset: DashboardPreset;
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export const ROLES: Role[] = [
  {
    id: "real_estate",
    label: "Real Estate Pro",
    description: "Property sales, rentals, or investment",
    icon: "🏠",
  },
  {
    id: "event_organizer",
    label: "Event Organizer",
    description: "Events, conferences, or activations",
    icon: "🎟️",
  },
  {
    id: "b2b_sales",
    label: "B2B Sales",
    description: "Selling products or services to businesses",
    icon: "🤝",
  },
  {
    id: "marketing_agency",
    label: "Marketing Agency",
    description: "Running a marketing, PR, or branding agency",
    icon: "📣",
  },
  {
    id: "recruiter",
    label: "Recruiter / HR",
    description: "Hiring talent or finding company partners",
    icon: "💼",
  },
  {
    id: "ecommerce",
    label: "E-commerce / Brand",
    description: "Online store or consumer-facing brand",
    icon: "🛍️",
  },
];

// ─── Goals per role ───────────────────────────────────────────────────────────

export const GOALS: Goal[] = [

  // ── Real Estate ─────────────────────────────────────────────────────────────
  {
    id: "find_property_buyers_india_olx",
    roleId: "real_estate",
    label: "Find Buyers in India (OLX)",
    description: "People posting 'wanted to buy' ads on OLX India — no Apify needed",
    icon: "🔑",
    preset: {
      motive: "re_buyers_india",
      scraper: "olx_india_buyers",
      prefill: { olxCity: "mumbai", olxIntent: "buy" },
      strategy: "broad",
      minSignals: "any",
    },
  },
  {
    id: "find_renters_india_olx",
    roleId: "real_estate",
    label: "Find Tenants in India (OLX)",
    description: "People looking for rental flats/houses posted on OLX India",
    icon: "🏠",
    preset: {
      motive: "re_buyers_india",
      scraper: "olx_india_buyers",
      prefill: { olxCity: "mumbai", olxIntent: "rent" },
      strategy: "broad",
      minSignals: "any",
    },
  },
  {
    id: "find_buyers_magicbricks",
    roleId: "real_estate",
    label: "Buyer Requirements (MagicBricks)",
    description: "Buyers posting requirements with budget & BHK — requires Apify",
    icon: "🧱",
    preset: {
      motive: "re_buyers_india",
      scraper: "magicbricks_buyers",
      prefill: { startUrl: "https://www.magicbricks.com/buyer-requirements-in-mumbai" },
      strategy: "broad",
      minSignals: "any",
    },
  },
  {
    id: "find_buyers_99acres",
    roleId: "real_estate",
    label: "Buyer Requirements (99acres)",
    description: "Purchase/rent requirements posted by buyers on 99acres — requires Apify",
    icon: "🌾",
    preset: {
      motive: "re_buyers_india",
      scraper: "acres99_buyers",
      prefill: { startUrl: "https://www.99acres.com/requirement-search.html?city=4&intentType=B" },
      strategy: "broad",
      minSignals: "any",
    },
  },
  {
    id: "find_property_buyers_us",
    roleId: "real_estate",
    label: "Find Buyers (US / UK)",
    description: "Craigslist 'real estate wanted' posts",
    icon: "🏘️",
    preset: {
      motive: "re_buyers",
      scraper: "craigslist_buyers",
      prefill: {
        searchUrl: "https://newyork.craigslist.org/d/real-estate-wanted/search/rea",
      },
      strategy: "broad",
      minSignals: "any",
    },
  },
  {
    id: "find_re_investors",
    roleId: "real_estate",
    label: "Find Investors",
    description: "Connect with property investment groups",
    icon: "💰",
    preset: {
      motive: "local_b2b",
      scraper: "google_maps",
      prefill: {
        searchTerms:
          "real estate investment clubs, property investors association, real estate investment group",
      },
      strategy: "balanced",
      minSignals: "2+",
    },
  },
  {
    id: "find_rental_leads",
    roleId: "real_estate",
    label: "Find Rental Tenants",
    description: "Source tenants for your properties",
    icon: "🏘️",
    preset: {
      motive: "web_search",
      scraper: "google_search",
      prefill: {
        queries:
          "looking for apartment to rent, tenants wanted, rental accommodation search",
      },
      strategy: "broad",
      minSignals: "any",
    },
  },
  {
    id: "find_re_listings",
    roleId: "real_estate",
    label: "Browse Listings",
    description: "Scan property listings on Zillow",
    icon: "📋",
    preset: {
      motive: "real_estate",
      scraper: "zillow_properties",
      prefill: { status: "forSale" },
      strategy: "broad",
      minSignals: "any",
    },
  },

  // ── Event Organizer ──────────────────────────────────────────────────────────
  {
    id: "find_event_sponsors",
    roleId: "event_organizer",
    label: "Find Sponsors",
    description: "Agencies & brands with sponsorship budget",
    icon: "💎",
    preset: {
      motive: "event_sponsors",
      scraper: "google_maps",
      prefill: {
        searchTerms:
          "marketing agencies, branding agencies, advertising firms, PR agencies, event management companies, corporate sponsors",
      },
      strategy: "balanced",
      minSignals: "2+",
    },
  },
  {
    id: "find_event_vendors",
    roleId: "event_organizer",
    label: "Find Vendors",
    description: "Caterers, AV, venues, and suppliers",
    icon: "🎪",
    preset: {
      motive: "local_b2b",
      scraper: "google_maps",
      prefill: {
        searchTerms:
          "event catering companies, AV hire, event venues, event decorators, event photography",
      },
      strategy: "balanced",
      minSignals: "2+",
    },
  },

  // ── B2B Sales ────────────────────────────────────────────────────────────────
  {
    id: "find_biz_prospects",
    roleId: "b2b_sales",
    label: "Find Business Prospects",
    description: "Local & regional companies to pitch",
    icon: "🏢",
    preset: {
      motive: "local_b2b",
      scraper: "google_maps",
      prefill: {},
      strategy: "balanced",
      minSignals: "2+",
    },
  },
  {
    id: "find_decision_makers",
    roleId: "b2b_sales",
    label: "Find Decision Makers",
    description: "Executives and buyers on LinkedIn",
    icon: "👔",
    preset: {
      motive: "decision_makers",
      scraper: "linkedin_companies",
      prefill: {},
      strategy: "strict",
      minSignals: "1+",
    },
  },
  {
    id: "find_hiring_biz",
    roleId: "b2b_sales",
    label: "Find Companies with Budget",
    description: "Active hiring signals = active spend",
    icon: "📈",
    preset: {
      motive: "hiring_signals",
      scraper: "indeed_jobs",
      prefill: {},
      strategy: "balanced",
      minSignals: "any",
    },
  },

  // ── Marketing Agency ─────────────────────────────────────────────────────────
  {
    id: "find_agency_clients",
    roleId: "marketing_agency",
    label: "Find Clients",
    description: "Businesses that need marketing help",
    icon: "🎯",
    preset: {
      motive: "local_b2b",
      scraper: "google_maps",
      prefill: {
        searchTerms:
          "businesses, restaurants, clinics, law firms, gyms, salons, retail stores",
      },
      strategy: "balanced",
      minSignals: "2+",
    },
  },
  {
    id: "find_influencer_partners",
    roleId: "marketing_agency",
    label: "Find Influencers",
    description: "Instagram profiles for campaigns",
    icon: "⭐",
    preset: {
      motive: "influencers",
      scraper: "instagram_profiles",
      prefill: {},
      strategy: "balanced",
      minSignals: "1+",
    },
  },

  // ── Recruiter / HR ───────────────────────────────────────────────────────────
  {
    id: "find_hiring_companies",
    roleId: "recruiter",
    label: "Find Hiring Companies",
    description: "Companies with open positions right now",
    icon: "🏭",
    preset: {
      motive: "hiring_signals",
      scraper: "indeed_jobs",
      prefill: {},
      strategy: "balanced",
      minSignals: "any",
    },
  },
  {
    id: "find_linkedin_cos",
    roleId: "recruiter",
    label: "Find LinkedIn Companies",
    description: "Corporate targets to pitch your services",
    icon: "🔗",
    preset: {
      motive: "decision_makers",
      scraper: "linkedin_companies",
      prefill: {},
      strategy: "strict",
      minSignals: "1+",
    },
  },

  // ── E-commerce / Brand ───────────────────────────────────────────────────────
  {
    id: "find_ecom_influencers",
    roleId: "ecommerce",
    label: "Find Influencers",
    description: "Instagram profiles for collaborations",
    icon: "📸",
    preset: {
      motive: "influencers",
      scraper: "instagram_profiles",
      prefill: {},
      strategy: "balanced",
      minSignals: "1+",
    },
  },
  {
    id: "find_ecom_web",
    roleId: "ecommerce",
    label: "Custom Web Search",
    description: "Free-form Google search for any niche",
    icon: "🔍",
    preset: {
      motive: "web_search",
      scraper: "google_search",
      prefill: {},
      strategy: "broad",
      minSignals: "any",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function goalsByRole(roleId: string): Goal[] {
  return GOALS.filter((g) => g.roleId === roleId);
}

export function presetByGoal(goalId: string): DashboardPreset | null {
  return GOALS.find((g) => g.id === goalId)?.preset ?? null;
}

export function roleById(roleId: string): Role | null {
  return ROLES.find((r) => r.id === roleId) ?? null;
}

export function goalById(goalId: string): Goal | null {
  return GOALS.find((g) => g.id === goalId) ?? null;
}

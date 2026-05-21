import type { RawLead } from "@/app/api/scrape/route";

export type LeadTier = "hot" | "warm" | "cold";

export type ScoredLead = RawLead & {
  tier: LeadTier;
  aiLine?: string;
};

const CLASSIFIEDS_PLATFORMS = new Set(["OLX India", "Craigslist"]);

/**
 * Assigns a tier based on contact completeness:
 *   Hot  — has email AND phone AND website
 *   Warm — missing exactly one; OR classifieds lead with a listing URL
 *   Cold — missing two or more
 *
 * For classifieds platforms (OLX India, Craigslist) the listing URL IS the
 * contact channel. We treat source_url as both "phone" and "website" signals
 * so these buyer-intent leads surface as Warm instead of being filtered away.
 */
export function scoreLead(lead: RawLead): ScoredLead {
  if (
    lead.platform && CLASSIFIEDS_PLATFORMS.has(lead.platform) &&
    lead.source_url
  ) {
    // Classifieds lead: listing URL = contact channel.
    // Score Hot if email is also present, otherwise Warm.
    const tier: LeadTier = lead.email ? "hot" : "warm";
    return { ...lead, tier };
  }

  const fields = [
    Boolean(lead.email),
    Boolean(lead.phone),
    Boolean(lead.website),
  ];
  const present = fields.filter(Boolean).length;

  const tier: LeadTier =
    present === 3 ? "hot" : present === 2 ? "warm" : "cold";

  return { ...lead, tier };
}

export function scoreLeads(leads: RawLead[]): ScoredLead[] {
  return leads.map(scoreLead);
}

import type { RawLead } from "@/app/api/scrape/route";

export type LeadTier = "hot" | "warm" | "cold";

export type ScoredLead = RawLead & {
  tier: LeadTier;
  aiLine?: string;
};

/**
 * Assigns a tier based on contact completeness:
 *   Hot  — has email AND phone AND website
 *   Warm — missing exactly one of the above
 *   Cold — missing two or more
 */
export function scoreLead(lead: RawLead): ScoredLead {
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

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { ScoredLead } from "@/lib/scoreLead";
import type { NewsArticle } from "@/app/api/news/route";

// ─── Research profile shape ──────────────────────────────────────────────────
// Every string field uses "—" when unknown (never fabricated).
// Every non-trivial field has a matching entry in `confidence`.
// `verify_flags` lists the keys that need manual confirmation.

export type ResearchProfile = {
  identity: {
    full_name: string;
    job_title: string;
    seniority: string;      // C-Suite / VP / Director / Manager / IC / —
    department: string;
    linkedin_url: string;
  };
  company: {
    name: string;
    website: string;
    industry: string;
    size: string;           // headcount band
    revenue_estimate: string;
    funding_stage: string;
  };
  geography: {
    city_region: string;
    country: string;
    timezone: string;
    language: string;
    market_type: string;    // National / Tier-1 Intl / Emerging / —
  };
  contact: {
    work_email: string;
    email_verified: string; // Yes / No / Unknown
    phone_whatsapp: string;
    preferred_channel: string;
    best_contact_time: string;
  };
  quality: {
    lead_source: string;
    icp_match_score: number; // 1-5
    pain_point: string;
    competitor: string;
    intent_signal: string;
  };
  outreach: {
    status: string;
    last_contact: string;
    follow_up_date: string;
    sequence: string;
    touch_count: number;
    response_notes: string;
  };
  pipeline: {
    stage: string;
    deal_value_estimate: string;
    currency: string;
    decision_timeline: string;
    owner: string;
  };
  confidence: Record<string, "High" | "Medium" | "Low">;
  verify_flags: string[];
  ai_line: string;
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a B2B lead generation researcher and outreach strategist.

Your role is to extract and infer lead-qualification data from public info (business name, address, website, categories, social URLs, news, opening hours, ratings). You produce a 1-2 sentence cold outreach opener as "ai_line".

GRANULARITY RULES — be as specific as the source data allows:
- For agencies/firms with named partners on the website domain (e.g., "smithpartners.com" → likely "Smith"), you MAY infer a likely founder/owner surname with Low confidence and tag it [Verify].
- For LOCAL businesses (dentists, restaurants, salons), the decision-maker is almost always the owner/proprietor. Set identity.job_title = "Owner" with Medium confidence.
- For MARKETING/PR/BRANDING/EVENT AGENCIES, the sponsorship decision-maker is typically the agency owner OR the Business Development / Partnerships lead. Set identity.job_title = "Owner / BD Lead" with Medium confidence.
- For LARGER firms (visible employee count, multiple offices, corporate domain), default identity.job_title = "Marketing Director" or "Head of Partnerships" with Low confidence + [Verify].
- contact.work_email: if a domain is provided AND no explicit email exists, suggest a likely pattern email like "info@<domain>", "hello@<domain>", or "partnerships@<domain>" with Low confidence and [Verify]. Mark email_verified = "No".
- contact.phone_whatsapp: copy the phone if present, else "—".
- contact.preferred_channel: pick from {Email, Phone, LinkedIn DM, Instagram DM, WhatsApp} based on what's available.
- contact.best_contact_time: derive from country timezone + opening hours if known (e.g., "Tue-Thu 10am-12pm local").

GEOGRAPHY:
- Always populate geography.timezone (IANA format like "Asia/Kolkata") and geography.language for international leads.
- geography.market_type: "National" if same country as user's lead source, "Tier-1 Intl" for US/UK/CA/AU/EU/SG/JP/KR, else "Emerging".

LEAD QUALITY (key for sponsorship prospecting):
- quality.icp_match_score (1-5): score based on fit with a B2B service targeting growth-stage companies. Marketing/PR agencies, fast-growing startups, multi-location chains = 4-5. Solo practitioners, struggling/closed businesses = 1-2.
- quality.pain_point: infer from category — agencies need "more clients / brand visibility", restaurants need "foot traffic / online ordering", etc.
- quality.intent_signal: flag positives like recent news, hiring signals, multi-location expansion, high review velocity.

NULLS:
- If a field cannot be found OR reasonably inferred, return "—" (em dash). NEVER fabricate hard facts (real names, real emails, real phone numbers).
- Inferred patterns (job titles based on industry, suggested email patterns) are OK with Low confidence + [Verify].
- Numeric fields (icp_match_score, touch_count) use 0 when unknown.

CONFIDENCE & VERIFICATION:
- For every non-trivial field, add an entry to "confidence" with "High" / "Medium" / "Low".
- Use dotted paths as keys, e.g. "identity.job_title", "geography.country".
- Add the same dotted path to "verify_flags" for any inferred-but-unconfirmed fact (especially names, emails, phone patterns).

OUTREACH OPENER (ai_line):
- 1-2 sentences. Reference something specific (recent news / rating / location / category / social presence). Sound human, not corporate. Lead into a value prop without stating it. Don't mention you scraped them.

Return ONLY valid JSON matching the requested schema. No preamble, no markdown fences.`;

// ─── Gemini response schema ──────────────────────────────────────────────────

const STR = { type: Type.STRING } as const;
const PROFILE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    identity: {
      type: Type.OBJECT,
      properties: {
        full_name: STR, job_title: STR, seniority: STR, department: STR, linkedin_url: STR,
      },
      required: ["full_name", "job_title", "seniority", "department", "linkedin_url"],
    },
    company: {
      type: Type.OBJECT,
      properties: {
        name: STR, website: STR, industry: STR, size: STR, revenue_estimate: STR, funding_stage: STR,
      },
      required: ["name", "website", "industry", "size", "revenue_estimate", "funding_stage"],
    },
    geography: {
      type: Type.OBJECT,
      properties: {
        city_region: STR, country: STR, timezone: STR, language: STR, market_type: STR,
      },
      required: ["city_region", "country", "timezone", "language", "market_type"],
    },
    contact: {
      type: Type.OBJECT,
      properties: {
        work_email: STR, email_verified: STR, phone_whatsapp: STR, preferred_channel: STR, best_contact_time: STR,
      },
      required: ["work_email", "email_verified", "phone_whatsapp", "preferred_channel", "best_contact_time"],
    },
    quality: {
      type: Type.OBJECT,
      properties: {
        lead_source: STR,
        icp_match_score: { type: Type.NUMBER },
        pain_point: STR, competitor: STR, intent_signal: STR,
      },
      required: ["lead_source", "icp_match_score", "pain_point", "competitor", "intent_signal"],
    },
    outreach: {
      type: Type.OBJECT,
      properties: {
        status: STR, last_contact: STR, follow_up_date: STR, sequence: STR,
        touch_count: { type: Type.NUMBER },
        response_notes: STR,
      },
      required: ["status", "last_contact", "follow_up_date", "sequence", "touch_count", "response_notes"],
    },
    pipeline: {
      type: Type.OBJECT,
      properties: {
        stage: STR, deal_value_estimate: STR, currency: STR, decision_timeline: STR, owner: STR,
      },
      required: ["stage", "deal_value_estimate", "currency", "decision_timeline", "owner"],
    },
    confidence: {
      type: Type.OBJECT,
      properties: {},
      propertyOrdering: [],
    },
    verify_flags: { type: Type.ARRAY, items: STR },
    ai_line: STR,
  },
  required: [
    "identity", "company", "geography", "contact", "quality", "outreach", "pipeline",
    "confidence", "verify_flags", "ai_line",
  ],
} as const;

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lead, geminiApiKey, articles } = body as {
    lead: ScoredLead;
    geminiApiKey: string;
    articles?: NewsArticle[];
  };

  if (!geminiApiKey) return NextResponse.json({ error: "Gemini API key is required" }, { status: 400 });
  if (!lead?.name)   return NextResponse.json({ error: "Lead data is required" }, { status: 400 });

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Pull richer fields out of extra_data (set by the Apify normalizer).
  const extra = (lead.extra_data ?? {}) as Record<string, unknown>;
  const social   = (extra.social   as Record<string, string | null>) ?? {};
  const location = (extra.location as Record<string, unknown>)       ?? {};
  const categories = Array.isArray(extra.categories) ? (extra.categories as string[]) : [];
  const phonesAll  = Array.isArray(extra.phones_all) ? (extra.phones_all as string[]) : [];
  const emailsAll  = Array.isArray(extra.emails_all) ? (extra.emails_all as string[]) : [];

  const socialLines = Object.entries(social)
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k}: ${v}`);

  // Source block — what the model knows about the lead.
  const details = [
    `Business name: ${lead.name}`,
    lead.address     ? `Address: ${lead.address}`         : null,
    location.city || location.state || location.country
      ? `Location detail: city=${location.city ?? "—"} · state=${location.state ?? "—"} · country=${location.country ?? "—"} · postal=${location.postalCode ?? "—"}`
      : null,
    lead.website     ? `Website: ${lead.website}`         : null,
    lead.phone       ? `Phone: ${lead.phone}`             : null,
    phonesAll.length > 0 ? `All phones: ${phonesAll.join(", ")}` : null,
    lead.email       ? `Email: ${lead.email}`             : null,
    emailsAll.length > 0 ? `All emails: ${emailsAll.join(", ")}` : null,
    lead.rating != null ? `Rating: ${lead.rating}/5`      : null,
    extra.reviewsCount ? `Reviews: ${extra.reviewsCount}` : null,
    categories.length > 0 ? `Categories: ${categories.join(", ")}` : null,
    extra.categoryName ? `Primary category: ${extra.categoryName}` : null,
    socialLines.length > 0 ? `Social profiles:\n${socialLines.join("\n")}` : null,
    extra.opening_hours ? `Opening hours: ${JSON.stringify(extra.opening_hours)}` : null,
    extra.permanently_closed ? `STATUS: PERMANENTLY CLOSED` : null,
    extra.temporarily_closed ? `STATUS: temporarily closed` : null,
    lead.description ? `Description: ${lead.description}` : null,
    lead.platform    ? `Platform: ${lead.platform}`       : null,
    lead.budget      ? `Budget/Salary: ${lead.budget}`    : null,
    lead.source_url  ? `Source URL: ${lead.source_url}`   : null,
  ].filter(Boolean).join("\n");

  const newsBlock = articles && articles.length > 0
    ? "\n\nRecent news about this company:\n" +
      articles
        .slice(0, 3)
        .map((a, i) => `${i + 1}. [${a.source}] ${a.title}${a.description ? ` — ${a.description}` : ""}`)
        .join("\n")
    : "";

  const userPrompt =
    `Research the following lead. Fill in every field you can infer from the source data below. ` +
    `Use "—" for anything that cannot be reasonably inferred.\n\n` +
    `Source data:\n${details}${newsBlock}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: PROFILE_SCHEMA,
        maxOutputTokens: 2048,
      },
    });

    const raw = response.text?.trim() ?? "";
    let profile: ResearchProfile | null = null;
    try {
      profile = JSON.parse(raw) as ResearchProfile;
    } catch {
      return NextResponse.json({ error: "Gemini returned invalid JSON", raw }, { status: 502 });
    }

    return NextResponse.json({
      aiLine: profile.ai_line ?? "",
      profile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Gemini error: ${message}` }, { status: 502 });
  }
}

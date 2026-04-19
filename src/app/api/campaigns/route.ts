import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreateCampaignBody = {
  name: string;
  source: string;
  config: Record<string, unknown>;
  leads: {
    name: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address?: string | null;
    rating?: number | null;
    source_url?: string | null;
    extra_data?: Record<string, unknown> | null;
    platform?: string | null;
    description?: string | null;
    budget?: string | null;
    tier: string;
    ai_line?: string | null;
  }[];
};

// Build a Supabase client scoped to the caller's JWT so RLS sees auth.uid().
function scopedClient(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// ─── GET /api/campaigns ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = scopedClient(req);
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data });
}

// ─── POST /api/campaigns ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as CreateCampaignBody | null;

  if (!body || !body.name || !body.source || !Array.isArray(body.leads)) {
    return NextResponse.json(
      { error: "Missing required fields: name, source, leads[]" },
      { status: 400 }
    );
  }

  const supabase = scopedClient(req);

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = userData.user.id;

  // 1. Create the campaign
  const { data: campaign, error: campaignErr } = await supabase
    .from("campaigns")
    .insert({
      name:       body.name,
      source:     body.source,
      config:     body.config ?? {},
      lead_count: body.leads.length,
      user_id:    userId,
    })
    .select()
    .single();

  if (campaignErr || !campaign) {
    return NextResponse.json(
      { error: `Failed to create campaign: ${campaignErr?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  // 2. Bulk-insert leads linked to the campaign
  if (body.leads.length > 0) {
    const leadsToInsert = body.leads.map((lead) => ({
      campaign_id: campaign.id,
      name:        lead.name,
      phone:       lead.phone ?? null,
      email:       lead.email ?? null,
      website:     lead.website ?? null,
      address:     lead.address ?? null,
      rating:      lead.rating ?? null,
      source_url:  lead.source_url ?? null,
      extra_data:  lead.extra_data ?? null,
      platform:    lead.platform ?? null,
      description: lead.description ?? null,
      budget:      lead.budget ?? null,
      tier:        lead.tier,
      crm_status:  "new",
      ai_line:     lead.ai_line ?? null,
    }));

    const { error: leadsErr } = await supabase
      .from("leads")
      .insert(leadsToInsert);

    if (leadsErr) {
      return NextResponse.json(
        {
          campaign,
          warning: `Campaign created but lead insertion failed: ${leadsErr.message}`,
        },
        { status: 207 }
      );
    }
  }

  return NextResponse.json({ campaign }, { status: 201 });
}

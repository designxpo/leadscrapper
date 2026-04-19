import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteCtx = { params: Promise<{ id: string }> };

function scopedClient(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

const VALID_CRM_STATUSES = ["new", "contacted", "replied", "converted"] as const;

// ─── PATCH /api/leads/[id] ───────────────────────────────────────────────────
// Updates a lead's CRM status, notes, or tier.
// This is the core CRM progression endpoint.

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Whitelist updatable fields
  const allowed: Record<string, unknown> = {};

  if (typeof body.crm_status === "string") {
    if (!VALID_CRM_STATUSES.includes(body.crm_status)) {
      return NextResponse.json(
        { error: `Invalid crm_status. Must be one of: ${VALID_CRM_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    allowed.crm_status = body.crm_status;
  }

  if (typeof body.notes === "string") {
    allowed.notes = body.notes;
  }

  if (typeof body.tier === "string" && ["hot", "warm", "cold"].includes(body.tier)) {
    allowed.tier = body.tier;
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update (crm_status, notes, tier)" },
      { status: 400 }
    );
  }

  const supabase = scopedClient(req);
  const { data, error } = await supabase
    .from("leads")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: data });
}

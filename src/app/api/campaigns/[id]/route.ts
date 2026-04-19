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

// ─── GET /api/campaigns/[id] ─────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = scopedClient(req);

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  if (leadsErr) {
    return NextResponse.json(
      { error: `Failed to fetch leads: ${leadsErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ campaign, leads });
}

// ─── PATCH /api/campaigns/[id] ───────────────────────────────────────────────

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed: Record<string, unknown> = {};
  if (typeof body.name === "string")   allowed.name   = body.name;
  if (typeof body.status === "string") allowed.status = body.status;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update (name, status)" },
      { status: 400 }
    );
  }

  const supabase = scopedClient(req);
  const { data, error } = await supabase
    .from("campaigns")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: data });
}

// ─── DELETE /api/campaigns/[id] ──────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = scopedClient(req);

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

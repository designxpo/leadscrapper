import { NextRequest, NextResponse } from "next/server";
import { scopedClient } from "@/lib/api-utils";

// ─── GET /api/profile ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = scopedClient(req);

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, goal_id, onboarding_complete")
    .eq("id", userData.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

// ─── PATCH /api/profile ───────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = scopedClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const allowed: Record<string, unknown> = {};
  if (typeof body.role === "string")               allowed.role = body.role;
  if (typeof body.goal_id === "string")            allowed.goal_id = body.goal_id;
  if (typeof body.full_name === "string")          allowed.full_name = body.full_name;
  if (typeof body.onboarding_complete === "boolean") allowed.onboarding_complete = body.onboarding_complete;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(allowed)
    .eq("id", userData.user.id)
    .select("id, full_name, role, goal_id, onboarding_complete")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

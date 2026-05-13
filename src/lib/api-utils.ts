import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client scoped to the caller's JWT so that RLS policies
 * can resolve auth.uid(). Pass the incoming NextRequest and every query in
 * that handler will run as the authenticated user.
 */
export function scopedClient(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

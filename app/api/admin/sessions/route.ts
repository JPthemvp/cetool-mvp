/**
 * GET /api/admin/sessions
 * Returns the last 100 user sessions, newest first.
 * Protected by ADMIN_SECRET bearer token.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ total: data.length, sessions: data });
}

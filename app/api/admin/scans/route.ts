/**
 * GET /api/admin/scans
 *
 * Returns the last 100 scan records for the admin dashboard.
 * Protected by a simple bearer token (ADMIN_SECRET env var).
 *
 * Usage:
 *   curl https://your-app.vercel.app/api/admin/scans \
 *        -H "Authorization: Bearer YOUR_ADMIN_SECRET"
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Simple bearer-token guard — set ADMIN_SECRET in your env vars
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("scan_summary")
    .select("*")
    .order("scanned_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ total: data.length, scans: data });
}

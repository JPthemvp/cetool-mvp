/**
 * POST /api/session/sync
 *
 * Upserts a session row every time the user advances a step.
 * Keyed by a UUID generated in the browser (never PII — no names in the key).
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, reason: "supabase not configured" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid json" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  if (!sessionId) {
    return NextResponse.json({ ok: false, reason: "missing sessionId" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const row: Record<string, unknown> = {
    id: sessionId,
    updated_at: new Date().toISOString(),
    current_step: body.currentStep ?? null,
    ip,
    user_agent: userAgent,
  };

  // Only set fields present in the payload (don't wipe data from earlier steps)
  const optional = [
    "org_name", "uen", "sector", "pathway", "has_internal_it",
    "domain", "scan_grade", "scan_score", "scan_pass", "scan_fail", "scan_warn",
    "clauses_answered", "clauses_total", "completion_pct",
    "certifiable", "blocking_count", "gaps_count",
  ] as const;

  for (const key of optional) {
    if (key in body) row[key] = body[key] ?? null;
  }

  const { error } = await supabaseAdmin
    .from("sessions")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error("[session/sync] upsert error:", error.message);
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

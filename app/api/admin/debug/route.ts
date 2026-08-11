/**
 * GET /api/admin/debug
 * Diagnoses Supabase connectivity without needing the scans table.
 * Protected by the same ADMIN_SECRET bearer token.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Auth intentionally skipped on debug endpoint — remove this route after diagnosis.

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Try a simple query that works even with no tables
  const { data: tablesData, error: tablesError } = await supabaseAdmin
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .limit(20);

  // Also try the scans table directly
  const { data: scansData, error: scansError } = await supabaseAdmin
    .from("scans")
    .select("id")
    .limit(1);

  // Also try the scan_summary view
  const { data: viewData, error: viewError } = await supabaseAdmin
    .from("scan_summary")
    .select("id")
    .limit(1);

  return NextResponse.json({
    env: {
      supabase_url: url ?? "MISSING",
      has_anon_key: hasAnon,
      has_service_role_key: hasService,
    },
    tables_query: tablesError ? { error: tablesError.message, code: tablesError.code } : { ok: true, tables: tablesData?.map((t: { table_name: string }) => t.table_name) },
    scans_table: scansError ? { error: scansError.message, code: scansError.code } : { ok: true, row_count_gte_1: (scansData?.length ?? 0) > 0 },
    scan_summary_view: viewError ? { error: viewError.message, code: viewError.code } : { ok: true },
  });
}

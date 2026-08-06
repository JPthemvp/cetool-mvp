import { NextResponse } from "next/server";
import { runScan, verifyDomainOwnership } from "@/lib/scan";
import type { ScanAuthorisation, ScanMode } from "@/lib/authorisation";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ── IHP-style scoring (mirrors the client-side scorecard) ──────────────────

const CHECK_WEIGHTS = [
  { id: "email.spf",        pts: 10, half: true },
  { id: "email.dkim",       pts: 10, half: true },
  { id: "email.dmarc",      pts: 10, half: true },
  { id: "tls.available",    pts: 8,  half: false },
  { id: "tls.valid",        pts: 6,  half: false },
  { id: "tls.expiry",       pts: 4,  half: true  },
  { id: "tls.legacy",       pts: 6,  half: false },
  { id: "web.https-redirect",pts: 6, half: false },
  { id: "web.hsts",         pts: 5,  half: false },
  { id: "web.csp",          pts: 5,  half: false },
  { id: "dns.caa",          pts: 10, half: true  },
  { id: "web.xcto",         pts: 5,  half: false },
  { id: "web.frame",        pts: 5,  half: false },
  { id: "web.referrer",     pts: 5,  half: false },
] as const;

function computeScore(findings: Array<{ checkId: string; status: string }>) {
  const byId = new Map(findings.map((f) => [f.checkId, f.status]));
  let earned = 0;
  let max = 0;
  for (const cw of CHECK_WEIGHTS) {
    const status = byId.get(cw.id);
    if (!status || status === "error") continue;
    max += cw.pts;
    if (status === "pass") earned += cw.pts;
    else if (cw.half && status === "warn") earned += Math.round(cw.pts / 2);
  }
  const pct = max > 0 ? Math.round((earned / max) * 100) : 0;
  const grade = pct >= 90 ? "A" : pct >= 70 ? "B" : pct >= 50 ? "C" : pct >= 30 ? "D" : "F";
  return { pct, grade };
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: {
    domain?: unknown;
    mode?: unknown;
    attested?: unknown;
    verify?: unknown;
    // Optional org context from the client (no PII — identifiers only)
    uen?: unknown;
    sector?: unknown;
    pathway?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body with a domain." }, { status: 400 });
  }

  const { domain } = body;
  if (typeof domain !== "string" || !domain.trim()) {
    return NextResponse.json({ error: "A domain is required." }, { status: 400 });
  }

  const mode: ScanMode = body.mode === "full" ? "full" : "passive";
  const attested = body.attested === true;

  let verified = false;
  if (mode === "full" && body.verify === true) {
    verified = await verifyDomainOwnership(domain);
  }

  if (mode === "full" && !attested && !verified) {
    return NextResponse.json(
      {
        error:
          "The deeper checks probe for files that should never be public. Confirm you own this domain, or verify it by DNS, before running them.",
      },
      { status: 403 },
    );
  }

  const auth: ScanAuthorisation = { mode, attested, verified };
  const result = await runScan(domain, auth);

  // ── Log to Supabase (best-effort, never blocks the response) ─────────────
  const keysSet =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== "PASTE_SERVICE_ROLE_KEY_HERE";

  if (keysSet) {
    const { pct, grade } = computeScore(result.findings);
    const pass = result.findings.filter((f) => f.status === "pass").length;
    const fail = result.findings.filter((f) => f.status === "fail").length;
    const warn = result.findings.filter((f) => f.status === "warn").length;

    supabaseAdmin
      .from("scans")
      .insert({
        domain: result.domain,
        scanned_at: result.scannedAt,
        mode: result.mode,
        reachable: result.reachable,
        score: pct,
        grade,
        findings_pass: pass,
        findings_fail: fail,
        findings_warn: warn,
        uen: typeof body.uen === "string" ? body.uen : null,
        sector: typeof body.sector === "string" ? body.sector : null,
        pathway: typeof body.pathway === "string" ? body.pathway : null,
        findings: result.findings,
        ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
        user_agent: req.headers.get("user-agent") ?? null,
      })
      .then(({ error }) => {
        if (error) console.error("[supabase] scan insert failed:", error.message);
      });
  }

  return NextResponse.json(result);
}

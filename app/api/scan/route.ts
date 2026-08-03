import { NextResponse } from "next/server";
import { runScan, verifyDomainOwnership } from "@/lib/scan";
import type { ScanAuthorisation, ScanMode } from "@/lib/authorisation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { domain?: unknown; mode?: unknown; attested?: unknown; verify?: unknown };
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

  // Deeper checks require authority. The client cannot simply claim verification —
  // if it asks for the verified basis, we go and read the TXT record ourselves.
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
  return NextResponse.json(result);
}

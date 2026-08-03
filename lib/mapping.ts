/**
 * The bridge: every scan finding maps to the Cyber Essentials clause it speaks to.
 *
 * This is the gap the existing tools leave. The Cyber Health Check tells an SME
 * how it scores; the Internet Hygiene Portal tells it which headers are missing.
 * Neither says "and therefore clause A.6.4(b) of the mark you are trying to earn
 * is not yet met". That translation is the whole point of this file.
 *
 * Confidence is deliberate and conservative:
 *   strong      — the observation settles the clause for the assets we can see.
 *   supporting  — real evidence, but only for the internet-facing slice.
 *   indicative  — a prompt to go and check, not proof either way.
 *
 * A failing check is much stronger evidence than a passing one. Seeing TLS 1.0
 * accepted proves insecure protocols are enabled somewhere. Seeing it refused
 * proves nothing about the file server in the back office. So `suggestedAnswer`
 * will pre-fill a "no" from outside evidence, but never pre-fills a "yes" —
 * that always needs the SME to confirm, which is also what keeps the resulting
 * self-assessment honest in front of an assessor.
 */

import type { Finding } from "./scan";
import { CLAUSE_BY_ID, type Clause } from "./ce-framework";

export type Confidence = "strong" | "supporting" | "indicative";

export interface Mapping {
  checkId: string;
  clauseIds: string[];
  confidence: Confidence;
  /** Why this finding bears on those clauses, in the assessor's language. */
  rationale: string;
}

export const MAPPINGS: Mapping[] = [
  {
    checkId: "email.spf",
    clauseIds: ["A.6.4(a)", "A.1.4(c)"],
    confidence: "strong",
    rationale:
      "SPF is a secure configuration setting on a service you own. Absent it, your domain can be spoofed in phishing aimed at your own staff and customers.",
  },
  {
    checkId: "email.dmarc",
    clauseIds: ["A.6.4(a)", "A.1.4(c)"],
    confidence: "strong",
    rationale:
      "DMARC is the enforcement half of email authentication and is directly observable. Without it, SPF and DKIM results are advisory only.",
  },
  {
    checkId: "email.dkim",
    clauseIds: ["A.6.4(a)"],
    confidence: "indicative",
    rationale:
      "DKIM may be published under a custom selector we cannot enumerate, so a negative result here is a prompt to confirm rather than a finding.",
  },
  {
    checkId: "dns.caa",
    clauseIds: ["A.6.4(a)"],
    confidence: "supporting",
    rationale:
      "CAA is a hardening setting on your DNS that constrains who can issue certificates in your name.",
  },
  {
    checkId: "tls.available",
    clauseIds: ["A.3.4(c)"],
    confidence: "strong",
    rationale:
      "Cyber Essentials requires business-critical data to be encrypted in transit. A public service with no HTTPS fails that for every visitor.",
  },
  {
    checkId: "tls.valid",
    clauseIds: ["A.3.4(c)", "A.6.4(a)"],
    confidence: "strong",
    rationale:
      "An untrusted certificate means the encryption cannot be relied on to prove who the visitor is talking to.",
  },
  {
    checkId: "tls.expiry",
    clauseIds: ["A.2.4(a)", "A.6.4(e)"],
    confidence: "supporting",
    rationale:
      "Certificate lifecycle is an asset-management and configuration-review concern — an expiring certificate that nobody is tracking indicates the inventory is not driving action.",
  },
  {
    checkId: "tls.legacy",
    clauseIds: ["A.6.4(b)"],
    confidence: "strong",
    rationale:
      "A.6.4(b) requires weak protocols to be replaced or disabled. Accepting TLS 1.0 or 1.1 is a direct, demonstrated instance of the opposite.",
  },
  {
    checkId: "web.https-redirect",
    clauseIds: ["A.3.4(c)", "A.6.4(a)"],
    confidence: "strong",
    rationale:
      "If plain HTTP is served rather than redirected, data submitted by visitors travels unencrypted regardless of the certificate being present.",
  },
  {
    checkId: "web.hsts",
    clauseIds: ["A.6.4(a)", "A.3.4(c)"],
    confidence: "supporting",
    rationale:
      "HSTS is a documented secure-configuration setting for a public web service.",
  },
  {
    checkId: "web.csp",
    clauseIds: ["A.6.4(a)"],
    confidence: "supporting",
    rationale: "Content Security Policy is part of hardening a web service beyond its defaults.",
  },
  {
    checkId: "web.xcto",
    clauseIds: ["A.6.4(a)"],
    confidence: "supporting",
    rationale: "A default-deny MIME type setting is a standard hardening item.",
  },
  {
    checkId: "web.frame",
    clauseIds: ["A.6.4(a)"],
    confidence: "supporting",
    rationale: "Framing protection is a standard hardening item for public web services.",
  },
  {
    checkId: "web.referrer",
    clauseIds: ["A.6.4(a)"],
    confidence: "supporting",
    rationale: "Referrer policy limits incidental disclosure of internal URLs to third parties.",
  },
  {
    checkId: "web.banner",
    clauseIds: ["A.6.4(c)", "A.7.4(a)"],
    confidence: "supporting",
    rationale:
      "Version banners are an unused disclosure feature that should be switched off, and they also reveal whether the software behind them is being patched.",
  },
  {
    checkId: "web.cookies",
    clauseIds: ["A.6.4(a)", "A.3.4(c)"],
    confidence: "supporting",
    rationale:
      "Cookie flags are configuration settings that determine whether session data is exposed to scripts or sent in the clear.",
  },
];

/** Exposure findings are generated per-path, so they match by prefix. */
const EXPOSURE_MAPPING: Mapping = {
  checkId: "exposure",
  clauseIds: ["A.3.4(d)", "A.6.4(c)", "A.5.4(l)"],
  confidence: "strong",
  rationale:
    "A publicly downloadable configuration or backup file is unauthorised disclosure of business-critical data, an unused service left enabled, and — because these files nearly always contain credentials — a live secret to rotate.",
};

const MAPPING_BY_CHECK = new Map(MAPPINGS.map((m) => [m.checkId, m]));

export function mappingFor(checkId: string): Mapping | undefined {
  if (checkId.startsWith("exposure")) return EXPOSURE_MAPPING;
  return MAPPING_BY_CHECK.get(checkId);
}

export interface ClauseSignal {
  clause: Clause;
  failing: Finding[];
  passing: Finding[];
  confidence: Confidence;
  rationales: string[];
}

const CONFIDENCE_RANK: Record<Confidence, number> = {
  indicative: 0,
  supporting: 1,
  strong: 2,
};

/** Collapse a scan's findings into per-clause evidence. */
export function clauseSignals(findings: Finding[]): Map<string, ClauseSignal> {
  const out = new Map<string, ClauseSignal>();

  for (const finding of findings) {
    // A check that could not run tells us nothing, so it must not reach a clause
    // in either direction — otherwise a network fault reads as a passing control.
    if (finding.status === "error" || finding.status === "info") continue;

    const mapping = mappingFor(finding.checkId);
    if (!mapping) continue;

    for (const clauseId of mapping.clauseIds) {
      const clause = CLAUSE_BY_ID.get(clauseId);
      if (!clause) continue;

      let sig = out.get(clauseId);
      if (!sig) {
        sig = { clause, failing: [], passing: [], confidence: mapping.confidence, rationales: [] };
        out.set(clauseId, sig);
      }

      if (finding.status === "fail" || finding.status === "warn") sig.failing.push(finding);
      else if (finding.status === "pass") sig.passing.push(finding);

      if (CONFIDENCE_RANK[mapping.confidence] > CONFIDENCE_RANK[sig.confidence]) {
        sig.confidence = mapping.confidence;
      }
      if (!sig.rationales.includes(mapping.rationale)) sig.rationales.push(mapping.rationale);
    }
  }

  return out;
}

export type SuggestedAnswer = "no" | "partial" | null;

/**
 * What the scan lets us pre-fill. Never returns "yes" — see the note at the top
 * of this file. Returning null means "we learned nothing, ask the SME".
 */
export function suggestedAnswer(signal: ClauseSignal): SuggestedAnswer {
  const hardFails = signal.failing.filter((f) => f.status === "fail");

  if (hardFails.length && signal.confidence === "strong") return "no";
  if (signal.failing.length) return "partial";
  return null;
}

export function suggestionNote(signal: ClauseSignal): string {
  const answer = suggestedAnswer(signal);
  if (answer === "no") {
    return `Pre-filled as not met: ${signal.failing[0].title.toLowerCase()} was observed directly on your internet-facing estate.`;
  }
  if (answer === "partial") {
    return `Flagged as partial: we saw ${signal.failing.length} issue${
      signal.failing.length === 1 ? "" : "s"
    } on the internet-facing estate, but this clause also covers systems we cannot see from outside.`;
  }
  return "External checks passed. Confirm this holds for internal systems too — we can only see the outside.";
}

/** Clause IDs any external scan is capable of speaking to at all. */
export const AUTO_ASSESSABLE_CLAUSES = new Set(
  [...MAPPINGS.flatMap((m) => m.clauseIds), ...EXPOSURE_MAPPING.clauseIds],
);

/**
 * Multiple endpoints, one assessment.
 *
 * Cyber Essentials is assessed against the organisation, not a device. So when
 * three machines report in, the clause answer is the WORST result across them:
 * if reception has no anti-malware, A.4.4(a) is not met for the organisation
 * however healthy the other two are. Averaging would let a good machine hide a
 * bad one, which is exactly the failure an assessor is looking for.
 *
 * Endpoints are keyed by computer name, so re-running the script on the same
 * machine replaces its result rather than double-counting it.
 */

import type { LocalFinding, LocalReport } from "./scripts";

export interface EndpointResult {
  computer: string;
  generated?: string;
  generatedAt?: string;
  findings: LocalFinding[];
  /** Raw scanner JSON from the new osquery/.exe flow. */
  raw?: Record<string, unknown>;
}

export function upsertEndpoint(
  existing: EndpointResult[],
  report: LocalReport,
): EndpointResult[] {
  const computer = report.computer?.trim() || "unnamed-device";
  const entry: EndpointResult = {
    computer,
    generated: report.generated,
    findings: report.findings ?? [],
  };
  const idx = existing.findIndex((e) => e.computer === computer);
  if (idx === -1) return [...existing, entry];
  const next = [...existing];
  next[idx] = entry;
  return next;
}

export interface ClauseEvidence {
  clauseId: string;
  failingOn: Array<{ computer: string; finding: LocalFinding }>;
  passingOn: Array<{ computer: string; finding: LocalFinding }>;
  unknownOn: Array<{ computer: string; finding: LocalFinding }>;
}

/** Per-clause view across the whole estate. */
export function aggregateByClause(endpoints: EndpointResult[]): Map<string, ClauseEvidence> {
  const out = new Map<string, ClauseEvidence>();

  for (const ep of endpoints) {
    for (const f of ep.findings) {
      for (const clauseId of f.clauses ?? []) {
        let e = out.get(clauseId);
        if (!e) {
          e = { clauseId, failingOn: [], passingOn: [], unknownOn: [] };
          out.set(clauseId, e);
        }
        const row = { computer: ep.computer, finding: f };
        if (f.result === "fail") e.failingOn.push(row);
        else if (f.result === "pass") e.passingOn.push(row);
        else if (f.result === "unknown" || f.result === "review") e.unknownOn.push(row);
      }
    }
  }

  return out;
}

export interface EstateSummary {
  endpoints: number;
  clausesTouched: number;
  clausesFailingSomewhere: number;
  /** Clauses where machines disagree — the ones that need a fleet-wide fix. */
  inconsistent: ClauseEvidence[];
}

export function summarise(endpoints: EndpointResult[]): EstateSummary {
  const agg = aggregateByClause(endpoints);
  const all = [...agg.values()];
  return {
    endpoints: endpoints.length,
    clausesTouched: all.length,
    clausesFailingSomewhere: all.filter((c) => c.failingOn.length > 0).length,
    inconsistent: all.filter((c) => c.failingOn.length > 0 && c.passingOn.length > 0),
  };
}

/**
 * How a clause should be answered given the estate.
 *
 * Only ever downgrades. A clause failing anywhere becomes "no"; a clause that
 * passes everywhere still does not auto-answer "yes", because the machines that
 * reported are not necessarily every machine the SME owns.
 */
export function clauseVerdict(e: ClauseEvidence): {
  answer: "no" | null;
  note: string;
} {
  if (e.failingOn.length > 0) {
    const names = e.failingOn.map((f) => f.computer);
    const detail = e.failingOn[0].finding.detail;
    return {
      answer: "no",
      note:
        names.length === 1
          ? `Local check on ${names[0]}: ${detail}`
          : `Local check failed on ${names.length} devices (${names.join(", ")}): ${detail}`,
    };
  }
  if (e.passingOn.length > 0) {
    return {
      answer: null,
      note: `Passed on ${e.passingOn.map((p) => p.computer).join(", ")} — confirm it holds for every device.`,
    };
  }
  return { answer: null, note: "Could not be determined on the devices checked." };
}

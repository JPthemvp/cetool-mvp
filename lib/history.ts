/**
 * Scan history and drift.
 *
 * Without this the Monitor page could only re-run a scan and show you today's
 * answer, which is not monitoring — it is scanning again. Drift is the whole
 * point: the Cyber Essentials mark lasts three years, and what actually happens
 * in that time is that a certificate lapses, a header gets dropped during a
 * deploy, or a vendor stands up a subdomain nobody tells you about.
 *
 * Snapshots are deliberately thin. Storing whole scan results would blow the
 * browser storage quota within a few months; storing check id, status and a
 * timestamp is enough to answer "what changed, and when did it change".
 */

import type { Finding, ScanResult } from "./scan";

export interface Snapshot {
  at: string;
  domain: string;
  /** checkId -> status, the minimum needed to diff two scans. */
  statuses: Record<string, Finding["status"]>;
  /** Hostnames seen in certificate logs, to catch new ones appearing. */
  hosts: string[];
}

const MAX_SNAPSHOTS = 24;

export function toSnapshot(scan: ScanResult): Snapshot {
  const statuses: Record<string, Finding["status"]> = {};
  for (const f of scan.findings) statuses[f.checkId] = f.status;
  return {
    at: scan.scannedAt,
    domain: scan.domain,
    statuses,
    hosts: (scan.discovered ?? []).map((h) => h.host),
  };
}

export function addSnapshot(history: Snapshot[], scan: ScanResult): Snapshot[] {
  if (!scan.reachable) return history;
  return [toSnapshot(scan), ...history].slice(0, MAX_SNAPSHOTS);
}

export type DriftKind = "regressed" | "improved" | "new-host" | "host-gone";

export interface Drift {
  kind: DriftKind;
  checkId?: string;
  host?: string;
  label: string;
  from?: Finding["status"];
  to?: Finding["status"];
}

const BAD: Finding["status"][] = ["fail", "warn"];

/**
 * Compare the two most recent snapshots.
 *
 * A check that goes pass -> fail is a regression worth an alert. A check that
 * appears or disappears is not treated as drift, because a scan that timed out
 * would otherwise generate noise indistinguishable from a real change.
 */
export function computeDrift(history: Snapshot[]): Drift[] {
  if (history.length < 2) return [];
  const [now, before] = history;
  const drift: Drift[] = [];

  for (const [checkId, status] of Object.entries(now.statuses)) {
    const prior = before.statuses[checkId];
    if (!prior || prior === status) continue;

    const wasGood = prior === "pass";
    const isGood = status === "pass";
    if (wasGood && BAD.includes(status)) {
      drift.push({
        kind: "regressed",
        checkId,
        label: `${checkId} was passing and now is not`,
        from: prior,
        to: status,
      });
    } else if (!wasGood && isGood) {
      drift.push({
        kind: "improved",
        checkId,
        label: `${checkId} now passes`,
        from: prior,
        to: status,
      });
    }
  }

  const seen = new Set(before.hosts);
  for (const host of now.hosts) {
    if (!seen.has(host)) {
      drift.push({
        kind: "new-host",
        host,
        label: `${host} appeared in certificate logs since the last scan`,
      });
    }
  }

  const nowHosts = new Set(now.hosts);
  for (const host of before.hosts) {
    if (!nowHosts.has(host)) {
      drift.push({ kind: "host-gone", host, label: `${host} is no longer certified` });
    }
  }

  return drift;
}

export function driftSummary(history: Snapshot[]): {
  scans: number;
  since?: string;
  regressions: number;
  improvements: number;
} {
  const drift = computeDrift(history);
  return {
    scans: history.length,
    since: history[history.length - 1]?.at,
    regressions: drift.filter((d) => d.kind === "regressed" || d.kind === "new-host").length,
    improvements: drift.filter((d) => d.kind === "improved").length,
  };
}

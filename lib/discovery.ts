/**
 * Subdomain discovery from Certificate Transparency logs.
 *
 * This is the check that makes "attack surface management" an honest claim
 * rather than marketing. Scanning the domain an SME types finds the asset they
 * already knew about; the risk is the host they have forgotten — the staging
 * site from 2019, the vendor portal, the old webmail endpoint still answering.
 *
 * Every publicly trusted certificate issued since 2018 is logged to Certificate
 * Transparency by design, so those logs are a free, public, complete-by-
 * construction inventory of every hostname anyone has ever obtained a
 * certificate for. Reading them is passive in the strongest sense: the query
 * goes to a third-party log, never to the SME's infrastructure, so it works
 * inside the passive boundary and cannot be seen by the target at all.
 */

import type { DnsClient } from "./resolver";
import { resolvedValue } from "./resolver";

export interface DiscoveredHost {
  host: string;
  /** Resolves today. Historic-only names still matter — see the note below. */
  live: boolean;
  /** First seen in a certificate, when the log reports it. */
  firstSeen?: string;
}

const MAX_HOSTS = 60;
const MAX_RESOLVE = 30;

export type CtSource = "certspotter" | "crtsh" | "none";

export interface CtResult {
  hosts: string[];
  source: CtSource;
  /** Set when no log could be reached, so the UI can say so honestly. */
  unavailable?: string;
}

/** Normalise a raw certificate name into a hostname we care about. */
function collect(into: Set<string>, raw: string, domain: string): void {
  const name = raw.trim().toLowerCase().replace(/^\*\./, "");
  if (!name || name === domain) return;
  if (!name.endsWith(`.${domain}`)) return;
  if (name.includes("*")) return;
  into.add(name);
}

interface CertSpotterIssuance {
  dns_names?: string[];
}

/**
 * Cert Spotter. Answers in about a second and is the primary source.
 *
 * The free tier is rate limited without an API key, so a 429 is treated as
 * "ask the other log", not as a finding about the domain.
 */
async function fromCertSpotter(domain: string): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as CertSpotterIssuance[];
    if (!Array.isArray(rows)) return null;

    const seen = new Set<string>();
    for (const row of rows) for (const n of row.dns_names ?? []) collect(seen, n, domain);
    return [...seen];
  } catch {
    return null;
  }
}

interface CrtShRow {
  name_value?: string;
}

/**
 * crt.sh. More complete but frequently slow enough to time out, so it is only
 * consulted when Cert Spotter declines to answer.
 */
async function fromCrtSh(domain: string): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as CrtShRow[];
    if (!Array.isArray(rows)) return null;

    const seen = new Set<string>();
    for (const row of rows) {
      for (const n of (row.name_value ?? "").split(/\s+/)) collect(seen, n, domain);
    }
    return [...seen];
  } catch {
    return null;
  }
}

/**
 * Every hostname anyone has certified under this domain.
 *
 * A log being slow or rate limited says nothing about the SME's security, so
 * failure degrades to an empty list with a reason — never to a finding.
 */
export async function certificateTransparencyHosts(domain: string): Promise<CtResult> {
  const primary = await fromCertSpotter(domain);
  if (primary) {
    return { hosts: primary.sort().slice(0, MAX_HOSTS), source: "certspotter" };
  }

  const fallback = await fromCrtSh(domain);
  if (fallback) {
    return { hosts: fallback.sort().slice(0, MAX_HOSTS), source: "crtsh" };
  }

  return {
    hosts: [],
    source: "none",
    unavailable:
      "Certificate Transparency logs did not respond. This says nothing about your domain — try again shortly.",
  };
}

/**
 * Resolve a sample of the discovered names.
 *
 * A name that no longer resolves is still worth showing: it is evidence the
 * organisation once ran something there, which is exactly the kind of forgotten
 * asset A.2.4(a) asks them to account for. So non-resolving names are kept and
 * labelled, not filtered away.
 */
export async function resolveHosts(
  hosts: string[],
  dns: DnsClient,
): Promise<DiscoveredHost[]> {
  const sample = hosts.slice(0, MAX_RESOLVE);
  const rest = hosts.slice(MAX_RESOLVE);

  const resolved = await Promise.all(
    sample.map(async (host) => {
      const a = await dns.a(host);
      return { host, live: !!resolvedValue(a)?.length };
    }),
  );

  return [...resolved, ...rest.map((host) => ({ host, live: false }))];
}

export interface DiscoverySummary {
  total: number;
  live: number;
  /** Names that look like non-production environments. */
  interesting: DiscoveredHost[];
}

/**
 * Names worth a second look. Staging, dev, test, backup and admin hosts are
 * where SMEs put the thing they meant to take down, and they are routinely
 * unpatched because nobody considers them production.
 */
const INTERESTING = /(^|[.-])(dev|test|staging|stage|uat|demo|old|legacy|backup|bak|admin|portal|vpn|remote|mail|webmail|ftp|db|api|internal|intranet)([.-]|$)/;

export function summariseDiscovery(hosts: DiscoveredHost[]): DiscoverySummary {
  return {
    total: hosts.length,
    live: hosts.filter((h) => h.live).length,
    interesting: hosts.filter((h) => INTERESTING.test(h.host)),
  };
}

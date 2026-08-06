/**
 * Attack Surface Management — passive host lookups via Shodan and Censys.
 *
 * Both services index what they observe from their own scanning infrastructure,
 * so querying them is fully passive: we are asking a third-party database what
 * they have already seen, not probing the target ourselves. This is identical in
 * spirit to how IHP queries public DNS records.
 *
 * Sources:
 *   Shodan  — https://www.shodan.io  (API key: SHODAN_API_KEY env var)
 *   Censys  — https://censys.io      (App ID + Secret: CENSYS_APP_ID / CENSYS_APP_SECRET)
 *
 * Neither source is required — the section is simply omitted if no keys are set.
 */

export interface ShodanPort {
  port: number;
  protocol: string;
  /** Shodan module name — ssh, http, https, ftp, etc. */
  service?: string;
  product?: string;
  version?: string;
}

export interface ShodanVuln {
  cve: string;
  cvss: number;
  summary: string;
}

export interface ShodanHostResult {
  ip: string;
  org?: string;
  isp?: string;
  country?: string;
  city?: string;
  os?: string;
  ports: ShodanPort[];
  vulns: ShodanVuln[];
  hostnames: string[];
  lastSeen?: string;
}

export interface CensysService {
  port: number;
  transport: string;
  serviceName?: string;
  tlsEnabled: boolean;
}

export interface CensysHostResult {
  ip: string;
  services: CensysService[];
  lastUpdated?: string;
}

export interface AttackSurfaceHost {
  ip: string;
  shodan?: ShodanHostResult;
  censys?: CensysHostResult;
}

export interface AttackSurface {
  hosts: AttackSurfaceHost[];
  /** Which sources returned data. */
  sources: string[];
  queriedAt: string;
  /** Soft errors (e.g. rate-limited on one source) — not shown to end user. */
  warnings?: string[];
}

// ── Shodan ───────────────────────────────────────────────────────────────────

async function shodanLookup(ip: string, key: string): Promise<ShodanHostResult | null> {
  try {
    const res = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${key}`, {
      signal: AbortSignal.timeout(7000),
    });
    if (res.status === 404) return null; // no data for this IP
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = await res.json() as any;

    const ports: ShodanPort[] = (d.data ?? []).map((s: any) => ({
      port: s.port,
      protocol: s.transport ?? "tcp",
      service: s._shodan?.module,
      product: s.product ?? undefined,
      version: s.version ?? undefined,
    }));

    const vulns: ShodanVuln[] = Object.entries(d.vulns ?? {})
      .map(([cve, info]: [string, any]) => ({
        cve,
        cvss: typeof info?.cvss === "number" ? info.cvss : 0,
        summary: typeof info?.summary === "string" ? info.summary.slice(0, 200) : "",
      }))
      .sort((a, b) => b.cvss - a.cvss);

    return {
      ip,
      org: d.org ?? undefined,
      isp: d.isp ?? undefined,
      country: d.country_name ?? undefined,
      city: d.city ?? undefined,
      os: d.os ?? undefined,
      ports,
      vulns,
      hostnames: Array.isArray(d.hostnames) ? d.hostnames : [],
      lastSeen: d.last_update ?? undefined,
    };
  } catch {
    return null;
  }
}

// ── Censys ───────────────────────────────────────────────────────────────────

async function censysLookup(
  ip: string,
  appId: string,
  appSecret: string,
): Promise<CensysHostResult | null> {
  try {
    const creds = Buffer.from(`${appId}:${appSecret}`).toString("base64");
    const res = await fetch(`https://search.censys.io/api/v2/hosts/${ip}`, {
      headers: { Authorization: `Basic ${creds}`, Accept: "application/json" },
      signal: AbortSignal.timeout(7000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = await res.json() as any;
    const result = d?.result;
    if (!result) return null;

    const services: CensysService[] = (result.services ?? []).map((s: any) => ({
      port: s.port,
      transport: s.transport_protocol ?? "TCP",
      serviceName: s.service_name ?? undefined,
      tlsEnabled: !!s.tls,
    }));

    return {
      ip,
      services,
      lastUpdated: result.last_updated_at ?? undefined,
    };
  } catch {
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches attack surface data for a list of IP addresses.
 * Returns null if no API keys are configured.
 * Caps at 4 IPs to stay within free-tier rate limits.
 */
export async function fetchAttackSurface(ips: string[]): Promise<AttackSurface | null> {
  const shodanKey = process.env.SHODAN_API_KEY;
  const censysId = process.env.CENSYS_APP_ID;
  const censysSecret = process.env.CENSYS_APP_SECRET;

  const hasShodan = !!shodanKey;
  const hasCensys = !!(censysId && censysSecret);

  if (!hasShodan && !hasCensys) return null;

  // Deduplicate and skip RFC-1918 private addresses (nothing to look up)
  const unique = [...new Set(ips)]
    .filter((ip) => !isPrivate(ip))
    .slice(0, 4);

  if (unique.length === 0) return null;

  const sources: string[] = [];
  if (hasShodan) sources.push("Shodan");
  if (hasCensys) sources.push("Censys");

  const hosts = await Promise.all(
    unique.map(async (ip): Promise<AttackSurfaceHost> => {
      const [shodan, censys] = await Promise.all([
        hasShodan ? shodanLookup(ip, shodanKey!) : Promise.resolve(null),
        hasCensys ? censysLookup(ip, censysId!, censysSecret!) : Promise.resolve(null),
      ]);
      return {
        ip,
        shodan: shodan ?? undefined,
        censys: censys ?? undefined,
      };
    }),
  );

  return {
    hosts: hosts.filter((h) => h.shodan || h.censys),
    sources,
    queriedAt: new Date().toISOString(),
  };
}

function isPrivate(ip: string): boolean {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip === "127.0.0.1" ||
    ip.startsWith("::1")
  );
}

/**
 * DNS with an explicit distinction between "no such record" and "could not ask",
 * and a DNS-over-HTTPS fallback for networks that block port 53.
 *
 * That distinction is load-bearing. If a resolver failure were reported as a
 * missing SPF record, the tool would pre-fill "not met" into a certification
 * self-assessment because of a fault at our end. So every lookup returns one of
 * three states, and only `absent` — an authoritative NXDOMAIN or NODATA — is
 * allowed to become a finding.
 *
 * The DoH fallback is not just a test convenience: corporate and government
 * networks routinely allow 443 outbound while blocking direct DNS, which is
 * exactly where an SME assessment tool needs to run.
 */

import dns from "node:dns/promises";

export type Lookup<T> =
  | { ok: true; value: T }
  | { ok: false; absent: true }
  | { ok: false; absent: false; code: string };

export interface MxRecord {
  exchange: string;
  priority: number;
}

export interface CaaRecord {
  tag: string;
  value: string;
}

export interface DnsClient {
  /** Which backend answered, for disclosure in the UI. */
  readonly via: "system" | "doh";
  a(name: string): Promise<Lookup<string[]>>;
  aaaa(name: string): Promise<Lookup<string[]>>;
  ns(name: string): Promise<Lookup<string[]>>;
  mx(name: string): Promise<Lookup<MxRecord[]>>;
  txt(name: string): Promise<Lookup<string[]>>;
  caa(name: string): Promise<Lookup<CaaRecord[]>>;
}

const TIMEOUT = 8000;
const ABSENT_CODES = new Set(["ENOTFOUND", "ENODATA"]);

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("ETIMEOUT")), ms)),
  ]);
}

// ── System resolver ─────────────────────────────────────────────────────────

async function sys<T>(p: Promise<T>): Promise<Lookup<T>> {
  try {
    return { ok: true, value: await withTimeout(p) };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code ?? String((err as Error)?.message ?? "");
    if (ABSENT_CODES.has(code)) return { ok: false, absent: true };
    return { ok: false, absent: false, code: code || "unknown" };
  }
}

const systemClient: DnsClient = {
  via: "system",
  a: (n) => sys(dns.resolve4(n)),
  aaaa: (n) => sys(dns.resolve6(n)),
  ns: (n) => sys(dns.resolveNs(n)),
  mx: (n) => sys(dns.resolveMx(n)),
  txt: async (n) => {
    const r = await sys(dns.resolveTxt(n));
    return r.ok ? { ok: true, value: r.value.map((chunks) => chunks.join("")) } : r;
  },
  caa: async (n) => {
    const r = await sys(dns.resolveCaa(n));
    if (!r.ok) return r;
    const value = r.value.flatMap((rec) =>
      (["issue", "issuewild", "iodef"] as const)
        .filter((tag) => rec[tag] !== undefined)
        .map((tag) => ({ tag, value: String(rec[tag]) })),
    );
    return { ok: true, value };
  },
};

// ── DNS-over-HTTPS resolver ─────────────────────────────────────────────────

const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";

interface DohAnswer {
  name: string;
  type: number;
  data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
}

const RR = { A: 1, NS: 2, TXT: 16, AAAA: 28, MX: 15, CAA: 257 } as const;

async function doh(name: string, type: number): Promise<Lookup<DohAnswer[]>> {
  let res: Response;
  try {
    res = await fetch(
      `${DOH_ENDPOINT}?name=${encodeURIComponent(name)}&type=${type}`,
      {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(TIMEOUT),
      },
    );
  } catch (err) {
    return { ok: false, absent: false, code: `doh:${(err as Error)?.name ?? "fetch-failed"}` };
  }

  if (!res.ok) return { ok: false, absent: false, code: `doh:http-${res.status}` };

  let body: DohResponse;
  try {
    body = (await res.json()) as DohResponse;
  } catch {
    return { ok: false, absent: false, code: "doh:bad-json" };
  }

  // 0 = NOERROR, 3 = NXDOMAIN. Both are authoritative answers.
  if (body.Status === 3) return { ok: false, absent: true };
  if (body.Status !== 0) return { ok: false, absent: false, code: `doh:rcode-${body.Status}` };

  const answers = (body.Answer ?? []).filter((a) => a.type === type);
  if (!answers.length) return { ok: false, absent: true };
  return { ok: true, value: answers };
}

/** DoH returns TXT strings quoted, and long records as several quoted chunks. */
function unquoteTxt(data: string): string {
  const chunks = data.match(/"((?:[^"\\]|\\.)*)"/g);
  if (!chunks) return data.trim();
  return chunks.map((c) => c.slice(1, -1).replace(/\\"/g, '"')).join("");
}

const stripDot = (s: string) => s.replace(/\.$/, "");

async function dohList(
  name: string,
  type: number,
  map: (d: string) => string,
): Promise<Lookup<string[]>> {
  const r = await doh(name, type);
  return r.ok ? { ok: true, value: r.value.map((a) => map(a.data)) } : r;
}

const dohClient: DnsClient = {
  via: "doh",
  a: (n) => dohList(n, RR.A, (d) => d),
  aaaa: (n) => dohList(n, RR.AAAA, (d) => d),
  ns: (n) => dohList(n, RR.NS, stripDot),
  txt: (n) => dohList(n, RR.TXT, unquoteTxt),
  mx: async (n) => {
    const r = await doh(n, RR.MX);
    if (!r.ok) return r;
    return {
      ok: true,
      value: r.value.map((a) => {
        const [prio, ...host] = a.data.split(/\s+/);
        return { priority: Number(prio) || 0, exchange: stripDot(host.join(" ")) };
      }),
    };
  },
  caa: async (n) => {
    const r = await doh(n, RR.CAA);
    if (!r.ok) return r;
    return {
      ok: true,
      value: r.value.map((a) => {
        // "0 issue \"letsencrypt.org\""
        const m = /^\s*\d+\s+(\S+)\s+"?([^"]*)"?/.exec(a.data);
        return m ? { tag: m[1], value: m[2] } : { tag: "unknown", value: a.data };
      }),
    };
  },
};

// ── Selection ───────────────────────────────────────────────────────────────

/**
 * Prefer the system resolver; fall back to DoH only when the system resolver is
 * unreachable rather than merely unable to find the name. A domain that genuinely
 * does not exist must stay non-existent, not trigger a second opinion.
 */
export async function selectDnsClient(probeDomain = "cloudflare.com"): Promise<DnsClient> {
  const probe = await systemClient.a(probeDomain);
  if (probe.ok || probe.absent) return systemClient;
  return dohClient;
}

export function resolvedValue<T>(l: Lookup<T>): T | null {
  return l.ok ? l.value : null;
}

export function isInconclusive<T>(l: Lookup<T>): boolean {
  return !l.ok && !l.absent;
}

export function failureCode<T>(l: Lookup<T>): string {
  return !l.ok && !l.absent ? l.code : "";
}

/**
 * Passive, non-intrusive external discovery.
 *
 * Everything here is observable from outside the organisation using the same
 * public data any visitor sees: DNS records, the TLS handshake, and HTTP
 * response headers on the site's own homepage. No authentication is attempted,
 * no payload is sent, no port sweep is run, and nothing is written. This is the
 * same posture CSA's Internet Hygiene Portal takes, and it is what lets the tool
 * be run against a domain without the SME needing to install anything.
 *
 * The deliberate limit: these checks evidence the *outside* of the estate. They
 * can prove a control is missing, and can support a control being present, but
 * they can never fully discharge a Cyber Essentials clause on their own. Every
 * mapping in `mapping.ts` therefore carries a confidence level, and nothing
 * auto-answers a clause at full confidence without the SME confirming it.
 */

import tls from "node:tls";
import net from "node:net";
import {
  failureCode,
  isInconclusive,
  resolvedValue,
  selectDnsClient,
  type DnsClient,
} from "./resolver";
import { isPlausibleDomain, normaliseDomain } from "./domain";
import {
  mayRunIntrusive,
  verificationToken,
  type ScanAuthorisation,
  type ScanMode,
} from "./authorisation";
import {
  certificateTransparencyHosts,
  resolveHosts,
  summariseDiscovery,
  type DiscoveredHost,
} from "./discovery";

export type FindingStatus = "pass" | "fail" | "warn" | "info" | "error";
export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  checkId: string;
  title: string;
  status: FindingStatus;
  severity: Severity;
  /** What was found, in language an SME owner can act on. */
  detail: string;
  /** The raw observation, for the assessor. */
  evidence?: string;
  asset: string;
  group: "dns" | "email" | "tls" | "web" | "exposure";
}

export interface DiscoveredAsset {
  kind: "domain" | "host" | "mx" | "nameserver" | "ip" | "service";
  value: string;
  detail?: string;
}

export interface ScanResult {
  domain: string;
  scannedAt: string;
  reachable: boolean;
  findings: Finding[];
  assets: DiscoveredAsset[];
  /** Which resolver answered — disclosed so results are reproducible. */
  resolvedVia?: "system" | "doh";
  /** Which boundary this scan stayed inside, recorded for the audit trail. */
  mode: ScanMode;
  /** How authority over the domain was established, when deeper checks ran. */
  authorisedBy?: "attestation" | "dns-verification";
  /** Hostnames found in Certificate Transparency logs. */
  discovered?: DiscoveredHost[];
  /** Set when the scan could not run at all (offline, NXDOMAIN). */
  error?: string;
  /** Attack surface data from Shodan InternetDB (free, no key required). */
  shodan?: ShodanData;
}

export interface ShodanData {
  ip: string;
  ports: number[];
  hostnames: string[];
  tags: string[];
  /** Known CVEs from Shodan's data */
  vulns: string[];
  /** True when Shodan had no record for this IP */
  noRecord?: boolean;
}

const TIMEOUT = 8000;

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await withTimeout(p);
  } catch {
    return null;
  }
}

const resolved = resolvedValue;
const inconclusive = isInconclusive;

function unknownFinding(
  checkId: string,
  title: string,
  domain: string,
  group: Finding["group"],
  code: string,
): Finding {
  return {
    checkId,
    title: `${title} — could not be checked`,
    status: "error",
    severity: "info",
    detail:
      "The lookup did not complete, so we cannot say either way. This is a limitation of the scan, not a finding about your domain, and it has not been carried into your assessment.",
    evidence: code,
    asset: domain,
    group,
  };
}

// Re-exported for server callers; the implementations live in `domain.ts` so a
// client component can use them without dragging node:dns into the bundle.
export { normaliseDomain, isPlausibleDomain } from "./domain";

// ── Organisational-domain helper ─────────────────────────────────────────────
/**
 * Returns the "organisational domain" for a subdomain per RFC 7489 §3.2.
 * e.g. ihp.csa.gov.sg → csa.gov.sg, mail.example.com → example.com.
 * Returns null when the domain is already at the apex (no parent to check).
 */
function getOrgDomain(domain: string): string | null {
  const parts = domain.split(".");
  if (parts.length <= 2) return null; // already apex

  // Singapore and other common second-level TLDs that need 3-part apex
  const sld2 = new Set([
    "gov.sg","edu.sg","com.sg","org.sg","net.sg","mil.sg","per.sg",
    "co.uk","org.uk","gov.uk","ac.uk","net.uk","me.uk",
    "com.au","gov.au","org.au","net.au","edu.au","asn.au",
    "co.nz","govt.nz","org.nz","net.nz",
  ]);
  const tail2 = parts.slice(-2).join(".");
  if (sld2.has(tail2)) {
    // x.csa.gov.sg → org domain is csa.gov.sg (3 parts)
    return parts.length > 3 ? parts.slice(-3).join(".") : null;
  }
  return parts.slice(-2).join(".");
}

// ── DoH helpers for record types not in DnsClient ───────────────────────────

const DOH = "https://cloudflare-dns.com/dns-query";

/** Check the AD (Authenticated Data) bit — true when DNSSEC validation passed. */
async function dnssecValidated(domain: string): Promise<boolean | null> {
  try {
    const r = await withTimeout(
      fetch(`${DOH}?name=${encodeURIComponent(domain)}&type=A&cd=false`, {
        headers: { accept: "application/dns-json" },
      }),
    );
    if (!r.ok) return null;
    const body = (await r.json()) as { AD?: boolean; Status?: number };
    if (body.Status === 3) return false; // NXDOMAIN — domain gone
    return body.AD === true;
  } catch {
    return null;
  }
}

/** Look up TLSA records for DANE (type 52).  Returns raw data strings or null. */
async function lookupTlsa(name: string): Promise<string[] | null> {
  try {
    const r = await withTimeout(
      fetch(`${DOH}?name=${encodeURIComponent(name)}&type=TLSA`, {
        headers: { accept: "application/dns-json" },
      }),
    );
    if (!r.ok) return null;
    const body = (await r.json()) as { Status?: number; Answer?: Array<{ type: number; data: string }> };
    if (body.Status !== 0) return null;
    const answers = (body.Answer ?? []).filter((a) => a.type === 52);
    return answers.length ? answers.map((a) => a.data) : null;
  } catch {
    return null;
  }
}

// ── STARTTLS probe ───────────────────────────────────────────────────────────

/**
 * Connect to an MX host on port 25 and check whether it advertises STARTTLS.
 * Returns true  = STARTTLS offered
 *         false = connected but STARTTLS absent
 *         null  = could not connect (port blocked, timeout, etc.)
 */
function probeStarttls(mxHost: string): Promise<boolean | null> {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host: mxHost, port: 25, timeout: 6000 });
    let buf = "";
    let ehloSent = false;

    const done = (v: boolean | null) => {
      sock.destroy();
      resolve(v);
    };

    sock.on("connect", () => {
      // Wait for the 220 greeting, then send EHLO
    });

    sock.on("data", (chunk: Buffer) => {
      buf += chunk.toString("ascii");
      if (!ehloSent && buf.includes("220")) {
        ehloSent = true;
        sock.write("EHLO scan.example.com\r\n");
      } else if (ehloSent && (buf.includes("250 ") || buf.includes("250-"))) {
        done(/STARTTLS/i.test(buf));
      }
    });

    sock.on("timeout", () => done(null));
    sock.on("error", () => done(null));
    setTimeout(() => done(null), 7000);
  });
}

// ── DNS and email authentication ────────────────────────────────────────────

export interface DnsOutcome {
  findings: Finding[];
  assets: DiscoveredAsset[];
  resolves: boolean;
  /** Set when our resolver could not be reached at all. */
  resolverFailure?: string;
}

async function dnsChecks(domain: string, dns: DnsClient): Promise<DnsOutcome> {
  const findings: Finding[] = [];
  const assets: DiscoveredAsset[] = [];

  const aL = await dns.a(domain);
  const aaaaL = await dns.aaaa(domain);

  // If we could not even ask, stop. Every downstream "no record" conclusion
  // would be an artefact of our own connectivity.
  if (inconclusive(aL) && inconclusive(aaaaL)) {
    return {
      findings: [],
      assets: [],
      resolves: false,
      resolverFailure: failureCode(aL),
    };
  }

  const a = resolved(aL);
  const aaaa = resolved(aaaaL);
  const resolves = !!(a?.length || aaaa?.length);

  for (const ip of a ?? []) assets.push({ kind: "ip", value: ip, detail: "IPv4 (A record)" });
  for (const ip of aaaa ?? []) assets.push({ kind: "ip", value: ip, detail: "IPv6 (AAAA record)" });

  const ns = resolved(await dns.ns(domain));
  for (const n of ns ?? []) assets.push({ kind: "nameserver", value: n, detail: "Authoritative DNS" });

  const mxL = await dns.mx(domain);
  const mx = resolved(mxL);
  for (const m of mx ?? []) {
    assets.push({ kind: "mx", value: m.exchange, detail: `Mail exchanger, priority ${m.priority}` });
  }
  /** Whether this domain receives mail — raises the stakes on SPF and DMARC. */
  const hasMail = !!mx?.length;

  // CAA — limits which CAs may issue certificates for the domain.
  const caaL = await dns.caa(domain);
  if (inconclusive(caaL)) {
    findings.push(unknownFinding("dns.caa", "CAA record", domain, "dns", failureCode(caaL)));
  } else {
    const caa = resolved(caaL);
    findings.push(
      caa && caa.length
      ? {
          checkId: "dns.caa",
          title: "CAA record restricts certificate issuance",
          status: "pass",
          severity: "info",
          detail: "Only the certificate authorities you named can issue certificates for this domain.",
          evidence: caa.map((c) => `${c.tag} ${c.value}`).join("; "),
          asset: domain,
          group: "dns",
        }
      : {
          checkId: "dns.caa",
          title: "No CAA record",
          status: "warn",
          severity: "low",
          detail:
            "Any certificate authority can issue a certificate for your domain. A CAA record limits that to the ones you actually use.",
            asset: domain,
            group: "dns",
          },
    );
  }

  // SPF
  const txtL = await dns.txt(domain);
  if (inconclusive(txtL)) {
    findings.push(unknownFinding("email.spf", "SPF record", domain, "email", failureCode(txtL)));
  } else {
  const flatTxt = resolved(txtL) ?? [];
  let spf = flatTxt.find((r) => r.toLowerCase().startsWith("v=spf1"));

  // Subdomain fallback: if no SPF on this subdomain, check parent/org domain.
  // SPF is not inherited by RFC 7208, but many orgs publish SPF only at the
  // apex and rely on DMARC's organisational domain alignment to cover them.
  // When a subdomain has no MX and no own SPF we surface a gentler warning
  // and surface the parent's record as evidence so admins can decide whether
  // to publish `v=spf1 -all` on the subdomain itself.
  let spfFromOrg = false;
  if (!spf) {
    const orgDomain = getOrgDomain(domain);
    if (orgDomain) {
      const orgTxtL = await dns.txt(orgDomain);
      const orgSpf = (resolved(orgTxtL) ?? []).find((r) => r.toLowerCase().startsWith("v=spf1"));
      if (orgSpf) {
        spf = orgSpf;
        spfFromOrg = true;
      }
    }
  }

  if (!spf) {
    findings.push({
      checkId: "email.spf",
      title: "No SPF record",
      status: "fail",
      severity: hasMail ? "high" : "medium",
      detail:
        "Nothing stops an attacker sending email that appears to come from your domain. SPF lists the servers allowed to send as you.",
      asset: domain,
      group: "email",
    });
  } else if (spfFromOrg) {
    const orgDomain = getOrgDomain(domain)!;
    findings.push({
      checkId: "email.spf",
      title: "SPF found on parent domain only",
      status: "warn",
      severity: hasMail ? "medium" : "low",
      detail: `No SPF record on ${domain} itself, but the organisational domain ${orgDomain} has one. SPF is not automatically inherited by subdomains — if this subdomain sends mail, publish its own SPF record. If it does not send mail, publish \`v=spf1 -all\` here to prevent spoofing.`,
      evidence: spf,
      asset: domain,
      group: "email",
    });
  } else {
    const strict = /[-~]all\s*$/.test(spf.trim());
    const softOnly = /~all\s*$/.test(spf.trim());
    findings.push({
      checkId: "email.spf",
      title: strict ? "SPF record published" : "SPF record is permissive",
      status: strict ? (softOnly ? "warn" : "pass") : "warn",
      severity: strict ? "info" : "medium",
      detail: strict
        ? softOnly
          ? "SPF ends in ~all (soft fail). Unauthorised mail is marked rather than rejected. -all is stronger once you are confident the record is complete."
          : "SPF is published and ends in -all, so unauthorised senders are rejected."
        : "SPF is published but does not end in -all or ~all, so it gives little protection against spoofing.",
      evidence: spf,
      asset: domain,
      group: "email",
    });
  }
  }

  // DMARC — per RFC 7489 §6.6.3, if no record at _dmarc.{domain} the receiver
  // falls back to _dmarc.{organisational-domain}. We mirror that logic so the
  // score matches what compliant receivers (and CSA's IHP) would report.
  const dmarcL = await dns.txt(`_dmarc.${domain}`);
  if (inconclusive(dmarcL)) {
    findings.push(unknownFinding("email.dmarc", "DMARC record", domain, "email", failureCode(dmarcL)));
  } else {
  let dmarc = (resolved(dmarcL) ?? []).find((r) => r.toLowerCase().startsWith("v=dmarc1"));
  let dmarcFromOrg = false;

  if (!dmarc) {
    // RFC 7489 organisational domain fallback
    const orgDomain = getOrgDomain(domain);
    if (orgDomain) {
      const orgDmarcL = await dns.txt(`_dmarc.${orgDomain}`);
      const orgDmarc = (resolved(orgDmarcL) ?? []).find((r) => r.toLowerCase().startsWith("v=dmarc1"));
      if (orgDmarc) {
        dmarc = orgDmarc;
        dmarcFromOrg = true;
      }
    }
  }

  if (!dmarc) {
    findings.push({
      checkId: "email.dmarc",
      title: "No DMARC record",
      status: "fail",
      severity: hasMail ? "high" : "medium",
      detail:
        "Without DMARC, receiving mail servers have no instruction on what to do with mail that fails your SPF or DKIM checks. This is the single most common way SME domains get used in invoice fraud.",
      asset: domain,
      group: "email",
    });
  } else {
    const orgDomain = dmarcFromOrg ? getOrgDomain(domain)! : null;
    const policy = /p=(\w+)/.exec(dmarc)?.[1] ?? "none";
    const enforcing = policy === "reject" || policy === "quarantine";
    findings.push({
      checkId: "email.dmarc",
      title: enforcing
        ? `DMARC enforcing (p=${policy})${dmarcFromOrg ? " via org domain" : ""}`
        : `DMARC published but not enforcing${dmarcFromOrg ? " (inherited from org domain)" : ""}`,
      status: enforcing ? "pass" : "warn",
      severity: enforcing ? "info" : "medium",
      detail: enforcing
        ? `Mail failing authentication is ${policy === "reject" ? "rejected" : "quarantined"}.${dmarcFromOrg ? ` Policy inherited from organisational domain ${orgDomain} per RFC 7489.` : ""}`
        : `DMARC is set to p=none, which only monitors. Move to quarantine, then reject, once the reports look clean.${dmarcFromOrg ? ` Record inherited from organisational domain ${orgDomain}.` : ""}`,
      evidence: dmarc,
      asset: domain,
      group: "email",
    });
  }
  }

  // DKIM — probe selectors used by common mail providers and governments.
  // Organised by provider to make it easy to extend.
  const selectors = [
    // Generic / custom
    "default", "mail", "dkim", "dkim1", "dkim2", "key1", "key2", "smtp", "email",
    // Google Workspace
    "google",
    // Microsoft 365 / Exchange Online
    "selector1", "selector2",
    // Amazon SES
    "amazonses",
    // Mailchimp / Mandrill
    "k1", "k2", "k3", "mandrill",
    // SendGrid
    "s1", "s2", "s3", "sendgrid",
    // Fastmail
    "fm1", "fm2", "fm3",
    // Mimecast
    "mimecast",
    // Proofpoint
    "proofpoint",
    // Mailjet
    "mailjet",
    // Zoho
    "zoho",
    // Campaign Monitor
    "cm",
    // Postmark
    "pm",
    // HubSpot
    "hs1", "hs2",
    // Generic numeric / enterprise
    "m1", "m2", "mx", "s1024", "s2048",
  ];
  const dkimHits: string[] = [];
  let dkimInconclusive = 0;
  await Promise.all(
    selectors.map(async (s) => {
      const rec = await dns.txt(`${s}._domainkey.${domain}`);
      if (inconclusive(rec)) dkimInconclusive++;
      else if (resolved(rec)?.length) dkimHits.push(s);
    }),
  );
  if (!dkimHits.length && dkimInconclusive === selectors.length) {
    findings.push(unknownFinding("email.dkim", "DKIM key", domain, "email", "resolver unreachable"));
  } else {
  findings.push(
    dkimHits.length
      ? {
          checkId: "email.dkim",
          title: "DKIM signing key published",
          status: "pass",
          severity: "info",
          detail: `Outbound mail can be cryptographically signed. Selector(s) found: ${dkimHits.join(", ")}.`,
          asset: domain,
          group: "email",
        }
      : {
          checkId: "email.dkim",
          title: "No DKIM key found on common selectors",
          status: "warn",
          severity: "low",
          detail:
            "We probed the usual provider selectors and found none. DKIM may still be configured under a custom selector — worth confirming with whoever runs your mail.",
          asset: domain,
          group: "email",
        },
  );
  }

  // IPv6 — does the domain have AAAA records?
  if (!inconclusive(aaaaL)) {
    const has6 = !!(aaaa?.length);
    findings.push({
      checkId: "dns.ipv6",
      title: has6 ? "IPv6 (AAAA record) present" : "No IPv6 address",
      status: has6 ? "pass" : "warn",
      severity: has6 ? "info" : "low",
      detail: has6
        ? `Domain is reachable over IPv6 (${aaaa!.slice(0, 2).join(", ")}).`
        : "The domain has no AAAA record. IPv6-only visitors cannot reach it directly, and some modern networks prefer IPv6.",
      evidence: has6 ? aaaa!.join(", ") : undefined,
      asset: domain,
      group: "dns",
    });
  }

  // DNSSEC — check the Authenticated Data (AD) bit via Cloudflare DoH
  const adBit = await dnssecValidated(domain);
  if (adBit === null) {
    findings.push(unknownFinding("dns.dnssec", "DNSSEC validation", domain, "dns", "doh-unreachable"));
  } else {
    findings.push({
      checkId: "dns.dnssec",
      title: adBit ? "DNSSEC enabled and validated" : "DNSSEC not enabled",
      status: adBit ? "pass" : "warn",
      severity: adBit ? "info" : "medium",
      detail: adBit
        ? "DNS responses for this domain are cryptographically signed. Attackers cannot forge DNS records to redirect visitors."
        : "DNS answers for this domain are not signed with DNSSEC. A DNS hijack attack could silently redirect visitors to a fraudulent site.",
      asset: domain,
      group: "dns",
    });
  }

  // DANE — check for TLSA record at _443._tcp.{domain}
  const tlsaName = `_443._tcp.${domain}`;
  const tlsaRecords = await lookupTlsa(tlsaName);
  findings.push({
    checkId: "dns.dane",
    title: tlsaRecords ? "DANE TLSA record published" : "No DANE TLSA record",
    status: tlsaRecords ? "pass" : "warn",
    severity: tlsaRecords ? "info" : "low",
    detail: tlsaRecords
      ? "A TLSA record ties the server's certificate to DNS, so even a rogue CA-issued certificate would be rejected."
      : "No TLSA record found. DANE (DNS-based Authentication of Named Entities) lets you pin your certificate to DNS, providing an extra layer of verification beyond the CA system. Requires DNSSEC to be meaningful.",
    evidence: tlsaRecords ? tlsaRecords.join("; ") : undefined,
    asset: domain,
    group: "dns",
  });

  return { findings, assets, resolves };
}

// ── TLS ─────────────────────────────────────────────────────────────────────

interface TlsInfo {
  protocol: string | null;
  issuer: string | null;
  validTo: string | null;
  daysToExpiry: number | null;
  subjectAltNames: string[];
  authorized: boolean;
  authorizationError?: string;
  /** Negotiated cipher suite name */
  cipher: string | null;
  /** Standard cipher name (IANA) */
  cipherStandard: string | null;
  /** Ephemeral key exchange algorithm (e.g. X25519, P-256, X25519Kyber768) */
  ephemeralKeyName: string | null;
}

function inspectTls(host: string): Promise<TlsInfo | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: TIMEOUT, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        const first = (v: string | string[] | undefined): string | null =>
          Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
        const validTo = cert?.valid_to ?? null;
        const days = validTo
          ? Math.round((new Date(validTo).getTime() - Date.now()) / 86_400_000)
          : null;
        const cipherInfo = socket.getCipher();
        const ephKey = socket.getEphemeralKeyInfo() as { type?: string; name?: string; size?: number } | null;
        resolve({
          protocol: socket.getProtocol(),
          issuer: first(cert?.issuer?.O) ?? first(cert?.issuer?.CN),
          validTo,
          daysToExpiry: days,
          subjectAltNames: (cert?.subjectaltname ?? "")
            .split(",")
            .map((s) => s.trim().replace(/^DNS:/, ""))
            .filter(Boolean),
          authorized: socket.authorized,
          authorizationError: socket.authorized ? undefined : String(socket.authorizationError ?? ""),
          cipher: cipherInfo?.name ?? null,
          cipherStandard: cipherInfo?.standardName ?? null,
          ephemeralKeyName: ephKey?.name ?? null,
        });
        socket.end();
      },
    );
    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/** Probe whether a specific legacy TLS version is still accepted. */
function probeProtocol(host: string, version: tls.SecureVersion): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        timeout: 5000,
        rejectUnauthorized: false,
        minVersion: version,
        maxVersion: version,
      },
      () => {
        socket.end();
        resolve(true);
      },
    );
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function tlsChecks(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const info = await inspectTls(domain);

  if (!info) {
    findings.push({
      checkId: "tls.available",
      title: "No HTTPS service reachable",
      status: "fail",
      severity: "high",
      detail:
        "Nothing answered on port 443. If this domain serves a website, traffic to it is unencrypted and anything typed into it can be read in transit.",
      asset: domain,
      group: "tls",
    });
    return findings;
  }

  findings.push({
    checkId: "tls.available",
    title: "HTTPS is available",
    status: "pass",
    severity: "info",
    detail: `Served over ${info.protocol ?? "TLS"}, certificate issued by ${info.issuer ?? "an unnamed CA"}.`,
    asset: domain,
    group: "tls",
  });

  if (!info.authorized) {
    findings.push({
      checkId: "tls.valid",
      title: "Certificate does not validate",
      status: "fail",
      severity: "high",
      detail:
        "Visitors see a browser security warning, which trains them to click through warnings and undermines every other control you have.",
      evidence: info.authorizationError,
      asset: domain,
      group: "tls",
    });
  }

  if (info.daysToExpiry !== null) {
    if (info.daysToExpiry < 0) {
      findings.push({
        checkId: "tls.expiry",
        title: "Certificate has expired",
        status: "fail",
        severity: "critical",
        detail: `The certificate expired ${Math.abs(info.daysToExpiry)} days ago.`,
        evidence: `valid_to ${info.validTo}`,
        asset: domain,
        group: "tls",
      });
    } else if (info.daysToExpiry < 30) {
      findings.push({
        checkId: "tls.expiry",
        title: `Certificate expires in ${info.daysToExpiry} days`,
        status: "warn",
        severity: "medium",
        detail: "Renew now. An expired certificate takes the site down for most visitors.",
        evidence: `valid_to ${info.validTo}`,
        asset: domain,
        group: "tls",
      });
    } else {
      findings.push({
        checkId: "tls.expiry",
        title: "Certificate validity healthy",
        status: "pass",
        severity: "info",
        detail: `Valid for another ${info.daysToExpiry} days.`,
        asset: domain,
        group: "tls",
      });
    }
  }

  const [tls10, tls11, tls13] = await Promise.all([
    probeProtocol(domain, "TLSv1"),
    probeProtocol(domain, "TLSv1.1"),
    probeProtocol(domain, "TLSv1.3"),
  ]);
  const legacy = [tls10 && "TLS 1.0", tls11 && "TLS 1.1"].filter(Boolean) as string[];
  findings.push(
    legacy.length
      ? {
          checkId: "tls.legacy",
          title: `Deprecated protocol accepted: ${legacy.join(", ")}`,
          status: "fail",
          severity: "medium",
          detail:
            "These protocol versions are withdrawn and carry known weaknesses. Cyber Essentials asks for insecure protocols to be disabled.",
          evidence: legacy.join(", "),
          asset: domain,
          group: "tls",
        }
      : {
          checkId: "tls.legacy",
          title: "Deprecated TLS versions disabled",
          status: "pass",
          severity: "info",
          detail: "TLS 1.0 and 1.1 are refused.",
          asset: domain,
          group: "tls",
        },
  );

  // TLS 1.3
  findings.push({
    checkId: "tls.v13",
    title: tls13 ? "TLS 1.3 supported" : "TLS 1.3 not supported",
    status: tls13 ? "pass" : "warn",
    severity: tls13 ? "info" : "medium",
    detail: tls13
      ? "The server supports TLS 1.3, the most secure transport version. It has faster handshakes and eliminates several legacy vulnerabilities."
      : "The server does not appear to support TLS 1.3. TLS 1.2 is still acceptable but TLS 1.3 is strongly preferred — it is faster and removes legacy cipher options.",
    asset: domain,
    group: "tls",
  });

  // Cipher suite quality
  const cipher = info.cipher ?? info.cipherStandard ?? "";
  const WEAK_PATTERNS = /RC4|DES|3DES|EXPORT|NULL|anon|MD5|ADH|AECDH/i;
  const FS_PATTERNS = /ECDHE|DHE|ECDH/i;
  const MODERN_PATTERNS = /AES.*(128|256).GCM|CHACHA20.POLY1305|AES_128_GCM|AES_256_GCM/i;

  if (cipher) {
    const isWeak = WEAK_PATTERNS.test(cipher);
    const hasFS = FS_PATTERNS.test(cipher) || (info.protocol === "TLSv1.3"); // TLS 1.3 always has FS
    const isModern = MODERN_PATTERNS.test(cipher) || (info.protocol === "TLSv1.3");
    const status = isWeak ? "fail" : (!hasFS || !isModern) ? "warn" : "pass";
    findings.push({
      checkId: "tls.ciphers",
      title: isWeak
        ? `Weak cipher suite negotiated: ${cipher}`
        : isModern && hasFS
          ? `Strong cipher suite: ${cipher}`
          : `Acceptable cipher suite: ${cipher}`,
      status,
      severity: isWeak ? "high" : "low",
      detail: isWeak
        ? "The negotiated cipher is considered cryptographically weak. Attackers may be able to decrypt recorded traffic. Disable weak cipher suites on your server or load balancer."
        : isModern && hasFS
          ? "The server negotiated a modern cipher with forward secrecy — past traffic cannot be decrypted even if the private key is later compromised."
          : "The cipher suite is acceptable but not ideal. Prefer ECDHE with AES-GCM or CHACHA20-POLY1305 for forward secrecy and modern authenticated encryption.",
      evidence: cipher,
      asset: domain,
      group: "tls",
    });
  }

  // Post-Quantum Cryptography readiness
  // PQC hybrid key exchange (e.g. X25519Kyber768) requires TLS 1.3 and
  // a PQC-capable OpenSSL build. Standard Node.js returns X25519 or P-256.
  const keyName = info.ephemeralKeyName ?? "";
  const isPqc = /kyber|mlkem|ml.kem|x25519kyber/i.test(keyName);
  const readyForPqc = tls13 && isPqc;
  findings.push({
    checkId: "tls.pqc",
    title: readyForPqc
      ? `Post-Quantum Cryptography active (${keyName})`
      : tls13
        ? "TLS 1.3 ready — PQC key exchange not yet detected"
        : "Not ready for Post-Quantum Cryptography",
    status: readyForPqc ? "pass" : tls13 ? "warn" : "warn",
    severity: "low",
    detail: readyForPqc
      ? `The server is negotiating a post-quantum hybrid key exchange (${keyName}). Traffic is protected against future quantum computer attacks.`
      : tls13
        ? `TLS 1.3 is supported (negotiated key: ${keyName || "standard ECDH"}), which is the prerequisite for PQC. Enable X25519Kyber768 or ML-KEM hybrid groups on your server to achieve full PQC readiness. CSA's IHP checks for this.`
        : "TLS 1.3 is not supported — it is required before post-quantum key exchange can be enabled. Upgrade to TLS 1.3 first.",
    evidence: keyName || undefined,
    asset: domain,
    group: "tls",
  });

  return findings;
}

// ── HTTP ────────────────────────────────────────────────────────────────────

async function httpChecks(domain: string): Promise<{ findings: Finding[]; assets: DiscoveredAsset[] }> {
  const findings: Finding[] = [];
  const assets: DiscoveredAsset[] = [];

  // Does plain HTTP redirect to HTTPS?
  const plain = await safe(
    fetch(`http://${domain}/`, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT) }),
  );
  if (plain) {
    const loc = plain.headers.get("location") ?? "";
    const redirects = plain.status >= 300 && plain.status < 400 && loc.startsWith("https://");
    findings.push({
      checkId: "web.https-redirect",
      title: redirects ? "HTTP redirects to HTTPS" : "HTTP does not redirect to HTTPS",
      status: redirects ? "pass" : "fail",
      severity: redirects ? "info" : "medium",
      detail: redirects
        ? "Visitors arriving on http:// are moved to the encrypted site."
        : "Visitors arriving on http:// stay on an unencrypted connection.",
      evidence: `HTTP ${plain.status}${loc ? ` → ${loc}` : ""}`,
      asset: domain,
      group: "web",
    });
  }

  const res = await safe(
    fetch(`https://${domain}/`, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT) }),
  );
  if (!res) {
    return { findings, assets };
  }

  assets.push({ kind: "service", value: `https://${domain}/`, detail: "Public website" });

  const h = res.headers;
  const headerChecks: Array<{
    id: string;
    name: string;
    present: boolean;
    severity: Severity;
    why: string;
  }> = [
    {
      id: "web.hsts",
      name: "Strict-Transport-Security",
      present: !!h.get("strict-transport-security"),
      severity: "medium",
      why: "tells browsers to only ever reach you over HTTPS, closing the gap on the first request",
    },
    {
      id: "web.csp",
      name: "Content-Security-Policy",
      present: !!h.get("content-security-policy"),
      severity: "medium",
      why: "limits what scripts can run, which is the main defence against site defacement and card skimming",
    },
    {
      id: "web.xcto",
      name: "X-Content-Type-Options",
      present: !!h.get("x-content-type-options"),
      severity: "low",
      why: "stops browsers guessing file types and executing something they shouldn't",
    },
    {
      id: "web.frame",
      name: "X-Frame-Options / frame-ancestors",
      present: !!h.get("x-frame-options") || /frame-ancestors/i.test(h.get("content-security-policy") ?? ""),
      severity: "low",
      why: "stops your site being framed inside an attacker's page to trick users into clicking",
    },
    {
      id: "web.referrer",
      name: "Referrer-Policy",
      present: !!h.get("referrer-policy"),
      severity: "low",
      why: "stops internal URLs leaking to third-party sites",
    },
  ];

  for (const c of headerChecks) {
    findings.push({
      checkId: c.id,
      title: c.present ? `${c.name} set` : `${c.name} missing`,
      status: c.present ? "pass" : "warn",
      severity: c.present ? "info" : c.severity,
      detail: c.present
        ? `The header is present — it ${c.why}.`
        : `This header is not set. It ${c.why}.`,
      evidence: c.present ? (h.get(c.name.split(" ")[0].toLowerCase()) ?? undefined) : undefined,
      asset: domain,
      group: "web",
    });
  }

  // Version disclosure in banners.
  const banners = [
    ["server", h.get("server")],
    ["x-powered-by", h.get("x-powered-by")],
    ["x-aspnet-version", h.get("x-aspnet-version")],
  ].filter(([, v]) => v) as Array<[string, string]>;
  const versioned = banners.filter(([, v]) => /\d+\.\d+/.test(v));
  if (versioned.length) {
    findings.push({
      checkId: "web.banner",
      title: "Software version disclosed in response headers",
      status: "warn",
      severity: "low",
      detail:
        "Your server is publishing its exact software version. That hands an attacker the list of known vulnerabilities to try first.",
      evidence: versioned.map(([k, v]) => `${k}: ${v}`).join("; "),
      asset: domain,
      group: "web",
    });
    for (const [, v] of versioned) {
      assets.push({ kind: "service", value: v, detail: "Web server software (from banner)" });
    }
  }

  // Cookie flags.
  const setCookie = h.getSetCookie?.() ?? [];
  if (setCookie.length) {
    const weak = setCookie.filter((c) => !/;\s*secure/i.test(c) || !/;\s*httponly/i.test(c));
    findings.push({
      checkId: "web.cookies",
      title: weak.length ? "Cookies set without Secure/HttpOnly" : "Cookies carry Secure and HttpOnly",
      status: weak.length ? "warn" : "pass",
      severity: weak.length ? "low" : "info",
      detail: weak.length
        ? "Cookies missing these flags can be read by scripts or sent over unencrypted connections."
        : "Session cookies are protected from script access and plaintext transmission.",
      evidence: weak.length ? `${weak.length} of ${setCookie.length} cookies affected` : undefined,
      asset: domain,
      group: "web",
    });
  }

  return { findings, assets };
}

// ── Accidental exposure ─────────────────────────────────────────────────────

/**
 * Single GETs for files that should never be publicly served. These are ordinary
 * requests to public URLs — the same thing a search engine crawler does — but
 * finding one is a genuine emergency, because they leak credentials directly.
 */
async function exposureChecks(domain: string): Promise<Finding[]> {
  const paths: Array<{ path: string; label: string; severity: Severity }> = [
    { path: "/.env", label: "Application environment file", severity: "critical" },
    { path: "/.git/config", label: "Git repository metadata", severity: "critical" },
    { path: "/backup.sql", label: "Database dump", severity: "critical" },
    { path: "/phpinfo.php", label: "PHP configuration page", severity: "high" },
    { path: "/server-status", label: "Apache server status page", severity: "medium" },
  ];

  const results = await Promise.all(
    paths.map(async (p) => {
      const res = await safe(
        fetch(`https://${domain}${p.path}`, {
          redirect: "manual",
          signal: AbortSignal.timeout(6000),
        }),
      );
      if (!res || res.status !== 200) return null;
      const body = await safe(res.text());
      // Guard against sites that return 200 with a friendly 404 page.
      if (!body || body.length > 200_000 || /<html/i.test(body.slice(0, 200))) return null;
      return { ...p, sample: body.slice(0, 120) };
    }),
  );

  const hits = results.filter(Boolean) as Array<(typeof paths)[number] & { sample: string }>;

  if (!hits.length) {
    return [
      {
        checkId: "exposure.sensitive-files",
        title: "No exposed configuration or backup files",
        status: "pass",
        severity: "info",
        detail: "The usual accidentally-published files are not reachable.",
        asset: domain,
        group: "exposure",
      },
    ];
  }

  return hits.map((hit) => ({
    checkId: `exposure${hit.path.replace(/[^a-z]/gi, "-")}`,
    title: `Exposed: ${hit.label}`,
    status: "fail" as const,
    severity: hit.severity,
    detail:
      "This file is publicly downloadable and typically contains passwords, API keys or database contents. Remove it today and rotate anything it contained.",
    evidence: `GET ${hit.path} → 200`,
    asset: domain,
    group: "exposure",
  }));
}

// ── STARTTLS check ───────────────────────────────────────────────────────────

/**
 * Probe up to 2 MX hosts for STARTTLS support.
 * If all probes time out (port 25 blocked by the host network), returns an
 * "error" finding rather than a false negative.
 */
async function starttlsChecks(mxHosts: string[], domain: string): Promise<Finding[]> {
  if (!mxHosts.length) return [];

  // Probe the top 2 MX hosts in parallel
  const targets = mxHosts.slice(0, 2);
  const results = await Promise.all(targets.map((h) => probeStarttls(h)));

  const allNull = results.every((r) => r === null);
  if (allNull) {
    return [
      unknownFinding(
        "email.starttls",
        "STARTTLS support",
        domain,
        "email",
        "port-25-blocked",
      ),
    ];
  }

  const anyTrue = results.some((r) => r === true);
  const anyFalse = results.some((r) => r === false);

  return [
    {
      checkId: "email.starttls",
      title: anyTrue
        ? "STARTTLS supported on mail server"
        : "STARTTLS not advertised on mail server",
      status: anyTrue ? "pass" : "fail",
      severity: anyTrue ? "info" : "high",
      detail: anyTrue
        ? `Mail delivered to ${targets.filter((_, i) => results[i] === true).join(", ")} is encrypted in transit using STARTTLS.`
        : `The mail server (${targets.filter((_, i) => results[i] === false).join(", ")}) does not advertise STARTTLS. Email in transit between mail servers may be sent in plain text.`,
      evidence: targets.map((h, i) => `${h}: ${results[i] === true ? "STARTTLS" : results[i] === false ? "none" : "timeout"}`).join("; "),
      asset: domain,
      group: "email",
    },
    ...(anyFalse && anyTrue
      ? [
          {
            checkId: "email.starttls.partial",
            title: "STARTTLS missing on some MX hosts",
            status: "warn" as const,
            severity: "medium" as const,
            detail: "Some of your MX hosts support STARTTLS and some do not. Senders may deliver to the unencrypted host. Enable STARTTLS on all mail servers.",
            asset: domain,
            group: "email" as const,
          },
        ]
      : []),
  ];
}

// ── Orchestration ───────────────────────────────────────────────────────────

export async function runScan(
  rawDomain: string,
  auth: ScanAuthorisation = { mode: "passive", attested: false, verified: false },
): Promise<ScanResult> {
  const domain = normaliseDomain(rawDomain);
  const scannedAt = new Date().toISOString();

  if (!isPlausibleDomain(domain)) {
    return {
      domain,
      scannedAt,
      reachable: false,
      mode: auth.mode,
      findings: [],
      assets: [],
      error: "That does not look like a domain name. Try something like acme.com.sg.",
    };
  }

  const dnsClient = await selectDnsClient();
  const dnsPart = await dnsChecks(domain, dnsClient);

  // Our resolver never answered. Report nothing rather than a page of invented
  // failures — an empty result is honest, a fabricated one gets written into a
  // certification submission.
  if (dnsPart.resolverFailure) {
    return {
      domain,
      scannedAt,
      reachable: false,
      mode: auth.mode,
      findings: [],
      assets: [],
      error: `DNS lookups could not be performed from this machine (${dnsPart.resolverFailure}). No conclusions have been drawn about ${domain} — nothing was recorded against your assessment. Run this where outbound DNS on port 53 is permitted.`,
    };
  }

  if (!dnsPart.resolves) {
    return {
      domain,
      scannedAt,
      reachable: false,
      mode: auth.mode,
      findings: dnsPart.findings,
      assets: dnsPart.assets,
      error: `${domain} does not resolve to an address. Check the spelling.`,
    };
  }

  const intrusive = mayRunIntrusive(auth);

  // Extract MX hosts from DNS findings assets (already resolved above)
  const mxHosts = dnsPart.assets
    .filter((a) => a.kind === "mx")
    .map((a) => a.value);

  const [tlsFindings, httpPart, exposureFindings, ct, starttlsFindings] = await Promise.all([
    tlsChecks(domain),
    httpChecks(domain),
    // Only asked for when authority over the domain has been established.
    intrusive ? exposureChecks(domain) : Promise.resolve<Finding[]>([]),
    // Reads a third-party log, never the target, so it is always in bounds.
    certificateTransparencyHosts(domain),
    // Passive SMTP STARTTLS probe — non-intrusive, just reads the capability banner.
    mxHosts.length ? starttlsChecks(mxHosts, domain) : Promise.resolve<Finding[]>([]),
  ]);

  const discovered = await resolveHosts(ct.hosts, dnsClient);
  const summary = summariseDiscovery(discovered);

  const discoveryFinding: Finding[] = ct.unavailable
    ? [
        {
          checkId: "discovery.ct",
          title: "Certificate Transparency lookup unavailable",
          status: "error",
          severity: "info",
          detail: ct.unavailable,
          asset: domain,
          group: "dns",
        },
      ]
    : discovered.length
      ? [
          {
            checkId: "discovery.ct",
            title: `${discovered.length} other hostname${discovered.length === 1 ? "" : "s"} certified under your domain`,
            status: summary.interesting.length > 0 ? "warn" : "info",
            severity: summary.interesting.length > 0 ? "low" : "info",
            detail: summary.interesting.length
              ? `${summary.live} of these still resolve. ${summary.interesting.length} look like non-production hosts (${summary.interesting.slice(0, 4).map((h) => h.host).join(", ")}) — staging and test sites are routinely left unpatched because nobody counts them as production, and every one belongs in your asset inventory.`
              : `${summary.live} of these still resolve. Each belongs in your asset inventory — the ones nobody remembers setting up are the ones that go unpatched.`,
            evidence: `via ${ct.source}: ${discovered.slice(0, 12).map((h) => `${h.host}${h.live ? "" : " (not resolving)"}`).join(", ")}`,
            asset: domain,
            group: "dns",
          },
        ]
      : [];

  return {
    domain,
    scannedAt,
    reachable: true,
    resolvedVia: dnsClient.via,
    mode: auth.mode,
    authorisedBy: intrusive
      ? auth.verified
        ? "dns-verification"
        : "attestation"
      : undefined,
    discovered,
    findings: [
      ...dnsPart.findings,
      ...discoveryFinding,
      ...tlsFindings,
      ...httpPart.findings,
      ...starttlsFindings,
      ...exposureFindings,
    ],
    assets: [
      { kind: "domain", value: domain, detail: "Primary domain" },
      ...dnsPart.assets,
      ...httpPart.assets,
      ...discovered.map((h) => ({
        kind: "host" as const,
        value: h.host,
        detail: h.live
          ? "Found in certificate logs, resolves today"
          : "Found in certificate logs, no longer resolving",
      })),
    ],
  };
}

/** Checks whether the owner has published the DNS TXT proof for this domain. */
export async function verifyDomainOwnership(rawDomain: string): Promise<boolean> {
  const domain = normaliseDomain(rawDomain);
  if (!isPlausibleDomain(domain)) return false;
  const dns = await selectDnsClient();
  const txt = resolvedValue(await dns.txt(domain));
  const token = verificationToken(domain);
  return (txt ?? []).some((r) => r.trim() === token);
}

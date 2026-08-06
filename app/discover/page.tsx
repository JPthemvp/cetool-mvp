"use client";

import { useState } from "react";
import { useStore } from "@/components/store";
import {
  Button,
  Card,
  EmptyState,
  Pill,
  RequiredMark,
  SectionTitle,
  Stat,
  inputCls,
} from "@/components/ui";
import { mappingFor } from "@/lib/mapping";
import { Technical } from "@/components/detail";
import type { ScanMode } from "@/lib/authorisation";
import { normaliseDomain } from "@/lib/domain";
import { plainFinding, plainGroup } from "@/lib/plain";
import type { DiscoveredAsset, Finding, ScanResult } from "@/lib/scan";
import { CLAUSE_BY_ID } from "@/lib/ce-framework";

// ── IHP-style scorecard ───────────────────────────────────────────────────────

interface CheckWeight {
  id: string;
  label: string;
  category: "email" | "web" | "dns";
  points: number; // max points
  passStatuses: string[]; // statuses that earn full points
  halfStatuses?: string[]; // statuses that earn half points
}

const CHECK_WEIGHTS: CheckWeight[] = [
  // Email — 30 pts
  { id: "email.spf",   label: "SPF record",    category: "email", points: 10, passStatuses: ["pass"], halfStatuses: ["warn"] },
  { id: "email.dkim",  label: "DKIM key",      category: "email", points: 10, passStatuses: ["pass"], halfStatuses: ["warn"] },
  { id: "email.dmarc", label: "DMARC policy",  category: "email", points: 10, passStatuses: ["pass"], halfStatuses: ["warn"] },
  // Web / TLS — 40 pts
  { id: "tls.available",     label: "HTTPS available",          category: "web", points: 8,  passStatuses: ["pass"] },
  { id: "tls.valid",         label: "Certificate valid",        category: "web", points: 6,  passStatuses: ["pass"] },
  { id: "tls.expiry",        label: "Certificate not expiring", category: "web", points: 4,  passStatuses: ["pass"], halfStatuses: ["warn"] },
  { id: "tls.legacy",        label: "Legacy TLS disabled",      category: "web", points: 6,  passStatuses: ["pass"] },
  { id: "web.https-redirect",label: "HTTP → HTTPS redirect",   category: "web", points: 6,  passStatuses: ["pass"] },
  { id: "web.hsts",          label: "HSTS header",              category: "web", points: 5,  passStatuses: ["pass"] },
  { id: "web.csp",           label: "Content-Security-Policy",  category: "web", points: 5,  passStatuses: ["pass"] },
  // DNS hygiene — 30 pts
  { id: "dns.caa",      label: "CAA record",           category: "dns", points: 10, passStatuses: ["pass"], halfStatuses: ["warn"] },
  { id: "web.xcto",     label: "X-Content-Type-Options",category: "dns", points: 5,  passStatuses: ["pass"] },
  { id: "web.frame",    label: "Framing protection",   category: "dns", points: 5,  passStatuses: ["pass"] },
  { id: "web.referrer", label: "Referrer-Policy",      category: "dns", points: 5,  passStatuses: ["pass"] },
  { id: "web.banner",   label: "No version disclosure",category: "dns", points: 5,  passStatuses: ["pass", "info"], halfStatuses: [] },
];

function scoreFindings(findings: Finding[]) {
  const byId = new Map(findings.map((f) => [f.checkId, f]));

  let earned = 0;
  let max = 0;
  const catEarned: Record<string, number> = { email: 0, web: 0, dns: 0 };
  const catMax: Record<string, number>    = { email: 0, web: 0, dns: 0 };

  const rows = CHECK_WEIGHTS.map((cw) => {
    const finding = byId.get(cw.id);
    // web.banner is a warn/fail — treat absence of a fail as a pass
    let pts = 0;
    if (finding) {
      if (cw.passStatuses.includes(finding.status)) {
        pts = cw.points;
      } else if (cw.halfStatuses?.includes(finding.status)) {
        pts = Math.round(cw.points / 2);
      }
      // If checkId is web.banner, it's present when a banner WAS found — so warn = 0
      // If it isn't in findings at all (no web access) we don't count it
    }
    // Don't count checks that had no finding (e.g. no web access means no tls/web checks)
    const counted = !!finding && finding.status !== "error";
    if (counted) {
      earned += pts;
      max += cw.points;
      catEarned[cw.category] += pts;
      catMax[cw.category] += cw.points;
    }
    return { ...cw, finding, pts, counted };
  });

  const pct = max > 0 ? Math.round((earned / max) * 100) : 0;
  const grade = pct >= 90 ? "A" : pct >= 70 ? "B" : pct >= 50 ? "C" : pct >= 30 ? "D" : "F";

  const catPct = (cat: string) =>
    catMax[cat] > 0 ? Math.round((catEarned[cat] / catMax[cat]) * 100) : null;

  return { pct, grade, rows, catPct };
}

function gradeColor(pct: number) {
  if (pct >= 90) return { ring: "ring-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-300", bar: "bg-emerald-500" };
  if (pct >= 70) return { ring: "ring-brand-500/50",   bg: "bg-brand-700/20",   text: "text-brand-300",   bar: "bg-brand-500" };
  if (pct >= 50) return { ring: "ring-amber-500/50",   bg: "bg-amber-500/10",   text: "text-amber-300",   bar: "bg-amber-500" };
  return           { ring: "ring-red-500/50",           bg: "bg-red-500/10",     text: "text-red-400",     bar: "bg-red-500" };
}

function statusIcon(status: string) {
  if (status === "pass") return <span className="text-emerald-400 font-bold">✓</span>;
  if (status === "fail") return <span className="text-red-400 font-bold">✗</span>;
  if (status === "warn") return <span className="text-amber-400 font-bold">!</span>;
  return <span className="text-brand-400/60">–</span>;
}

function IHPScoreCard({ findings }: { findings: Finding[] }) {
  const [open, setOpen] = useState(true);
  const { pct, grade, rows, catPct } = scoreFindings(findings);
  const col = gradeColor(pct);

  const cats = [
    { key: "email", label: "Email security",   desc: "SPF · DKIM · DMARC" },
    { key: "web",   label: "Web & HTTPS",       desc: "TLS · Headers · Redirect" },
    { key: "dns",   label: "DNS hygiene",        desc: "CAA · Headers · Disclosure" },
  ] as const;

  return (
    <Card className={`overflow-hidden ring-1 ${col.ring}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-ink-850/50"
      >
        <span className="flex items-center gap-4">
          {/* Grade badge */}
          <span className={`grid h-12 w-12 place-items-center rounded-xl text-2xl font-black ${col.bg} ${col.text} ring-1 ${col.ring}`}>
            {grade}
          </span>
          <span>
            <span className="block text-[15px] font-semibold text-white">
              Internet Hygiene Score
            </span>
            <span className="mt-0.5 block text-[12px] text-brand-100/60">
              Modelled on CSA&apos;s Internet Hygiene Portal methodology
            </span>
          </span>
        </span>
        <span className="flex items-center gap-4 text-right">
          <span>
            <span className={`block text-2xl font-black tabular-nums ${col.text}`}>{pct}%</span>
            <span className="block text-[11px] text-brand-200/60">overall</span>
          </span>
          <span className="text-brand-200/60" style={{ display: "inline-block", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-brand-700/30">
          {/* Score bar */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                <div className={`h-full rounded-full transition-all ${col.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`w-10 text-right text-sm font-semibold tabular-nums ${col.text}`}>{pct}%</span>
            </div>
          </div>

          {/* Category scores */}
          <div className="grid gap-px border-t border-brand-700/30 sm:grid-cols-3">
            {cats.map((cat) => {
              const p = catPct(cat.key);
              const c = p !== null ? gradeColor(p) : gradeColor(0);
              return (
                <div key={cat.key} className="px-6 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-200/70">{cat.label}</p>
                  <p className="text-[11px] text-brand-100/50">{cat.desc}</p>
                  {p !== null ? (
                    <>
                      <p className={`mt-2 text-xl font-black tabular-nums ${c.text}`}>{p}%</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-800">
                        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${p}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-brand-100/40">Not checked</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Check-by-check table */}
          <div className="border-t border-brand-700/30">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-brand-700/20 text-[10px] uppercase tracking-wide text-brand-200/50">
                  <th className="px-6 py-2 font-medium">Check</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 text-center font-medium">Result</th>
                  <th className="px-6 py-2 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter((r) => r.counted).map((r) => {
                  const full = r.pts === r.points;
                  const none = r.pts === 0;
                  return (
                    <tr key={r.id} className="border-b border-ink-800/40 last:border-0">
                      <td className="px-6 py-2.5 font-medium text-brand-50">{r.label}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-brand-200/60">
                          {r.category === "email" ? "Email" : r.category === "web" ? "Web" : "DNS"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {r.finding ? statusIcon(r.finding.status) : <span className="text-brand-400/40">–</span>}
                      </td>
                      <td className={`px-6 py-2.5 text-right font-semibold tabular-nums ${full ? "text-emerald-400" : none ? "text-red-400/80" : "text-amber-400"}`}>
                        {r.pts}/{r.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="px-6 py-3 text-[11px] leading-relaxed text-brand-200/50">
              Score based on observable external checks only. CSA&apos;s Internet Hygiene Portal (ihp.sg) is the authoritative source — run your domain there for the official rating.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Asset inventory (merged from /assets) ────────────────────────────────────

const KIND_LABEL: Record<DiscoveredAsset["kind"], string> = {
  domain: "Domain",
  host: "Host",
  mx: "Mail server",
  nameserver: "Name server",
  ip: "IP address",
  service: "Service",
};

const INVENTORY_CLASSES = [
  { label: "Internet-facing services", discoverable: true },
  { label: "Domains and DNS", discoverable: true },
  { label: "Mail infrastructure", discoverable: true },
  { label: "End-user devices (laptops, desktops)", discoverable: false },
  { label: "Mobile and portable devices", discoverable: false },
  { label: "Network devices (firewalls, routers, switches)", discoverable: false },
  { label: "Servers", discoverable: false },
  { label: "IoT and non-standard computing devices", discoverable: false },
  { label: "Business applications and SaaS", discoverable: false },
];

const GROUP_LABEL: Record<Finding["group"], string> = {
  dns: "Domain and DNS",
  email: "Email authentication",
  tls: "Encryption in transit",
  web: "Web service configuration",
  exposure: "Accidental exposure",
};

const STATUS_TONE = {
  pass: "good",
  fail: "bad",
  warn: "warn",
  info: "info",
  error: "neutral",
} as const;

function FindingRow({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const { technical } = useStore();
  const mapping = mappingFor(finding.checkId);
  // In simple mode a finding is described by its consequence, not its mechanism.
  const plain = technical ? undefined : plainFinding(finding.checkId, finding.status);
  const clauses = (mapping?.clauseIds ?? [])
    .map((id) => CLAUSE_BY_ID.get(id))
    .filter(Boolean);

  return (
    <div className="border-b border-brand-700/30 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-ink-850/50"
      >
        <span className="mt-0.5">
          <Pill tone={STATUS_TONE[finding.status]}>
            {finding.status === "pass"
              ? "Pass"
              : finding.status === "fail"
                ? "Fail"
                : finding.status === "error"
                  ? "Unknown"
                  : "Check"}
          </Pill>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-white/90">
            {plain?.title ?? finding.title}
          </span>
          <span className="mt-1 block text-[13px] leading-relaxed text-brand-100/60">
            {plain ? plain.detail : finding.detail}
          </span>
          <Technical>
            {clauses.length > 0 && (
              <span className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-brand-200/70">
                  Maps to
                </span>
                {clauses.map((c) => (
                  <span
                    key={c!.id}
                    className="rounded bg-brand-500/10 px-1.5 py-0.5 font-mono text-[11px] text-brand-400 ring-1 ring-inset ring-brand-500/25"
                  >
                    {c!.id}
                  </span>
                ))}
              </span>
            )}
          </Technical>
        </span>
        <span className="mt-1 shrink-0 text-xs text-brand-200/70">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="space-y-3 bg-ink-950/45 px-5 pb-5 pt-1 text-[13px] leading-relaxed">
          {finding.evidence && (
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-brand-200/70">
                What we observed
              </p>
              <code className="block break-all rounded bg-ink-900 px-3 py-2 font-mono text-[12px] text-brand-100/80">
                {finding.evidence}
              </code>
            </div>
          )}
          {mapping && (
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-brand-200/70">
                Why it maps there · {mapping.confidence} confidence
              </p>
              <p className="text-brand-100/80">{mapping.rationale}</p>
            </div>
          )}
          {clauses.map((c) => (
            <div key={c!.id} className="rounded-lg border border-ink-700/60 bg-ink-900/60 p-3">
              <p className="font-mono text-[11px] text-brand-400">
                {c!.id} · {c!.obligation}
              </p>
              <p className="mt-1 text-brand-50">{c!.statement}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Asset inventory component ────────────────────────────────────────────────

function AssetInventory({
  scan,
  open,
  onToggle,
  onExport,
}: {
  scan: ScanResult;
  open: boolean;
  onToggle: () => void;
  onExport: (assets: DiscoveredAsset[]) => void;
}) {
  const assets = scan.assets ?? [];
  const byKind = (Object.keys(KIND_LABEL) as DiscoveredAsset["kind"][])
    .map((k) => ({ kind: k, items: assets.filter((a) => a.kind === k) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mt-6">
      <Card className="overflow-hidden">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-ink-850/50"
        >
          <span className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white/90">Asset inventory</span>
            <span className="rounded-full bg-brand-700/50 px-2 py-0.5 text-[11px] text-brand-200/80 ring-1 ring-inset ring-brand-500/20">
              {assets.length} discovered
            </span>
          </span>
          <span className="flex items-center gap-3">
            <span className="text-xs text-brand-200/60">A.2.4(a)</span>
            <span
              className="text-brand-200/60 transition-transform duration-200"
              style={{ display: "inline-block", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
            >
              ▾
            </span>
          </span>
        </button>

        {open && (
          <div className="border-t border-brand-700/30 p-5">
            <p className="mb-4 max-w-3xl text-[13px] leading-relaxed text-brand-100/70">
              A.2.4(a) requires an up-to-date hardware and software inventory — CSA accepts a
              spreadsheet. Discovery fills in the internet-facing rows automatically. The
              remainder needs a physical walkthrough.
            </p>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Stat label="Assets discovered" value={assets.length} />
              <Stat
                label="Asset classes covered"
                value={`${byKind.length} / ${INVENTORY_CLASSES.length}`}
                hint="CSA A.2.4(b) requires inventorying 6 classes: servers, endpoints, network devices, cloud services, mobile devices, and software. This shows how many classes the scan found assets for."
              />
              <Stat label="Clause" value="A.2.4(a)" hint="Inventory of hardware and software" />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-700/30 px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-white/90">Discovered assets</h3>
                  <Button
                    variant="subtle"
                    onClick={() => onExport(assets)}
                    className="!px-3 !py-1.5 !text-xs"
                  >
                    Export as inventory CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-brand-700/30 text-[11px] uppercase tracking-wide text-brand-200/70">
                        <th className="px-5 py-2.5 font-medium">Asset</th>
                        <th className="px-5 py-2.5 font-medium">Type</th>
                        <th className="px-5 py-2.5 font-medium">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((a, i) => (
                        <tr
                          key={`${a.kind}-${a.value}-${i}`}
                          className="border-b border-ink-800/50 last:border-0"
                        >
                          <td className="px-5 py-3 font-mono text-[13px] text-white/90">
                            {a.value}
                          </td>
                          <td className="px-5 py-3">
                            <Pill>{KIND_LABEL[a.kind]}</Pill>
                          </td>
                          <td className="px-5 py-3 text-[13px] text-brand-100/60">{a.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-white">
                  What the inventory <span className="text-csa-400">still needs</span>
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-brand-100/60">
                  A.2.4(b) lists the asset classes in scope. External discovery reaches three of
                  them. The rest require a physical walkthrough.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {INVENTORY_CLASSES.map((c) => (
                    <li key={c.label} className="flex items-start gap-2.5 text-[13px]">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          c.discoverable ? "bg-emerald-400" : "bg-amber-400/70"
                        }`}
                      />
                      <span className={c.discoverable ? "font-medium text-white" : "font-semibold text-amber-300"}>
                        {c.label}
                        {c.discoverable ? (
                          <span className="ml-1.5 text-[11px] font-normal text-emerald-400/80">
                            {" "}— discovered
                          </span>
                        ) : (
                          <span className="ml-1.5 text-[11px] font-normal text-amber-400/70">
                            {" "}— needs manual entry
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-brand-700/30 pt-4 text-[13px] leading-relaxed text-brand-100/60">
                  The CSV export includes the columns A.2.4(c) and A.2.4(d) require — owner,
                  location, end-of-support date, authorisation date — with discovered rows
                  already filled in.
                </p>
              </Card>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DiscoverPage() {
  const { domain, scan, scanning, scanError, runScan, lastPrefilled, ready, technical } =
    useStore();

  function exportInventory(assets: DiscoveredAsset[]) {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Asset", "Type", "Detail", "Source", "Owner", "Location", "End of support", "Authorised on"],
      ...assets.map((a) => [
        a.value,
        KIND_LABEL[a.kind],
        a.detail ?? "",
        "Automated discovery",
        "",
        "",
        "",
        "",
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset-inventory-${scan?.domain ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const [input, setInput] = useState(domain);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [inventoryOpen, setInventoryOpen] = useState(true);

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  const findings = scan?.findings ?? [];
  const fails = findings.filter((f) => f.status === "fail");
  const warns = findings.filter((f) => f.status === "warn");
  const passes = findings.filter((f) => f.status === "pass");

  const groups = (Object.keys(GROUP_LABEL) as Finding["group"][])
    .map((g) => ({ group: g, items: findings.filter((f) => f.group === g) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 01 · Discover"
        title="What an attacker can already see"
        lead="Enter the domain your business uses. We check DNS, email authentication, your certificate and your web service the same way any visitor could — no login, no port sweep, nothing installed. Then every result is mapped to the Cyber Essentials clause it affects."
      />

      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              runScan(input, { mode: "passive", attested: false, verify: false });
            }
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <div className="mb-1.5 flex items-center gap-1">
              <span className="text-sm font-medium text-brand-50">Your domain</span>
              <RequiredMark />
            </div>
            <input
              className={inputCls}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="yourcompany.com.sg"
              spellCheck={false}
              autoCapitalize="off"
              required
              aria-required="true"
            />
          </div>
          <Button
            type="submit"
            disabled={scanning || !input.trim()}
            className="sm:w-44"
          >
            {scanning ? "Scanning…" : "Run scan"}
          </Button>
        </form>

        {scanning && (
          <div className="mt-4 h-0.5 overflow-hidden rounded bg-ink-800">
            <div className="h-full w-1/3 rounded bg-brand-500 animate-sweep" />
          </div>
        )}

        <p className="mt-3 text-[12px] leading-relaxed text-brand-200/70">
          Reads public DNS records, completes a TLS handshake, checks email authentication
          (SPF / DKIM / DMARC), and fetches security headers — the same boundary
          CSA&apos;s Internet Hygiene Portal works within. Subdomain discovery reads public
          Certificate Transparency logs; that query never touches your domain directly.
        </p>

        {scanError && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {scanError}
          </div>
        )}
      </Card>

      {!scan && ready && !scanning && (
        <div className="mt-6">
          <EmptyState
            title="No scan yet"
            body="Run a scan and this page fills with findings, each tagged with the Cyber Essentials clause it speaks to. Those tags are what pre-fill your self-assessment later."
          />
        </div>
      )}

      {scan && scan.reachable && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label="Checks run" value={findings.length} />
            <Stat label="Failing" value={fails.length} tone={fails.length ? "bad" : "good"} />
            <Stat label="Worth reviewing" value={warns.length} tone={warns.length ? "warn" : "good"} />
            <Stat
              label="Clauses pre-filled"
              value={lastPrefilled.length}
              hint="Carried into your self-assessment"
            />
          </div>

          <IHPScoreCard findings={findings} />

          {lastPrefilled.length > 0 && (
            <Card className="mt-6 border-brand-500/30 bg-brand-500/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-brand-300">
                    {lastPrefilled.length} clauses answered from evidence
                  </h3>
                  <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-brand-100/80">
                    We only ever pre-fill a negative. A control we cannot see from outside
                    still needs you to confirm it — that is what keeps the submission
                    defensible in front of an assessor.
                  </p>
                </div>
                <span className="text-[12px] text-brand-200/70">
                  Carried forward automatically
                </span>
              </div>
            </Card>
          )}

          <div className="mt-6 space-y-3">
            {groups.map(({ group, items }) => {
              const isCollapsed = collapsedGroups.has(group);
              const passing = items.filter((i) => i.status === "pass").length;
              const failing = items.filter((i) => i.status === "fail").length;
              return (
                <Card key={group} className="overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-ink-850/50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white/90">
                        {technical ? GROUP_LABEL[group] : plainGroup(group)}
                      </span>
                      {failing > 0 && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-400 ring-1 ring-inset ring-red-500/25">
                          {failing} failing
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs tabular-nums text-brand-200/70">
                        {passing}/{items.length} passing
                      </span>
                      <span className="text-brand-200/60 transition-transform duration-200" style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
                        ▾
                      </span>
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="border-t border-brand-700/30">
                      {items.map((f) => (
                        <FindingRow key={f.checkId + f.title} finding={f} />
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-brand-200/70">
            Scanned {new Date(scan.scannedAt).toLocaleString("en-SG")} · {passes.length} checks
            passed. External checks cover the internet-facing slice of your estate only.
            Everything behind the firewall still needs answering in the assessment.
          </p>

          {/* ── Asset inventory ─────────────────────────────────────────── */}
          <AssetInventory
            scan={scan}
            open={inventoryOpen}
            onToggle={() => setInventoryOpen((o) => !o)}
            onExport={exportInventory}
          />

        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import {
  Button,
  Card,
  Field,
  Pill,
  RequiredLegend,
  RequiredMark,
  SectionTitle,
  inputCls,
} from "@/components/ui";
import { SECTORS } from "@/lib/sectors";

// ── Corppass simulation (replace with real Corppass OIDC redirect in prod) ───

const DEMO_ORG = {
  name: "Marina Precision Engineering Pte Ltd",
  uen: "201534217K",
  industry: "Manufacturing",
  size: "10–49 employees",
  hasInternalIt: false,
  onboardedVia: "corppass" as const,
  sector: "general" as const,
  scoping: { locations: "1", mobile: "no", byod: "no", servers: "yes" },
};

export default function StartPage() {
  const router = useRouter();
  const { org, setOrg, setScoping, domain, setDomain, scan, setScan, beginJourney, markCompleted } =
    useStore();

  const [corppassBusy, setCorppassBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState(org.onboardedVia === "corppass");
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(!!scan);
  const [domainInput, setDomainInput] = useState(domain ?? "");
  const [domainError, setDomainError] = useState("");

  useEffect(() => { beginJourney(); }, [beginJourney]);

  // ── Corppass login ────────────────────────────────────────────────────────

  function handleCorppass() {
    setCorppassBusy(true);
    // In production: redirect to Corppass OIDC endpoint, then callback fills
    // org details from ACRA via MyInfo Business API.
    setTimeout(() => {
      setOrg({
        ...DEMO_ORG,
        sector: org.sector || "general",
        scoping: org.scoping ?? DEMO_ORG.scoping,
      });
      // Populate scoping question answers one by one
      for (const [k, v] of Object.entries(DEMO_ORG.scoping)) setScoping(k, v);
      setLoggedIn(true);
      setCorppassBusy(false);
    }, 1200);
  }

  // ── Domain scan ──────────────────────────────────────────────────────────

  function validateDomain(v: string) {
    const clean = v.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (!clean) return "Please enter your organisation's domain.";
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean)) return "Enter a valid domain, e.g. company.com.sg";
    return "";
  }

  async function handleScan() {
    const err = validateDomain(domainInput);
    if (err) { setDomainError(err); return; }
    setDomainError("");
    const clean = domainInput.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    setDomain(clean);
    setScanning(true);

    try {
      const res = await fetch(`/api/scan?domain=${encodeURIComponent(clean)}`);
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      setScan(data);
      setScanDone(true);
      markCompleted("start");
    } catch {
      // Tolerate scan failure — user can still proceed and manually answer
      setScanDone(true);
      markCompleted("start");
    } finally {
      setScanning(false);
    }
  }

  const canProceed = loggedIn && (scanDone || scanning === false);

  function handleProceed() {
    markCompleted("start");
    router.push("/scan");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <SectionTitle
        eyebrow="Step 1 of 3"
        title="Log in and enter your domain"
        lead="Corppass fills your organisation details automatically. We then scan your domain for external risks — nothing installs on your machine."
      />

      {/* ── Corppass ─────────────────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Organisation login
            <RequiredMark />
          </h2>
          {loggedIn && <Pill tone="good">Logged in via Corppass</Pill>}
        </div>

        {!loggedIn ? (
          <>
            <p className="text-[13px] leading-relaxed text-brand-100/70">
              Log in with Corppass to auto-fill your UEN, registered name, and sector
              from ACRA. No typing required.
            </p>
            <button
              onClick={handleCorppass}
              disabled={corppassBusy}
              className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-red-600/60 bg-red-900/20 px-5 py-3.5 text-sm font-semibold text-red-200 transition hover:border-red-500/80 hover:bg-red-900/40 disabled:opacity-60"
            >
              {corppassBusy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300" />
                  Connecting to Corppass…
                </>
              ) : (
                <>
                  <span className="grid h-6 w-6 place-items-center rounded bg-red-600 text-[11px] font-bold text-white">
                    CP
                  </span>
                  Log in with Corppass
                </>
              )}
            </button>
            <p className="text-[11px] text-brand-200/50">
              Corppass is Singapore&apos;s corporate digital identity. Your data is fetched
              from ACRA via MyInfo Business — we do not store your Corppass credentials.
            </p>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 p-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-brand-300">Organisation</p>
              <p className="text-sm font-medium text-white">{org.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-brand-300">UEN</p>
              <p className="text-sm font-medium text-white">{org.uen}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-brand-300">Industry</p>
              <p className="text-sm font-medium text-white">{org.industry}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-brand-300">Size</p>
              <p className="text-sm font-medium text-white">{org.size}</p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Domain + auto-scan ──────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">
          Your organisation&apos;s domain
          <RequiredMark />
        </h2>
        <p className="text-[13px] leading-relaxed text-brand-100/70">
          We run a passive external scan — DNS, TLS, email authentication, HTTP
          security headers, exposed files. Same checks any attacker would run, but
          read-only and non-intrusive.
        </p>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="company.com.sg"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value);
                if (domainError) setDomainError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
              disabled={scanning || scanDone}
              className={inputCls + " w-full"}
            />
            {domainError && (
              <p className="mt-1 text-[12px] text-csa-400">{domainError}</p>
            )}
          </div>
          <Button
            onClick={handleScan}
            disabled={!loggedIn || scanning || scanDone || !domainInput.trim()}
            className="shrink-0"
          >
            {scanning ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Scanning…
              </span>
            ) : scanDone ? "✓ Scanned" : "Scan domain"}
          </Button>
        </div>

        {scanning && (
          <div className="space-y-2 rounded-lg bg-brand-900/40 border border-brand-700/30 p-4">
            <p className="text-[12px] font-semibold text-brand-200">Running external checks…</p>
            {[
              "DNS records (SPF, DKIM, DMARC)",
              "TLS/HTTPS configuration",
              "HTTP security headers",
              "Exposed files (.env, .git)",
              "Certificate transparency",
            ].map((c, i) => (
              <div key={c} className="flex items-center gap-2 text-[12px] text-brand-100/70">
                <span className="h-3 w-3 animate-spin rounded-full border border-brand-400/40 border-t-brand-300" style={{ animationDelay: `${i * 0.15}s` }} />
                {c}
              </div>
            ))}
          </div>
        )}

        {scanDone && !scanning && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-3 text-[13px] text-emerald-300">
            <span className="text-base">✓</span>
            External scan complete — findings mapped to CE clauses automatically.
          </div>
        )}
      </Card>

      {/* ── Proceed ─────────────────────────────────────────────────────── */}
      <Button
        onClick={handleProceed}
        disabled={!loggedIn || (!scanDone && !scanning)}
        className="w-full py-3.5 text-[15px]"
      >
        Next: Scan your devices →
      </Button>
    </div>
  );
}

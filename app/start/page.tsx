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
import { CorppassButton } from "@/components/corppass-logo";
import { SECTORS } from "@/lib/sectors";

// ── Corppass simulation (replace with real Corppass OIDC redirect in prod) ───
// In production: Corppass OIDC → MyInfo Business API → ACRA registered particulars
// For demo: marks session as Corppass-authenticated; org details filled by user below

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
    // Simulates the Corppass OIDC → MyInfo Business → ACRA flow.
    // In production this redirect returns the registered name, UEN, and
    // SSIC-mapped sector automatically. Here we pre-fill realistic demo
    // values so the experience matches what a real login would produce.
    setTimeout(() => {
      setOrg({
        onboardedVia: "corppass",
        name: "Demo Enterprise Pte Ltd",
        uen: "202312345A",
        sector: "Information and Communications",
      });
      setLoggedIn(true);
      setCorppassBusy(false);
    }, 1400);
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
            <CorppassButton
              onClick={handleCorppass}
              busy={corppassBusy}
              size="md"
              className="w-full"
            />
            <p className="text-[11px] text-brand-200/50">
              Corppass is Singapore&apos;s corporate digital identity. Your data is fetched
              from ACRA via MyInfo Business — we do not store your Corppass credentials.
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-700/30 bg-emerald-900/15 px-4 py-3 text-[13px] text-emerald-300">
              <span className="text-base">✓</span>
              Corppass session verified — ACRA details pre-filled below. Update if needed.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-brand-300 mb-1">
                  Registered Name <span className="normal-case text-brand-200/40">(from ACRA)</span>
                </label>
                <input
                  className="w-full rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-[13px] text-white placeholder-brand-300/30 focus:border-brand-500/60 focus:outline-none"
                  value={org.name}
                  placeholder="e.g. Tan Brothers Pte Ltd"
                  onChange={(e) => setOrg({ name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-brand-300 mb-1">
                  UEN <span className="normal-case text-brand-200/40">(from ACRA)</span>
                </label>
                <input
                  className="w-full rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-[13px] text-white placeholder-brand-300/30 focus:border-brand-500/60 focus:outline-none"
                  value={org.uen}
                  placeholder="e.g. 202312345A"
                  onChange={(e) => setOrg({ uen: e.target.value })}
                />
              </div>
            </div>
            <p className="text-[11px] text-brand-200/50">
              ⓘ Demo simulation — in production, Corppass retrieves these from ACRA via MyInfo Business automatically. You can edit before proceeding.
            </p>
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

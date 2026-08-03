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
import {
  ATTESTATION_TEXT,
  INTRUSIVE_DESCRIPTION,
  PASSIVE_DESCRIPTION,
  verificationInstructions,
  type ScanMode,
} from "@/lib/authorisation";
import { normaliseDomain } from "@/lib/domain";
import { plainFinding, plainGroup } from "@/lib/plain";
import type { Finding } from "@/lib/scan";
import { CLAUSE_BY_ID } from "@/lib/ce-framework";

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

export default function DiscoverPage() {
  const { domain, scan, scanning, scanError, runScan, lastPrefilled, ready, technical } =
    useStore();
  const [input, setInput] = useState(domain);
  const [mode, setMode] = useState<ScanMode>("passive");
  const [attested, setAttested] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [useVerification, setUseVerification] = useState(false);

  const blocked = mode === "full" && !attested && !useVerification;

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
            if (input.trim() && !blocked) {
              runScan(input, { mode, attested, verify: useVerification });
            }
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <div className="mb-1.5 flex items-start justify-between gap-2">
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
            disabled={scanning || !input.trim() || blocked}
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

        {/* The boundary, stated before the button rather than after it. */}
        <div className="mt-5 space-y-2">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition ${
              mode === "passive"
                ? "border-brand-500/50 bg-brand-700/15"
                : "border-ink-700/60 hover:border-ink-600"
            }`}
          >
            <input
              type="radio"
              name="scan-mode"
              checked={mode === "passive"}
              onChange={() => setMode("passive")}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2f7dbf]"
            />
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-semibold text-white">
                  Configuration check
                </span>
                <Pill tone="good">Safe on any domain</Pill>
              </span>
              <span className="mt-1 block text-[12px] leading-relaxed text-brand-100/80">
                {PASSIVE_DESCRIPTION}
              </span>
            </span>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition ${
              mode === "full"
                ? "border-csa-500/50 bg-csa-500/10"
                : "border-ink-700/60 hover:border-ink-600"
            }`}
          >
            <input
              type="radio"
              name="scan-mode"
              checked={mode === "full"}
              onChange={() => setMode("full")}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#e31736]"
            />
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-semibold text-white">
                  Configuration check plus exposure probe
                </span>
                <Pill tone="bad">Your own domain only</Pill>
              </span>
              <span className="mt-1 block text-[12px] leading-relaxed text-brand-100/80">
                {INTRUSIVE_DESCRIPTION}
              </span>
            </span>
          </label>
        </div>

        {mode === "full" && (
          <div className="mt-3 rounded-lg border border-csa-500/40 bg-csa-500/10 p-4">
            <p className="text-[13px] leading-relaxed text-brand-50">
              Requesting these files is a security test, not browsing. It will appear in
              the target&apos;s logs as reconnaissance, and running it against a domain you
              are not authorised to test may be an offence under the Computer Misuse Act.
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-csa-500/25 pt-3">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-950 accent-[#e31736]"
              />
              <span className="text-[13px] leading-relaxed text-white">
                {ATTESTATION_TEXT}
              </span>
            </label>

            <button
              onClick={() => setShowVerify((v) => !v)}
              className="mt-3 text-[12px] text-brand-300 underline-offset-2 hover:underline"
            >
              {showVerify ? "Hide" : "Prove it by DNS instead (stronger)"}
            </button>

            {showVerify && (
              <div className="mt-2.5 rounded-lg border border-ink-700/60 bg-ink-950/50 p-3">
                <ol className="list-inside list-decimal space-y-1 text-[12px] text-brand-100/80">
                  {verificationInstructions(normaliseDomain(input || "yourdomain.com")).map(
                    (line) => (
                      <li key={line}>{line}</li>
                    ),
                  )}
                </ol>
                <label className="mt-3 flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={useVerification}
                    onChange={(e) => setUseVerification(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-950 accent-[#2f7dbf]"
                  />
                  <span className="text-[12px] text-brand-50">
                    I have published the record — check it when scanning
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-xs leading-relaxed text-brand-200/70">
          Subdomain discovery reads public Certificate Transparency logs, which are
          third-party records — that query never touches the domain being scanned, so it
          runs in both modes.
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

          <div className="mt-6 space-y-5">
            {groups.map(({ group, items }) => (
              <Card key={group} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-700/30 px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-white/90">
                    {technical ? GROUP_LABEL[group] : plainGroup(group)}
                  </h3>
                  <span className="text-xs tabular-nums text-brand-200/70">
                    {items.filter((i) => i.status === "pass").length}/{items.length} passing
                  </span>
                </div>
                {items.map((f) => (
                  <FindingRow key={f.checkId + f.title} finding={f} />
                ))}
              </Card>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-brand-200/70">
            Scanned {new Date(scan.scannedAt).toLocaleString("en-SG")} · {passes.length} checks
            passed. External checks cover the internet-facing slice of your estate only.
            Everything behind the firewall still needs answering in the assessment.
          </p>
        </>
      )}
    </div>
  );
}

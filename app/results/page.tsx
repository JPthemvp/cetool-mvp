"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/components/store";
import { Button, Card, EmptyState, Meter, Pill, SectionTitle, Stat } from "@/components/ui";
import {
  ANSWER_LABEL,
  buildResultRows,
  toCsv,
  type AnswerValue,
  type ResultRow,
} from "@/lib/assessment";
import { CATEGORIES, MEASURE_BY_ID, measuresInCategory } from "@/lib/ce-framework";
import { CERTIFICATION_STEPS } from "@/lib/guidance";
import { SECTOR_BY_ID, extraObligations } from "@/lib/sectors";
import { ObligationLabel } from "@/components/detail";
import { buildReport, reportFilename, reportToJson, reportToXlsx } from "@/lib/report";

// ── Email to Certification Body ──────────────────────────────────────────────

const CERT_BODIES = [
  { name: "CYBERTRUST ASIA PTE. LTD.", email: "certbody@cybertrust-asia.com.sg" },
  { name: "SAIQA PTE. LTD.",           email: "ce-assessment@saiqa.com.sg" },
  { name: "WIZLYNX PTE. LTD.",         email: "cemarks@wizlynx.com.sg" },
  { name: "NCS PTE. LTD.",             email: "cyberessentials@ncs.com.sg" },
];

function EmailToCertBody({
  org, readiness, gaps, scan, declComplete,
}: {
  org: { name: string; uen: string; sector: string };
  readiness: { completion: number; percent: number; blocking: number; certifiable: boolean };
  gaps: Array<{ band: string }>;
  scan: { domain: string } | null;
  declComplete: boolean;
}) {
  const [selectedBody, setSelectedBody] = useState(CERT_BODIES[0]);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
  const completionPct = Math.round(readiness.completion);
  const criticalGaps = gaps.filter((g) => g.band === "critical").length;

  const template = `To: ${selectedBody.email}
Subject: Cyber Essentials Mark — Assessment Submission — ${org.name || "[Organisation Name]"}

Dear ${selectedBody.name} Assessment Team,

I am writing to submit our organisation for the CSA Cyber Essentials Mark assessment.

ORGANISATION DETAILS
────────────────────
Organisation name : ${org.name || "[Organisation Name]"}
UEN               : ${org.uen || "[UEN]"}
Sector            : ${org.sector || "[Sector]"}
Assessment date   : ${today}
Scanned domain    : ${scan?.domain || "[domain.com.sg]"}

SELF-ASSESSMENT SUMMARY
────────────────────────
Overall completion : ${completionPct}%
Certifiable status : ${readiness.certifiable ? "Yes — all mandatory clauses met" : `No — ${readiness.blocking} mandatory clause(s) still open`}
Open gaps          : ${gaps.length} (${criticalGaps} critical)
Weighted score     : ${readiness.percent}%

ATTACHED
────────
Please find attached our completed self-assessment export (Excel + JSON) generated from the Cyber Essentials Readiness Tool. The export contains clause-by-clause answers, evidence references, and scan data mapped to each CE measure.

We confirm that the information provided is accurate to the best of our knowledge and that we have conducted this self-assessment in good faith.

Please advise on next steps and your scheduling for the independent assessment.

Yours sincerely,

[Authorised Signatory Name]
[Designation]
${org.name || "[Organisation Name]"}
[Contact number]
[Email address]`;

  function copy() {
    navigator.clipboard.writeText(template).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const mailtoHref = `mailto:${selectedBody.email}?subject=${encodeURIComponent(`Cyber Essentials Mark — Assessment Submission — ${org.name || "Organisation"}`)}&body=${encodeURIComponent(template)}`;

  return (
    <Card className="mt-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-ink-850/50"
      >
        <span className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-white">✉️ Submit to Certification Body</span>
          {!declComplete && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-inset ring-amber-500/30">
              Complete declaration first
            </span>
          )}
          {declComplete && (
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
              Ready to send
            </span>
          )}
        </span>
        <span className="text-brand-200/60" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
      </button>

      {open && (
        <div className="border-t border-brand-700/30">
          <div className="px-5 py-4 border-b border-brand-700/30">
            <p className="text-[13px] text-brand-100/70 mb-3">Select a CSA-appointed certification body, then send the pre-filled email with your Excel export attached.</p>
            <div className="flex flex-wrap gap-2">
              {CERT_BODIES.map((b) => (
                <button key={b.name} onClick={() => setSelectedBody(b)}
                  className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition ${selectedBody.name === b.name ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-ink-600/60 bg-ink-800/60 text-brand-200/70 hover:border-brand-500/40"}`}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-100/40">Pre-filled email template</p>
              <div className="flex gap-2">
                <button onClick={copy}
                  className="rounded border border-ink-600/60 bg-ink-800/60 px-2.5 py-1 text-[11px] font-medium text-brand-200/80 transition hover:border-brand-500/40 hover:text-white">
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <a href={mailtoHref}
                  className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/20">
                  Open in email client ↗
                </a>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-ink-700/50 bg-ink-900 p-4 text-[11px] leading-relaxed text-brand-100/70 whitespace-pre-wrap font-mono">
              {template}
            </pre>
            <p className="mt-2 text-[11px] text-brand-100/30">
              ⚠ These are dummy email addresses for demonstration. Replace with the actual certification body contact from <a href="https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cyber-essentials-and-cyber-trust-mark/certification-body-and-assessors" target="_blank" rel="noreferrer" className="underline hover:text-brand-100/60">CSA&apos;s register ↗</a>.
              Attach your Excel export before sending.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Signature pad ────────────────────────────────────────────────────────────

function SignaturePad({
  onSigned,
  onCleared,
}: {
  onSigned: (dataUrl: string) => void;
  onCleared: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      lastPos.current = getPos(e, canvas);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing.current || !lastPos.current) return;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = pos;
    };
    const end = () => {
      if (!drawing.current) return;
      drawing.current = false;
      lastPos.current = null;
      onSigned(canvas.toDataURL("image/png"));
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, [onSigned]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    onCleared();
  }, [onCleared]);

  return (
    <div className="space-y-1.5">
      <canvas
        ref={canvasRef}
        width={600}
        height={140}
        className="w-full cursor-crosshair rounded-lg border border-ink-600/80 bg-ink-850 touch-none"
        style={{ height: "140px" }}
      />
      <button
        type="button"
        onClick={clear}
        className="text-[11px] text-brand-200/60 underline-offset-2 hover:text-brand-100/80 hover:underline"
      >
        Clear signature
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const ANSWER_TONE: Record<AnswerValue, "good" | "warn" | "bad" | "neutral"> = {
  yes: "good",
  partial: "warn",
  no: "bad",
  unsure: "warn",
  na: "neutral",
  unanswered: "neutral",
};

export default function ResultsPage() {
  const { org, scope, answers, readiness, scan, gaps, ready, technical, pathway, endpoints } =
    useStore();
  const [busy, setBusy] = useState<"xlsx" | "json" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);

  // Declaration state — name intentionally left blank; user must sign manually.
  const [declName, setDeclName] = useState("");
  const [declDesignation, setDeclDesignation] = useState("");
  const [declAgreed, setDeclAgreed] = useState(false);
  const [declSignature, setDeclSignature] = useState<string | null>(null);
  const declComplete = declName.trim().length > 0 && declDesignation.trim().length > 0 && declAgreed && !!declSignature;
  const onSigned = useCallback((dataUrl: string) => setDeclSignature(dataUrl), []);
  const onSignatureCleared = useCallback(() => setDeclSignature(null), []);

  const rows = useMemo(() => buildResultRows(answers, scope), [answers, scope]);
  const generatedAt = new Date().toLocaleString("en-SG");

  const shown = showAll ? rows : rows.filter((r) => r.answer !== "yes" && r.answer !== "na");

  const sector = SECTOR_BY_ID.get(org.sector);
  const beyond = extraObligations(org.sector);

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const makeReport = () =>
    buildReport({
      org: {
        name: org.name,
        uen: org.uen,
        industry: org.industry,
        size: org.size,
        sector: org.sector,
        scoping: org.scoping,
      },
      scope,
      pathway,
      answers,
      readiness,
      gaps,
      scan,
      endpoints,
    });

  async function exportXlsx() {
    setBusy("xlsx");
    setExportError(null);
    try {
      const report = makeReport();
      const blob = await reportToXlsx(report);
      saveBlob(blob, reportFilename(org.name, "xlsx"));
    } catch (e) {
      setExportError(
        `The spreadsheet could not be built (${(e as Error).message}). The JSON export is unaffected.`,
      );
    } finally {
      setBusy(null);
    }
  }

  function exportJson() {
    setBusy("json");
    setExportError(null);
    try {
      const blob = new Blob([reportToJson(makeReport())], { type: "application/json" });
      saveBlob(blob, reportFilename(org.name, "json"));
    } catch (e) {
      setExportError(`The JSON export failed (${(e as Error).message}).`);
    } finally {
      setBusy(null);
    }
  }

  function download(kind: "csv" | "json") {
    const name = org.name || "organisation";
    let blob: Blob;
    let filename: string;

    if (kind === "csv") {
      blob = new Blob([toCsv(rows, name, generatedAt)], { type: "text/csv;charset=utf-8" });
      filename = `cyber-essentials-results-${name.replace(/\s+/g, "-").toLowerCase()}.csv`;
    } else {
      const payload = {
        tool: "Cyber Essentials Tool",
        generatedAt: new Date().toISOString(),
        organisation: org,
        scope,
        scannedDomain: scan?.domain ?? null,
        scannedAt: scan?.scannedAt ?? null,
        readiness: {
          completion: readiness.completion,
          weightedScore: readiness.percent,
          mandatoryGapsOpen: readiness.blocking,
          certifiable: readiness.certifiable,
        },
        results: rows,
      };
      blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      filename = `cyber-essentials-results-${name.replace(/\s+/g, "-").toLowerCase()}.json`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (ready && readiness.completion === 0) {
    return (
      <div>
        <SectionTitle
          eyebrow="Capability 04 · Assess"
          title="Results"
          lead="This is what replaces the results tab in CSA's self-assessment."
        />
        <EmptyState
          title="No results to show yet"
          body="Run a scan and answer the assessment. This page then produces the submission-ready results tab, with each clause carrying its answer, where that answer came from, and its evidence reference."
          action={{ label: "Start with a scan", href: "/discover" }}
        />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 04 · Assess"
        title="Cyber Essentials mark — self-assessment results"
        lead="One row per applicable clause, carrying the answer, its provenance, and the evidence reference an assessor will read. Export it as CSV for the submission or JSON for a certification body to ingest."
      />

      {/* Header block */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-brand-200/70">Organisation</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {org.name || "Not provided"}
            </p>
            <p className="mt-0.5 text-[13px] text-brand-100/60">
              {[org.uen, org.industry, org.size].filter(Boolean).join(" · ") || "Complete your profile on the Start page"}
            </p>
            {org.onboardedVia === "corppass" && (
              <span className="mt-2 inline-block">
                <Pill tone="info">Particulars retrieved via Corppass</Pill>
              </span>
            )}
          </div>

          <div className="text-right text-[13px]">
            <p className="text-[11px] uppercase tracking-wide text-brand-200/70">Generated</p>
            <p className="mt-1 text-brand-50">{generatedAt}</p>
            {scan && (
              <p className="mt-1 text-brand-100/60">
                Scan of <span className="font-mono text-brand-100/80">{scan.domain}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Clauses in scope" value={rows.length} />
          <Stat label="Completion" value={`${readiness.completion}%`} />
          <Stat label="Weighted score" value={`${readiness.percent}%`} />
          <Stat
            label="Mandatory gaps"
            value={readiness.blocking}
            tone={readiness.blocking === 0 ? "good" : "bad"}
          />
        </div>

        <div
          className={`mt-6 rounded-xl border p-5 ${
            readiness.certifiable
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-amber-500/25 bg-amber-500/5"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              readiness.certifiable ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {readiness.certifiable ? "Ready to submit" : "Not yet ready to submit"}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-brand-100/80">{readiness.verdict}</p>
        </div>

        {/* Declaration — only unlocked when assessment is certifiable */}
        <div className={`mt-6 border-t border-brand-700/30 pt-5 ${!readiness.certifiable ? "pointer-events-none opacity-40" : ""}`}>
          {!readiness.certifiable && (
            <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-2.5 text-[12px] font-medium text-amber-300">
              Complete all mandatory clauses to unlock the declaration and submission.
            </p>
          )}
          <p className="text-[13px] font-semibold uppercase tracking-wide text-white">
            Declaration
          </p>
          <ul className="mt-3 space-y-3 text-[13px] leading-relaxed text-brand-100/80">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-csa-400" />
              <span>
                We, the Applicant, declare that the facts stated in this application and
                the accompanying information are true and correct to the best of our
                knowledge and that we have not withheld / distorted any material facts.
                We understand that we have a continuing obligation to promptly notify our
                appointed certification body if there is any change affecting the
                information set out in this application and declaration.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-csa-400" />
              <span>
                We understand that our appointed certification body may take the relevant
                action if we provide false or misleading statements or fail to disclose
                material facts, and the certification body may, at its discretion,
                withdraw the certification issued or take other follow-on action.
              </span>
            </li>
          </ul>

          {/* Agreement checkbox */}
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={declAgreed}
              onChange={(e) => setDeclAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-850 accent-[#2f7dbf]"
            />
            <span className="font-medium text-brand-50">Yes, we agree to the above declaration.</span>
          </label>

          {/* Signatory fields */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-medium text-brand-200/80 mb-1">
                Name (for and on behalf of{" "}
                <span className="text-brand-50 italic">
                  {org.name || "your organisation"}
                </span>
                )
              </label>
              <input
                className="w-full rounded-lg border border-ink-600/80 bg-ink-850 px-3 py-2 text-sm text-brand-50 placeholder:text-brand-200/40 focus:border-brand-500 focus:outline-none"
                value={declName}
                onChange={(e) => setDeclName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-brand-200/80 mb-1">
                Designation
              </label>
              <input
                className="w-full rounded-lg border border-ink-600/80 bg-ink-850 px-3 py-2 text-sm text-brand-50 placeholder:text-brand-200/40 focus:border-brand-500 focus:outline-none"
                value={declDesignation}
                onChange={(e) => setDeclDesignation(e.target.value)}
                placeholder="e.g. Director, CEO, IT Manager"
              />
            </div>
          </div>

          {/* Digital signature */}
          <div className="mt-4">
            <label className="block text-[12px] font-medium text-brand-200/80 mb-1">
              Signature <span className="text-brand-200/50">(draw with mouse or touch)</span>
            </label>
            <SignaturePad
              onSigned={onSigned}
              onCleared={onSignatureCleared}
            />
          </div>

          {declComplete && (
            <p className="mt-3 text-[12px] text-emerald-400">
              ✓ Declaration complete — print this page or take a screenshot to capture the signed declaration alongside your export.
            </p>
          )}
        </div>

        {/* Export — only revealed after declaration is complete */}
        <div className="mt-6 border-t border-brand-700/30 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
            For the certification body
          </p>
          {!declComplete ? (
            <p className="mt-3 rounded-lg border border-brand-700/40 bg-ink-900/60 px-4 py-3 text-[13px] leading-relaxed text-brand-100/60">
              Complete the declaration above — agree to the statement, fill in your name and designation, and draw your signature — to unlock the download options.
            </p>
          ) : (
            <>
              <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-brand-100/80">
                Both formats carry the same content: every clause with its answer, how that
                answer was reached, and the evidence log showing what ran and when. The
                spreadsheet is for the assessor to read; the JSON is for a body that would
                rather ingest it than re-key it.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={exportXlsx} disabled={busy !== null}>
                  {busy === "xlsx" ? "Building…" : "Download submission (Excel)"}
                </Button>
                <Button variant="ghost" onClick={exportJson} disabled={busy !== null}>
                  Download submission (JSON)
                </Button>
              </div>
              {exportError && (
                <p className="mt-2 text-[12px] text-csa-300">{exportError}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => download("csv")}>
                  Results tab only (CSV)
                </Button>
                <Button variant="ghost" onClick={() => window.print()}>
                  Print
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ── Email to Certification Body ──────────────────────────────── */}
      <EmailToCertBody
        org={org}
        readiness={readiness}
        gaps={gaps}
        scan={scan}
        declComplete={declComplete}
      />

      {/* Per-measure summary */}
      <h2 className="mt-10 mb-4 text-xl font-semibold tracking-tight text-white">
        By measure
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.flatMap((cat) =>
          measuresInCategory(cat.id).map((m) => {
            const s = readiness.measures.find((x) => x.measureId === m.id)!;
            return (
              <Card key={m.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-brand-400">{m.id}</p>
                    <p className="mt-0.5 text-[13px] font-medium leading-snug text-white/90">
                      {m.name}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-white/90">
                    {s.percent}%
                  </span>
                </div>
                <div className="mt-3">
                  <Meter
                    value={s.percent}
                    tone={s.blocking === 0 ? "good" : s.percent > 60 ? "warn" : "bad"}
                  />
                </div>
                <p className="mt-2 text-[11px] text-brand-100/60">
                  {s.met}/{s.total - s.na} met
                  {s.blocking > 0 && (
                    <span className="text-csa-400"> · {s.blocking} mandatory open</span>
                  )}
                </p>
              </Card>
            );
          }),
        )}
      </div>

      {/* The results tab itself */}
      <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Clause-by-clause results
        </h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-brand-100/80">
          <input
            type="checkbox"
            checked={!showAll}
            onChange={(e) => setShowAll(!e.target.checked)}
            className="h-3.5 w-3.5 rounded border-ink-600/80 bg-ink-850 accent-[#2f7dbf]"
          />
          Show only outstanding
        </label>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="sticky top-0 bg-ink-900">
              <tr className="border-b border-ink-700 text-[11px] uppercase tracking-wide text-brand-100/60">
                {technical && <th className="px-4 py-3 font-medium">Clause</th>}
                <th className="px-4 py-3 font-medium">Requirement</th>
                <th className="px-4 py-3 font-medium">{technical ? "Type" : "Needed for"}</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r: ResultRow) => (
                <tr key={r.clauseId} className="border-b border-ink-800/50 last:border-0">
                  {technical && (
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <span className="font-mono text-[11px] text-brand-400">{r.clauseId}</span>
                    </td>
                  )}
                  <td className="px-4 py-3 align-top">
                    <span className="block text-[13px] text-white/90">{r.requirement}</span>
                    <span className="mt-0.5 block text-[11px] text-brand-200/70">
                      {MEASURE_BY_ID.get(r.measureId)?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <ObligationLabel obligation={r.obligation} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Pill tone={ANSWER_TONE[r.answer]}>{ANSWER_LABEL[r.answer]}</Pill>
                  </td>
                  <td className="px-4 py-3 align-top text-[12px] text-brand-100/60">
                    {r.source === "scan"
                      ? "Automated scan"
                      : r.source === "user"
                        ? "Self-declared"
                        : "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-[12px] text-brand-100/60">
                    {r.evidenceRef || <span className="text-brand-200/55">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sector obligations beyond Cyber Essentials */}
      {sector && beyond.length > 0 && (
        <>
          <h2 className="mt-12 mb-2 text-xl font-semibold tracking-tight text-white">
            Beyond Cyber Essentials — {sector.name.toLowerCase()}
          </h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-brand-100/80">
            {sector.headline ??
              "Your sector carries duties the Cyber Essentials mark does not cover. These sit alongside the nine measures, not instead of them."}
          </p>
          <Card className="overflow-hidden">
            {beyond.map((o) => (
              <div
                key={o.title}
                className="border-b border-brand-700/30 p-5 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="bad">Not covered by CE</Pill>
                  <span className="font-mono text-[11px] text-brand-400">
                    attaches to {o.measureId}
                  </span>
                </div>
                <p className="mt-2 text-[14px] font-medium text-white">{o.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-brand-100/80">{o.detail}</p>
              </div>
            ))}
            <div className="bg-ink-950/45 px-5 py-3.5">
              <p className="text-[12px] leading-relaxed text-brand-100/70">
                {sector.regulator
                  ? `${sector.regulator} is the authority on these, not this tool. Confirm current requirements before relying on any of it.`
                  : "Confirm current requirements with the relevant authority before relying on any of it."}
                {sector.sources.length > 0 && (
                  <>
                    {" "}
                    {sector.sources.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 && " · "}
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-brand-300 underline-offset-2 hover:underline"
                        >
                          {s.label}
                        </a>
                      </span>
                    ))}
                  </>
                )}
              </p>
            </div>
          </Card>
        </>
      )}

      {/* Hand-off */}
      <h2 className="mt-12 mb-4 text-xl font-semibold tracking-tight text-white">
        Hand-off to certification
      </h2>
      <Card className="p-6">
        <ol className="space-y-4">
          {CERTIFICATION_STEPS.map((s, i) => {
            const done = i === 0 && readiness.certifiable;
            return (
              <li key={s.title} className="flex gap-4">
                <span
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums ${
                    done ? "bg-emerald-500 text-oncolor-dark" : "bg-ink-800 text-brand-100/80"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-white">{s.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-brand-100/60">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {gaps.length > 0 && (
          <p className="mt-6 border-t border-brand-700/30 pt-4 text-[13px] text-brand-100/60">
            {gaps.filter((g) => g.blocksCertification).length} mandatory clauses stand between
            you and step one.{" "}
            <a href="/prioritise" className="text-brand-400 underline-offset-2 hover:underline">
              See them in priority order
            </a>
            .
          </p>
        )}
      </Card>
    </div>
  );
}

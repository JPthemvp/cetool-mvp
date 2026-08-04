"use client";

import { useMemo, useState } from "react";
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
import { TIERS, ceCoverageOfTier } from "@/lib/ct-framework";
import { CERTIFICATION_STEPS } from "@/lib/guidance";
import { SECTOR_BY_ID, extraObligations } from "@/lib/sectors";
import { ObligationLabel } from "@/components/detail";
import { buildReport, reportFilename, reportToJson, reportToXlsx } from "@/lib/report";

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

  const rows = useMemo(() => buildResultRows(answers, scope), [answers, scope]);
  const generatedAt = new Date().toLocaleString("en-SG");

  const shown = showAll ? rows : rows.filter((r) => r.answer !== "yes" && r.answer !== "na");

  const supporter = ceCoverageOfTier("supporter");
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
          eyebrow="Capability 05 · Prepare"
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
        eyebrow="Capability 05 · Prepare"
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

        <div className="mt-6 border-t border-brand-700/30 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
            For the certification body
          </p>
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
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-brand-700/30 pt-5">
          <Button variant="ghost" onClick={() => download("csv")}>
            Results tab only (CSV)
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </Card>

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

      {/* Forward look to Cyber Trust */}
      <h2 className="mt-12 mb-4 text-xl font-semibold tracking-tight text-white">
        What this earns you towards Cyber Trust
      </h2>
      <Card className="p-6">
        <p className="max-w-3xl text-[13px] leading-relaxed text-brand-100/80">
          CSA&apos;s own tier table marks eight Cyber Trust domains as already covered by
          Cyber Essentials measures. At the Supporter tier that is{" "}
          <span className="font-semibold text-white/90">
            {supporter.covered} of {supporter.total} domains
          </span>{" "}
          — so finishing this assessment does most of the work for the next mark, not just
          this one.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {TIERS.map((t) => {
            const cov = ceCoverageOfTier(t.id);
            const pct = Math.round((cov.covered / cov.total) * 100);
            return (
              <div key={t.id} className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-4">
                <p className="text-[13px] font-semibold text-white/90">{t.name}</p>
                <p className="mt-0.5 text-[11px] text-brand-200/70">Tier {t.level}</p>
                <p className="mt-2 text-lg font-semibold tabular-nums text-white">
                  {cov.covered}
                  <span className="text-sm text-brand-200/70">/{cov.total}</span>
                </p>
                <div className="mt-2">
                  <Meter value={pct} tone={pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad"} />
                </div>
                <p className="mt-2 text-[11px] leading-snug text-brand-200/70">
                  {cov.remaining.length} domains to add
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 border-t border-brand-700/30 pt-4">
          <p className="text-[11px] uppercase tracking-wide text-brand-200/70">
            Still to add for Supporter
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {supporter.remaining.map((d) => (
              <Pill key={d.n}>
                {d.n}. {d.name}
              </Pill>
            ))}
          </div>
        </div>
      </Card>

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

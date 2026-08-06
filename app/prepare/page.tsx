"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/components/store";
import { Button, Card, Meter, Pill, SectionTitle, Stat, inputCls } from "@/components/ui";
import {
  CATEGORIES,
  CLAUSES_BY_MEASURE,
  applicableClauses,
  measuresInCategory,
  type Clause,
  type MeasureId,
} from "@/lib/ce-framework";
import { ANSWER_LABEL, type AnswerValue } from "@/lib/assessment";
import { suggestionNote } from "@/lib/mapping";
import { helpFor } from "@/lib/readiness";
import { SECTOR_BY_ID, obligationsForMeasure } from "@/lib/sectors";
import { ClauseCode, Drilldown, ObligationLabel, Simple, Technical } from "@/components/detail";
import { coverageStats } from "@/lib/coverage";
import { PATHWAY_BY_ID, humanOnlyClauses, pathwayCoverage } from "@/lib/pathways";
import { answerabilityOf } from "@/lib/answerability";
import { PLAIN_CATEGORY, plainMeasure } from "@/lib/plain";
import { resourcesForMeasure, audienceLabel } from "@/lib/csa-resources";
import { quizToPlainText, quizToKahootCsv, quizToTrackingCsvTemplate } from "@/lib/employee-quiz";

const OPTIONS: Array<{ value: AnswerValue; label: string; tone: string }> = [
  { value: "yes", label: "Yes", tone: "data-[on=true]:bg-emerald-500 data-[on=true]:text-oncolor-dark" },
  { value: "partial", label: "Partly", tone: "data-[on=true]:bg-amber-500 data-[on=true]:text-oncolor-dark" },
  { value: "no", label: "No", tone: "data-[on=true]:bg-csa-500 data-[on=true]:text-oncolor" },
  { value: "unsure", label: "Not sure", tone: "data-[on=true]:bg-brand-500 data-[on=true]:text-oncolor" },
  { value: "na", label: "N/A", tone: "data-[on=true]:bg-brand-700 data-[on=true]:text-oncolor" },
];

// ── Employee Quiz Download Panel (shown inside clause A.1.4(a)) ──────────────

const QUIZ_FORMATS = [
  {
    id: "plain",
    label: "Plain Text",
    sublabel: "SurveyMonkey · Google Forms · Microsoft Forms",
    ext: "txt",
    mime: "text/plain",
    generate: quizToPlainText,
  },
  {
    id: "kahoot",
    label: "Kahoot CSV",
    sublabel: "Import directly into Kahoot",
    ext: "csv",
    mime: "text/csv",
    generate: quizToKahootCsv,
  },
  {
    id: "tracking",
    label: "Score Tracker",
    sublabel: "Excel / Google Sheets template",
    ext: "csv",
    mime: "text/csv",
    generate: quizToTrackingCsvTemplate,
  },
] as const;

function EmployeeQuizPanel() {
  const [open, setOpen] = useState(false);

  function download(fmt: typeof QUIZ_FORMATS[number]) {
    const content = fmt.generate();
    const blob = new Blob([content], { type: `${fmt.mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `csa-employee-cybersecurity-quiz-${fmt.id}.${fmt.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-3 rounded-xl border border-brand-500/30 bg-brand-700/10 p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-brand-200">
            📋 CSA Employee Cybersecurity Quiz — ready to use
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-brand-100/60">
            14 questions from the official SG Cyber Safe quiz. Download for SurveyMonkey, Google Forms,
            Microsoft Forms, Kahoot, or Mentimeter.
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-[11px] text-brand-200/50">
          {open ? "▲ Collapse" : "▼ Expand"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* What's inside */}
          <div className="rounded-lg border border-ink-700/60 bg-ink-900/60 p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
              Quiz overview — 14 questions, 4 topics
            </p>
            <ul className="space-y-1 text-[12px] leading-relaxed text-brand-100/80">
              <li className="flex gap-2"><span className="text-csa-400 shrink-0">Tip 1</span> Protect yourself from phishing (Q1–4)</li>
              <li className="flex gap-2"><span className="text-csa-400 shrink-0">Tip 2</span> Set strong passphrases and protect them (Q5–9)</li>
              <li className="flex gap-2"><span className="text-csa-400 shrink-0">Tip 3</span> Protect your corporate / personal devices (Q10–12)</li>
              <li className="flex gap-2"><span className="text-csa-400 shrink-0">Tip 4</span> Report cyber incidents (Q13–14)</li>
            </ul>
            <p className="mt-2 text-[11px] text-brand-200/50">
              Source: <a href="https://www.surveymonkey.com/r/sgcybersafe-employee" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">CSA SG Cyber Safe Employee Quiz</a> · © Cyber Security Agency of Singapore
            </p>
          </div>

          {/* Download buttons */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
              Download for your platform
            </p>
            <div className="flex flex-wrap gap-2">
              {QUIZ_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => download(fmt)}
                  className="rounded-lg border border-ink-600/60 bg-ink-800 px-3 py-2 text-left transition hover:border-brand-500/50 hover:bg-ink-750"
                >
                  <p className="text-[12px] font-semibold text-white">{fmt.label}</p>
                  <p className="text-[11px] text-brand-100/60">{fmt.sublabel}</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-brand-200/50">
              Mentimeter: use the plain text file — question type &quot;Quiz (Competition)&quot; or &quot;Multiple Choice&quot;, copy each question manually.
            </p>
          </div>

          {/* Tracking recommendation */}
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 p-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
              📊 Recommended: track scores in a database
            </p>
            <p className="text-[12px] leading-relaxed text-brand-50">
              Assessors may ask for evidence that training was completed and assessed. A simple spreadsheet
              with the fields below satisfies clause A.1.4(a) and supports clause A.1.4(e) (annual refresh).
            </p>
            <div className="mt-2.5 overflow-x-auto rounded border border-ink-700/60 bg-ink-950/60">
              <table className="w-full min-w-[520px] text-left text-[11px]">
                <thead>
                  <tr className="border-b border-ink-700/60">
                    {["Employee Name", "Department", "Date Taken", "Score (/14)", "Pass? (≥70%)", "Retake Date"].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold text-brand-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-brand-100/60 italic">
                    <td className="px-3 py-1.5">Tan Ah Hock</td>
                    <td className="px-3 py-1.5">Logistics</td>
                    <td className="px-3 py-1.5">01/08/2026</td>
                    <td className="px-3 py-1.5">12 / 14</td>
                    <td className="px-3 py-1.5 text-emerald-400">Yes</td>
                    <td className="px-3 py-1.5">—</td>
                  </tr>
                  <tr className="border-t border-ink-800/40 text-brand-100/60 italic">
                    <td className="px-3 py-1.5">Lim Mei Ling</td>
                    <td className="px-3 py-1.5">Finance</td>
                    <td className="px-3 py-1.5">01/08/2026</td>
                    <td className="px-3 py-1.5">8 / 14</td>
                    <td className="px-3 py-1.5 text-csa-400">No</td>
                    <td className="px-3 py-1.5">15/08/2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-brand-100/70">
              <li className="flex gap-1.5"><span className="text-amber-400 shrink-0">·</span> Pass threshold: <strong className="text-white">10/14 (≥70%)</strong> — staff scoring below should receive targeted training and retest.</li>
              <li className="flex gap-1.5"><span className="text-amber-400 shrink-0">·</span> Run the quiz on onboarding <strong className="text-white">and</strong> at least once annually thereafter (clause A.1.4(e)).</li>
              <li className="flex gap-1.5"><span className="text-amber-400 shrink-0">·</span> Keep completion records for <strong className="text-white">at least 2 years</strong> as evidence for your Cyber Essentials assessor.</li>
              <li className="flex gap-1.5"><span className="text-amber-400 shrink-0">·</span> For incidents, staff should report to SingCERT: <a href="https://www.csa.gov.sg/singcert/reporting" target="_blank" rel="noreferrer" className="text-brand-300 underline-offset-2 hover:underline">csa.gov.sg/singcert/reporting</a></li>
            </ul>
            <button
              onClick={() => download(QUIZ_FORMATS[2])}
              className="mt-3 rounded-lg border border-amber-500/30 bg-amber-600/15 px-3 py-1.5 text-[11px] font-medium text-amber-300 transition hover:bg-amber-600/25"
            >
              ↓ Download score tracker template (CSV)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const AUDIENCE_COLOUR: Record<string, string> = {
  employees: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
  "it-teams": "bg-sky-700/30 text-sky-200 ring-sky-500/40",
  "business-owners": "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  general: "bg-brand-500/20 text-brand-200 ring-brand-500/30",
};

function ClauseRow({ clause, measureId }: { clause: Clause; measureId: string }) {
  const { answers, setAnswer, signals, confirmations } = useStore();
  const confirmed = confirmations.get(clause.id);
  const answerability = answerabilityOf(clause.id);
  const answer = answers[clause.id] ?? { value: "unanswered" as AnswerValue, source: "unanswered" as const };
  const signal = signals.get(clause.id);
  const help = helpFor(clause.id);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const resources = resourcesForMeasure(measureId);

  // Scan-answered clauses: if the scan confirmed "yes", show it as auto-confirmed
  // without requiring the user to re-click.
  const scanConfirmedYes = answer.source === "scan" && answer.value === "yes";

  return (
    <div className="border-b border-brand-700/30 px-5 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ClauseCode id={clause.id} />
            <ObligationLabel obligation={clause.obligation} />
            {answer.source === "scan" && (
              <Pill tone={scanConfirmedYes ? "good" : "info"}>
                {scanConfirmedYes ? "✓ Verified by scan" : "Flagged by scan"}
              </Pill>
            )}
            <Pill
              tone={
                answerability === "machine"
                  ? "good"
                  : answerability === "mixed"
                    ? "warn"
                    : "neutral"
              }
            >
              {answerability === "human"
                ? "Only you can answer"
                : answerability === "machine"
                  ? "A check can answer this"
                  : "Check assists, you confirm"}
            </Pill>
          </div>

          <p className="mt-2 text-[14px] font-medium leading-snug text-white">
            {clause.question}
          </p>

          <Technical>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-100/60">
              {clause.statement}
            </p>
            {signal && (
              <p
                className={`mt-2 text-[12px] leading-relaxed ${
                  signal.failing.length ? "text-amber-300/90" : "text-emerald-300/80"
                }`}
              >
                {suggestionNote(signal)}
              </p>
            )}
          </Technical>

          {scanConfirmedYes && answer.note && (
            <div className="mt-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/8 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                ✓ Local check passed — please reconfirm across your full estate
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-brand-100/70">{answer.note}</p>
            </div>
          )}

          {confirmed && answer.value !== "yes" && (
            <div className="mt-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                Checked and healthy on {confirmed.computers.length} of {confirmed.total}{" "}
                {confirmed.total === 1 ? "device" : "devices"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-50">
                {confirmed.computers.join(", ")} passed this check. This supports a positive response. Confirm it holds across all devices before answering yes.
              </p>
            </div>
          )}

          {answer.value === "unsure" && help?.notSure && (
            <div className="mt-3 rounded-lg border border-brand-500/35 bg-brand-700/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
                Explanation
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-50">{help.notSure}</p>
            </div>
          )}

          {help && (answer.value === "no" || answer.value === "partial" || answer.value === "unsure") && (
            <div className="mt-2.5 rounded-lg border border-blue-500/30 bg-blue-500/8 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-300">
                Recommended action
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-50">{help.action}</p>
            </div>
          )}
        </div>

        {/* Answer buttons — hidden when scan already confirmed yes */}
        {!scanConfirmedYes && (
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-ink-600/80">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                data-on={answer.value === o.value}
                onClick={() => setAnswer(clause.id, { value: o.value })}
                className={`px-3 py-1.5 text-xs font-semibold text-brand-100/80 transition hover:text-white ${o.tone}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        {scanConfirmedYes && (
          <button
            onClick={() => setAnswer(clause.id, { value: "yes" })}
            className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            title="Override the scan-confirmed answer"
          >
            ✓ Confirmed · Override
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setShowEvidence((s) => !s)}
          className="rounded border border-ink-600/60 bg-ink-800/60 px-2.5 py-1 text-[11px] font-medium text-brand-200/80 transition hover:border-brand-500/40 hover:bg-ink-700/60 hover:text-brand-100"
        >
          {showEvidence ? "Hide references" : "📎 Attach references"}
          {!showEvidence && answer.evidenceRef && (
            <span className="ml-1.5 text-brand-400 normal-case">{answer.evidenceRef}</span>
          )}
        </button>

        {resources.length > 0 && (
          <button
            onClick={() => setShowResources((s) => !s)}
            className="rounded border border-ink-600/60 bg-ink-800/60 px-2.5 py-1 text-[11px] font-medium text-brand-200/80 transition hover:border-brand-500/40 hover:bg-ink-700/60 hover:text-brand-100"
          >
            {showResources ? "Hide resources" : "📚 Show resources"}
          </button>
        )}
      </div>

      {showEvidence && (
        <div className="mt-2.5 rounded-lg border border-ink-700/60 bg-ink-900/60 p-3">
          <p className="text-[11px] uppercase tracking-wide text-brand-200/70">
            What the assessor will ask for
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[13px] text-brand-100/80">
            {clause.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <input
            className={`${inputCls} mt-3`}
            value={answer.evidenceRef ?? ""}
            placeholder="Reference the document — e.g. 'Asset inventory v3, SharePoint/IT'"
            onChange={(e) => setAnswer(clause.id, { evidenceRef: e.target.value })}
          />
        </div>
      )}

      {showResources && resources.length > 0 && (
        <div className="mt-2.5 rounded-lg border border-ink-700/60 bg-ink-900/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-200/70 mb-2">
            CSA Resources for this measure
          </p>
          <ul className="space-y-1.5">
            {resources.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${AUDIENCE_COLOUR[r.audience] ?? AUDIENCE_COLOUR.general}`}
                >
                  {audienceLabel(r.audience)}
                </span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[12px] text-brand-300 underline-offset-2 hover:underline"
                >
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Simple>
        <Drilldown label="View the published requirement">
          <p className="font-mono text-[11px] text-brand-300">
            {clause.id} · {clause.obligation}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-brand-50">
            {clause.statement}
          </p>
          {signal && (
            <p className="mt-2 text-[12px] leading-relaxed text-brand-100/80">
              {suggestionNote(signal)}
            </p>
          )}
        </Drilldown>
      </Simple>

      {/* Employee quiz download — shown only for the training awareness clause */}
      {clause.id === "A.1.4(a)" && <EmployeeQuizPanel />}
    </div>
  );
}

export default function PreparePage() {
  const { readiness, scope, answers, bulkAnswer, prefilledCount, org, pathway, technical } =
    useStore();
  const [openMeasure, setOpenMeasure] = useState<MeasureId | null>("A.1");
  const [obligation, setObligation] = useState<"all" | "shall" | "should">("all");
  // Toggle state for "Met all (testing)" — true means all answered yes
  const [metAllActive, setMetAllActive] = useState(false);
  const sectorName = SECTOR_BY_ID.get(org.sector)?.name ?? "";
  const cov = useMemo(() => coverageStats(), []);
  const activePathway = PATHWAY_BY_ID.get(pathway);
  const pcov = useMemo(() => pathwayCoverage(pathway), [pathway]);
  const humanCount = useMemo(() => humanOnlyClauses().length, []);
  const agentDelta = useMemo(
    () =>
      pathwayCoverage("agent-assisted").preAnswered +
      pathwayCoverage("agent-assisted").evidenced -
      (pathwayCoverage("self-assess").preAnswered + pathwayCoverage("self-assess").evidenced),
    [],
  );

  const inScope = useMemo(
    () => new Set(applicableClauses(scope).map((c) => c.id)),
    [scope],
  );

  const scoreOf = (id: MeasureId) => readiness.measures.find((m) => m.measureId === id);

  function handleMetAll() {
    if (metAllActive) {
      // Reverse: mark all as "no" so they appear as gaps again
      bulkAnswer([...inScope], "no");
      setMetAllActive(false);
    } else {
      bulkAnswer([...inScope], "yes");
      setMetAllActive(true);
    }
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 04 · Assess"
        title="The Cyber Essentials self-assessment"
        lead="Answered against the published clauses, with anything the local device check or web scan could verify already filled in. Passing checks are auto-filled as met — please review and confirm each one holds across your full estate."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Answered" value={`${readiness.completion}%`} hint="% of applicable clauses you or a scan have answered" />
        <Stat label="Weighted score" value={`${readiness.percent}%`} hint="Yes = full credit, Partial = half credit" />
        <Stat
          label="Mandatory gaps"
          value={readiness.blocking}
          tone={readiness.blocking === 0 ? "good" : "bad"}
          hint="Shall clauses not yet marked yes or n/a — these block certification"
        />
        <Stat
          label="Auto-filled clauses"
          value={prefilledCount}
          hint="Filled by web scan or local device check — review each one"
        />
      </div>

      {/* Pathway coverage summary */}
      <Card className="mt-6 border-brand-500/30 bg-brand-700/12 p-5">
        <p className="text-sm font-semibold text-brand-300">
          {activePathway?.name}: what is answered for you, and what is not
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-ink-950/40 p-3">
            <p className="text-lg font-semibold tabular-nums text-emerald-300">
              {pcov.preAnswered}
            </p>
            <p className="text-[12px] leading-snug text-brand-100/80">
              answered by a check — review rather than retype
            </p>
          </div>
          <div className="rounded-lg bg-ink-950/40 p-3">
            <p className="text-lg font-semibold tabular-nums text-amber-300">
              {pcov.evidenced}
            </p>
            <p className="text-[12px] leading-snug text-brand-100/80">
              evidence gathered, you confirm it holds everywhere
            </p>
          </div>
          <div className="rounded-lg bg-ink-950/40 p-3">
            <p className="text-lg font-semibold tabular-nums text-white">{pcov.toAnswer}</p>
            <p className="text-[12px] leading-snug text-brand-100/80">
              only you can answer — people and process
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-brand-50">
          {humanCount} of the {cov.total} clauses are about how your organisation behaves:
          whether staff were trained, whether the backup was ever restored, who approves a
          new account. No software sees those on either pathway — which is why the
          questions exist rather than being an admission of a gap.
        </p>
        {pathway === "self-assess" && (
          <p className="mt-2 text-[12px] leading-relaxed text-brand-100/70">
            Running the device check would move roughly {agentDelta} more clauses out of
            &quot;answer from memory&quot; and into &quot;answered with evidence&quot;.
          </p>
        )}
      </Card>

      <Card className="mt-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-brand-50">{readiness.verdict}</p>
            <div className="mt-3">
              <Meter
                value={readiness.percent}
                tone={readiness.blocking === 0 ? "good" : readiness.percent > 60 ? "warn" : "bad"}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "All clauses"],
                ["shall", "Requirements"],
                ["should", "Recommendations"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setObligation(key)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  obligation === key
                    ? "bg-csa-600 text-oncolor"
                    : "bg-ink-800 text-brand-200/70 hover:text-brand-100"
                }`}
              >
                {label}
              </button>
            ))}

            <span className="h-4 w-px bg-ink-600/60" />

            <button
              onClick={handleMetAll}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition ${
                metAllActive
                  ? "bg-emerald-600/20 text-emerald-300 ring-emerald-500/30 hover:bg-emerald-600/30"
                  : "bg-amber-600/20 text-amber-300 ring-amber-500/30 hover:bg-amber-600/30"
              }`}
              title={metAllActive ? "Re-click to un-answer all clauses" : "Testing only — marks all in-scope clauses as Yes"}
            >
              ! {metAllActive ? "Un-met all (testing)" : "Met all (testing)"}
            </button>
          </div>
        </div>
      </Card>

      <div className="mt-8 space-y-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-white">
              {technical ? cat.name : (PLAIN_CATEGORY[cat.id] ?? cat.name)}
            </h2>

            <div className="space-y-3">
              {measuresInCategory(cat.id).map((m) => {
                const score = scoreOf(m.id);
                const isOpen = openMeasure === m.id;
                let clauses = CLAUSES_BY_MEASURE[m.id].filter((c) => inScope.has(c.id));
                if (obligation === "shall") {
                  clauses = clauses.filter((c) => c.obligation === "shall");
                } else if (obligation === "should") {
                  clauses = clauses.filter((c) => c.obligation === "should");
                }
                const allIds = CLAUSES_BY_MEASURE[m.id]
                  .filter((c) => inScope.has(c.id))
                  .map((c) => c.id);
                const measureResources = resourcesForMeasure(m.id);

                return (
                  <Card key={m.id} className="overflow-hidden">
                    <button
                      onClick={() => setOpenMeasure(isOpen ? null : m.id)}
                      className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-ink-850/50"
                    >
                      <span className="font-mono text-xs text-brand-400">{m.id}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-white">
                          {technical ? m.name : plainMeasure(m.id).name}
                        </span>
                        {!technical && (
                          <span className="mt-0.5 block text-[12px] leading-relaxed text-brand-100/70">
                            {plainMeasure(m.id).blurb}
                          </span>
                        )}
                        {score && (
                          <span className="mt-1 block text-[13px] text-brand-100/60">
                            {score.met} met · {score.partial} partial · {score.notMet} not met ·{" "}
                            {score.total - score.answered} unanswered
                          </span>
                        )}
                      </span>
                      {score && (
                        <span className="w-24 shrink-0 text-right">
                          <span className="block text-sm font-semibold tabular-nums text-white/90">
                            {score.percent}%
                          </span>
                          <span className="mt-1.5 block">
                            <Meter
                              value={score.percent}
                              tone={
                                score.blocking === 0
                                  ? "good"
                                  : score.percent > 60
                                    ? "warn"
                                    : "bad"
                              }
                            />
                          </span>
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <div>
                        {obligationsForMeasure(org.sector, m.id).map((o) => (
                          <div
                            key={o.title}
                            className="border-t border-csa-500/25 bg-csa-500/8 px-5 py-3.5"
                          >
                            <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-csa-300">
                              {o.beyondCe ? "Beyond Cyber Essentials" : "Sector emphasis"}
                              <span className="font-normal normal-case text-brand-100/70">
                                {sectorName}
                              </span>
                            </p>
                            <p className="mt-1.5 text-[13px] font-medium text-white">{o.title}</p>
                            <p className="mt-1 text-[13px] leading-relaxed text-brand-100/80">
                              {o.detail}
                            </p>
                          </div>
                        ))}

                        {/* Measure-level CSA resources panel */}
                        {measureResources.length > 0 && (
                          <div className="border-t border-brand-700/20 bg-ink-950/30 px-5 py-3.5">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
                              CSA Resources
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {measureResources.map((r, i) => (
                                <a
                                  key={i}
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition hover:opacity-80 ${AUDIENCE_COLOUR[r.audience] ?? AUDIENCE_COLOUR.general}`}
                                >
                                  <span className="opacity-60">{audienceLabel(r.audience)}</span>
                                  <span>·</span>
                                  <span>{r.label}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 border-t border-brand-700/30 bg-ink-950/45 px-5 py-2.5">
                          <span className="mr-auto text-[11px] uppercase tracking-wide text-brand-200/70">
                            Set all in this measure
                          </span>
                          {(["yes", "no"] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => bulkAnswer(allIds, v)}
                              className="rounded bg-ink-800 px-2.5 py-1 text-[11px] font-medium text-brand-100/80 transition hover:text-white"
                            >
                              {ANSWER_LABEL[v]}
                            </button>
                          ))}
                        </div>
                        {clauses.length === 0 ? (
                          <p className="px-5 py-6 text-center text-[13px] text-brand-200/70">
                            Every clause in this measure is answered.
                          </p>
                        ) : (
                          clauses.map((c) => <ClauseRow key={c.id} clause={c} measureId={m.id} />)
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

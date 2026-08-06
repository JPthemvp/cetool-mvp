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

const OPTIONS: Array<{ value: AnswerValue; label: string; tone: string }> = [
  { value: "yes", label: "Yes", tone: "data-[on=true]:bg-emerald-500 data-[on=true]:text-oncolor-dark" },
  { value: "partial", label: "Partly", tone: "data-[on=true]:bg-amber-500 data-[on=true]:text-oncolor-dark" },
  { value: "no", label: "No", tone: "data-[on=true]:bg-csa-500 data-[on=true]:text-oncolor" },
  // A real answer, not a cop-out. An unsure SME that is forced to pick Yes/No
  // guesses, and a guessed Yes travels all the way to the assessor unchallenged.
  { value: "unsure", label: "Not sure", tone: "data-[on=true]:bg-brand-500 data-[on=true]:text-oncolor" },
  { value: "na", label: "N/A", tone: "data-[on=true]:bg-brand-700 data-[on=true]:text-oncolor" },
];

function ClauseRow({ clause }: { clause: Clause }) {
  const { answers, setAnswer, signals, confirmations } = useStore();
  const confirmed = confirmations.get(clause.id);
  const answerability = answerabilityOf(clause.id);
  const answer = answers[clause.id] ?? { value: "unanswered" as AnswerValue, source: "unanswered" as const };
  const signal = signals.get(clause.id);
  const help = helpFor(clause.id);
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <div className="border-b border-brand-700/30 px-5 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ClauseCode id={clause.id} />
            <ObligationLabel obligation={clause.obligation} />
            {answer.source === "scan" && <Pill tone="info">Answered by the scan</Pill>}
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

          {/* Evidence in the SME's favour. The scan can only ever answer "no", so
              without this the tool would be a device that lowers your score every
              time you use its best feature. */}
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

          {/* "Not sure" explains rather than penalises. */}
          {answer.value === "unsure" && help?.notSure && (
            <div className="mt-3 rounded-lg border border-brand-500/35 bg-brand-700/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
                Explanation
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-50">{help.notSure}</p>
            </div>
          )}

          {/* The action item, shown once we know it is a gap. */}
          {help && (answer.value === "no" || answer.value === "partial" || answer.value === "unsure") && (
            <div className="mt-2.5 rounded-lg border border-csa-500/30 bg-csa-500/8 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-csa-300">
                Recommended action
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-brand-50">{help.action}</p>
            </div>
          )}
        </div>

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
      </div>

      <div className="mt-3">
        <button
          onClick={() => setShowEvidence((s) => !s)}
          className="text-[11px] uppercase tracking-wide text-brand-200/70 transition hover:text-brand-100/80"
        >
          {showEvidence ? "Hide" : "Evidence"} ·{" "}
          {answer.evidenceRef ? (
            <span className="text-brand-400 normal-case">{answer.evidenceRef}</span>
          ) : (
            <span className="normal-case text-brand-200/70">none recorded</span>
          )}
        </button>

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

        {/* The formal wording, on demand, without switching the whole page. */}
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
      </div>
    </div>
  );
}

export default function PreparePage() {
  const { readiness, scope, answers, bulkAnswer, prefilledCount, org, pathway, technical } =
    useStore();
  const [openMeasure, setOpenMeasure] = useState<MeasureId | null>("A.1");
  const [hideAnswered, setHideAnswered] = useState(false);
  const [focus, setFocus] = useState<"all" | "human" | "machine">("all");
  const [obligation, setObligation] = useState<"all" | "shall" | "should">("all");
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

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 04 · Assess"
        title="The Cyber Essentials self-assessment"
        lead="Answered against the published clauses, with anything the scan could verify already filled in. Only negatives are pre-filled — a control we cannot see from outside still needs your confirmation, which is what keeps the submission defensible."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Completion" value={`${readiness.completion}%`} />
        <Stat label="Weighted score" value={`${readiness.percent}%`} hint="Partial counts as half" />
        <Stat
          label="Mandatory gaps"
          value={readiness.blocking}
          tone={readiness.blocking === 0 ? "good" : "bad"}
        />
        <Stat
          label="Pre-filled from scan"
          value={prefilledCount}
          hint="Answered without you typing"
        />
      </div>

      {/* Say the split out loud, at the point they are about to feel it. */}
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
            <label className="flex cursor-pointer items-center gap-2 text-xs text-brand-100/80">
              <input
                type="checkbox"
                checked={hideAnswered}
                onChange={(e) => setHideAnswered(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-ink-600/80 bg-ink-850 accent-[#2f7dbf]"
              />
              Only unanswered
            </label>

            <span className="h-4 w-px bg-ink-600/60" />

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

            {(
              [
                ["all", "All"],
                ["human", "People & process"],
                ["machine", "Technical"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFocus(key)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  focus === key
                    ? "bg-brand-600 text-oncolor"
                    : "bg-ink-800 text-brand-200/70 hover:text-brand-100"
                }`}
              >
                {label}
              </button>
            ))}

            <span className="h-4 w-px bg-ink-600/60" />

            <button
              onClick={() => bulkAnswer([...inScope], "yes")}
              className="rounded-lg bg-amber-600/20 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30 transition hover:bg-amber-600/30"
              title="Testing only — marks all in-scope clauses as Yes"
            >
              ⚡ Met all (testing)
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
                if (hideAnswered) {
                  clauses = clauses.filter(
                    (c) => (answers[c.id]?.value ?? "unanswered") === "unanswered",
                  );
                }
                if (obligation === "shall") {
                  clauses = clauses.filter((c) => c.obligation === "shall");
                } else if (obligation === "should") {
                  clauses = clauses.filter((c) => c.obligation === "should");
                }
                if (focus === "human") {
                  clauses = clauses.filter((c) => answerabilityOf(c.id) === "human");
                } else if (focus === "machine") {
                  clauses = clauses.filter((c) => answerabilityOf(c.id) !== "human");
                }
                const allIds = CLAUSES_BY_MEASURE[m.id]
                  .filter((c) => inScope.has(c.id))
                  .map((c) => c.id);

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
                          clauses.map((c) => <ClauseRow key={c.id} clause={c} />)
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

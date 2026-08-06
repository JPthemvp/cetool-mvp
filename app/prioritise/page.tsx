"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/components/store";
import { Card, EmptyState, Meter, Pill, SectionTitle, Stat } from "@/components/ui";
import { BAND_STYLE, EFFORT_LABEL, THREATS, quickWins, type Band, type Gap } from "@/lib/risk";
import { helpFor } from "@/lib/readiness";
import { ClauseCode, Drilldown, ObligationLabel, Simple, Technical } from "@/components/detail";
import { plainMeasure, PLAIN_CATEGORY } from "@/lib/plain";
import { CATEGORIES, CLAUSES_BY_MEASURE, measuresInCategory } from "@/lib/ce-framework";
import { GUIDANCE_BY_MEASURE } from "@/lib/guidance";
import type { MeasureId } from "@/lib/ce-framework";

// ── Gap card (priority list) ──────────────────────────────────────────────────

function GapCard({ gap, rank }: { gap: Gap; rank: number }) {
  const [open, setOpen] = useState(false);
  const band = BAND_STYLE[gap.band];
  const help = helpFor(gap.clause.id);
  const { technical } = useStore();

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-ink-850/50"
      >
        <span className="mt-0.5 w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-brand-200/70">
          {rank}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${band.className}`}
            >
              {band.label}
            </span>
            <ClauseCode id={gap.clause.id} />
            {gap.blocksCertification && <Pill tone="bad">Blocks certification</Pill>}
            {gap.signal?.failing.length ? (
              <Pill tone="info">Observed externally</Pill>
            ) : gap.evidenced ? (
              <Pill tone="warn">Confirmed not in place</Pill>
            ) : (
              <Pill>Not yet answered</Pill>
            )}
          </span>

          <span className="mt-2 block text-[15px] font-semibold text-white">
            {gap.clause.title}
          </span>
          <span className="mt-1 block text-[13px] leading-relaxed text-brand-100/60">
            {technical ? gap.measureName : plainMeasure(gap.clause.measureId).name}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block text-[11px] text-brand-100/80">
            {EFFORT_LABEL[gap.effort]}
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-brand-700/30 bg-ink-950/45 p-5 text-[13px] leading-relaxed">
          <Technical>
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-brand-200/70">
                The requirement
              </p>
              <p className="text-brand-50">{gap.clause.statement}</p>
            </div>
          </Technical>

          {help && (
            <div className="rounded-lg border border-csa-500/30 bg-csa-500/8 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-csa-300">
                Recommended action
              </p>
              <p className="text-brand-50">{help.action}</p>
            </div>
          )}

          {gap.answer === "unsure" && help?.notSure && (
            <div className="rounded-lg border border-brand-500/35 bg-brand-700/20 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
                Explanation
              </p>
              <p className="text-brand-50">{help.notSure}</p>
            </div>
          )}

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-brand-200/70">
              Basis for this ranking
            </p>
            <p className="text-brand-100/80">{gap.why}</p>
          </div>

          <Technical>
            <div className="rounded-lg border border-ink-700/60 bg-ink-900 p-3">
              <p className="text-[11px] uppercase tracking-wide text-brand-200/70">
                How this was ranked
              </p>
              <p className="mt-1 text-brand-100/80">
                Ordered by how often the weakness is exploited against organisations
                like yours, weighed against what it would cost you. Those inputs are
                expert judgement on a coarse scale, not a measurement, so the tool shows
                you the ordering and the reasoning rather than a number that would imply
                more precision than exists.
              </p>
              <p className="mt-2 text-[12px] text-brand-200/70">
                Effort: {EFFORT_LABEL[gap.effort]}
              </p>
            </div>
          </Technical>

          {gap.threats.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-brand-200/70">
                Threats this enables
              </p>
              <div className="space-y-1.5">
                {gap.threats.map((t) => (
                  <p key={t} className="text-brand-100/80">
                    <span className="font-medium text-brand-50">{THREATS[t].name}</span> —{" "}
                    {THREATS[t].note}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Technical>
            {gap.signal?.failing.length ? (
              <div className="rounded-lg border border-ink-700/60 bg-ink-900/60 p-3">
                <p className="mb-1.5 text-[11px] uppercase tracking-wide text-brand-200/70">
                  External evidence
                </p>
                {gap.signal.failing.map((fi) => (
                  <p key={fi.checkId} className="text-brand-100/80">
                    {fi.title}
                    {fi.evidence && (
                      <span className="ml-1.5 font-mono text-[11px] text-brand-200/70">
                        {fi.evidence}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            ) : null}
          </Technical>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-brand-200/70">
              Evidence required at assessment
            </p>
            <ul className="list-inside list-disc space-y-0.5 text-brand-100/80">
              {gap.clause.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>

          <Simple>
            <Drilldown label="View the published requirement">
              <p className="font-mono text-[11px] text-brand-300">
                {gap.clause.id} · {gap.clause.obligation}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-brand-50">
                {gap.clause.statement}
              </p>
            </Drilldown>
          </Simple>
        </div>
      )}
    </Card>
  );
}

// ── Measure accordion (guide) ─────────────────────────────────────────────────

function MeasureGuide() {
  const { readiness, technical } = useStore();
  const [open, setOpen] = useState<MeasureId | null>(null);

  const scoreOf = (id: MeasureId) => readiness.measures.find((m) => m.measureId === id);

  return (
    <div className="space-y-10">
      {CATEGORIES.map((cat) => (
        <section key={cat.id}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold tracking-tight text-white">
              {technical ? cat.name : (PLAIN_CATEGORY[cat.id] ?? cat.name)}
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-brand-100/60">
              {cat.blurb}
            </p>
          </div>

          <div className="space-y-3">
            {measuresInCategory(cat.id).map((m) => {
              const clauses = CLAUSES_BY_MEASURE[m.id];
              const guidance = GUIDANCE_BY_MEASURE.get(m.id);
              const score = scoreOf(m.id);
              const isOpen = open === m.id;
              const mandatory = clauses.filter((c) => c.obligation === "shall").length;

              return (
                <Card key={m.id} className="overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : m.id)}
                    className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-ink-850/50"
                  >
                    <span className="mt-0.5 shrink-0">
                      <ClauseCode id={m.id} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-white">
                        {technical ? m.name : plainMeasure(m.id).name}
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-brand-100/60">
                        {technical ? m.tagline : plainMeasure(m.id).blurb}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        <Pill>{clauses.length} clauses</Pill>
                        <Pill>{mandatory} mandatory</Pill>
                      </span>
                    </span>
                    {score && score.answered > 0 && (
                      <span className="w-28 shrink-0 text-right">
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
                        {score.blocking > 0 && (
                          <span className="mt-1.5 block text-[11px] text-csa-400">
                            {score.blocking} mandatory open
                          </span>
                        )}
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-brand-700/30 bg-ink-950/45 p-5">
                      <p className="text-[13px] leading-relaxed text-brand-100/80">
                        {m.objective}
                      </p>

                      {guidance && (
                        <div className="mt-5">
                          <h4 className="text-[11px] uppercase tracking-wide text-brand-200/70">
                            What to do, in this order
                          </h4>
                          <ol className="mt-2.5 space-y-2">
                            {guidance.steps.map((s, i) => (
                              <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-800 text-[11px] font-semibold tabular-nums text-brand-100/80">
                                  {i + 1}
                                </span>
                                <span className="text-brand-50">{s}</span>
                              </li>
                            ))}
                          </ol>

                          <div className="mt-4 flex flex-wrap gap-4 border-t border-brand-700/30 pt-4 text-[12px]">
                            <a
                              href={guidance.toolkit.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-brand-400 underline-offset-2 hover:underline"
                            >
                              {guidance.toolkit.label} &#x2197;
                            </a>
                            {guidance.benchmark && (
                              <span className="text-brand-100/60">
                                Baseline: {guidance.benchmark}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        <h4 className="text-[11px] uppercase tracking-wide text-brand-200/70">
                          Clauses in this measure
                        </h4>
                        <div className="mt-2.5 space-y-2">
                          {clauses.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-lg border border-ink-700/60 bg-ink-900/60 p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <ClauseCode id={c.id} />
                                <ObligationLabel obligation={c.obligation} />
                                {c.conditional && (
                                  <Pill tone="info">if {c.conditional} in scope</Pill>
                                )}
                              </div>
                              <p className="mt-1.5 text-[13px] font-medium text-white/90">
                                {c.title}
                              </p>
                              <Technical>
                                <p className="mt-1 text-[13px] leading-relaxed text-brand-100/60">
                                  {c.statement}
                                </p>
                              </Technical>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "gaps" | "guide";

export default function PrioritisePage() {
  const { gaps, readiness, ready } = useStore();
  const [filter, setFilter] = useState<"all" | "blocking" | "quick">("all");
  const [tab, setTab] = useState<Tab>("gaps");

  const wins = useMemo(() => quickWins(gaps), [gaps]);

  const shown = useMemo(() => {
    if (filter === "blocking") return gaps.filter((g) => g.blocksCertification);
    if (filter === "quick") return wins;
    return gaps;
  }, [filter, gaps, wins]);

  const counts = useMemo(() => {
    const c: Record<Band, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const g of gaps) c[g.band]++;
    return c;
  }, [gaps]);

  if (ready && readiness.completion === 0 && gaps.length === 0) {
    return (
      <div>
        <SectionTitle
          eyebrow="Capability 03 · Gap Analysis"
          title="Gaps ranked by what they would actually cost you"
        />
        <EmptyState
          title="Nothing to prioritise yet"
          body="Run a scan or start the self-assessment. Once there are answers, this page orders every gap by likelihood times impact, and separates the ones you can close this afternoon."
          action={{ label: "Go to Discover", href: "/discover" }}
        />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 03 · Gap Analysis"
        title="Gaps ranked by what they would actually cost you"
        lead="Ordered by likelihood times impact, with anything blocking certification pulled to the top. Switch to the Guide tab to see what each measure asks for and what to do about it."
      />

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-xl border border-ink-700/60 bg-ink-900/50 p-1">
        {(
          [
            ["gaps", "Priority list"],
            ["guide", "Measure guide"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-brand-700/60 text-white shadow"
                : "text-brand-100/70 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "gaps" && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Open gaps" value={gaps.length} />
            <Stat
              label="Blocking certification"
              value={readiness.blocking}
              tone={readiness.blocking === 0 ? "good" : "bad"}
              hint="Unmet mandatory clauses"
            />
            <Stat
              label="Evidenced gaps"
              value={gaps.filter((g) => g.evidenced).length}
              tone="warn"
              hint="Observed or confirmed, not just unanswered"
            />
            <Stat label="Quick wins" value={wins.length} tone="good" hint="High risk, under a day" />
          </div>

          {wins.length > 0 && (
            <Card className="mt-6 border-emerald-500/25 bg-emerald-500/5 p-5">
              <h3 className="text-sm font-semibold text-emerald-300">
                Recommended starting point: {wins.length} high-risk items that can each be addressed within a day
              </h3>
              <ul className="mt-3 space-y-1.5">
                {wins.map((g) => (
                  <li key={g.clause.id} className="flex items-baseline gap-2 text-[13px]">
                    <span className="font-mono text-[11px] text-brand-200/70">{g.clause.id}</span>
                    <span className="text-brand-50">{g.clause.title}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="mt-8 mb-4 flex flex-wrap items-center gap-2">
            {(
              [
                ["all", `All gaps (${gaps.length})`],
                ["blocking", `Blocking certification (${readiness.blocking})`],
                ["quick", `Quick wins (${wins.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filter === key
                    ? "bg-brand-500 text-oncolor"
                    : "bg-ink-800 text-brand-100/80 hover:text-white/90"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <Meter
              value={readiness.percent}
              tone={readiness.blocking === 0 ? "good" : readiness.percent > 60 ? "warn" : "bad"}
            />
          </div>

          <div className="space-y-3">
            {shown.map((g, i) => (
              <GapCard key={g.clause.id} gap={g} rank={i + 1} />
            ))}
            {shown.length === 0 && (
              <EmptyState title="Nothing in this view" body="Try a different filter." />
            )}
          </div>
        </>
      )}

      {tab === "guide" && (
        <div className="mt-2">
          <p className="mb-6 max-w-3xl text-[13px] leading-relaxed text-brand-100/70">
            Five categories, nine measures, 75 clauses. Every clause is either a
            <span className="mx-1 font-medium text-white">shall</span>
            (mandatory — an assessor will fail you on it) or a
            <span className="mx-1 font-medium text-white">should</span>
            (recommended). The steps under each measure are the order worth doing them in.
          </p>
          <MeasureGuide />
        </div>
      )}
    </div>
  );
}

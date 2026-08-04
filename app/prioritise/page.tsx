"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/components/store";
import { Card, EmptyState, Meter, Pill, SectionTitle, Stat } from "@/components/ui";
import { BAND_STYLE, EFFORT_LABEL, THREATS, quickWins, type Band, type Gap } from "@/lib/risk";
import { helpFor } from "@/lib/readiness";
import { ClauseCode, Drilldown, Simple, Technical } from "@/components/detail";
import { plainMeasure } from "@/lib/plain";

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

export default function PrioritisePage() {
  const { gaps, readiness, ready } = useStore();
  const [filter, setFilter] = useState<"all" | "blocking" | "quick">("all");

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
          eyebrow="Capability 03 · Prioritise"
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
        eyebrow="Capability 03 · Prioritise"
        title="Gaps ranked by what they would actually cost you"
        lead="Ordered by likelihood times impact, with anything blocking certification pulled to the top. Effort is kept separate from the score so 'high risk and cheap to fix' can be its own answer — that combination is what actually gets done."
      />

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
    </div>
  );
}

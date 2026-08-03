"use client";

import { useState } from "react";
import { useStore } from "@/components/store";
import { Card, Meter, Pill, SectionTitle } from "@/components/ui";
import { CATEGORIES, CLAUSES_BY_MEASURE, measuresInCategory } from "@/lib/ce-framework";
import { GUIDANCE_BY_MEASURE } from "@/lib/guidance";
import type { MeasureId } from "@/lib/ce-framework";
import { ClauseCode, ObligationLabel, Technical } from "@/components/detail";
import { PLAIN_CATEGORY, plainMeasure } from "@/lib/plain";

export default function GuidePage() {
  const { readiness, technical } = useStore();
  const [open, setOpen] = useState<MeasureId | null>("A.1");

  const scoreOf = (id: MeasureId) => readiness.measures.find((m) => m.measureId === id);

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 04 · Guide"
        title="The nine measures, and what to do about each"
        lead="Five categories, nine measures, 75 clauses. Every clause is either a shall — mandatory, and an assessor will fail you on it — or a should, which is a recommendation. The steps under each measure are the order worth doing them in, and each one points at the CSA toolkit that covers it."
      />

      <div className="space-y-10">
        {CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {technical ? cat.name : (PLAIN_CATEGORY[cat.id] ?? cat.name)}
              </h2>
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
                          <Pill tone="info">Cyber Trust domain {m.trustDomain}</Pill>
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
                                {guidance.toolkit.label} ↗
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
                            What this measure covers
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
    </div>
  );
}

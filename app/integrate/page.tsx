"use client";

import { useMemo } from "react";
import { useStore } from "@/components/store";
import { Card, Pill, SectionTitle, Stat } from "@/components/ui";
import { EFFORT_LABEL } from "@/lib/risk";
import {
  CERTIFICATION_BODIES,
  CERTIFICATION_REGISTER_URL,
  CISOAAS_DIRECTORY_URL,
  CISOAAS_PROGRAMME_URL,
  CISOAAS_PROVIDERS,
  CSA_NON_ENDORSEMENT,
  recommendNextStep,
} from "@/lib/providers";
import { SECTOR_BY_ID } from "@/lib/sectors";

export default function IntegratePage() {
  const { gaps, readiness, org } = useStore();

  const criticalGaps = gaps.filter((g) => g.band === "critical").length;
  const sector = SECTOR_BY_ID.get(org.sector);

  const rec = useMemo(
    () =>
      recommendNextStep({
        completion: readiness.completion,
        blocking: readiness.blocking,
        criticalGaps,
        hasInternalIt: org.hasInternalIt,
      }),
    [readiness.completion, readiness.blocking, criticalGaps, org.hasInternalIt],
  );

  const effortMix = useMemo(() => {
    const mix = { quick: 0, moderate: 0, project: 0 };
    for (const g of gaps) mix[g.effort]++;
    return mix;
  }, [gaps]);

  const unsure = gaps.filter((g) => g.answer === "unsure").length;

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 07 · Integrate"
        title="Money, help, and the hand-off to certification"
        lead="A gap list with no funding and nobody to call is where most SME security programmes stop. This page decides which hand-off you actually need right now — help closing the gaps, or a body to certify you — rather than showing both and letting you guess."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Open gaps" value={gaps.length} />
        <Stat label="Under a day each" value={effortMix.quick} tone="good" />
        <Stat
          label="Need vendor help"
          value={effortMix.project}
          tone={effortMix.project ? "bad" : "good"}
        />
        <Stat
          label="Answered 'not sure'"
          value={unsure}
          tone={unsure ? "warn" : "good"}
          hint="Find these out before getting quotes"
        />
      </div>

      {/* The routed recommendation */}
      <Card
        className={`mt-6 p-6 ${
          rec.step === "get-certified"
            ? "border-emerald-500/35 bg-emerald-500/10"
            : rec.step === "get-help"
              ? "border-csa-500/35 bg-csa-500/10"
              : "border-brand-500/35 bg-brand-700/20"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Pill
            tone={rec.step === "get-certified" ? "good" : rec.step === "get-help" ? "bad" : "info"}
          >
            Where you are
          </Pill>
          <span className="text-[15px] font-semibold text-white">{rec.title}</span>
        </div>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-brand-50">{rec.body}</p>
        <p className="mt-2 text-[12px] text-brand-100/70">Because: {rec.because}</p>
      </Card>

      {/* CISOaaS — shown while help is still the answer */}
      {rec.step !== "get-certified" && (
        <>
          <h2 className="mt-10 mb-2 text-xl font-semibold tracking-tight text-white">
            CISO-as-a-Service providers
          </h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-brand-100/80">
            Consultants onboarded by CSA to act as an outsourced security lead for SMEs with
            no in-house capability. Eligible SMEs have been able to claim substantial
            co-funding — confirm the current rate, and claim it{" "}
            <span className="text-white">before</span> the work starts.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-white">Start here</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-brand-100/80">
                CSA points SMEs at a matching listing rather than a fixed panel, because the
                provider set changes. Use it to shortlist, then get more than one quote.
              </p>
              <div className="mt-4 flex flex-col gap-2 text-[13px]">
                <a
                  href={CISOAAS_PROGRAMME_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-300 underline-offset-2 hover:underline"
                >
                  CSA CISOaaS programme and eligibility ↗
                </a>
                <a
                  href={CISOAAS_DIRECTORY_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-300 underline-offset-2 hover:underline"
                >
                  Consultant matching listing ↗
                </a>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-white">
                Providers publicly listing CSA CISOaaS
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-brand-100/80">
                A starting point for your own due diligence — not a shortlist and not a
                ranking. Verify current appointment with CSA before engaging.
              </p>
              <ul className="mt-4 space-y-2">
                {CISOAAS_PROVIDERS.map((p) => (
                  <li key={p.name} className="text-[13px]">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-brand-50 underline-offset-2 hover:text-white hover:underline"
                      >
                        {p.name} ↗
                      </a>
                    ) : (
                      <span className="text-brand-50">{p.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {gaps.filter((g) => g.effort === "project").length > 0 && (
            <Card className="mt-3 p-5">
              <h3 className="text-sm font-semibold text-white">What to put in the brief</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-brand-100/80">
                Send the JSON export from your results tab. A provider quoting against real
                clause-level findings scopes tighter than one quoting blind, and you avoid
                paying for a discovery workshop that repeats what you already know.
              </p>
              <div className="mt-4 space-y-2">
                {gaps
                  .filter((g) => g.effort === "project")
                  .slice(0, 6)
                  .map((g) => (
                    <div
                      key={g.clause.id}
                      className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg border border-ink-700/60 bg-ink-900/60 px-3 py-2.5"
                    >
                      <span className="font-mono text-[11px] text-brand-400">{g.clause.id}</span>
                      <span className="text-[13px] text-white/90">{g.clause.title}</span>
                      <span className="ml-auto text-[11px] text-brand-200/70">
                        {EFFORT_LABEL[g.effort]}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Certification bodies — only once the mandatory clauses are actually closed */}
      <h2 className="mt-10 mb-2 text-xl font-semibold tracking-tight text-white">
        Certification bodies
      </h2>

      {rec.step === "get-certified" ? (
        <>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-brand-100/80">
            Appointed by CSA to conduct the independent assessment. Fees and lead times vary,
            so quote more than one. Send them the JSON export — it carries your clause-level
            answers, their provenance and your evidence references, so the assessor is not
            re-keying your submission.
          </p>
          <Card className="p-5">
            <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {CERTIFICATION_BODIES.map((b) => (
                <div key={b.name} className="text-[13px]">
                  {b.url ? (
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-brand-50 underline-offset-2 hover:text-white hover:underline"
                    >
                      {b.name} ↗
                    </a>
                  ) : (
                    <span className="text-brand-50">{b.name}</span>
                  )}
                </div>
              ))}
            </div>
            <a
              href={CERTIFICATION_REGISTER_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-block border-t border-brand-700/30 pt-4 text-[13px] text-brand-300 underline-offset-2 hover:underline"
            >
              CSA&apos;s current register of appointed certification bodies ↗
            </a>
          </Card>
        </>
      ) : (
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Pill>Not yet applicable</Pill>
            <span className="text-[14px] font-medium text-white">
              {readiness.blocking} mandatory clause{readiness.blocking === 1 ? "" : "s"} stand
              between you and booking an assessment
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-brand-100/80">
            The list of certification bodies is withheld until the mandatory clauses are closed. Engaging an assessor with outstanding mandatory items means commissioning an assessment that is unlikely to pass, and the findings returned would largely duplicate the priority list already available to you here. We recommend addressing those first.
          </p>
          <a
            href="/prioritise"
            className="mt-4 inline-block text-[13px] text-brand-300 underline-offset-2 hover:underline"
          >
            View outstanding items in priority order →
          </a>
        </Card>
      )}

      {/* Funding, routed by sector */}
      <h2 className="mt-10 mb-2 text-xl font-semibold tracking-tight text-white">
        Funding you can apply for
      </h2>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-brand-100/80">
        Routed to your sector
        {sector && sector.id !== "general" && (
          <>
            {" "}
            — <span className="text-white">{sector.name}</span>
          </>
        )}
        . Most schemes need approval before the work begins, so apply first.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {(sector?.funding ?? []).map((f) => (
          <Card key={f.name} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-white">{f.name}</h3>
              <Pill>{f.body}</Pill>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-brand-100/80">{f.summary}</p>
            <a
              href={f.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 text-[12px] text-brand-300 underline-offset-2 hover:underline"
            >
              Scheme details ↗
            </a>
          </Card>
        ))}
      </div>

      {sector && sector.sources.length > 0 && (
        <Card className="mt-3 p-5">
          <h3 className="text-sm font-semibold text-white">Official sources</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-brand-100/80">
            {sector.regulator
              ? `${sector.regulator} is the authority here, not this tool. Verify any obligation against these before acting on it.`
              : "Verify any obligation against the source before acting on it."}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {sector.sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[13px] text-brand-300 underline-offset-2 hover:underline"
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        </Card>
      )}

      <p className="mt-8 rounded-xl border border-ink-700/60 bg-ink-900/50 p-4 text-[12px] leading-relaxed text-brand-100/70">
        {CSA_NON_ENDORSEMENT}
      </p>
    </div>
  );
}

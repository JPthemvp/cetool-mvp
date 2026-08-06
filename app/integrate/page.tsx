"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/components/store";
import { Card, Pill, SectionTitle, Stat } from "@/components/ui";
import {
  CERTIFICATION_BODIES,
  CERTIFICATION_REGISTER_URL,
  CISOAAS_DIRECTORY_URL,
  CISOAAS_PROGRAMME_URL,
  CSA_NON_ENDORSEMENT,
  recommendNextStep,
} from "@/lib/providers";
import { SECTOR_BY_ID } from "@/lib/sectors";

export default function IntegratePage() {
  const { gaps, readiness, org, reset } = useStore();
  const [showResetModal, setShowResetModal] = useState(false);

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
        eyebrow="Capability 05 · Next Steps"
        title="CISOaaS Consulting, Funding & Certification"
        lead="A gap list with no funding and nobody to call is where most SME security programmes stop. This page routes you to the right hand-off — CISOaaS consulting to close gaps, or a certification body when you are ready."
      />

      <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-5 py-4 text-[13px] leading-relaxed text-brand-50">
        <span className="font-semibold text-emerald-300">Funding available: </span>
        CSA&apos;s CISOaaS programme provides{" "}
        <span className="font-semibold text-white">up to 70% co-funding support</span>{" "}
        for eligible organisations. Apply before the engagement starts — funding cannot be claimed retrospectively.
      </div>

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

          <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-white">Find a provider via CSA</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-brand-100/80">
                CSA maintains a live matching listing of onboarded consultants — the set of
                approved providers changes, so the authoritative source is always CSA's own
                register. Use it to shortlist two or three, then get comparative quotes.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-brand-100/80">
                Eligible SMEs have been able to claim substantial co-funding. Confirm the
                current rate and apply{" "}
                <span className="font-medium text-white">before</span> the engagement
                begins — funding cannot be claimed retrospectively.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 border-t border-brand-700/30 pt-4 text-[13px]">
                <a
                  href={CISOAAS_PROGRAMME_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-300 underline-offset-2 hover:underline"
                >
                  CSA CISOaaS programme — eligibility and co-funding ↗
                </a>
                <a
                  href={CISOAAS_DIRECTORY_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-300 underline-offset-2 hover:underline"
                >
                  CSA consultant matching listing ↗
                </a>
              </div>
            </Card>

        </>
      )}

      {/* Certification bodies — only shown when ready to submit */}
      {rec.step === "get-certified" && (
        <>
          <h2 className="mt-10 mb-2 text-xl font-semibold tracking-tight text-white">
            Certification bodies
          </h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-brand-100/80">
            Appointed by CSA to conduct the independent assessment. Send them the JSON export
            from your results tab — it carries your clause-level answers, their provenance, and
            your evidence references, so the assessor is not re-keying your submission.
          </p>
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-[13px] leading-relaxed text-brand-50">
            <span className="font-semibold text-emerald-300">Validity:</span>{" "}
            The Cyber Essentials mark is valid for{" "}
            <span className="font-medium text-white">two years</span> from the date of
            award. A re-assessment against the current framework version is required to renew.
          </div>
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

      {/* Reset */}
      <div className="mt-12 border-t border-ink-700/40 pt-8">
        <button
          onClick={() => setShowResetModal(true)}
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-500/70 hover:bg-red-500/20 hover:text-red-300"
        >
          Clear and reset to default
        </button>
        <p className="mt-2 text-[12px] text-brand-100/50">
          Removes all scan results, answers, and company information from this browser.
        </p>
      </div>

      {/* Reset confirmation modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowResetModal(false)}
        >
          <div className="mx-4 w-full max-w-md rounded-2xl border border-red-500/30 bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Reset everything?</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-brand-100/80">
              Everything will be deleted — your company details, scan results, assessment answers,
              and all progress. This cannot be undone.
            </p>
            <p className="mt-2 text-[13px] font-medium text-red-400">Are you sure?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="rounded-lg border border-ink-600 bg-ink-800 px-4 py-2 text-sm font-medium text-brand-100/80 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  reset();
                  setShowResetModal(false);
                  window.location.href = "/";
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Yes, delete everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

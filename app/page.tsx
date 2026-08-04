"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/components/store";
import {
  Button,
  Card,
  Field,
  Meter,
  Pill,
  RequiredLegend,
  RequiredMark,
  Stat,
  inputCls,
} from "@/components/ui";
import { CATEGORIES, MEASURES } from "@/lib/ce-framework";
import { SECTORS, SECTOR_BY_ID } from "@/lib/sectors";
import { READINESS_PROMISE, SCOPING_QUESTIONS } from "@/lib/readiness";
import { PATHWAYS, humanOnlyClauses, pathwayCoverage } from "@/lib/pathways";

const CAPABILITIES = [
  {
    name: "Discover",
    body: "Passive scan of your domain, mail and public services. Nothing to install.",
    href: "/discover",
  },
  {
    name: "Assets",
    body: "The inventory Cyber Essentials asks for, started from what we found.",
    href: "/assets",
  },
  {
    name: "Prioritise",
    body: "Gaps ordered by risk and effort, not by clause number.",
    href: "/prioritise",
  },
  {
    name: "Guide",
    body: "What to do about each measure, with the CSA toolkit that covers it.",
    href: "/guide",
  },
  {
    name: "Prepare",
    body: "The self-assessment, pre-filled from evidence we could verify.",
    href: "/prepare",
  },
  {
    name: "Monitor",
    body: "Re-scan on a schedule so you don't drift out of compliance.",
    href: "/monitor",
  },
  {
    name: "Integrate",
    body: "Funding, CISO-as-a-Service, and the hand-off to a certification body.",
    href: "/integrate",
  },
];

const INDUSTRIES = [
  "Professional services",
  "Retail and F&B",
  "Manufacturing",
  "Logistics",
  "Healthcare",
  "Construction and real estate",
  "Infocomm and media",
  "Finance and insurance",
  "Other",
];

const SIZES = ["1–9 employees", "10–49 employees", "50–199 employees", "200+ employees"];

export default function StartPage() {
  const { org, setOrg, setScoping, scope, setScope, onboarded, readiness, reset, started, beginJourney } =
    useStore();
  const { pathway, setPathway } = useStore();
  const [corppassBusy, setCorppassBusy] = useState(false);
  const activeSector = SECTOR_BY_ID.get(org.sector);
  const humanOnly = useMemo(() => humanOnlyClauses().length, []);

  function simulateCorppass() {
    setCorppassBusy(true);
    // Stands in for the real flow: Corppass authenticates the officer, and ACRA
    // returns the entity's registered particulars so none of this is typed by hand.
    setTimeout(() => {
      setOrg({
        name: "Marina Precision Engineering Pte Ltd",
        uen: "201534217K",
        industry: "Manufacturing",
        size: "10–49 employees",
        hasInternalIt: false,
        onboardedVia: "corppass",
      });
      setCorppassBusy(false);
    }, 900);
  }

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div>
          <Pill tone="info">Free · Non-intrusive · No agent to install</Pill>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Find out where you stand against the{" "}
            <span className="text-brand-400">Cyber Essentials mark</span> — and leave with
            the paperwork half done.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-brand-100/80">
            Existing tools tell an SME it has a problem and stop there. This one scans what
            an attacker can already see, maps every finding to the specific clause of the
            mark it affects, ranks the gaps by what they would actually cost you, and hands
            back a self-assessment that is already filled in where we could verify the
            answer.
          </p>

          {/*
            Always present, before anything has been typed. The landing page has
            to ask for exactly one decision — "shall I start?" — and a form with
            no button reads as work rather than an offer.
          */}
          <div className="mt-7">
            <Button
              onClick={() => {
                beginJourney();
                document
                  .getElementById("org-form")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {started ? "Continue where I left off" : "Start the assessment"}
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-brand-200/70">
            {started
              ? "Your answers are saved in this browser. Use Next at the bottom of each step to move on."
              : "Ten steps, one at a time. The next one opens when this one is done. Nothing is submitted anywhere and you can stop at any point."}
          </p>

          {/* Set expectations before they start. Borrowed from IASME, which is
              explicit that its tool is not a pass/fail test — that framing is
              what gets honest answers instead of defensive ones. */}
          <div className="mt-8 rounded-xl border border-ink-700/60 bg-ink-900/50 p-5">
            <p className="text-sm font-semibold text-white">
              What to expect · about {READINESS_PROMISE.minutes}
            </p>
            <ul className="mt-3 space-y-2">
              {READINESS_PROMISE.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[13px] leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-csa-500" />
                  <span className="text-brand-100/80">{p}</span>
                </li>
              ))}
            </ul>

            {/* The seven capabilities, so they know what they are walking into. */}
            <div className="mt-5 border-t border-brand-700/30 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
                The seven capabilities
              </p>
              <ol className="mt-3 space-y-2.5">
                {CAPABILITIES.map((c, i) => (
                  <li key={c.name} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-700/60 text-[11px] font-semibold tabular-nums text-brand-100 ring-1 ring-inset ring-brand-500/30">
                      {i + 1}
                    </span>
                    <span className="text-[13px] leading-relaxed">
                      <span className="font-semibold text-white">{c.name}</span>
                      <span className="text-brand-100/80"> — {c.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Categories" value={CATEGORIES.length} />
            <Stat label="Measures" value={MEASURES.length} />
            <Stat label="Clauses assessed" value={readiness.totalClauses} />
            <Stat
              label="Cyber Trust domains"
              value="8 / 10"
              hint="Covered at Supporter tier once you hold Cyber Essentials"
            />
          </dl>
        </div>

        {/* Onboarding */}
        <Card className="p-6" id="org-form">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Your organisation</h2>
              <p className="mt-1 text-sm text-brand-100/60">
                Scope decides which clauses apply to you.
              </p>
              <div className="mt-1.5">
                <RequiredLegend />
              </div>
            </div>
            {onboarded && <Pill tone="good">Onboarded</Pill>}
          </div>

          <button
            onClick={simulateCorppass}
            disabled={corppassBusy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink-600/80 px-4 py-3 text-sm font-medium text-brand-50 transition hover:border-brand-500/60 hover:text-white disabled:opacity-60"
          >
            {corppassBusy ? "Retrieving entity particulars…" : "Onboard with Corppass"}
          </button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-brand-200/70">
            Simulated in this prototype. In production this authenticates the officer and
            pulls registered particulars, so the SME types nothing.
          </p>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-700" />
            <span className="text-[11px] uppercase tracking-widest text-brand-200/70">or</span>
            <span className="h-px flex-1 bg-ink-700" />
          </div>

          <div className="space-y-4">
            <Field label="Registered name" required>
              <input
                className={inputCls}
                value={org.name}
                placeholder="Acme Trading Pte Ltd"
                required
                aria-required="true"
                onChange={(e) => setOrg({ name: e.target.value, onboardedVia: "manual" })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="UEN">
                <input
                  className={inputCls}
                  value={org.uen}
                  placeholder="201812345A"
                  onChange={(e) => setOrg({ uen: e.target.value })}
                />
              </Field>
              <Field label="Headcount">
                <select
                  className={inputCls}
                  value={org.size}
                  onChange={(e) => setOrg({ size: e.target.value })}
                >
                  <option value="">Select…</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Industry">
              <select
                className={inputCls}
                value={org.industry}
                onChange={(e) => setOrg({ industry: e.target.value })}
              >
                <option value="">Select…</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Pathway — the decision that shapes everything after it. */}
          <div className="mt-6 border-t border-brand-700/30 pt-5">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-brand-50">How would you like to proceed?</p>
              <RequiredMark />
            </div>
            <p className="mb-3 text-[12px] leading-relaxed text-brand-100/70">
              Both cover all {readiness.totalClauses} clauses and both end in the same
              submittable results. The difference is who answers the technical half.
            </p>

            <div className="space-y-2">
              {PATHWAYS.map((p) => {
                const cov = pathwayCoverage(p.id);
                const on = pathway === p.id;
                return (
                  <label
                    key={p.id}
                    className={`block cursor-pointer rounded-lg border p-4 transition ${
                      on
                        ? "border-csa-500/50 bg-csa-500/10"
                        : "border-ink-700/60 hover:border-ink-600"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="pathway"
                        checked={on}
                        onChange={() => setPathway(p.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#e31736]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-white">
                          {p.name}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-brand-100/80">
                          {p.tagline}
                        </span>

                        <span className="mt-2.5 flex flex-wrap gap-1.5">
                          <Pill tone={p.id === "self-assess" ? "good" : "warn"}>
                            {p.id === "self-assess" ? "Nothing installed" : "You install a check"}
                          </Pill>
                          <Pill tone="info">
                            {cov.preAnswered + cov.evidenced} of {cov.total} assisted
                          </Pill>
                          <Pill>{cov.toAnswer} you answer</Pill>
                        </span>

                        {on && (
                          <span className="mt-3 block border-t border-csa-500/25 pt-3">
                            <span className="block text-[12px] leading-relaxed text-brand-50">
                              {p.mechanics.map((m) => (
                                <span key={m} className="mb-1 flex gap-2">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-csa-400" />
                                  <span>{m}</span>
                                </span>
                              ))}
                            </span>
                            <span className="mt-2 block text-[12px] leading-relaxed text-amber-300/90">
                              Please note: {p.limitation}
                            </span>
                          </span>
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-brand-100/70">
              {humanOnly} of the {readiness.totalClauses} clauses are about people and
              process — training, approvals, incident plans. Those come back to you on
              either route, because no software can see them. You can switch pathway later.
            </p>
          </div>

          {/* Sector — decides which obligations get layered on later. */}
          <div className="mt-6 border-t border-brand-700/30 pt-5">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-brand-50">
                Which of these describes your organisation?
              </p>
              <RequiredMark />
            </div>
            <p className="mb-3 text-[12px] leading-relaxed text-brand-100/70">
              Some sectors carry duties that Cyber Essentials does not cover. This adds
              them to your action plan and points you at the right funding.
            </p>
            <div className="space-y-2">
              {SECTORS.map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-[13px] transition ${
                    org.sector === s.id
                      ? "border-csa-500/50 bg-csa-500/10"
                      : "border-ink-700/60 hover:border-ink-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="sector"
                    checked={org.sector === s.id}
                    onChange={() => setOrg({ sector: s.id })}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#e31736]"
                  />
                  <span className="leading-snug text-brand-50">{s.identifier}</span>
                </label>
              ))}
            </div>

            {activeSector && activeSector.id !== "general" && activeSector.headline && (
              <div className="mt-3 rounded-lg border border-csa-500/35 bg-csa-500/10 p-3.5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-csa-300">
                  {activeSector.regulator ?? activeSector.name}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-brand-50">
                  {activeSector.headline}
                </p>
              </div>
            )}
          </div>

          {/* Scoping — IASME asks these before any control question, and so do we. */}
          <div className="mt-6 border-t border-brand-700/30 pt-5">
            <p className="mb-3 text-sm font-medium text-brand-50">Scoping</p>
            <div className="space-y-4">
              {SCOPING_QUESTIONS.map((q) => (
                <div key={q.id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-brand-50">{q.question}</p>
                    <RequiredMark />
                  </div>
                  {q.note && (
                    <p className="mt-1 text-[12px] leading-relaxed text-brand-100/70">{q.note}</p>
                  )}
                  <select
                    className={`${inputCls} mt-2`}
                    value={org.scoping[q.id] ?? ""}
                    onChange={(e) => {
                      setScoping(q.id, e.target.value);
                      // "Who looks after IT" also drives the CISOaaS recommendation.
                      if (q.id === "who-runs-it") {
                        setOrg({
                          hasInternalIt:
                            e.target.value === "internal" || e.target.value === "mixed",
                        });
                      }
                    }}
                  >
                    <option value="">Please select an option</option>
                    {q.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-brand-700/30 pt-5">
            <p className="mb-3 text-sm font-medium text-brand-50">
              What is in scope for certification?
            </p>
            <div className="space-y-2.5">
              {(
                [
                  ["servers", "Servers or on-premise systems"],
                  ["mobile", "Company mobile devices"],
                  ["byod", "Staff personal devices used for work (BYOD)"],
                  ["cloud", "Cloud services (Microsoft 365, Google Workspace, AWS…)"],
                  ["ot", "Operational technology or industrial equipment"],
                  ["ai", "AI tools or services"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={scope[key]}
                    onChange={(e) => setScope({ [key]: e.target.checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-850 accent-[#2f7dbf]"
                  />
                  <span className="leading-snug text-brand-100/80">{label}</span>
                </label>
              ))}
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-brand-700/30 pt-4 text-sm">
              <input
                type="checkbox"
                checked={org.hasInternalIt}
                onChange={(e) => setOrg({ hasInternalIt: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-850 accent-[#2f7dbf]"
              />
              <span className="leading-snug text-brand-100/80">
                We have someone in-house who looks after IT
              </span>
            </label>
          </div>

          {onboarded && (
            <button
              onClick={reset}
              className="mt-5 text-xs text-brand-200/70 underline-offset-2 hover:text-brand-100/80 hover:underline"
            >
              Clear this assessment and start again
            </button>
          )}
        </Card>
      </section>

      {/* Progress, once there is any */}
      {readiness.completion > 0 && (
        <section>
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Where you are</h2>
                <p className="mt-1 text-sm text-brand-100/80">{readiness.verdict}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Stat label="Clauses answered" value={`${readiness.completion}%`} />
              <Stat
                label="Measures met"
                value={`${readiness.measures.filter((m) => m.status === "ready").length} / ${readiness.measures.length}`}
              />
              <Stat
                label="Mandatory gaps"
                value={readiness.blocking}
                tone={readiness.blocking === 0 ? "good" : readiness.blocking > 10 ? "bad" : "warn"}
              />
            </div>
            <div className="mt-5">
              <Meter
                value={readiness.percent}
                tone={readiness.blocking === 0 ? "good" : readiness.percent > 60 ? "warn" : "bad"}
              />
            </div>
          </Card>
        </section>
      )}

    </div>
  );
}

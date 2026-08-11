"use client";

import Link from "next/link";
import { Pill, Stat } from "@/components/ui";
import { CATEGORIES, MEASURES } from "@/lib/ce-framework";

const CAPABILITIES = [
  {
    name: "Scan",
    body: "Passive domain scan surfaces what attackers can already see — exposed services, mail authentication gaps, certificate details. Your asset inventory starts from what we found. Nothing to install.",
  },
  {
    name: "Gap Analysis",
    body: "Gaps ranked by actual risk and fix effort, not by clause number. Each carries one concrete action for Monday morning, written for a business owner not a security engineer.",
  },
  {
    name: "Harden",
    body: "Step-by-step remediation playbooks for every gap identified. Prioritised fixes with clear ownership so your team knows exactly what to do next.",
  },
  {
    name: "Assess",
    body: "All 75 Cyber Essentials clauses in plain English, pre-filled where the scan answered them. 'Not sure' is a valid answer — it records an honest gap rather than a guessed pass.",
  },
];

const WHAT_TO_EXPECT = [
  "This is a readiness review, not a pass/fail test. Nothing is submitted on your behalf.",
  "Automated checks address about one third of the assessment. The rest concerns how your organisation operates.",
  "If a question is unclear, select Not sure — it is a valid answer and an explanation is provided.",
  "You will receive a prioritised action plan and a cyber health-check score on completion.",
];

export default function LandingPage() {
  return (
    <div className="space-y-14">

      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <Pill tone="info">Free · Non-intrusive · No agent to install</Pill>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Find out where you stand against the{" "}
            <span className="text-brand-400">Cyber Essentials mark</span>
            {" "}— and leave with the paperwork half done.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-brand-100/80">
            Built for Singapore SMEs with no in-house security specialist. Scans what an
            attacker can already see, maps every finding to the exact clause it affects,
            and hands back a self-assessment already filled in where we could verify
            the answer.
          </p>

          <div className="mt-8">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 rounded-lg bg-csa-600 px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-csa-500 active:scale-[0.98]"
            >
              Start assessment
              <span aria-hidden="true">&#x2192;</span>
            </Link>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-brand-200/70">
            About one hour &#xB7; progress saved in your browser &#xB7; nothing submitted on your behalf
          </p>

          {/* About the mark */}
          <div className="mt-8 rounded-xl border border-ink-700/60 bg-ink-900/50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
              About the Cyber Essentials mark
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-brand-100/80">
              {"CSA Singapore's foundational cybersecurity certification for organisations that have met a baseline set of security controls across nine measures."}
            </p>
            <a
              href="https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/cyber-essentials"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block text-[12px] text-brand-300 underline-offset-2 hover:underline"
            >
              CSA Cyber Essentials mark &#x2014; official page &#x2197;
            </a>
          </div>
        </div>

        {/* Capabilities card */}
        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/60 p-6 shadow-lg shadow-ink-950/40">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
            Four capabilities
          </p>
          <ol className="mt-4 space-y-4">
            {CAPABILITIES.map((c, i) => (
              <li key={c.name} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-700/60 text-[11px] font-semibold tabular-nums text-brand-100 ring-1 ring-inset ring-brand-500/30">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-relaxed">
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className="text-brand-100/80"> &#x2014; {c.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-brand-700/30 pt-5">
            <Stat label="Categories" value={CATEGORIES.length} />
            <Stat label="Measures" value={MEASURES.length} />
            <Stat label="Clauses assessed" value={75} />
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section>
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/50 p-6">
          <p className="text-sm font-semibold text-white">What to expect &#xB7; about one hour</p>
          <ul className="mt-3 space-y-2.5">
            {WHAT_TO_EXPECT.map((p) => (
              <li key={p} className="flex gap-2.5 text-[13px] leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-csa-500" />
                <span className="text-brand-100/80">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </div>
  );
}

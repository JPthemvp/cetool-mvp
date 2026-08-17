"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      {/* Badge */}
      <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/40 bg-brand-900/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Free · Non-intrusive · Singapore SME
      </span>

      {/* Headline */}
      <h1 className="mt-8 max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
        Cyber Essentials
        <br />
        <span className="text-csa-400">in three clicks.</span>
      </h1>

      <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-brand-100/70">
        Log in with Corppass, run the device scanner, and walk away with a
        submission-ready CSA Cyber Essentials self-assessment — automatically filled
        where tools can verify the answer.
      </p>

      {/* THE button */}
      <Link
        href="/start"
        className="mt-10 inline-flex items-center gap-3 rounded-xl bg-csa-600 px-10 py-4 text-[17px] font-bold text-white shadow-lg shadow-csa-800/40 transition hover:bg-csa-500 active:scale-[0.98]"
      >
        Begin Assessment
        <span aria-hidden="true" className="text-xl">→</span>
      </Link>

      <p className="mt-4 text-[12px] text-brand-300/60">
        Nothing installed permanently · Nothing submitted without your review
      </p>

      {/* Steps preview */}
      <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-4 text-left">
        {[
          {
            n: "1",
            label: "Log in & scan domain",
            body: "Corppass fills your org details. We scan your domain for external risks automatically.",
          },
          {
            n: "2",
            label: "Scan your devices",
            body: "Download a one-click scanner (.exe or PowerShell). Results auto-populate the assessment.",
          },
          {
            n: "3",
            label: "Review & submit",
            body: "Answer the short human-only checklist. Export a submission-ready PDF or JSON.",
          },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-xl border border-ink-700/60 bg-ink-900/50 p-5"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-csa-700/60 text-[12px] font-bold text-csa-200 ring-1 ring-inset ring-csa-500/30">
              {s.n}
            </span>
            <p className="mt-3 text-[13px] font-semibold text-white">{s.label}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-brand-100/60">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-[11px] text-brand-200/40">
        Based on CSA Cyber Essentials mark V202503 · Not affiliated with CSA ·
        Certification requires an appointed certification body
      </p>
    </div>
  );
}

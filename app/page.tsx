"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CorppassButton } from "@/components/corppass-logo";

const FEATURES = [
  {
    icon: "🏛️",
    title: "Corppass login",
    body: "Your organisation name, UEN, and sector auto-fill from your Singpass business profile. No manual data entry.",
  },
  {
    icon: "🌐",
    title: "Automated domain scan",
    body: "TLS grade, SPF/DKIM/DMARC, open ports, and exposed services — scanned the moment you enter your domain.",
  },
  {
    icon: "💻",
    title: "Device scanner (.exe or PowerShell)",
    body: "Run once on each device. Antivirus, disk encryption, patch level, firewall, and account policy — all read automatically.",
  },
  {
    icon: "✅",
    title: "67+ clauses auto-populated",
    body: "Technical checks fill the CSA self-assessment for you. You only answer the 8 questions a machine cannot.",
  },
  {
    icon: "🚨",
    title: "Incident Response plan",
    body: "A sector-specific IR plan — covering PDPA, MAS, and MOH obligations — generated and ready to download.",
  },
  {
    icon: "📤",
    title: "Submission-ready export",
    body: "Export your completed self-assessment as JSON or CSV, formatted for your appointed certification body.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [corppassBusy, setCorppassBusy] = useState(false);

  function handleCorppass() {
    setCorppassBusy(true);
    // In production: redirect to Corppass OIDC endpoint → callback fills org from ACRA
    // For the demo: navigate to /start where user enters their own org details
    setTimeout(() => {
      router.push("/start");
    }, 900);
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Badge */}
      <span className="inline-flex items-center gap-2 rounded-full border border-csa-600/50 bg-csa-700/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-csa-500">
        <span className="h-1.5 w-1.5 rounded-full bg-csa-400 animate-pulse" />
        Free | CSA&apos;s Cyber Essentials Mark
      </span>

      {/* Headline */}
      <h1 className="mt-8 max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
        Cyber Essentials
        <br />
        <span className="text-csa-400">Simplified.</span>
      </h1>

      <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-brand-100/70">
        Log in with Corppass, run the scanner, review and export. Your CSA Cyber Essentials
        self-assessment — automatically filled, results ready for certification body.
      </p>

      {/* Primary CTA — Corppass login */}
      <CorppassButton
        onClick={handleCorppass}
        busy={corppassBusy}
        size="lg"
        className="mt-10 shadow-lg shadow-red-100/30 rounded-xl"
      />

      <p className="mt-3 text-[12px] text-brand-300/60">
        Singapore&apos;s corporate digital identity · Your credentials are never stored
      </p>

      <div className="mt-3 flex items-center gap-3">
        <span className="h-px w-20 bg-ink-700" />
        <span className="text-[11px] uppercase tracking-widest text-brand-200/50">or</span>
        <span className="h-px w-20 bg-ink-700" />
      </div>

      <Link
        href="/start"
        className="mt-3 text-[13px] text-brand-300 underline-offset-2 hover:underline"
      >
        Continue without Corppass →
      </Link>

      <p className="mt-2 text-[11px] text-brand-300/40">
        Nothing installed permanently · Nothing submitted without your review
      </p>

      {/* 3-step strip */}
      <div className="mt-16 flex w-full max-w-2xl items-start justify-center gap-0">
        {[
          { n: "1", label: "Log in & scan domain" },
          { n: "2", label: "Scan your devices" },
          { n: "3", label: "Review & export" },
        ].map((s, i, arr) => (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-2 px-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-csa-700/60 text-[13px] font-bold text-csa-200 ring-1 ring-inset ring-csa-500/30">
                {s.n}
              </span>
              <span className="text-[12px] font-semibold text-white whitespace-nowrap">{s.label}</span>
            </div>
            {i < arr.length - 1 && (
              <span className="text-brand-600 text-lg -mt-4">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <div className="mt-16 w-full max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300 mb-6">
          What the tool does for you
        </p>
        <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-ink-700/60 bg-ink-900/50 p-5"
            >
              <span className="text-2xl">{f.icon}</span>
              <p className="mt-3 text-[13px] font-semibold text-white">{f.title}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-brand-100/60">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-12 text-[11px] text-brand-200/40">
        Based on CSA Cyber Essentials mark V202503 · Not affiliated with CSA ·
        Certification requires an appointed certification body
      </p>
    </div>
  );
}

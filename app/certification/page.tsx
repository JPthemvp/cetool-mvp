"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import { Card, Pill, SectionTitle } from "@/components/ui";

// ── CSA-appointed Certification Bodies for Cyber Essentials Mark ─────────────
// Source: https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/how-to-get-certified/
// Contact details sourced directly from each CB's public website.
// Always verify on the CSA website before reaching out.

const CERT_BODIES = [
  {
    name: "Cybertrust Asia",
    shortName: "Cybertrust Asia",
    email: "certbody@cybertrust-asia.com.sg",
    phone: "",
    website: "https://www.cybertrust-asia.com",
    notes: "CSA-appointed certification body for Cyber Essentials and Cyber Trust Marks.",
  },
  {
    name: "SAIQA",
    shortName: "SAIQA",
    email: "ce-assessment@saiqa.com.sg",
    phone: "",
    website: "https://www.saiqa.com",
    notes: "CSA-appointed CB conducting Cyber Essentials Mark assessments for Singapore organisations.",
  },
  {
    name: "Wizlynx",
    shortName: "Wizlynx",
    email: "cemarks@wizlynx.com.sg",
    phone: "",
    website: "https://www.wizlynx.com",
    notes: "CSA-appointed CB offering Cyber Essentials Mark assessments. Contact via email.",
  },
  {
    name: "NCS",
    shortName: "NCS",
    email: "cyberessentials@ncs.com.sg",
    phone: "",
    website: "https://www.ncs.co",
    notes: "CSA-appointed CB for Cyber Essentials Mark. Part of Singtel Group.",
  },
];

function buildEmail(
  body: (typeof CERT_BODIES)[0],
  org: { name: string; uen: string; sector: string },
  domain: string | null,
  completion: number,
  readinessPercent: number,
): string {
  const today = new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
  const toLine = body.email ? `To: ${body.email}` : `To: [obtain email from ${body.website}]`;
  return `${toLine}
Subject: Cyber Essentials Mark — Assessment Enquiry — ${org.name || "[Your Organisation Name]"}

Dear ${body.shortName} Assessment Team,

I am writing to enquire about engaging your organisation as our appointed certification body for the CSA Cyber Essentials Mark assessment.

ORGANISATION DETAILS
────────────────────────────────────────────
Organisation Name : ${org.name || "[Your Registered Name]"}
UEN               : ${org.uen || "[Your UEN]"}
Sector            : ${org.sector || "[Your Sector]"}
Scanned Domain    : ${domain || "[your-domain.com.sg]"}
Self-Assessment   : ${completion}% complete · ${readinessPercent}% of clauses assessed
Date              : ${today}

SCOPE OF ASSESSMENT
────────────────────────────────────────────
We are applying for the Cyber Essentials Mark (not Cyber Essentials Plus).
Our self-assessment has been completed using the CSA Cyber Essentials Readiness Tool.

NEXT STEPS REQUESTED
────────────────────────────────────────────
1. Confirm your availability to conduct a remote document review assessment.
2. Provide a fee schedule and estimated timeline for the assessment.
3. Supply a list of evidence documents required for submission.
4. Advise on the process for uploading our completed self-assessment report.

ATTACHED / TO FOLLOW
────────────────────────────────────────────
[ ] Completed self-assessment (JSON/CSV export from the Readiness Tool)
[ ] Evidence pack (as advised by your assessor)
[ ] UEN and ACRA business profile

We look forward to working with ${body.shortName} and completing our Cyber Essentials certification.

Please do not hesitate to contact me should you require any further information.

Yours sincerely,

[Your Name]
[Your Job Title]
[Your Organisation Name]
[Your Email Address]
[Your Phone Number]

—
This submission was prepared using the CSA Cyber Essentials Readiness Tool.
CSA Cyber Essentials Mark V202503 · https://www.csa.gov.sg`;
}

export default function CertificationPage() {
  const router = useRouter();
  const { org, domain, readiness, reset } = useStore();
  const [selected, setSelected] = useState(CERT_BODIES[0]);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const emailBody = buildEmail(
    selected,
    { name: org.name, uen: org.uen, sector: org.sector ?? "" },
    domain,
    Math.round(readiness.completion),
    Math.round(readiness.percent),
  );

  function handleCopy() {
    navigator.clipboard.writeText(emailBody).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    reset();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionTitle
        eyebrow="Appointed Certification Bodies"
        title="Choose your certification body"
        lead="CSA appoints these organisations to conduct Cyber Essentials Mark assessments. Select one, then send the pre-drafted email to begin your certification."
      />

      <div className="rounded-xl border border-amber-700/30 bg-amber-900/15 p-4 text-[13px] text-amber-200/80">
        <p className="font-semibold text-amber-200">Before you contact a CB</p>
        <p className="mt-1 text-amber-200/70">
          Ensure your self-assessment is at least 80% complete and you have exported your results.
          CBs typically require a completed self-assessment, evidence documents, and your UEN.{" "}
          <a
            href="https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/how-to-get-certified/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-amber-200"
          >
            Verify this list and contact details on the CSA website ↗
          </a>
        </p>
      </div>

      {/* CB cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {CERT_BODIES.map((cb) => {
          const active = selected.name === cb.name;
          return (
            <button
              key={cb.name}
              onClick={() => setSelected(cb)}
              className={`rounded-xl border p-4 text-left transition ${
                active
                  ? "border-csa-500/50 bg-csa-900/20 ring-1 ring-csa-500/30"
                  : "border-ink-700/60 bg-ink-900/40 hover:border-ink-600"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-white leading-snug">{cb.name}</p>
                {active && <Pill tone="good">Selected</Pill>}
              </div>
              <p className="mt-1.5 text-[11px] text-brand-300/70">
                {cb.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}
              </p>
              {cb.phone && <p className="mt-1 text-[11px] text-brand-300/60">{cb.phone}</p>}
              <p className="mt-2 text-[11px] leading-relaxed text-brand-100/60">{cb.notes}</p>
            </button>
          );
        })}
      </div>

      {/* Email template */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Draft email to {selected.shortName}</h2>
            <p className="text-[12px] text-brand-100/60 mt-0.5">
              Copy and send from your work email. Replace fields in [ ] with your details.
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg border border-csa-600/60 bg-csa-900/30 px-4 py-2 text-[13px] font-semibold text-csa-200 transition hover:bg-csa-800/40 active:scale-[0.97]"
          >
            {copied ? "✓ Copied to clipboard" : "📋 Copy for Outlook"}
          </button>
        </div>

        <pre className="w-full overflow-x-auto rounded-lg bg-ink-950/80 border border-ink-700/40 p-4 font-mono text-[11px] leading-relaxed text-brand-100/80 select-all whitespace-pre-wrap">
          {emailBody}
        </pre>

        <div className={`grid gap-3 pt-1 ${selected.email || selected.phone ? "grid-cols-3" : "grid-cols-1"}`}>
          {selected.email && (
            <div className="rounded-lg border border-ink-700/40 bg-ink-900/40 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-brand-300">Email</p>
              <p className="mt-1 text-[11px] font-medium text-white break-all">{selected.email}</p>
            </div>
          )}
          {selected.phone && (
            <div className="rounded-lg border border-ink-700/40 bg-ink-900/40 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-brand-300">Phone</p>
              <p className="mt-1 text-[11px] font-medium text-white">{selected.phone}</p>
            </div>
          )}
          <div className="rounded-lg border border-ink-700/40 bg-ink-900/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-brand-300">Website</p>
            <a
              href={selected.website}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-[11px] font-medium text-csa-300 hover:underline underline-offset-2"
            >
              Visit ↗
            </a>
          </div>
        </div>
      </Card>

      <p className="text-center text-[11px] text-brand-200/40">
        Source:{" "}
        <a
          href="https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/how-to-get-certified/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-brand-200/60"
        >
          CSA — How to Get Certified
        </a>
        {" "}· Always verify contact details on the CSA website before sending
      </p>

      {/* ── Reset all ──────────────────────────────────────────────────────── */}
      <div className="border-t border-brand-700/30 pt-8">
        <div className="rounded-xl border border-red-800/30 bg-red-950/20 p-5">
          <p className="text-sm font-semibold text-red-300">Reset all data</p>
          <p className="mt-1 text-[12px] leading-relaxed text-brand-100/60">
            Clears all answers, scan results, organisation details, and assessment progress from this browser.
            This cannot be undone.
          </p>
          <button
            onClick={handleReset}
            className={`mt-4 rounded-lg border px-4 py-2 text-[13px] font-semibold transition ${
              confirmReset
                ? "border-red-500/60 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                : "border-red-800/40 bg-red-950/30 text-red-400/80 hover:border-red-700/60 hover:text-red-300"
            }`}
          >
            {confirmReset ? "⚠ Click again to confirm reset" : "Reset all default values"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useStore } from "@/components/store";
import { Card, Pill, SectionTitle } from "@/components/ui";

// ── CSA-appointed Certification Bodies for Cyber Essentials Mark ─────────────
// Source: https://www.csa.gov.sg/our-programmes/cybersecurity-certification/cyber-essentials/certification-bodies
// Last verified: August 2026

const CERT_BODIES = [
  {
    name: "CyberTrust Asia Pte Ltd",
    shortName: "CyberTrust Asia",
    email: "certbody@cybertrust-asia.com.sg",
    website: "https://www.cybertrust-asia.com.sg",
    phone: "+65 6908 6263",
    address: "10 Anson Road, #10-11 International Plaza, Singapore 079903",
    notes: "Specialist in SME cyber certifications; conducts assessments island-wide.",
  },
  {
    name: "SAIQA Pte Ltd",
    shortName: "SAIQA",
    email: "ce-assessment@saiqa.com.sg",
    website: "https://www.saiqa.com.sg",
    phone: "+65 6970 0138",
    address: "8 Shenton Way, #47-01 AXA Tower, Singapore 068811",
    notes: "Accredited by Singapore Accreditation Council (SAC). Offers bundled CE + CT packages.",
  },
  {
    name: "Wizlynx Pte Ltd",
    shortName: "Wizlynx",
    email: "cemarks@wizlynx.com.sg",
    website: "https://www.wizlynx.com",
    phone: "+65 6970 0990",
    address: "1 Fullerton Road, #02-01 One Fullerton, Singapore 049213",
    notes: "International assessor with offices across Asia-Pacific.",
  },
  {
    name: "NCS Pte Ltd",
    shortName: "NCS",
    email: "cyberessentials@ncs.com.sg",
    website: "https://www.ncs.co",
    phone: "+65 6556 8000",
    address: "5 Seletar Aerospace View, Singapore 798946",
    notes: "Part of the Singtel Group. Strong in government and large enterprise assessments.",
  },
  {
    name: "Bureau Veritas Singapore Pte Ltd",
    shortName: "Bureau Veritas",
    email: "sg.cyberessentials@bureauveritas.com",
    website: "https://www.bureauveritas.com.sg",
    phone: "+65 6270 0670",
    address: "390 Havelock Road, #07-01 King's Centre, Singapore 169662",
    notes: "Global certification body with ISO 27001 and CE Mark assessment capability.",
  },
  {
    name: "TÜV SÜD PSB Pte Ltd",
    shortName: "TÜV SÜD PSB",
    email: "psb.cyberessentials@tuvsud.com",
    website: "https://www.tuvsud.com/en-sg",
    phone: "+65 6885 1333",
    address: "3 Science Park Drive, Singapore 118223",
    notes: "SAC-accredited. Long-standing CB with experience across manufacturing and technology sectors.",
  },
];

function buildEmail(body: typeof CERT_BODIES[0], org: { name: string; uen: string; sector: string }, domain: string | null, completion: number, readinessPercent: number): string {
  const today = new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
  return `To: ${body.email}
Subject: Cyber Essentials Mark — Assessment Submission — ${org.name || "[Your Organisation Name]"}

Dear ${body.shortName} Assessment Team,

I am writing to engage your organisation as our appointed certification body for the CSA Cyber Essentials Mark assessment.

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
CSA Cyber Essentials Mark V202503 · https://www.csa.gov.sg/our-programmes/cybersecurity-certification/cyber-essentials`;
}

export default function CertificationPage() {
  const { org, domain, readiness } = useStore();
  const [selected, setSelected] = useState(CERT_BODIES[0]);
  const [copied, setCopied] = useState(false);

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
            href="https://www.csa.gov.sg/our-programmes/cybersecurity-certification/cyber-essentials/certification-bodies"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-amber-200"
          >
            Verify this list on the CSA website ↗
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
              <p className="mt-1.5 text-[11px] text-brand-300/70">{cb.website.replace("https://", "")}</p>
              <p className="mt-1 text-[11px] text-brand-300/60">{cb.phone}</p>
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
            className="shrink-0 rounded-lg border border-ink-600/60 bg-ink-900/60 px-3 py-1.5 text-[12px] font-semibold text-brand-200 transition hover:border-brand-500/60"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <pre className="w-full overflow-x-auto rounded-lg bg-ink-950/80 border border-ink-700/40 p-4 font-mono text-[11px] leading-relaxed text-brand-100/80 select-all whitespace-pre-wrap">
          {emailBody}
        </pre>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="rounded-lg border border-ink-700/40 bg-ink-900/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-brand-300">Email</p>
            <p className="mt-1 text-[11px] font-medium text-white break-all">{selected.email}</p>
          </div>
          <div className="rounded-lg border border-ink-700/40 bg-ink-900/40 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-brand-300">Phone</p>
            <p className="mt-1 text-[11px] font-medium text-white">{selected.phone}</p>
          </div>
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

        <p className="text-[11px] text-brand-200/40">
          Address: {selected.address}
        </p>
      </Card>

      <p className="text-center text-[11px] text-brand-200/40">
        Source:{" "}
        <a
          href="https://www.csa.gov.sg/our-programmes/cybersecurity-certification/cyber-essentials/certification-bodies"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-brand-200/60"
        >
          CSA — Appointed Certification Bodies for Cyber Essentials
        </a>
        {" "}· Verify contact details before sending
      </p>
    </div>
  );
}

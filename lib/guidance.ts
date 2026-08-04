/**
 * Guidance, toolkits and the support ecosystem.
 *
 * The Guide, Integrate and hand-off capabilities. Everything an SME is pointed
 * at here is either a CSA resource or a named scheme it can actually apply to —
 * the failure mode of assessment tools is ending on a gap list with no next step
 * and no money attached to it.
 */

import type { MeasureId } from "./ce-framework";

export interface MeasureGuidance {
  measureId: MeasureId;
  /** Concrete first moves, ordered. */
  steps: string[];
  /** Where a hardening baseline for this measure comes from. */
  benchmark?: string;
  toolkit: { label: string; url: string };
}

const CSA_TOOLKITS = "https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/sg-cyber-safe-toolkits";

export const GUIDANCE: MeasureGuidance[] = [
  {
    measureId: "A.1",
    steps: [
      "Pick a training source — CSA's free Cyber Safe toolkits are enough to satisfy the clause for most SMEs.",
      "Run a session for all staff and keep the attendance list; that list is the evidence.",
      "Write a one-page cyber hygiene guideline covering phishing, passphrases, MFA, BYOD, data handling and how to report an incident.",
      "Diarise a refresh in twelve months.",
    ],
    toolkit: { label: "SG Cyber Safe toolkit for employees", url: CSA_TOOLKITS },
  },
  {
    measureId: "A.2",
    steps: [
      "Start the inventory in a spreadsheet — CSA accepts this, you do not need a tool.",
      "Conduct a physical walkthrough and record every laptop, phone, server, router and connected device against its owner.",
      "Add every piece of software, its version, and its end-of-support date.",
      "Draw the network on one page, including the internet-facing assets this tool discovered.",
      "Flag anything past end-of-support and decide: replace, or isolate and document the risk.",
    ],
    benchmark: "CIS Controls v8 — Control 1 (Enterprise Assets) and Control 2 (Software Assets)",
    toolkit: { label: "SG Cyber Safe toolkit for IT teams", url: CSA_TOOLKITS },
  },
  {
    measureId: "A.3",
    steps: [
      "List your business-critical data types and where each one is stored.",
      "Turn on disk encryption — BitLocker on Windows, FileVault on Mac — across all devices.",
      "Make sure every public service is HTTPS-only, which also closes the transit half of this measure.",
      "Restrict who can copy data out: block or log removable media, and review sharing settings on cloud drives.",
    ],
    benchmark: "CIS Controls v8 — Control 3 (Data Protection)",
    toolkit: { label: "SG Cyber Safe toolkit for IT teams", url: CSA_TOOLKITS },
  },
  {
    measureId: "A.4",
    steps: [
      "Confirm anti-malware is installed and reporting on every endpoint, including servers.",
      "Turn on real-time scanning and automatic definition updates.",
      "Enable the firewall on the perimeter router and on each endpoint.",
      "Tell staff how to report a suspected infection, and make it a no-blame process.",
    ],
    benchmark: "CIS Controls v8 — Control 10 (Malware Defenses)",
    toolkit: { label: "SG Cyber Safe toolkit for IT teams", url: CSA_TOOLKITS },
  },
  {
    measureId: "A.5",
    steps: [
      "Export the user list from Microsoft 365 or Google Workspace — that is your account inventory.",
      "Turn on MFA for every administrator today, then extend it to all users.",
      "Give admins a separate admin account and stop using it for email and browsing.",
      "Remove accounts for people who have left. Check this against your HR leaver list.",
      "Change every default password on routers, NAS boxes, cameras and printers.",
    ],
    benchmark: "CIS Controls v8 — Controls 5 (Account Management) and 6 (Access Control)",
    toolkit: { label: "SG Cyber Safe toolkit for IT teams", url: CSA_TOOLKITS },
  },
  {
    measureId: "A.6",
    steps: [
      "Adopt a published hardening baseline rather than writing your own — CIS Benchmarks cover Windows, macOS, Microsoft 365, Google Workspace and the major cloud platforms, and are free to download.",
      "Fix what this tool found on your internet-facing estate: security headers, email authentication, and any deprecated TLS versions.",
      "Disable services, ports and features you are not using.",
      "Turn on audit logging and decide how long you keep the logs.",
    ],
    benchmark:
      "CIS Benchmarks — free PDFs per platform; CIS-CAT Pro in CIS SecureSuite automates the same checks internally",
    toolkit: { label: "SG Cyber Safe toolkit for IT teams", url: CSA_TOOLKITS },
  },
  {
    measureId: "A.7",
    steps: [
      "Turn on automatic updates for operating systems and browsers where you safely can.",
      "Write down a target: critical patches within a set number of days.",
      "Include firmware — routers, firewalls and NAS boxes are the ones everyone forgets.",
      "Check the end-of-support list from your asset inventory; unsupported software cannot be patched at all.",
    ],
    benchmark: "CIS Controls v8 — Control 7 (Continuous Vulnerability Management)",
    toolkit: { label: "SG Cyber Safe toolkit for IT teams", url: CSA_TOOLKITS },
  },
  {
    measureId: "A.8",
    steps: [
      "Decide what you cannot trade without, and back that up first.",
      "Automate it. A backup that depends on someone remembering is not a backup.",
      "Keep one copy offline or immutable — ransomware goes looking for the backup, and a synced cloud drive is not isolated.",
      "Restore something. An untested backup is a hypothesis, and this is the clause that most often fails at audit.",
    ],
    benchmark: "CIS Controls v8 — Control 11 (Data Recovery)",
    toolkit: { label: "SG Cyber Safe toolkit for IT teams", url: CSA_TOOLKITS },
  },
  {
    measureId: "A.9",
    steps: [
      "Write the plan on two pages: who decides, who calls whom, and what gets switched off first.",
      "Put the phone numbers in it — your IT vendor, your bank, SingCERT, and PDPC if personal data is involved.",
      "Tell the people named in it that they are named in it.",
      "Run a tabletop once: talk through a ransomware morning and see what the plan does not answer.",
    ],
    benchmark: "CIS Controls v8 — Control 17 (Incident Response Management)",
    toolkit: { label: "SingCERT incident reporting", url: "https://www.csa.gov.sg/singcert" },
  },
];

export const GUIDANCE_BY_MEASURE = new Map(GUIDANCE.map((g) => [g.measureId, g]));

// Funding routes now live in `sectors.ts` (routed per sector) and provider
// selection in `providers.ts` (gated on readiness), so this file stays focused
// on per-measure remediation guidance.

// ── Certification hand-off ──────────────────────────────────────────────────

export const CERTIFICATION_STEPS = [
  {
    title: "Complete the self-assessment",
    detail:
      "Every mandatory clause answered, with an evidence reference against each one. This tool produces that as the results tab.",
  },
  {
    title: "Assemble the evidence pack",
    detail:
      "The assessor reads documents, not claims. Each evidence reference in your results tab should point at a real file — the inventory, the training register, the backup restore test, the incident response plan.",
  },
  {
    title: "Appoint a certification body",
    detail:
      "CSA-appointed certification bodies conduct the independent assessment. Fees vary, so quote more than one.",
  },
  {
    title: "Independent assessment",
    detail:
      "The assessor verifies your documentation and confirms the measures are met. Gaps found here become findings you must close before the mark is issued.",
  },
  {
    title: "Certification",
    detail:
      "The Cyber Essentials mark is valid for three years. Continuous monitoring keeps you from drifting out of compliance in year two.",
  },
];

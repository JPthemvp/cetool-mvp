/**
 * Structured questions for every human-only CE clause.
 *
 * "Human-only" means no scanner or agent can settle the clause — the answer
 * lives in how the organisation behaves: training records, approval processes,
 * vendor contracts, physical access controls, backup test logs.
 *
 * 43 clauses total, grouped by measure. Each question has three to four
 * options (yes / partial / no, and occasionally na) so the wizard can map
 * directly to the assessment answer model without free text.
 *
 * Fix log:
 *   - A.5.4(g): was mapped to "accounts disabled when employee leaves" → now
 *     correctly mapped to "third-party / contractor access control"
 *   - A.9.4(c): was mapped to A.9.4(d) (exercise) → corrected to post-incident review
 *   - A.9.4(d): exercise the plan (new)
 *   - Added 35 clauses that were missing from the original 8-question wizard
 */

export interface WizardQuestion {
  clauseId: string;
  measureId: string;
  measureName: string;
  question: string;
  options: Array<{ value: string; label: string }>;
  hint: string;
}

const YES_PARTIAL_NO = [
  { value: "yes", label: "Yes — in place" },
  { value: "partial", label: "Partly — incomplete" },
  { value: "no", label: "No — not yet" },
];

const YES_PARTIAL_NO_NA = [
  { value: "yes", label: "Yes — in place" },
  { value: "partial", label: "Partly — incomplete" },
  { value: "no", label: "No — not yet" },
  { value: "na", label: "N/A — not applicable" },
];

export const HUMAN_WIZARD_QUESTIONS: WizardQuestion[] = [
  // ── A.1 Assets: People ───────────────────────────────────────────────────
  {
    clauseId: "A.1.4(a)",
    measureId: "A.1",
    measureName: "A.1 · People",
    question:
      "Does every employee receive cybersecurity awareness and data protection training?",
    options: [
      { value: "yes", label: "Yes — documented and delivered to all staff" },
      { value: "partial", label: "Partly — some staff trained, not all" },
      { value: "no", label: "No — not yet implemented" },
    ],
    hint: "Self-learning materials, external providers, and online courses all count. CSA's free e-learning below satisfies this.",
  },
  {
    clauseId: "A.1.4(b)",
    measureId: "A.1",
    measureName: "A.1 · People",
    question: "Do you have written cyber hygiene guidelines that staff follow day-to-day?",
    options: YES_PARTIAL_NO,
    hint: "An email policy, acceptable use policy, or similar document counts.",
  },
  {
    clauseId: "A.1.4(c)",
    measureId: "A.1",
    measureName: "A.1 · People",
    question:
      "Do your guidelines cover phishing/deepfakes, MFA, BYOD, data handling, remote work, and how to report an incident?",
    options: YES_PARTIAL_NO,
    hint: "All six topics should be covered. A one-page quick-reference with these headings is enough.",
  },
  {
    clauseId: "A.1.4(d)",
    measureId: "A.1",
    measureName: "A.1 · People",
    question: "Is training tailored for leadership, general staff, and personal-data handlers separately?",
    options: [
      { value: "yes", label: "Yes — role-based training in place" },
      { value: "partial", label: "Partly — differentiated for some roles" },
      { value: "no", label: "No — same training for everyone" },
    ],
    hint: "This is a 'should' (recommendation), not a 'shall'. Even labelling sections in one course satisfies it.",
  },
  {
    clauseId: "A.1.4(e)",
    measureId: "A.1",
    measureName: "A.1 · People",
    question: "Is cybersecurity awareness training refreshed at least once a year?",
    options: YES_PARTIAL_NO,
    hint: "A dated completion record covering two consecutive years is the evidence an assessor expects.",
  },

  // ── A.2 Assets: Hardware and software ────────────────────────────────────
  {
    clauseId: "A.2.4(c)",
    measureId: "A.2",
    measureName: "A.2 · Hardware & Software",
    question: "Does each hardware record in your inventory show owner, location, and support/EOS status?",
    options: YES_PARTIAL_NO,
    hint: "Owner, location and end-of-support date are the three columns assessors look for.",
  },
  {
    clauseId: "A.2.4(e)",
    measureId: "A.2",
    measureName: "A.2 · Hardware & Software",
    question: "Is the asset inventory reviewed on a regular schedule?",
    options: YES_PARTIAL_NO,
    hint: "Quarterly is good practice. Show a review log with dates and the reviewer's name.",
  },
  {
    clauseId: "A.2.4(g)",
    measureId: "A.2",
    measureName: "A.2 · Hardware & Software",
    question:
      "For any end-of-support asset you must keep, are compensating controls in place and the risk formally documented?",
    options: [
      ...YES_PARTIAL_NO,
      { value: "na", label: "N/A — no EOS assets in use" },
    ],
    hint: "Network isolation, restricted access, or enhanced monitoring are typical compensating controls.",
  },
  {
    clauseId: "A.2.4(h)",
    measureId: "A.2",
    measureName: "A.2 · Hardware & Software",
    question: "Is there an approval step before new hardware or software enters the environment?",
    options: YES_PARTIAL_NO,
    hint: "An email approval trail or a simple request form both satisfy this.",
  },
  {
    clauseId: "A.2.4(i)",
    measureId: "A.2",
    measureName: "A.2 · Hardware & Software",
    question: "Does the inventory record the date each asset was approved?",
    options: YES_PARTIAL_NO,
    hint: "A single 'date approved' column in your spreadsheet is enough.",
  },
  {
    clauseId: "A.2.4(k)",
    measureId: "A.2",
    measureName: "A.2 · Hardware & Software",
    question: "Is data securely wiped or destroyed from devices before they are disposed of?",
    options: YES_PARTIAL_NO,
    hint: "A documented wipe procedure or third-party destruction certificate is the evidence.",
  },
  {
    clauseId: "A.2.4(l)",
    measureId: "A.2",
    measureName: "A.2 · Hardware & Software",
    question: "Are all disposals logged and removed from the inventory?",
    options: YES_PARTIAL_NO,
    hint: "A disposal log tied to inventory entries satisfies this.",
  },

  // ── A.3 Assets: Data ─────────────────────────────────────────────────────
  {
    clauseId: "A.3.4(a)",
    measureId: "A.3",
    measureName: "A.3 · Data",
    question: "Do you have an inventory of your business-critical data and where it lives?",
    options: YES_PARTIAL_NO,
    hint: "A spreadsheet listing data type, storage location, and data owner is the minimum.",
  },
  {
    clauseId: "A.3.4(b)",
    measureId: "A.3",
    measureName: "A.3 · Data",
    question: "Is the data inventory reviewed at least once a year?",
    options: YES_PARTIAL_NO,
    hint: "Show a dated review record. Annual is the minimum; quarterly when the data landscape changes frequently.",
  },
  {
    clauseId: "A.3.4(d)",
    measureId: "A.3",
    measureName: "A.3 · Data",
    question: "Are there controls preventing staff from moving critical data to personal accounts or removable media?",
    options: YES_PARTIAL_NO,
    hint: "DLP policies, USB restrictions, or a documented policy enforced with technical controls all count.",
  },
  {
    clauseId: "A.3.4(e)",
    measureId: "A.3",
    measureName: "A.3 · Data",
    question: "Is storage media securely destroyed or wiped before it is disposed of?",
    options: YES_PARTIAL_NO,
    hint: "Hard drives, USB sticks, and printed documents with sensitive data all fall under this clause.",
  },

  // ── A.4 Malware protection ────────────────────────────────────────────────
  {
    clauseId: "A.4.4(d)",
    measureId: "A.4",
    measureName: "A.4 · Malware Protection",
    question: "Are company-issued mobile devices protected against malware?",
    options: [
      ...YES_PARTIAL_NO,
      { value: "na", label: "N/A — no mobile devices in scope" },
    ],
    hint: "MDM with a mobile security policy, or a mobile security app, both count.",
  },
  {
    clauseId: "A.4.4(f)",
    measureId: "A.4",
    measureName: "A.4 · Malware Protection",
    question: "Are firewall rules reviewed on a schedule?",
    options: YES_PARTIAL_NO,
    hint: "A firewall review log with dates satisfies this. Annual is the minimum.",
  },
  {
    clauseId: "A.4.4(g)",
    measureId: "A.4",
    measureName: "A.4 · Malware Protection",
    question: "Are mobile devices protected when on untrusted networks (e.g. public Wi-Fi)?",
    options: [
      ...YES_PARTIAL_NO,
      { value: "na", label: "N/A — no mobile devices in scope" },
    ],
    hint: "A mandatory VPN policy enforced via MDM is the typical control.",
  },
  {
    clauseId: "A.4.4(j)",
    measureId: "A.4",
    measureName: "A.4 · Malware Protection",
    question: "Do all staff know how to report a suspected malware infection or suspicious file?",
    options: YES_PARTIAL_NO,
    hint: "A reporting procedure communicated to staff — even an email address and a one-liner in the guidelines — satisfies this.",
  },

  // ── A.5 Access Control ───────────────────────────────────────────────────
  {
    clauseId: "A.5.4(c)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Is access approved by a manager or system owner before it is granted?",
    options: YES_PARTIAL_NO,
    hint: "An email approval trail counts. Joiner forms with a manager sign-off are the standard.",
  },
  {
    clauseId: "A.5.4(e)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Are accounts disabled or deleted promptly when someone leaves or changes role?",
    options: [
      { value: "yes", label: "Yes — same day or within 24 hours" },
      { value: "partial", label: "Partly — done but sometimes delayed" },
      { value: "no", label: "No formal off-boarding process" },
    ],
    hint: "Covers email accounts, cloud services, and any system access. A leaver checklist is the evidence.",
  },
  {
    clauseId: "A.5.4(g)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Is vendor and contractor access limited to what is needed and time-bounded?",
    options: YES_PARTIAL_NO,
    hint: "A third-party access register with start and expiry dates is the evidence assessors look for.",
  },
  {
    clauseId: "A.5.4(h)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Do vendor contracts or agreements set out their security responsibilities?",
    options: YES_PARTIAL_NO,
    hint: "Contract clauses, vendor security agreements, or a supplier security schedule all satisfy this.",
  },
  {
    clauseId: "A.5.4(j)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Is physical access to server rooms and network equipment restricted?",
    options: [
      ...YES_PARTIAL_NO,
      { value: "na", label: "N/A — fully cloud-hosted, no on-premises hardware" },
    ],
    hint: "Locked server room, access log, and a list of who has a key or card satisfies this.",
  },
  {
    clauseId: "A.5.4(k)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Are user accounts reviewed periodically to confirm access is still appropriate?",
    options: YES_PARTIAL_NO,
    hint: "Access review reports with dates and outcomes. Microsoft Entra ID Access Reviews automate this if you use M365.",
  },
  {
    clauseId: "A.5.4(l)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Have default passwords been changed on every device, including routers, switches and IoT?",
    options: YES_PARTIAL_NO,
    hint: "A build checklist requiring credential change, or spot-check records, are the evidence.",
  },
  {
    clauseId: "A.5.4(n)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Is there a process to force password resets immediately after a suspected account compromise?",
    options: YES_PARTIAL_NO,
    hint: "The incident procedure should include credential reset as a step. SSPR in M365 automates this.",
  },
  {
    clauseId: "A.5.4(p)",
    measureId: "A.5",
    measureName: "A.5 · Access Control",
    question: "Is MFA enabled for all staff, not just admins?",
    options: YES_PARTIAL_NO,
    hint: "This is a 'should' (recommendation). M365 Conditional Access can enforce MFA for all users.",
  },

  // ── A.6 Secure Configuration ──────────────────────────────────────────────
  {
    clauseId: "A.6.4(d)",
    measureId: "A.6",
    measureName: "A.6 · Secure Configuration",
    question: "Does your IT vendor or managed service provider apply secure configuration on your behalf?",
    options: [
      ...YES_PARTIAL_NO,
      { value: "na", label: "N/A — all IT managed in-house" },
    ],
    hint: "The vendor service agreement should reference hardening standards. Ask your IT provider to confirm.",
  },
  {
    clauseId: "A.6.4(e)",
    measureId: "A.6",
    measureName: "A.6 · Secure Configuration",
    question: "Are system configurations reviewed periodically for drift from the secure baseline?",
    options: YES_PARTIAL_NO,
    hint: "A configuration review log with dates satisfies this. Tools like CIS-CAT or Defender Endpoint Secure Score can automate it.",
  },
  {
    clauseId: "A.6.4(h)",
    measureId: "A.6",
    measureName: "A.6 · Secure Configuration",
    question: "Are additional logs kept that would help investigate a security incident?",
    options: YES_PARTIAL_NO,
    hint: "Web proxy, email gateway, and VPN logs are examples. A list of log sources collected satisfies this.",
  },

  // ── A.7 Software Updates ──────────────────────────────────────────────────
  {
    clauseId: "A.7.4(b)",
    measureId: "A.7",
    measureName: "A.7 · Updates",
    question: "Are updates tested for compatibility before being deployed organisation-wide?",
    options: [
      ...YES_PARTIAL_NO,
      { value: "na", label: "N/A — auto-updates only, no staged rollout" },
    ],
    hint: "Even a 24-hour test on a small group of devices before wide rollout satisfies this.",
  },

  // ── A.8 Backup ────────────────────────────────────────────────────────────
  {
    clauseId: "A.8.4(b)",
    measureId: "A.8",
    measureName: "A.8 · Backup",
    question: "Are critical systems backed up often enough to match your recovery needs (RPO)?",
    options: [
      { value: "yes", label: "Yes — backup frequency matches our RPO" },
      { value: "partial", label: "Partly — backed up but frequency not formally set" },
      { value: "no", label: "No — backup frequency has not been defined" },
    ],
    hint: "RPO (Recovery Point Objective) is the maximum data loss you can tolerate. Daily backups = 24h RPO.",
  },
  {
    clauseId: "A.8.4(c)",
    measureId: "A.8",
    measureName: "A.8 · Backup",
    question: "Is there a defined backup approach for non-critical systems (not just critical data)?",
    options: YES_PARTIAL_NO,
    hint: "Even 'restore from scratch using the build runbook' is a valid approach if documented.",
  },
  {
    clauseId: "A.8.4(e)",
    measureId: "A.8",
    measureName: "A.8 · Backup",
    question: "Are server configurations and system state backed up, not just data files?",
    options: [
      ...YES_PARTIAL_NO,
      { value: "na", label: "N/A — no servers in scope, fully cloud/SaaS" },
    ],
    hint: "System state or disk images that allow full server restoration are what assessors look for.",
  },
  {
    clauseId: "A.8.4(g)",
    measureId: "A.8",
    measureName: "A.8 · Backup",
    question: "Is at least one backup copy kept offline or otherwise isolated from your production network?",
    options: YES_PARTIAL_NO,
    hint: "A backup connected to the same network as your systems can be encrypted by ransomware too. Offline, immutable, or air-gapped copies are the standard.",
  },
  {
    clauseId: "A.8.4(h)",
    measureId: "A.8",
    measureName: "A.8 · Backup",
    question: "Are backups run at least weekly?",
    options: YES_PARTIAL_NO,
    hint: "Daily is strongly recommended. Backup logs showing frequency are the evidence.",
  },
  {
    clauseId: "A.8.4(i)",
    measureId: "A.8",
    measureName: "A.8 · Backup",
    question: "Have you tested restoring from backup in the last 12 months, and did it succeed?",
    options: [
      { value: "yes", label: "Yes — restore tested and documented" },
      { value: "partial", label: "Partly — tested informally, not documented" },
      { value: "no", label: "No — restore has not been tested" },
    ],
    hint: "An untested backup is not a backup. A restore test can be as simple as recovering one folder.",
  },

  // ── A.9 Incident Response ─────────────────────────────────────────────────
  {
    clauseId: "A.9.4(a)",
    measureId: "A.9",
    measureName: "A.9 · Incident Response",
    question: "Do you have a written incident response plan naming who does what?",
    options: [
      { value: "yes", label: "Yes — documented and staff are aware of it" },
      { value: "partial", label: "Partly — exists informally" },
      { value: "no", label: "No — we will use the generated plan below" },
    ],
    hint: "The generated IR plan below satisfies this clause. Download it, add your names, and distribute it.",
  },
  {
    clauseId: "A.9.4(b)",
    measureId: "A.9",
    measureName: "A.9 · Incident Response",
    question: "Do the relevant staff know the plan exists and what their role is in an incident?",
    options: YES_PARTIAL_NO,
    hint: "A distribution record, a briefing attendance list, or even an email confirming receipt satisfies this.",
  },
  {
    clauseId: "A.9.4(c)",
    measureId: "A.9",
    measureName: "A.9 · Incident Response",
    question: "When an incident occurs, do you review what happened and update the plan accordingly?",
    options: [
      { value: "yes", label: "Yes — reviewed and documented" },
      { value: "partial", label: "Partly — discussed informally" },
      { value: "no", label: "No formal review process" },
      { value: "na", label: "N/A — no incidents have occurred" },
    ],
    hint: "Post-incident review notes are the evidence. The IR plan template includes a review section.",
  },
  {
    clauseId: "A.9.4(d)",
    measureId: "A.9",
    measureName: "A.9 · Incident Response",
    question: "Have you run a tabletop exercise or drill of the incident response plan?",
    options: [
      { value: "yes", label: "Yes — exercise completed and documented" },
      { value: "partial", label: "Partly — discussed but not formally exercised" },
      { value: "no", label: "No drill has been run" },
    ],
    hint: "A tabletop exercise can be done in 2 hours with your management team. An exercise report with date and participants is the evidence.",
  },
];

/** Group questions by measure for section headers. */
export function groupByMeasure(questions: WizardQuestion[]): Array<{
  measureId: string;
  measureName: string;
  questions: WizardQuestion[];
}> {
  const map = new Map<string, { measureId: string; measureName: string; questions: WizardQuestion[] }>();
  for (const q of questions) {
    const existing = map.get(q.measureId);
    if (existing) {
      existing.questions.push(q);
    } else {
      map.set(q.measureId, { measureId: q.measureId, measureName: q.measureName, questions: [q] });
    }
  }
  return [...map.values()];
}

/**
 * Sector obligations layered on top of Cyber Essentials.
 *
 * Cyber Essentials is sector-neutral, but the SME sitting in front of it is not.
 * A GP clinic contributing to NEHR carries duties under the Health Information
 * Act that Cyber Essentials never mentions — a two-hour incident report to MOH
 * being the sharpest of them. A social service agency has 80% funding available
 * that a manufacturer does not.
 *
 * So sector does not change the framework. It adds obligations onto specific
 * measures, and it changes which funding route is worth pointing at. That keeps
 * one clause set to maintain while still telling the clinic the thing it most
 * needs to hear.
 *
 * Regulatory detail changes. Every obligation here carries its source so the SME
 * can verify it, and the UI tells them to confirm with the regulator rather than
 * treating this tool as legal advice.
 */

import type { MeasureId } from "./ce-framework";

export type SectorId =
  | "healthcare-hia"
  | "social-service"
  | "finance"
  | "cii"
  | "general";

export interface SectorObligation {
  /** The Cyber Essentials measure this obligation attaches to. */
  measureId: MeasureId;
  title: string;
  detail: string;
  /** True when this goes beyond what Cyber Essentials alone would ask. */
  beyondCe: boolean;
}

export interface FundingRoute {
  name: string;
  body: string;
  summary: string;
  url: string;
}

export interface Sector {
  id: SectorId;
  name: string;
  /** The scoping question that identifies this sector, in the SME's own terms. */
  identifier: string;
  /** Who it covers, so the SME can tell whether it is them. */
  appliesTo: string;
  regulator?: string;
  /** Shown prominently when the sector is detected. */
  headline?: string;
  obligations: SectorObligation[];
  funding: FundingRoute[];
  sources: Array<{ label: string; url: string }>;
}

export const SECTORS: Sector[] = [
  {
    id: "healthcare-hia",
    name: "Licensed healthcare provider",
    identifier:
      "We are licensed under the Healthcare Services Act — for example a GP or dental clinic, clinical laboratory, radiology service, retail pharmacy or telemedicine provider",
    appliesTo:
      "Licensed healthcare providers that contribute to or access the National Electronic Health Record (NEHR), and the Health Information Management System (HIMS) vendors that support them.",
    regulator: "Ministry of Health",
    headline:
      "The Health Information Act adds duties that Cyber Essentials does not cover on its own — most urgently, a two-hour incident report to MOH. Treat these as additional to the nine measures, not instead of them.",
    obligations: [
      {
        measureId: "A.9",
        title: "Report confirmed incidents to MOH within 2 hours",
        detail:
          "A confirmed cybersecurity incident or data breach requires an initial report to MOH within two hours, and a detailed report within 14 days. Two hours is far tighter than most incident response plans assume — the phone number and the decision-maker must be in the plan itself, not looked up on the day.",
        beyondCe: true,
      },
      {
        measureId: "A.9",
        title: "Notify affected individuals of notifiable breaches",
        detail:
          "Where a data breach is likely to result in significant harm to the individuals affected, they must be notified. This sits alongside your PDPA obligations to PDPC, not instead of them.",
        beyondCe: true,
      },
      {
        measureId: "A.5",
        title: "Restrict health information to authorised personnel",
        detail:
          "Access to health information must be limited to staff who need it for care, with the access list maintained and reviewed. This is Cyber Essentials A.5 with a lower tolerance for drift — a locum who still has NEHR access is a finding.",
        beyondCe: false,
      },
      {
        measureId: "A.6",
        title: "Maintain audit trails of access to health information",
        detail:
          "Audit logging is required so that access to health information can be reconstructed. Cyber Essentials already asks for logging; the HIA makes it non-negotiable for the systems holding patient data, and MOH may audit it.",
        beyondCe: true,
      },
      {
        measureId: "A.6",
        title: "Ensure systems processing health data are secure and reliable",
        detail:
          "MOH published Cybersecurity and Data Security Essentials in March 2026 setting out the expected safeguards for storing, accessing, using and sharing health information. Read it alongside this assessment — it is the standard you will be audited against.",
        beyondCe: true,
      },
      {
        measureId: "A.3",
        title: "Health information is your most sensitive data class",
        detail:
          "When you inventory your business-critical data, patient records are the entry that matters. Record where they live, who the vendor is, and whether the system connects to NEHR.",
        beyondCe: false,
      },
    ],
    funding: [
      {
        name: "CISO-as-a-Service",
        body: "CSA",
        summary:
          "Subsidised cybersecurity consultancy. Useful here because an HIA-aware consultant can cover both the Cyber Essentials gaps and the MOH obligations in one engagement.",
        url: "https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/ciso-as-a-service-to-develop-cybersecurity-health-plan/",
      },
      {
        name: "SMEs Go Digital",
        body: "IMDA",
        summary:
          "Pre-approved solutions including clinic management systems and security tooling, with funding support attached.",
        url: "https://www.imda.gov.sg/how-we-can-help/smes-go-digital",
      },
    ],
    sources: [
      { label: "Health Information Act — official site", url: "https://www.healthinfo.gov.sg/" },
      {
        label: "Protecting health information (MOH)",
        url: "https://www.healthinfo.gov.sg/overview/protecting-health-information/",
      },
      { label: "HIA resources and implementation guides", url: "https://www.healthinfo.gov.sg/resources/" },
    ],
  },

  {
    id: "social-service",
    name: "Social service agency",
    identifier:
      "We are a social service agency — an NCSS member or an MSF-funded agency",
    appliesTo:
      "NCSS member agencies and MSF-funded social service agencies, including those holding beneficiary case files and personal data.",
    regulator: "National Council of Social Service",
    headline:
      "Social service agencies have the most generous funding route of any sector here — up to 80% of project cost, capped at $100,000. If cost is what is stopping you, this is the answer.",
    obligations: [
      {
        measureId: "A.3",
        title: "Beneficiary case data is highly sensitive personal data",
        detail:
          "Case files routinely contain health, family and financial circumstances. Under PDPA this is personal data whose disclosure would cause real harm, so it belongs at the top of your A.3 data inventory with encryption and tight access.",
        beyondCe: false,
      },
      {
        measureId: "A.5",
        title: "Volunteers and part-time staff need the same account discipline",
        detail:
          "Agencies typically run with volunteers, sessional staff and high turnover. That makes removing access when someone leaves the single item most likely to fail at audit. Tie account removal to your volunteer offboarding, not just HR.",
        beyondCe: false,
      },
      {
        measureId: "A.9",
        title: "PDPA breach notification to PDPC",
        detail:
          "A data breach likely to result in significant harm, or affecting 500 or more individuals, must be notified to PDPC and to affected individuals. Put the threshold and the contact in your incident response plan.",
        beyondCe: true,
      },
    ],
    funding: [
      {
        name: "Transformation Sustainability Scheme",
        body: "NCSS",
        summary:
          "Funds cybersecurity and data protection consultancy at up to 80% of cost, capped at $100,000 per project. Covers Data Protection Essentials and the Cyber Trust mark. Requires NCSS membership or MSF funding and a valid OHFSS assessment. Apply via the OurSG Grants portal.",
        url: "https://www.ncss.gov.sg/grants/organisation-development/transformation-sustainability-scheme/",
      },
      {
        name: "Tech-and-GO! Consultancy Subsidy",
        body: "NCSS",
        summary:
          "Subsidised consultancy for digital and cybersecurity projects, aimed at agencies without in-house IT.",
        url: "https://www.ncss.gov.sg/grants/organisation-development/tech-and-go/consultancy-subsidy/",
      },
      {
        name: "CISO-as-a-Service",
        body: "CSA",
        summary: "Available alongside NCSS funding for the Cyber Essentials pathway specifically.",
        url: "https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/ciso-as-a-service-to-develop-cybersecurity-health-plan/",
      },
    ],
    sources: [
      { label: "NCSS grants", url: "https://www.ncss.gov.sg/grants/" },
      { label: "For social service agencies", url: "https://www.ncss.gov.sg/for-social-service-agencies/" },
    ],
  },

  {
    id: "finance",
    name: "Financial institution",
    identifier: "We are regulated by the Monetary Authority of Singapore",
    appliesTo:
      "MAS-regulated financial institutions, including payment services licensees and capital markets intermediaries.",
    regulator: "Monetary Authority of Singapore",
    headline:
      "MAS expectations sit well above Cyber Essentials. Treat this assessment as a floor, and read it against the Technology Risk Management Guidelines and the Notice on Cyber Hygiene.",
    obligations: [
      {
        measureId: "A.5",
        title: "MAS Notice on Cyber Hygiene sets specific baselines",
        detail:
          "Administrative account controls and multi-factor authentication are mandated, not recommended. Your A.5 answers should be comfortably above the Cyber Essentials bar.",
        beyondCe: true,
      },
      {
        measureId: "A.9",
        title: "Incident notification to MAS",
        detail:
          "Relevant incidents carry their own notification timeframe to MAS, separate from PDPA. Confirm the current requirement for your licence class.",
        beyondCe: true,
      },
    ],
    funding: [
      {
        name: "CISO-as-a-Service",
        body: "CSA",
        summary: "Available, though most MAS-regulated entities will need capability beyond its scope.",
        url: "https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/ciso-as-a-service-to-develop-cybersecurity-health-plan/",
      },
    ],
    sources: [{ label: "MAS regulations and guidance", url: "https://www.mas.gov.sg/regulation" }],
  },

  {
    id: "cii",
    name: "Critical Information Infrastructure owner",
    identifier:
      "We have been designated a Critical Information Infrastructure owner under the Cybersecurity Act",
    appliesTo:
      "Organisations formally designated as CII owners by the Commissioner of Cybersecurity. If you have been designated, you will know — it arrives in writing.",
    regulator: "Cyber Security Agency of Singapore",
    headline:
      "CII designation brings statutory duties under the Cybersecurity Act that far exceed Cyber Essentials. This tool is not the right instrument for your obligations — use it for a subsidiary or non-CII entity if that is what you are assessing.",
    obligations: [
      {
        measureId: "A.9",
        title: "Statutory incident reporting under the Cybersecurity Act",
        detail:
          "CII owners must report prescribed cybersecurity incidents to the Commissioner within statutory timeframes, and comply with codes of practice, audits and risk assessments.",
        beyondCe: true,
      },
    ],
    funding: [],
    sources: [
      { label: "Cybersecurity Act and CII", url: "https://www.csa.gov.sg/legislation/cybersecurity-act" },
    ],
  },

  {
    id: "general",
    name: "General business",
    identifier: "None of the above",
    appliesTo: "Any organisation without additional sector-specific cybersecurity regulation.",
    obligations: [
      {
        measureId: "A.9",
        title: "PDPA breach notification to PDPC",
        detail:
          "Almost every organisation in Singapore handles personal data. A breach likely to cause significant harm, or affecting 500 or more individuals, must be notified to PDPC and to the affected individuals. Put this in your incident response plan.",
        beyondCe: true,
      },
      {
        measureId: "A.1",
        title: "PDPA training for staff handling personal data",
        detail:
          "Training works best when differentiated by role. For anyone handling personal data, PDPC's free e-learning covers both this measure and your PDPA accountability obligations.",
        beyondCe: false,
      },
    ],
    funding: [
      {
        name: "CISO-as-a-Service",
        body: "CSA",
        summary: "Subsidised consultancy to plan and close the gaps this assessment finds.",
        url: "https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/ciso-as-a-service-to-develop-cybersecurity-health-plan/",
      },
      {
        name: "SMEs Go Digital",
        body: "IMDA",
        summary: "Pre-approved cybersecurity solutions with funding support.",
        url: "https://www.imda.gov.sg/how-we-can-help/smes-go-digital",
      },
      {
        name: "Enterprise Development Grant",
        body: "Enterprise Singapore",
        summary: "Can cover consultancy and certification costs for qualifying projects.",
        url: "https://www.enterprisesg.gov.sg/financial-support/enterprise-development-grant",
      },
    ],
    sources: [{ label: "PDPC — data breach notification", url: "https://www.pdpc.gov.sg/" }],
  },
];

export const SECTOR_BY_ID = new Map(SECTORS.map((s) => [s.id, s]));

export function obligationsForMeasure(sectorId: SectorId, measureId: MeasureId): SectorObligation[] {
  return (SECTOR_BY_ID.get(sectorId)?.obligations ?? []).filter((o) => o.measureId === measureId);
}

/** Obligations that go beyond Cyber Essentials — the ones worth surfacing loudly. */
export function extraObligations(sectorId: SectorId): SectorObligation[] {
  return (SECTOR_BY_ID.get(sectorId)?.obligations ?? []).filter((o) => o.beyondCe);
}

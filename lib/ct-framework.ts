/**
 * CSA Cyber Trust mark — framework model.
 *
 * Source: "CSA Cybersecurity Certification: Cyber Trust mark", V202504,
 * Table 7 "Domains applicable for each cybersecurity preparedness tier".
 *
 * Twenty-two domains across five pillars, assessed at one of five tiers.
 * The eight domains CSA marks with `*` in Table 7 are the ones already covered
 * by Cyber Essentials measures — that footnote is the official bridge between
 * the two marks, and it is what lets this tool carry an SME's Cyber Essentials
 * answers forward into a Cyber Trust readiness view.
 */

import type { MeasureId } from "./ce-framework";

export type TierId = "supporter" | "practitioner" | "promoter" | "performer" | "advocate";

export interface Tier {
  id: TierId;
  /** Tier number, 1–5. */
  level: number;
  name: string;
  /** Domain count at this tier, per Table 7. */
  domainCount: number;
  profile: string;
}

export const TIERS: Tier[] = [
  {
    id: "supporter",
    level: 1,
    name: "Supporter",
    domainCount: 10,
    profile:
      "Small and some micro enterprises at a starter digital maturity level. The natural next step after the Cyber Essentials mark.",
  },
  {
    id: "practitioner",
    level: 2,
    name: "Practitioner",
    domainCount: 13,
    profile:
      "Medium and small organisations at a starter digital maturity level.",
  },
  {
    id: "promoter",
    level: 3,
    name: "Promoter",
    domainCount: 19,
    profile:
      "Medium and some large organisations at a literate digital maturity level.",
  },
  {
    id: "performer",
    level: 4,
    name: "Performer",
    domainCount: 21,
    profile:
      "Large and some medium organisations at a performer digital maturity level.",
  },
  {
    id: "advocate",
    level: 5,
    name: "Advocate",
    domainCount: 22,
    profile:
      "Large organisations at a leading digital maturity level.",
  },
];

export type PillarId =
  | "governance"
  | "education"
  | "asset-protection"
  | "secure-access"
  | "resilience";

export interface Pillar {
  id: PillarId;
  name: string;
}

export const PILLARS: Pillar[] = [
  { id: "governance", name: "Cyber governance and oversight" },
  { id: "education", name: "Cyber education" },
  { id: "asset-protection", name: "Information asset protection" },
  { id: "secure-access", name: "Secure access and environment" },
  { id: "resilience", name: "Cybersecurity resilience" },
];

export interface TrustDomain {
  /** Domain number 1–22 as published. */
  n: number;
  name: string;
  pillar: PillarId;
  /** Lowest tier at which this domain becomes assessable. */
  fromTier: TierId;
  /**
   * The Cyber Essentials measure that already covers this domain.
   * Present only for the eight domains CSA marks with `*` in Table 7.
   */
  ceMeasure?: MeasureId;
}

export const TRUST_DOMAINS: TrustDomain[] = [
  { n: 1, name: "Governance", pillar: "governance", fromTier: "promoter" },
  { n: 2, name: "Policies and procedure", pillar: "governance", fromTier: "promoter" },
  { n: 3, name: "Risk management", pillar: "governance", fromTier: "supporter" },
  { n: 4, name: "Cyber strategy", pillar: "governance", fromTier: "advocate" },
  { n: 5, name: "Compliance", pillar: "governance", fromTier: "supporter" },
  { n: 6, name: "Audit", pillar: "governance", fromTier: "performer" },

  { n: 7, name: "Training and awareness", pillar: "education", fromTier: "supporter", ceMeasure: "A.1" },

  { n: 8, name: "Asset management", pillar: "asset-protection", fromTier: "supporter", ceMeasure: "A.2" },
  { n: 9, name: "Data protection and privacy", pillar: "asset-protection", fromTier: "supporter", ceMeasure: "A.3" },
  { n: 10, name: "Backups", pillar: "asset-protection", fromTier: "supporter", ceMeasure: "A.8" },
  { n: 11, name: "Bring Your Own Device (BYOD)", pillar: "asset-protection", fromTier: "promoter" },
  { n: 12, name: "System security", pillar: "asset-protection", fromTier: "supporter", ceMeasure: "A.6" },
  { n: 13, name: "Anti-virus/anti-malware", pillar: "asset-protection", fromTier: "supporter", ceMeasure: "A.4" },
  { n: 14, name: "Secure Software Development Lifecycle (SDLC)", pillar: "asset-protection", fromTier: "promoter" },

  { n: 15, name: "Access control", pillar: "secure-access", fromTier: "supporter", ceMeasure: "A.5" },
  { n: 16, name: "Cyber threat management", pillar: "secure-access", fromTier: "performer" },
  { n: 17, name: "Third-party risk and oversight", pillar: "secure-access", fromTier: "promoter" },
  { n: 18, name: "Vulnerability assessment", pillar: "secure-access", fromTier: "promoter" },
  { n: 19, name: "Physical/environmental security", pillar: "secure-access", fromTier: "practitioner" },
  { n: 20, name: "Network security", pillar: "secure-access", fromTier: "practitioner" },

  { n: 21, name: "Incident response", pillar: "resilience", fromTier: "supporter", ceMeasure: "A.9" },
  { n: 22, name: "Business continuity/disaster recovery", pillar: "resilience", fromTier: "practitioner" },
];

const TIER_ORDER: TierId[] = ["supporter", "practitioner", "promoter", "performer", "advocate"];

export function tierRank(tier: TierId): number {
  return TIER_ORDER.indexOf(tier);
}

/** Domains assessed at the given tier — cumulative, per Table 7. */
export function domainsForTier(tier: TierId): TrustDomain[] {
  return TRUST_DOMAINS.filter((d) => tierRank(d.fromTier) <= tierRank(tier));
}

/** The eight domains Cyber Essentials already answers for you. */
export const CE_COVERED_DOMAINS = TRUST_DOMAINS.filter((d) => d.ceMeasure);

/**
 * How far a completed Cyber Essentials assessment carries you into a given
 * Cyber Trust tier. At Supporter, eight of the ten domains are CE measures —
 * which is the single most useful thing an SME can be told about what comes next.
 */
export function ceCoverageOfTier(tier: TierId): {
  total: number;
  covered: number;
  remaining: TrustDomain[];
} {
  const domains = domainsForTier(tier);
  const covered = domains.filter((d) => d.ceMeasure);
  return {
    total: domains.length,
    covered: covered.length,
    remaining: domains.filter((d) => !d.ceMeasure),
  };
}

export const PILLAR_BY_ID = new Map(PILLARS.map((p) => [p.id, p]));
export const TIER_BY_ID = new Map(TIERS.map((t) => [t.id, t]));

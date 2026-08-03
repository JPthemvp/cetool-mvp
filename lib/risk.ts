/**
 * Risk-based prioritisation of gaps.
 *
 * An SME that finishes a self-assessment with forty unmet clauses learns almost
 * nothing from a list of forty unmet clauses. What it needs is an ordering that
 * survives contact with a limited budget and one part-time IT person.
 *
 * The ordering here is likelihood × impact, where:
 *   likelihood rises when the scan actually observed the weakness from outside,
 *              and when the weakness is one attackers routinely use against SMEs;
 *   impact     reflects what the control stops — losing the business (backups,
 *              ransomware) outranks losing face (referrer headers).
 *
 * Effort is tracked separately rather than folded into the score, so the UI can
 * surface "high risk and cheap to fix" as its own answer. That combination is
 * what actually gets done in a company with no security team.
 */

import type { Clause, MeasureId } from "./ce-framework";
import { MEASURE_BY_ID } from "./ce-framework";
import type { ClauseSignal } from "./mapping";
import type { AnswerValue } from "./assessment";

export type ThreatId =
  | "ransomware"
  | "bec"
  | "data-breach"
  | "account-takeover"
  | "defacement"
  | "supply-chain"
  | "insider";

export const THREATS: Record<ThreatId, { name: string; note: string }> = {
  ransomware: {
    name: "Ransomware",
    note: "Encrypts everything and demands payment. The most common way an SME loses the ability to trade.",
  },
  bec: {
    name: "Business email compromise",
    note: "Fake invoices and payment redirection sent from — or appearing to be from — your domain.",
  },
  "data-breach": {
    name: "Data breach",
    note: "Customer or employee personal data exposed, triggering PDPA notification duties.",
  },
  "account-takeover": {
    name: "Account takeover",
    note: "A stolen or guessed credential used to log in as a real member of staff.",
  },
  defacement: {
    name: "Website compromise",
    note: "Your public site altered, or used to serve malware to your own customers.",
  },
  "supply-chain": {
    name: "Third-party compromise",
    note: "An attacker reaches you through a vendor who has access to your systems.",
  },
  insider: {
    name: "Insider or accidental loss",
    note: "Data walked out on a USB stick or emailed to the wrong place, deliberately or not.",
  },
};

export type Effort = "quick" | "moderate" | "project";

export const EFFORT_LABEL: Record<Effort, string> = {
  quick: "Under a day",
  moderate: "A few days",
  project: "Weeks, or vendor help",
};

interface RiskProfile {
  impact: number; // 1–5
  effort: Effort;
  threats: ThreatId[];
}

/** Baseline per measure, overridden per clause where the clause differs. */
const MEASURE_PROFILE: Record<MeasureId, RiskProfile> = {
  "A.1": { impact: 4, effort: "moderate", threats: ["bec", "account-takeover", "ransomware"] },
  "A.2": { impact: 3, effort: "moderate", threats: ["ransomware", "supply-chain"] },
  "A.3": { impact: 4, effort: "moderate", threats: ["data-breach", "insider"] },
  "A.4": { impact: 5, effort: "quick", threats: ["ransomware", "defacement"] },
  "A.5": { impact: 5, effort: "moderate", threats: ["account-takeover", "data-breach", "insider"] },
  "A.6": { impact: 4, effort: "moderate", threats: ["defacement", "account-takeover"] },
  "A.7": { impact: 5, effort: "quick", threats: ["ransomware", "defacement"] },
  "A.8": { impact: 5, effort: "moderate", threats: ["ransomware"] },
  "A.9": { impact: 4, effort: "moderate", threats: ["ransomware", "data-breach"] },
};

const CLAUSE_OVERRIDE: Record<string, Partial<RiskProfile>> = {
  // The handful that decide whether a ransomware hit is survivable.
  "A.8.4(g)": { impact: 5, effort: "moderate", threats: ["ransomware"] },
  "A.8.4(i)": { impact: 5, effort: "quick", threats: ["ransomware"] },
  "A.5.4(o)": { impact: 5, effort: "quick", threats: ["account-takeover", "bec"] },
  "A.5.4(l)": { impact: 5, effort: "quick", threats: ["account-takeover", "defacement"] },
  "A.5.4(f)": { impact: 5, effort: "quick", threats: ["ransomware", "account-takeover"] },
  "A.5.4(e)": { impact: 4, effort: "quick", threats: ["account-takeover", "insider"] },
  "A.7.4(a)": { impact: 5, effort: "moderate", threats: ["ransomware", "defacement"] },
  "A.4.4(a)": { impact: 5, effort: "quick", threats: ["ransomware"] },
  "A.9.4(a)": { impact: 4, effort: "moderate", threats: ["ransomware", "data-breach"] },
  "A.3.4(d)": { impact: 4, effort: "project", threats: ["data-breach", "insider"] },
  "A.6.4(b)": { impact: 3, effort: "quick", threats: ["defacement", "data-breach"] },
  "A.6.4(g)": { impact: 3, effort: "moderate", threats: ["ransomware", "data-breach"] },
  // Real, but nobody should fix these before the ones above.
  "A.6.4(i)": { impact: 2, effort: "quick", threats: ["insider"] },
  "A.2.4(i)": { impact: 1, effort: "quick", threats: [] },
  "A.2.4(l)": { impact: 2, effort: "quick", threats: ["data-breach"] },
  "A.1.4(e)": { impact: 2, effort: "quick", threats: ["bec"] },
};

export function riskProfile(clause: Clause): RiskProfile {
  return { ...MEASURE_PROFILE[clause.measureId], ...(CLAUSE_OVERRIDE[clause.id] ?? {}) };
}

export type Band = "critical" | "high" | "medium" | "low";

export interface Gap {
  clause: Clause;
  measureName: string;
  answer: AnswerValue;
  /** External evidence, when the scan had something to say about this clause. */
  signal?: ClauseSignal;
  /**
   * These three drive the ordering and are deliberately NOT shown as numbers in
   * the UI. They are judgement calls on a 1-5 scale; multiplying two of them
   * produces something that looks like a measurement and is not. The ranking is
   * defensible, the decimal is not, so only the band and the reason are surfaced.
   */
  likelihood: number;
  impact: number;
  score: number;
  band: Band;
  effort: Effort;
  threats: ThreatId[];
  /** Plain-English reason this sits where it does in the list. */
  why: string;
  /** True when the gap blocks certification, i.e. an unmet `shall`. */
  blocksCertification: boolean;
  /**
   * True when something actually established this gap — either the SME said the
   * control is absent, or the scan observed it. False means the clause is simply
   * unanswered, which is an open question rather than a known weakness.
   */
  evidenced: boolean;
}

const SEVERITY_LIKELIHOOD: Record<string, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

function likelihoodFor(clause: Clause, answer: AnswerValue, signal?: ClauseSignal): number {
  // Base likelihood: a `shall` exists because the risk is common.
  let base = clause.obligation === "shall" ? 3 : 2;

  // Confirmed absent is likelier to be exploited than merely unconfirmed.
  // "Not sure" sits between: in practice a control nobody can confirm is more
  // often missing than present, but we have not established that it is.
  if (answer === "no") base += 1;
  if (answer === "partial" || answer === "unsure") base += 0.5;

  // Directly observed from the internet: an attacker can see it too.
  if (signal?.failing.length) {
    const worst = Math.max(
      ...signal.failing.map((f) => SEVERITY_LIKELIHOOD[f.severity] ?? 1),
    );
    base = Math.max(base, worst);
    if (signal.confidence === "strong") base += 0.5;
  }

  return Math.min(5, Math.round(base * 2) / 2);
}

function bandFor(score: number, blocksCertification: boolean): Band {
  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return blocksCertification ? "high" : "medium";
  return "low";
}

function explain(
  clause: Clause,
  answer: AnswerValue,
  signal: ClauseSignal | undefined,
  profile: RiskProfile,
  blocks: boolean,
): string {
  const parts: string[] = [];

  // Be explicit about the difference between a control we know is missing and one
  // nobody has looked at yet. Both are open, but only one is a finding.
  if (answer === "unanswered" && !signal?.failing.length) {
    parts.push(
      "Nobody has answered this yet, so it is ranked on how often the underlying weakness is exploited rather than on anything observed here.",
    );
  } else if (answer === "no") {
    parts.push("You have confirmed this control is not in place.");
  } else if (answer === "partial") {
    parts.push("You have marked this as only partially in place.");
  } else if (answer === "unsure") {
    parts.push(
      "You said you are not sure. Find out before doing anything else here — an assessor will ask, and the answer decides whether this is a real gap or already done.",
    );
  }

  if (signal?.failing.length) {
    const f = signal.failing[0];
    parts.push(
      `We observed this from outside your network — ${f.title.toLowerCase()} — so an attacker scanning you sees it too.`,
    );
  }

  if (profile.threats.length) {
    parts.push(
      `Leaving it open supports ${profile.threats
        .slice(0, 2)
        .map((t) => THREATS[t].name.toLowerCase())
        .join(" and ")}.`,
    );
  }

  parts.push(
    blocks
      ? "It is a mandatory clause, so it must be closed before you can certify."
      : "It is a recommended clause — an assessor will note it but will not fail you on it.",
  );

  return parts.join(" ");
}

export function assessGap(
  clause: Clause,
  answer: AnswerValue,
  signal?: ClauseSignal,
): Gap {
  const profile = riskProfile(clause);
  const likelihood = likelihoodFor(clause, answer, signal);
  const score = Math.round(likelihood * profile.impact * 10) / 10;
  const blocksCertification = clause.obligation === "shall" && answer !== "yes" && answer !== "na";

  return {
    clause,
    measureName: MEASURE_BY_ID.get(clause.measureId)?.name ?? clause.measureId,
    answer,
    signal,
    likelihood,
    impact: profile.impact,
    score,
    band: bandFor(score, blocksCertification),
    effort: profile.effort,
    threats: profile.threats,
    why: explain(clause, answer, signal, profile, blocksCertification),
    blocksCertification,
    /** True when this is a live finding rather than merely an unanswered question. */
    evidenced: !!signal?.failing.length || answer === "no" || answer === "partial",
  };
}

export function prioritise(gaps: Gap[]): Gap[] {
  const bandOrder: Record<Band, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...gaps].sort((a, b) => {
    if (a.blocksCertification !== b.blocksCertification) return a.blocksCertification ? -1 : 1;
    if (bandOrder[a.band] !== bandOrder[b.band]) return bandOrder[a.band] - bandOrder[b.band];
    if (a.score !== b.score) return b.score - a.score;
    return a.clause.id.localeCompare(b.clause.id);
  });
}

/** High risk, low effort — the list to hand someone on a Friday afternoon. */
export function quickWins(gaps: Gap[], limit = 6): Gap[] {
  return prioritise(gaps.filter((g) => g.effort === "quick" && g.score >= 12)).slice(0, limit);
}

export const BAND_STYLE: Record<Band, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-csa-500/20 text-csa-300 ring-csa-500/45" },
  high: { label: "High", className: "bg-orange-500/15 text-orange-300 ring-orange-500/30" },
  medium: { label: "Medium", className: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  low: { label: "Low", className: "bg-brand-600/25 text-brand-200 ring-brand-500/30" },
};

/**
 * Assessment state and readiness scoring.
 *
 * The unit of truth is one answer per clause. Everything the tool shows —
 * measure scores, the gap list, the readiness verdict, the results tab that
 * replaces CSA's — is derived from that one map, so there is never a second
 * copy of the answers to drift out of step.
 */

import {
  CLAUSES,
  CLAUSES_BY_MEASURE,
  MEASURES,
  MEASURE_BY_ID,
  applicableClauses,
  type Clause,
  type MeasureId,
} from "./ce-framework";
import { clauseSignals, suggestedAnswer, type ClauseSignal } from "./mapping";
import { assessGap, prioritise, type Gap } from "./risk";
import type { Finding } from "./scan";

/**
 * `unsure` is deliberately distinct from `unanswered`. Unanswered means nobody
 * has looked yet; unsure means someone looked and genuinely does not know. Both
 * block certification, but only unsure earns an explanation, and the difference
 * tells you whether to send a person or a document.
 */
export type AnswerValue = "yes" | "partial" | "no" | "unsure" | "na" | "unanswered";

export interface Answer {
  value: AnswerValue;
  /** Where the answer came from — matters for assessor trust. */
  source: "scan" | "user" | "unanswered";
  note?: string;
  /** Free-text evidence reference the SME supplies. */
  evidenceRef?: string;
  updatedAt?: string;
}

export type Answers = Record<string, Answer>;

export interface Scope {
  mobile: boolean;
  byod: boolean;
  servers: boolean;
  cloud: boolean;
  ot: boolean;
  ai: boolean;
}

export const DEFAULT_SCOPE: Scope = {
  mobile: true,
  byod: false,
  servers: true,
  cloud: true,
  ot: false,
  ai: false,
};

export const UNANSWERED: Answer = { value: "unanswered", source: "unanswered" };

export function emptyAnswers(): Answers {
  return Object.fromEntries(CLAUSES.map((c) => [c.id, { ...UNANSWERED }]));
}

/**
 * Seed the assessment from a scan. Only ever pre-fills a negative — see the
 * reasoning in mapping.ts. Existing user answers are never overwritten.
 */
export function applyScanToAnswers(
  answers: Answers,
  findings: Finding[],
): { answers: Answers; prefilled: string[]; signals: Map<string, ClauseSignal> } {
  const signals = clauseSignals(findings);
  const next: Answers = { ...answers };
  const prefilled: string[] = [];

  for (const [clauseId, signal] of signals) {
    const existing = next[clauseId];
    if (existing && existing.source === "user") continue;

    const suggestion = suggestedAnswer(signal);
    if (!suggestion) continue;

    next[clauseId] = {
      value: suggestion,
      source: "scan",
      note: signal.failing[0]?.title,
      updatedAt: new Date().toISOString(),
    };
    prefilled.push(clauseId);
  }

  return { answers: next, prefilled, signals };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export interface MeasureScore {
  measureId: MeasureId;
  name: string;
  /** Applicable clauses under this measure, after scope filtering. */
  total: number;
  answered: number;
  met: number;
  partial: number;
  notMet: number;
  /** Answered, but the SME genuinely does not know. Needs a person, not a form. */
  unsure: number;
  na: number;
  /** Mandatory clauses still unmet — these block certification. */
  blocking: number;
  /** 0–100, counting partial as half credit. */
  percent: number;
  status: "ready" | "close" | "gaps" | "not-started";
}

function scopedClauses(scope: Scope): Clause[] {
  return applicableClauses({ mobile: scope.mobile, byod: scope.byod, servers: scope.servers });
}

export function scoreMeasure(
  measureId: MeasureId,
  answers: Answers,
  scope: Scope,
): MeasureScore {
  const inScope = new Set(scopedClauses(scope).map((c) => c.id));
  const clauses = CLAUSES_BY_MEASURE[measureId].filter((c) => inScope.has(c.id));

  let met = 0;
  let partial = 0;
  let notMet = 0;
  let unsure = 0;
  let na = 0;
  let blocking = 0;

  for (const c of clauses) {
    const a = answers[c.id]?.value ?? "unanswered";
    if (a === "yes") met++;
    else if (a === "partial") partial++;
    else if (a === "no") notMet++;
    else if (a === "unsure") unsure++;
    else if (a === "na") na++;

    if (c.obligation === "shall" && a !== "yes" && a !== "na") blocking++;
  }

  const assessable = clauses.length - na;
  const answered = met + partial + notMet + unsure + na;
  const percent = assessable > 0 ? Math.round(((met + partial * 0.5) / assessable) * 100) : 100;

  let status: MeasureScore["status"];
  if (answered === 0) status = "not-started";
  else if (blocking === 0) status = "ready";
  else if (blocking <= 2) status = "close";
  else status = "gaps";

  return {
    measureId,
    name: MEASURE_BY_ID.get(measureId)?.name ?? measureId,
    total: clauses.length,
    answered,
    met,
    partial,
    notMet,
    unsure,
    na,
    blocking,
    percent,
    status,
  };
}

export interface Readiness {
  measures: MeasureScore[];
  totalClauses: number;
  answered: number;
  completion: number;
  percent: number;
  blocking: number;
  /** True only when every applicable mandatory clause is answered "yes" or "n/a". */
  certifiable: boolean;
  verdict: string;
}

export function computeReadiness(answers: Answers, scope: Scope): Readiness {
  const measures = MEASURES.map((m) => scoreMeasure(m.id, answers, scope));
  const totalClauses = measures.reduce((s, m) => s + m.total, 0);
  const answered = measures.reduce((s, m) => s + m.answered, 0);
  const blocking = measures.reduce((s, m) => s + m.blocking, 0);

  const assessable = measures.reduce((s, m) => s + (m.total - m.na), 0);
  const weighted = measures.reduce((s, m) => s + (m.met + m.partial * 0.5), 0);
  // Nothing assessable means nothing outstanding, which is 100 — matching
  // scoreMeasure, which would otherwise disagree with the total it feeds.
  const percent = assessable > 0 ? Math.round((weighted / assessable) * 100) : 100;
  const completion = totalClauses > 0 ? Math.round((answered / totalClauses) * 100) : 0;

  const certifiable = blocking === 0 && completion === 100;

  let verdict: string;
  if (completion === 0) {
    verdict = "Not started. Run a scan or answer the first measure to begin.";
  } else if (completion < 100) {
    verdict = `${completion}% of clauses answered. Finish the assessment to get a certification verdict.`;
  } else if (certifiable) {
    verdict =
      "Every mandatory clause is met. You are in a position to submit for Cyber Essentials certification.";
  } else {
    verdict = `${blocking} mandatory clause${blocking === 1 ? "" : "s"} still unmet. Close ${
      blocking === 1 ? "it" : "them"
    } and you are ready to submit.`;
  }

  return { measures, totalClauses, answered, completion, percent, blocking, certifiable, verdict };
}

// ── Gaps ────────────────────────────────────────────────────────────────────

export function computeGaps(
  answers: Answers,
  scope: Scope,
  signals: Map<string, ClauseSignal>,
): Gap[] {
  const clauses = scopedClauses(scope);
  const gaps: Gap[] = [];

  for (const clause of clauses) {
    const answer = answers[clause.id]?.value ?? "unanswered";
    if (answer === "yes" || answer === "na") continue;
    gaps.push(assessGap(clause, answer, signals.get(clause.id)));
  }

  return prioritise(gaps);
}

// ── The results tab ─────────────────────────────────────────────────────────

export interface ResultRow {
  clauseId: string;
  measureId: MeasureId;
  measureName: string;
  obligation: "shall" | "should";
  requirement: string;
  answer: AnswerValue;
  source: Answer["source"];
  evidenceRef: string;
  remarks: string;
}

/**
 * The rows that replace CSA's current results tab. One row per applicable
 * clause, carrying the answer, where it came from, and the evidence reference —
 * which is what an assessor actually reads.
 */
export function buildResultRows(answers: Answers, scope: Scope): ResultRow[] {
  return scopedClauses(scope).map((clause) => {
    const a = answers[clause.id] ?? UNANSWERED;
    return {
      clauseId: clause.id,
      measureId: clause.measureId,
      measureName: MEASURE_BY_ID.get(clause.measureId)?.name ?? clause.measureId,
      obligation: clause.obligation,
      requirement: clause.title,
      answer: a.value,
      source: a.source,
      evidenceRef: a.evidenceRef ?? "",
      remarks: a.note ?? "",
    };
  });
}

export const ANSWER_LABEL: Record<AnswerValue, string> = {
  yes: "Met",
  partial: "Partially met",
  no: "Not met",
  unsure: "Not sure — needs checking",
  na: "Not applicable",
  unanswered: "Not answered",
};

export function toCsv(rows: ResultRow[], org: string, scannedAt: string): string {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const header = [
    "Clause",
    "Measure",
    "Obligation",
    "Requirement",
    "Status",
    "Answer source",
    "Evidence reference",
    "Remarks",
  ];
  const lines = [
    `"Cyber Essentials Tool — Cyber Essentials mark self-assessment results"`,
    `"Organisation",${esc(org)}`,
    `"Generated",${esc(scannedAt)}`,
    "",
    header.map(esc).join(","),
    ...rows.map((r) =>
      [
        r.clauseId,
        r.measureName,
        r.obligation,
        r.requirement,
        ANSWER_LABEL[r.answer],
        r.source === "scan" ? "Automated scan" : r.source === "user" ? "Self-declared" : "—",
        r.evidenceRef,
        r.remarks,
      ]
        .map(esc)
        .join(","),
    ),
  ];
  return lines.join("\n");
}

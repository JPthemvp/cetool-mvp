/**
 * The journey as an enforced sequence.
 *
 * Ten tabs on first load reads as homework, and an SME owner deciding whether to
 * bother will not read ten tabs. So the tool shows one step at a time: you see
 * what you are doing now and what you have already done, and the next page does
 * not exist until this one is finished.
 *
 * The cost is that a returning user cannot jump straight to Results. That is
 * handled by completion being sticky — once a step is done it stays unlocked, so
 * the constraint only bites on the first pass through.
 *
 * Two kinds of completion:
 *
 *   EVIDENCED — the tool can see it happened. A scan exists; every clause is
 *   answered. These complete on their own and cannot be faked past.
 *
 *   ACKNOWLEDGED — reading and deciding, which no program can detect. Assets,
 *   Prioritise and Guide are of this kind, so they complete when the user says
 *   so. Pretending to measure them would be theatre.
 */

export interface Step {
  id: string;
  href: string;
  label: string;
  /** Shown in the step header. */
  title: string;
  /** What finishing this step means, in the user's terms. */
  doneWhen: string;
  /** True when the tool detects completion rather than asking for it. */
  evidenced: boolean;
  /**
   * Nothing here changes state — the user reads and moves on. Marked so the UI
   * can say "Read and continue" rather than "Mark done", which would imply work
   * was completed and inflate the progress bar with a click.
   */
  reviewOnly?: boolean;
  /** Skippable without completing — currently only the local toolkit. */
  optional?: boolean;
  /**
   * When set, this step is only shown for the named pathway.
   * Users on other pathways skip it entirely.
   */
  pathwayOnly?: string;
}

/**
 * Three-click journey:
 *
 *   1. /start  — Corppass login + domain → auto-launches external scan
 *   2. /scan   — Download .exe scanner (or PS script) → results auto-import
 *   3. /review — Auto-populated assessment + short human wizard + export
 *
 * Legacy routes (/onboard, /discover, /prepare, /results, /toolkit, /guide,
 * /prioritise, /assets, /monitor, /integrate) remain reachable for power users
 * but are not part of the primary step sequence.
 */
export const STEPS: Step[] = [
  {
    id: "start",
    href: "/start",
    label: "1 · Start",
    title: "Log in and enter your domain",
    doneWhen: "Corppass login complete and domain entered.",
    evidenced: true,
  },
  {
    id: "scan",
    href: "/scan",
    label: "2 · Scan",
    title: "Scan your devices",
    doneWhen: "Device scan complete or skipped.",
    evidenced: true,
  },
  {
    id: "review",
    href: "/review",
    label: "3 · Review & Submit",
    title: "Review results and generate report",
    doneWhen: "Results reviewed and report exported.",
    evidenced: false,
  },
];

/**
 * Returns the steps relevant to a given pathway, hiding any steps
 * that are gated to a different pathway.
 */
export function activeSteps(pathway: string): Step[] {
  return STEPS.filter((s) => !s.pathwayOnly || s.pathwayOnly === pathway);
}

export const STEP_BY_HREF = new Map(STEPS.map((s) => [s.href, s]));
export const STEP_BY_ID = new Map(STEPS.map((s) => [s.id, s]));

export function stepIndex(href: string): number {
  return STEPS.findIndex((s) => s.href === href);
}

/** Signals the tool can verify on its own. */
export interface EvidenceInput {
  orgNamed: boolean;
  sectorChosen: boolean;
  scopingAnswered: boolean;
  scanRun: boolean;
  assessmentComplete: boolean;
}

export function autoCompleted(e: EvidenceInput): Set<string> {
  const done = new Set<string>();
  if (e.orgNamed && e.sectorChosen && e.scopingAnswered) done.add("start");
  if (e.scanRun) done.add("scan");
  if (e.assessmentComplete) done.add("review");
  return done;
}

export interface JourneyState {
  /** Every step considered finished, evidenced or acknowledged. */
  completed: Set<string>;
  /** The step the user is on: the first unfinished one. */
  currentIndex: number;
  /** Steps the user may open. */
  unlocked: Step[];
}

/**
 * Unlocking is prefix-based rather than per-step: everything up to and including
 * the first unfinished step is open. That keeps a user who completed steps 1-6
 * from being thrown back to step 3 because they later cleared an answer.
 */
export function resolveJourney(completed: Set<string>): JourneyState {
  let currentIndex = STEPS.findIndex((s) => !completed.has(s.id));
  if (currentIndex === -1) currentIndex = STEPS.length - 1;

  // A completed step further along implies everything before it was passed.
  let furthest = currentIndex;
  STEPS.forEach((s, i) => {
    if (completed.has(s.id) && i > furthest) furthest = i;
  });
  const reachable = Math.min(STEPS.length - 1, Math.max(currentIndex, furthest));

  return {
    completed,
    currentIndex,
    unlocked: STEPS.slice(0, reachable + 1),
  };
}

export function isUnlocked(state: JourneyState, href: string): boolean {
  return state.unlocked.some((s) => s.href === href);
}

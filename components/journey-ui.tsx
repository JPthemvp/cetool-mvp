"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "./store";
import { Button, Card, Meter } from "./ui";
import { STEPS, STEP_BY_HREF, activeSteps, isUnlocked, stepIndex } from "@/lib/journey";

/**
 * Sends anyone who lands on a locked step back to where they actually are.
 *
 * Mounted once in the layout rather than repeated in ten pages, so a new page
 * cannot be added and accidentally left ungated.
 */
export function StepGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { journey, ready, testMode, setTestMode } = useStore();

  // ?uat=1 turns the gate off; ?uat=0 turns it back on. Kept in the URL rather
  // than behind a hidden key combination so a tester can share the link.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = new URLSearchParams(window.location.search).get("uat");
    if (flag === "1" && !testMode) setTestMode(true);
    if (flag === "0" && testMode) setTestMode(false);
  }, [pathname, testMode, setTestMode]);

  useEffect(() => {
    if (!ready) return; // Wait for localStorage, or we bounce a returning user.
    if (testMode) return; // Every step is reachable while testing.

    // Read the flag from the URL as well as from state. Both effects run in the
    // same pass, so on a cold load with ?uat=1 the store has not updated yet and
    // this would redirect the tester away before test mode ever engaged.
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("uat") === "1"
    ) {
      return;
    }

    if (!STEP_BY_HREF.has(pathname)) return;
    if (isUnlocked(journey, pathname)) return;
    router.replace(STEPS[journey.currentIndex].href);
  }, [ready, pathname, journey, router, testMode]);

  return null;
}

/** Unmissable while the gate is off, so nobody demos from a bypassed build. */
export function TestModeBanner() {
  const { testMode, setTestMode } = useStore();
  if (!testMode) return null;

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/15">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 sm:px-6">
        <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-oncolor-dark">
          Test mode
        </span>
        <span className="text-[12px] leading-relaxed text-amber-100">
          Step order is not enforced — every page is reachable. Completion still updates
          normally, so scores and exports remain real.
        </span>
        <button
          onClick={() => setTestMode(false)}
          className="ml-auto text-[12px] font-medium text-amber-200 underline-offset-2 hover:underline"
        >
          Leave test mode
        </button>
      </div>
    </div>
  );
}

/** "Step 3 of 10" plus a bar — the journey's length without exposing its pages. */
export function StepHeader() {
  const pathname = usePathname();
  const { journey, started, pathway } = useStore();
  const step = STEP_BY_HREF.get(pathname);
  if (!started || !step) return null;

  const steps = activeSteps(pathway);
  const index = steps.findIndex((s) => s.href === pathname);
  const done = journey.completed.has(step.id);
  // Review steps count for less: clicking through a page you read is not the
  // same as answering the assessment, and a bar that treats them equally lies.
  const weight = (s: (typeof STEPS)[number]) => (s.reviewOnly || s.optional ? 0.4 : 1);
  const totalWeight = steps.reduce((t, s) => t + weight(s), 0);
  const earned = steps.reduce(
    (t, s) => t + (journey.completed.has(s.id) ? weight(s) : 0),
    0,
  );
  const percent = Math.round((earned / totalWeight) * 100);

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
          Step {index + 1} of {steps.length} · {step.label}
          {step.optional && <span className="ml-2 text-brand-200/70">· optional</span>}
        </p>
        <p className="flex items-center gap-2 text-xs tabular-nums text-brand-200/70">
          {done && <span className="text-emerald-400">✓ done</span>}
          {percent}% of the journey
        </p>
      </div>
      <div className="mt-2.5">
        <Meter value={percent} tone={done ? "good" : "brand"} />
      </div>
    </div>
  );
}

/**
 * The only way forward. Shows what finishing this step means, and refuses to
 * advance until an evidenced step has its evidence.
 */
export function StepFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { journey, acknowledgeStep, started, readiness, scan, org, pathway } = useStore();

  const step = STEP_BY_HREF.get(pathname);
  if (!started || !step) return null;

  const steps = activeSteps(pathway);
  const index = steps.findIndex((s) => s.href === pathname);
  const next = steps[index + 1];
  const done = journey.completed.has(step.id);

  // Why an evidenced step is not finished yet, in the user's terms.
  let blockedBecause: string | null = null;
  if (step.evidenced && !done) {
    if (step.id === "start") {
      const missing: string[] = [];
      if (!org.name.trim()) missing.push("your organisation's name");
      if (!org.scoping.boundary) missing.push("the scoping questions");
      blockedBecause = missing.length
        ? `Still needed: ${missing.join(", ")}.`
        : "Finish the questions above.";
    } else if (step.id === "discover") {
      blockedBecause = scan
        ? "The scan did not complete. Try again, or check outbound DNS is allowed."
        : "Run a scan against your domain to continue.";
    } else if (step.id === "prepare") {
      const left = readiness.totalClauses - Math.round((readiness.completion / 100) * readiness.totalClauses);
      blockedBecause = `${left} clause${left === 1 ? "" : "s"} still unanswered. 'Not sure' counts as an answer.`;
    }
  }

  const canAdvance = !step.evidenced || done;

  function advance() {
    acknowledgeStep(step!.id);
    if (next) router.push(next.href);
  }

  const previous = index > 0 ? steps[index - 1] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
      <Card className={`p-5 ${!next ? "border-emerald-500/30 bg-emerald-500/10" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-200/70">
              {!next ? "End of the journey" : done ? "Step complete" : "To finish this step"}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-50">
              {!next
                ? "Everything stays saved in this browser. Come back when you have closed a gap, and re-run the scan to see it move."
                : done
                  ? step.doneWhen
                  : (blockedBecause ?? step.doneWhen)}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {previous && (
              <Button variant="ghost" onClick={() => router.push(previous.href)}>
                ← {previous.label}
              </Button>
            )}
            {next && step.optional && !done && (
              <Button variant="ghost" onClick={advance}>
                Skip
              </Button>
            )}
            {next && (
              <Button onClick={advance} disabled={!canAdvance}>
                {done
                  ? next.label
                  : step.reviewOnly
                    ? `Read it · ${next.label}`
                    : `Mark done · ${next.label}`}{" "}
                →
              </Button>
            )}
          </div>
        </div>

        {next && !canAdvance && (
          <p className="mt-3 border-t border-brand-700/30 pt-3 text-[12px] leading-relaxed text-brand-200/70">
            This step completes on its own once the work above is done — there is nothing to
            click.
          </p>
        )}
      </Card>
    </div>
  );
}

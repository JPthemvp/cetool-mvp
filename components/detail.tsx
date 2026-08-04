"use client";

import { useState, type ReactNode } from "react";
import { useStore } from "./store";

/**
 * Two audiences, one tool.
 *
 * The person who most needs this is a business owner with no security
 * background. Clause codes, obligation keywords, likelihood arithmetic and raw
 * scan evidence are all noise to them — but they are exactly what an IT vendor
 * or an assessor needs to trust the output.
 *
 * So nothing is removed from the model, only from the page. Simple mode hides
 * the machinery; technical mode shows it; and any single card can be opened on
 * its own without changing the global setting.
 */

/** Renders children only in technical mode. */
export function Technical({ children }: { children: ReactNode }) {
  const { technical } = useStore();
  if (!technical) return null;
  return <>{children}</>;
}

/** Renders children only in simple mode — for plain-English substitutes. */
export function Simple({ children }: { children: ReactNode }) {
  const { technical } = useStore();
  if (technical) return null;
  return <>{children}</>;
}

/**
 * A per-item drill-down. Open in technical mode by default, collapsed in simple
 * mode, so a curious non-technical user can still look without being shown it
 * everywhere by default.
 */
export function Drilldown({
  label = "Technical detail",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const { technical } = useStore();
  const [open, setOpen] = useState(false);
  const isOpen = technical || open;

  return (
    <div className="mt-3">
      {!technical && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-700/60 px-2.5 py-1 text-[11px] font-medium text-brand-200/80 transition hover:border-brand-500/50 hover:text-brand-100"
        >
          <span aria-hidden className="text-[9px]">{open ? "▼" : "▶"}</span>
          {open ? `Hide ${label.toLowerCase()}` : label}
        </button>
      )}
      {isOpen && (
        <div className="mt-2.5 rounded-lg border border-ink-700/60 bg-ink-950/40 p-3">
          {children}
        </div>
      )}
    </div>
  );
}

/** The global switch, in the header. */
export function DetailToggle() {
  const { detailLevel, setDetailLevel } = useStore();

  return (
    <div
      role="group"
      aria-label="Level of detail"
      className="flex overflow-hidden rounded-lg border border-ink-600/80"
    >
      {(
        [
          ["simple", "Simple"],
          ["technical", "Technical"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          onClick={() => setDetailLevel(value)}
          aria-pressed={detailLevel === value}
          title={
            value === "simple"
              ? "Plain English, no clause numbers"
              : "Show clause codes, scores and raw evidence"
          }
          className={`px-2.5 py-1 text-[11px] font-semibold transition ${
            detailLevel === value
              ? "bg-brand-600 text-oncolor"
              : "text-brand-200/70 hover:text-brand-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * A clause reference. Shows the code in technical mode and nothing in simple
 * mode, so callers do not each have to branch.
 */
export function ClauseCode({ id, className = "" }: { id: string; className?: string }) {
  const { technical } = useStore();
  if (!technical) return null;
  return (
    <span
      className={`rounded bg-brand-500/12 px-1.5 py-0.5 font-mono text-[11px] text-brand-300 ring-1 ring-inset ring-brand-500/25 ${className}`}
    >
      {id}
    </span>
  );
}

/**
 * `shall` / `should` translated for the simple view. The distinction decides
 * certification so it is never hidden — only reworded.
 */
export function ObligationLabel({ obligation }: { obligation: "shall" | "should" }) {
  const { technical } = useStore();
  const required = obligation === "shall";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
        required
          ? "bg-amber-500/15 text-amber-300 ring-amber-500/30"
          : "bg-ink-700/50 text-brand-100/80 ring-ink-600"
      }`}
    >
      {technical ? obligation : required ? "Required" : "Recommended"}
    </span>
  );
}

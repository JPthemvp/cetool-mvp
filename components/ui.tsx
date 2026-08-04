import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-ink-700/60 bg-ink-900/60 shadow-lg shadow-ink-950/40 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="mb-8">
      {eyebrow && (
        <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
          <span className="inline-block h-3.5 w-1 rounded-full bg-csa-500" />
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      {lead && <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-brand-100/80">{lead}</p>}
    </header>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const tones = {
    neutral: "bg-ink-700/50 text-brand-100/80 ring-ink-600",
    good: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    warn: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    bad: "bg-csa-500/18 text-csa-300 ring-csa-500/40",
    info: "bg-brand-500/18 text-brand-300 ring-brand-500/35",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "ghost" | "subtle";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    // CSA red carries the primary action; blue carries structure and navigation.
    primary:
      "bg-csa-500 text-oncolor hover:bg-csa-400 shadow-lg shadow-csa-700/35",
    ghost:
      "border border-brand-600/70 text-brand-100 hover:border-brand-400 hover:bg-brand-700/25 hover:text-white",
    subtle: "bg-ink-800 text-brand-100 hover:bg-ink-700",
  };
  const cls = `${base} ${variants[variant]} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Meter({
  value,
  tone = "brand",
}: {
  value: number;
  tone?: "brand" | "good" | "warn" | "bad";
}) {
  const colors = {
    brand: "bg-gradient-to-r from-brand-600 to-brand-400",
    good: "bg-gradient-to-r from-emerald-600 to-emerald-400",
    warn: "bg-gradient-to-r from-amber-600 to-amber-400",
    bad: "bg-gradient-to-r from-csa-600 to-csa-400",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-850 ring-1 ring-inset ring-ink-700/60">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colors[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "good" | "warn" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warn"
        ? "text-amber-300"
        : tone === "bad"
          ? "text-csa-300"
          : "text-white";
  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-850/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-300/85">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-brand-100/75">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <Card className="p-10 text-center">
      <h3 className="text-lg font-semibold text-white/90">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-100/80">{body}</p>
      {action && (
        <div className="mt-6 flex justify-center">
          <Button href={action.href}>{action.label}</Button>
        </div>
      )}
    </Card>
  );
}

/**
 * The required marker.
 *
 * Sits at the top right of the field's label row, so a form can be scanned down
 * its right edge to see what must be filled — rather than reading every label.
 * Carries an accessible name because a bare asterisk means nothing to a screen
 * reader.
 */
export function RequiredMark() {
  return (
    <span
      className="ml-2 shrink-0 text-sm font-bold leading-none text-csa-400"
      title="Required"
      aria-label="required"
    >
      *
    </span>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-brand-50">{label}</span>
        {required && <RequiredMark />}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-brand-100/60">{hint}</span>}
    </label>
  );
}

/** Legend explaining the marker, shown once per form. */
export function RequiredLegend() {
  return (
    <p className="text-[12px] text-brand-100/70">
      <span className="font-bold text-csa-400">*</span> Required to continue
    </p>
  );
}

export const inputCls =
  "w-full rounded-lg border border-ink-600/80/80 bg-ink-950/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-brand-200/55 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25";

/** Checkbox and radio accent, so form controls pick up the CSA blue. */
export const checkCls =
  "h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-950 accent-[#2f7dbf]";

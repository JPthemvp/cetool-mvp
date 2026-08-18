"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "./store";
import { activeSteps } from "@/lib/journey";
import { ThemeToggle } from "./theme";

export function Nav() {
  const pathname = usePathname();
  const { readiness, onboarded, org, started, beginJourney, journey, testMode, pathway } = useStore();
  // DetailToggle removed — simple/technical distinction removed from UI

  // A deep link into a later step is itself a commitment. The gate decides
  // whether they may stay there; this only stops them landing without a nav.
  useEffect(() => {
    if (!started && pathname !== "/" && pathname !== "/onboard" && pathname !== "/start") beginJourney();
  }, [started, pathname, beginJourney]);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-700/40 bg-ink-950/90 backdrop-blur-md">
      <div className="gov-strip" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-brand-700 text-[13px] font-bold text-oncolor ring-1 ring-brand-400/40">
              <span className="absolute inset-y-0 left-0 w-1 bg-csa-500" />
              CE
            </span>
            <span className="text-[15px] font-semibold leading-tight tracking-tight text-white">
              Cyber <span className="text-csa-400">Essentials</span>
              <span className="ml-1.5 text-[11px] font-normal text-brand-200/70">Readiness Tool</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            {started && onboarded && (
              <span className="hidden text-brand-200/70 lg:inline">{org.name}</span>
            )}
            <ThemeToggle />
            {started && (
              <span className="rounded-full bg-brand-700/40 px-2.5 py-1 font-medium tabular-nums text-brand-100 ring-1 ring-inset ring-brand-500/30">
                {journey.completed.size}/{activeSteps(pathway).length} steps
                {readiness.completion > 0 && ` · ${readiness.completion}% assessed`}
              </span>
            )}
          </div>
        </div>

        {/*
          Progress read-out, not navigation. Movement is Previous/Next only, so
          the user is always answering one question rather than choosing which
          of ten pages to be on.
        */}
        {started && (
          <div
            aria-label="Progress"
            className="-mb-px flex gap-1 overflow-x-auto pb-2 pt-0.5 scroll-thin"
          >
            {activeSteps(pathway).map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const done = journey.completed.has(item.id);
              const reached = journey.unlocked.some((u) => u.id === item.id);

              const className = `flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-1.5 text-[13px] transition ${
                active
                  ? "border-csa-500 font-semibold text-white"
                  : done
                    ? "border-emerald-500/40 text-brand-100/80"
                    : reached
                      ? "border-transparent text-brand-200/70"
                      : "border-transparent text-brand-200/35"
              }`;

              const label = (
                <>
                  {done && (
                    <span aria-hidden className="text-[11px] leading-none text-emerald-400">
                      ✓
                    </span>
                  )}
                  {item.label}
                </>
              );

              // Only clickable in test mode. Normal movement is Previous/Next.
              return testMode ? (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "step" : undefined}
                  className={`${className} hover:border-amber-500/60 hover:text-amber-200`}
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={item.href}
                  aria-current={active ? "step" : undefined}
                  className={className}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

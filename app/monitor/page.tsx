"use client";

import { useState } from "react";
import { useStore } from "@/components/store";
import { Button, Card, EmptyState, Pill, SectionTitle, Stat } from "@/components/ui";

const CADENCES = [
  { id: "weekly", label: "Weekly", note: "Catches certificate expiry and new exposure early." },
  { id: "monthly", label: "Monthly", note: "Enough for a stable estate. A sensible default." },
  { id: "quarterly", label: "Quarterly", note: "Minimum to notice drift before the next audit." },
];

/**
 * The certificate is valid for three years; the configuration behind it is not.
 * This page is about the gap between those two facts.
 */
export default function MonitorPage() {
  const { scan, events, domain, runScan, scanning, ready, drift, driftStats } = useStore();
  const [cadence, setCadence] = useState("monthly");
  const [notify, setNotify] = useState(true);

  const nextDue = (() => {
    if (!scan) return null;
    const base = new Date(scan.scannedAt);
    const days = cadence === "weekly" ? 7 : cadence === "monthly" ? 30 : 90;
    base.setDate(base.getDate() + days);
    return base;
  })();

  const expiring = scan?.findings.find(
    (f) => f.checkId === "tls.expiry" && f.status !== "pass",
  );

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 06 · Monitor"
        title="Stay certified, not just get certified"
        lead="The mark lasts three years. A certificate expires, a vendor spins up a subdomain, someone disables a header during a deploy — and the assessment you submitted quietly stops being true. Re-scanning on a schedule catches that while it is still cheap."
      />

      {!scan && ready && (
        <EmptyState
          title="Nothing to monitor yet"
          body="Run your first scan to set a baseline. Monitoring then compares each later scan against it and tells you what moved."
          action={{ label: "Go to Discover", href: "/discover" }}
        />
      )}

      {scan && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Monitored domain" value={<span className="font-mono text-base">{domain}</span>} />
            <Stat label="Scans on record" value={driftStats.scans} hint="Used to detect drift" />
            <Stat
              label="Next due"
              value={nextDue ? nextDue.toLocaleDateString("en-SG") : "—"}
            />
            <Stat
              label="Regressions"
              value={driftStats.regressions}
              tone={driftStats.regressions > 0 ? "bad" : "good"}
              hint="Since the previous scan"
            />
          </div>

          {/* Drift is what separates monitoring from scanning twice. */}
          {driftStats.scans < 2 ? (
            <Card className="mt-6 p-5">
              <p className="text-sm font-semibold text-white">Nothing to compare yet</p>
              <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-brand-100/80">
                Drift needs two scans. This one is the baseline — re-scan later and this
                page will tell you what moved, rather than just showing today&apos;s
                answer again.
              </p>
            </Card>
          ) : drift.length === 0 ? (
            <Card className="mt-6 border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-sm font-semibold text-emerald-300">
                Nothing changed since the last scan
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-brand-50">
                Every check returned what it returned last time, and no new hostnames
                appeared in certificate logs.
              </p>
            </Card>
          ) : (
            <Card className="mt-6 overflow-hidden">
              <div className="border-b border-brand-700/30 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-white">
                  What changed since the last scan
                </h3>
              </div>
              {drift.map((d, i) => (
                <div
                  key={`${d.kind}-${d.checkId ?? d.host}-${i}`}
                  className="flex items-start gap-3 border-b border-ink-800/50 px-5 py-3 last:border-0"
                >
                  <Pill
                    tone={
                      d.kind === "improved"
                        ? "good"
                        : d.kind === "regressed"
                          ? "bad"
                          : d.kind === "new-host"
                            ? "warn"
                            : "neutral"
                    }
                  >
                    {d.kind === "regressed"
                      ? "Regressed"
                      : d.kind === "improved"
                        ? "Improved"
                        : d.kind === "new-host"
                          ? "New host"
                          : "Host gone"}
                  </Pill>
                  <span className="text-[13px] leading-relaxed text-brand-50">{d.label}</span>
                </div>
              ))}
            </Card>
          )}

          {expiring && (
            <Card className="mt-6 border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <Pill tone="warn">Time-bound</Pill>
                <div>
                  <p className="text-sm font-semibold text-amber-300">{expiring.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-brand-100/80">
                    {expiring.detail} This is exactly the class of drift that monitoring exists
                    to catch — it is fine today and an outage next month.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-start">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-white/90">Re-scan schedule</h3>
              <div className="mt-4 space-y-2">
                {CADENCES.map((c) => (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      cadence === c.id
                        ? "border-brand-500/50 bg-brand-500/5"
                        : "border-ink-700 hover:border-ink-600/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cadence"
                      checked={cadence === c.id}
                      onChange={() => setCadence(c.id)}
                      className="mt-0.5 h-4 w-4 accent-[#2f7dbf]"
                    />
                    <span>
                      <span className="block text-[13px] font-medium text-white/90">
                        {c.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-brand-100/60">
                        {c.note}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-brand-700/30 pt-4 text-[13px]">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-600/80 bg-ink-850 accent-[#2f7dbf]"
                />
                <span className="leading-snug text-brand-100/80">
                  Email me when a previously passing check starts failing
                </span>
              </label>

              <p className="mt-3 text-[11px] leading-relaxed text-brand-200/70">
                Scheduling is illustrative in this prototype — it needs a server-side job
                runner to fire on its own. The scan it would run is real, and you can trigger
                it now.
              </p>

              <div className="mt-4">
                <Button onClick={() => runScan(domain)} disabled={scanning || !domain}>
                  {scanning ? "Re-scanning…" : "Re-scan now"}
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-brand-700/30 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-white/90">Activity</h3>
              </div>
              {events.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-brand-200/70">
                  No activity recorded yet.
                </p>
              ) : (
                <ul>
                  {events.map((e, i) => (
                    <li
                      key={`${e.at}-${i}`}
                      className="flex gap-3 border-b border-ink-800/50 px-5 py-3.5 last:border-0"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-relaxed text-brand-50">
                          {e.message}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-brand-200/70">
                          {new Date(e.at).toLocaleString("en-SG")}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="mt-6 p-5">
            <h3 className="text-sm font-semibold text-white/90">
              What continuous monitoring covers, and what it does not
            </h3>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-emerald-400/80">
                  Watched automatically
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-brand-100/80">
                  <li>Certificate validity and expiry</li>
                  <li>TLS protocol versions accepted</li>
                  <li>Security headers on the public site</li>
                  <li>SPF, DKIM and DMARC records</li>
                  <li>Newly exposed config or backup files</li>
                </ul>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-brand-100/60">
                  Still needs a person
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-brand-100/80">
                  <li>Backup restore tests</li>
                  <li>Leaver account removal</li>
                  <li>Training refreshes</li>
                  <li>Incident response exercises</li>
                  <li>Asset inventory accuracy</li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

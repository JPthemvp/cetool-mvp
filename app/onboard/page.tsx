"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import {
  Button,
  Card,
  Field,
  Pill,
  RequiredLegend,
  RequiredMark,
  SectionTitle,
  inputCls,
} from "@/components/ui";
import { SECTORS, SECTOR_BY_ID } from "@/lib/sectors";
import { SCOPING_QUESTIONS } from "@/lib/readiness";
import { PATHWAYS, humanOnlyClauses, pathwayCoverage } from "@/lib/pathways";

const INDUSTRIES = [
  "Professional services",
  "Retail and F&B",
  "Manufacturing",
  "Logistics",
  "Healthcare",
  "Construction and real estate",
  "Infocomm and media",
  "Finance and insurance",
  "Other",
];

const SIZES = ["1–9 employees", "10–49 employees", "50–199 employees", "200+ employees"];

export default function OnboardPage() {
  const router = useRouter();
  const { org, setOrg, setScoping, scope, setScope, onboarded, reset, pathway, setPathway, beginJourney } =
    useStore();
  const [corppassBusy, setCorppassBusy] = useState(false);

  // Kick off the journey as soon as the user lands on this page so the
  // StepFooter Next button renders (it requires started === true).
  useEffect(() => { beginJourney(); }, [beginJourney]);
  const activeSector = SECTOR_BY_ID.get(org.sector);
  const humanOnly = useMemo(() => humanOnlyClauses().length, []);

  function simulateCorppass() {
    setCorppassBusy(true);
    // Stands in for the real flow: Corppass authenticates the officer, and ACRA
    // returns the entity's registered particulars so none of this is typed by hand.
    setTimeout(() => {
      setOrg({
        name: "Marina Precision Engineering Pte Ltd",
        uen: "201534217K",
        industry: "Manufacturing",
        size: "10–49 employees",
        hasInternalIt: false,
        onboardedVia: "corppass",
      });
      setCorppassBusy(false);
    }, 900);
  }

  const canProceed =
    org.name.trim().length > 0 &&
    org.sector &&
    Object.values(org.scoping ?? {}).some(Boolean) &&
    !!(org.scoping?.["locations"] && parseInt(org.scoping["locations"], 10) >= 1);

  function handleBegin() {
    beginJourney();
    router.push("/discover");
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Step 1 · Your Organisation"
        title="Tell us about your organisation"
        lead="Scope decides which of the 75 clauses apply to you, and which funding routes are relevant. The more accurately you fill this in, the more useful the assessment."
      />

      <Card className="p-6" id="org-form">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Organisation details</h2>
            <p className="mt-1 text-sm text-brand-100/60">
              These details scope the assessment and pre-fill the certification submission.
            </p>
            <div className="mt-1.5">
              <RequiredLegend />
            </div>
          </div>
          {!onboarded && <Pill tone="bad">Not onboarded</Pill>}
        </div>

        {/* Corppass */}
        <button
          onClick={simulateCorppass}
          disabled={corppassBusy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink-600/80 px-4 py-3 text-sm font-medium text-brand-50 transition hover:border-brand-500/60 hover:text-white disabled:opacity-60"
        >
          {corppassBusy ? "Retrieving entity particulars…" : "Onboard with Corppass"}
        </button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-brand-200/70">
          Simulated in this prototype. In production this authenticates the officer and
          pulls registered particulars from ACRA, so the SME types nothing.
        </p>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-ink-700" />
          <span className="text-[11px] uppercase tracking-widest text-brand-200/70">or enter manually</span>
          <span className="h-px flex-1 bg-ink-700" />
        </div>

        {/* Manual entry */}
        <div className="space-y-4">
          <Field label="Registered name" required>
            <input
              className={inputCls}
              value={org.name}
              placeholder="Acme Trading Pte Ltd"
              required
              aria-required="true"
              onChange={(e) => setOrg({ name: e.target.value, onboardedVia: "manual" })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="UEN">
              <input
                className={inputCls}
                value={org.uen}
                placeholder="201812345A"
                onChange={(e) => setOrg({ uen: e.target.value })}
              />
            </Field>
            <Field label="Headcount">
              <select
                className={inputCls}
                value={org.size}
                onChange={(e) => setOrg({ size: e.target.value })}
              >
                <option value="">Select…</option>
                {SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Industry">
            <select
              className={inputCls}
              value={org.industry}
              onChange={(e) => setOrg({ industry: e.target.value })}
            >
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Pathway */}
        <div className="mt-6 border-t border-brand-700/30 pt-5">
          <div className="mb-1 flex items-center gap-1">
            <p className="text-sm font-medium text-brand-50">How would you like to proceed?</p>
            <RequiredMark />
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-brand-100/70">
            Both pathways cover all 75 clauses and produce the same submittable results.
            The difference is who answers the technical half.
          </p>
          <div className="space-y-2">
            {PATHWAYS.map((p) => {
              const cov = pathwayCoverage(p.id);
              const on = pathway === p.id;
              return (
                <label
                  key={p.id}
                  className={`block cursor-pointer rounded-lg border p-4 transition ${
                    on
                      ? "border-csa-500/50 bg-csa-500/10"
                      : "border-ink-700/60 hover:border-ink-600"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="pathway"
                      checked={on}
                      onChange={() => setPathway(p.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#e31736]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-white">{p.name}</span>
                      <span className="mt-0.5 block text-[13px] text-brand-100/80">{p.tagline}</span>
                      <span className="mt-2.5 flex flex-wrap gap-1.5">
                        <Pill tone={p.id === "self-assess" ? "good" : "warn"}>
                          {p.id === "self-assess" ? "Nothing installed" : "You install a check"}
                        </Pill>
                        <Pill tone="info">
                          {cov.preAnswered + cov.evidenced} of {cov.total} assisted
                        </Pill>
                        <Pill>{cov.toAnswer} you answer</Pill>
                      </span>
                      {on && (
                        <span className="mt-3 block border-t border-csa-500/25 pt-3">
                          <span className="block text-[12px] leading-relaxed text-brand-50">
                            {p.mechanics.map((m) => (
                              <span key={m} className="mb-1 flex gap-2">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-csa-400" />
                                <span>{m}</span>
                              </span>
                            ))}
                          </span>
                          <span className="mt-2 block text-[12px] leading-relaxed text-amber-300/90">
                            Please note: {p.limitation}
                          </span>
                        </span>
                      )}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-brand-100/70">
            {humanOnly} clauses are about people and process — training, approvals, incident
            plans. Those come back to you on either route, because no software can see them.
          </p>
        </div>

        {/* Sector */}
        <div className="mt-6 border-t border-brand-700/30 pt-5">
          <div className="mb-1 flex items-center gap-1">
            <p className="text-sm font-medium text-brand-50">Which sector describes your organisation?</p>
            <RequiredMark />
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-brand-100/70">
            Some sectors carry regulatory duties that Cyber Essentials does not cover. This
            adds them to your action plan and points you at the right funding.
          </p>
          <div className="space-y-2">
            {SECTORS.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-[13px] transition ${
                  org.sector === s.id
                    ? "border-csa-500/50 bg-csa-500/10"
                    : "border-ink-700/60 hover:border-ink-600"
                }`}
              >
                <input
                  type="radio"
                  name="sector"
                  checked={org.sector === s.id}
                  onChange={() => setOrg({ sector: s.id })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#e31736]"
                />
                <span className="leading-snug text-brand-50">{s.identifier}</span>
              </label>
            ))}
          </div>
          {activeSector && activeSector.id !== "general" && activeSector.headline && (
            <div className="mt-3 rounded-lg border border-csa-500/35 bg-csa-500/10 p-3.5">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-csa-300">
                {activeSector.regulator ?? activeSector.name}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-brand-50">
                {activeSector.headline}
              </p>
            </div>
          )}
        </div>

        {/* Scoping */}
        <div className="mt-6 border-t border-brand-700/30 pt-5">
          <p className="mb-3 text-sm font-medium text-brand-50">Scoping questions</p>
          <div className="space-y-4">
            {SCOPING_QUESTIONS.map((q) => (
              <div key={q.id}>
                <div className="flex items-center gap-1">
                  <p className="text-[13px] font-medium text-brand-50">{q.question}</p>
                  <RequiredMark />
                </div>
                {q.note && (
                  <p className="mt-1 text-[12px] leading-relaxed text-brand-100/70">{q.note}</p>
                )}
                <select
                  className={`${inputCls} mt-2`}
                  value={org.scoping[q.id] ?? ""}
                  onChange={(e) => {
                    setScoping(q.id, e.target.value);
                    if (q.id === "who-runs-it") {
                      setOrg({
                        hasInternalIt:
                          e.target.value === "internal" || e.target.value === "mixed",
                      });
                    }
                  }}
                >
                  <option value="">Please select an option</option>
                  {q.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Location count — number input, inserted after who-runs-it */}
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[13px] font-medium text-brand-50">
                  How many location(s) are in scope?
                </p>
                <RequiredMark />
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-brand-100/70">
                Count each distinct physical site or network boundary — an office, a branch, a data centre. A fully cloud-based organisation with no on-premise equipment can enter 1.
              </p>
              <input
                type="number"
                min={1}
                step={1}
                className={`${inputCls} mt-2 w-32`}
                placeholder="e.g. 1"
                value={org.scoping["locations"] ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Accept only positive integers
                  if (raw === "" || (/^\d+$/.test(raw) && parseInt(raw, 10) >= 1)) {
                    setScoping("locations", raw);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* In-scope assets */}
        <div className="mt-6 border-t border-brand-700/30 pt-5">
          <p className="mb-3 text-sm font-medium text-brand-50">What is in scope for certification?</p>
          <div className="space-y-2.5">
            {(
              [
                ["servers", "Servers or on-premise systems"],
                ["mobile", "Company mobile devices"],
                ["byod", "Staff personal devices used for work (BYOD)"],
                ["cloud", "Cloud services (Microsoft 365, Google Workspace, AWS…)"],
                ["ot", "Operational technology or industrial equipment"],
                ["ai", "AI tools or services (ChatGPT, Co-Pilot, Claude etc.)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={scope[key]}
                  onChange={(e) => setScope({ [key]: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-850 accent-[#2f7dbf]"
                />
                <span className="leading-snug text-brand-100/80">{label}</span>
              </label>
            ))}
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-brand-700/30 pt-4 text-sm">
            <input
              type="checkbox"
              checked={org.hasInternalIt}
              onChange={(e) => setOrg({ hasInternalIt: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-850 accent-[#2f7dbf]"
            />
            <span className="leading-snug text-brand-100/80">
              We have someone in-house who looks after IT
            </span>
          </label>
        </div>

        {/* hint only — the nav's Next: Discover button takes them forward */}
        <p className="mt-8 border-t border-brand-700/30 pt-5 text-[12px] text-brand-200/70">
          {canProceed
            ? "Your answers are saved in this browser as you go. Use the Next button to continue to Discover."
            : "Complete the required fields above, then use the Next button to continue."}
        </p>

        {onboarded && (
          <button
            onClick={reset}
            className="mt-4 text-xs text-brand-200/70 underline-offset-2 hover:text-brand-100/80 hover:underline"
          >
            Clear this assessment and start again
          </button>
        )}
      </Card>
    </div>
  );
}

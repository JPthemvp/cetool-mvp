"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import { Button, Card, Meter, Pill, SectionTitle, Stat } from "@/components/ui";
import { applicableClauses } from "@/lib/ce-framework";
import { answerabilityOf } from "@/lib/answerability";
import { buildResultRows, toCsv } from "@/lib/assessment";
import { CSA_ELEARNING } from "@/lib/training/gophish";
import Link from "next/link";
import { generateIRPlan } from "@/lib/training/irplan";
import { HUMAN_WIZARD_QUESTIONS, groupByMeasure } from "@/lib/wizard-questions";

type WizardSection = "training" | "irplan" | "done";

// HUMAN_WIZARD_QUESTIONS and groupByMeasure imported from @/lib/wizard-questions

export default function ReviewPage() {
  const router = useRouter();
  const store = useStore();
  const { org, scan, answers, setAnswer, endpoints, markCompleted, scope, reset } = store;
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({});
  const [trainingEvidence, setTrainingEvidence] = useState<"csa" | "gophish" | "other" | null>(null);
  const [irplanDownloaded, setIrplanDownloaded] = useState(false);
  const [exported, setExported] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [m365Busy, setM365Busy] = useState(false);
  const [m365Connected, setM365Connected] = useState(false);
  const [m365Results, setM365Results] = useState<string[]>([]);

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    reset();
    router.push("/");
  }

  // ── M365 connector simulation ─────────────────────────────────────────────
  // In production: Microsoft Graph API OAuth2 with delegated admin consent.
  // Reads: MFA coverage, Conditional Access policies, Entra access reviews,
  // SSPR configuration, and Intune device compliance baselines.

  function handleM365Connect() {
    setM365Busy(true);
    // Simulate OAuth redirect + Graph API calls (~2s)
    setTimeout(() => {
      // Simulated Graph API responses → map to human-only wizard clauses
      const prefilled: Record<string, string> = {
        "A.5.4(k)": "yes",   // Entra ID Access Reviews configured
        "A.5.4(n)": "yes",   // SSPR (Self-Service Password Reset) enabled
        "A.5.4(p)": "yes",   // MFA enabled for all users via Conditional Access
        "A.6.4(e)": "yes",   // Defender Secure Score baseline reviewed
        "A.6.4(h)": "yes",   // Defender / Sentinel logs collected
        "A.4.4(d)": "yes",   // Intune mobile device policy active
        "A.4.4(g)": "yes",   // Intune VPN-on-untrusted-network policy
        "A.6.4(j)": "yes",   // Intune: passcode + encryption + remote wipe
        "A.7.4(d)": "yes",   // Intune: mobile OS update compliance
      };
      setWizardAnswers((prev) => ({ ...prefilled, ...prev })); // don't overwrite manual answers
      setM365Results([
        "✓ MFA for all users — Conditional Access policy found",
        "✓ Account reviews — Entra ID Access Reviews configured",
        "✓ SSPR — Self-Service Password Reset enabled",
        "✓ Mobile policy — Intune baseline active (passcode, encryption, remote wipe)",
        "✓ Mobile updates — Intune OS compliance policy enforced",
        "✓ VPN on untrusted networks — Intune network policy found",
        "✓ Audit logs — Defender / Sentinel log collection active",
        "✓ Configuration review — Defender Secure Score baseline found",
      ]);
      setM365Connected(true);
      setM365Busy(false);
    }, 2000);
  }

  // ── Compute auto-filled vs needs-human ────────────────────────────────────

  const clauses = useMemo(() => applicableClauses(scope), [scope]);

  const autoFilledCount = useMemo(() =>
    clauses.filter((c) => {
      const a = answerabilityOf(c.id);
      return a === "machine" && answers[c.id]?.value && answers[c.id].value !== "unsure";
    }).length, [clauses, answers]);

  const humanNeeded = useMemo(() =>
    HUMAN_WIZARD_QUESTIONS.filter((q) => {
      const existing = answers[q.clauseId]?.value;
      return !existing || existing === "unsure";
    }), [answers]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _wizardComplete = humanNeeded.every((q) => wizardAnswers[q.clauseId]);

  const wizardComplete = humanNeeded.every((q) => wizardAnswers[q.clauseId]);

  // ── Scoring ───────────────────────────────────────────────────────────────

  const allAnswers = useMemo(() => {
    const merged = { ...answers };
    for (const [clauseId, val] of Object.entries(wizardAnswers)) {
      merged[clauseId] = { value: val as "yes" | "no" | "partial" | "unsure" | "na", source: "user", updatedAt: new Date().toISOString() };
    }
    return merged;
  }, [answers, wizardAnswers]);

  const rows = useMemo(() => buildResultRows(allAnswers, scope), [allAnswers, scope]);

  // ── Certification is determined by "shall" clauses only ─────────────────
  // "should" clauses are recommendations — an assessor notes them but
  // cannot fail you on them. Score and certifiable state use shall rows only.
  const shallRows = rows.filter((r) => r.obligation === "shall");
  const shouldRows = rows.filter((r) => r.obligation === "should");

  const blocking = shallRows.filter((r) => r.answer === "no").length;
  const shallAnswered = shallRows.filter((r) => r.answer && r.answer !== "unsure" && r.answer !== "unanswered").length;
  const completion = Math.round((shallAnswered / shallRows.length) * 100);
  // Certifiable: every "shall" clause answered and none are "no"
  const certifiable = blocking === 0 && shallAnswered === shallRows.length;

  // ── IR Plan download ──────────────────────────────────────────────────────

  function downloadIRPlan() {
    const plan = generateIRPlan({
      name: org.name || "Your Organisation",
      uen: org.uen || "",
      sector: org.sector || "general",
      contactName: "",
      contactEmail: "",
    });
    const blob = new Blob([plan], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IR-Plan-${(org.name || "org").replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIrplanDownloaded(true);
    // Auto-answer A.9.4(a) since we just generated a plan
    setWizardAnswers((prev: Record<string, string>) => ({ ...prev, "A.9.4(a)": "yes" }));
  }

  // ── Export ────────────────────────────────────────────────────────────────

  function downloadJson() {
    const report = {
      generatedAt: new Date().toISOString(),
      org: { name: org.name, uen: org.uen, sector: org.sector },
      summary: { completion, blocking, certifiable, clauseCount: rows.length },
      clauses: rows,
    };
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CE-Assessment-${(org.name || "org").replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    markCompleted("review");
  }

  function downloadCsv() {
    const csv = toCsv(rows, org.name || "Organisation", new Date().toISOString());
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CE-Assessment-${(org.name || "org").replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    markCompleted("review");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionTitle
        eyebrow="Step 3 of 3"
        title="Review & submit"
        lead="Your assessment is auto-populated from the scans. Answer the short human checklist below, then export a submission-ready report."
      />

      {/* ── Score summary ────────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-base font-semibold text-white">Required clauses (shall)</h2>
            <p className="text-[11px] text-brand-100/50 mt-0.5">
              Certification is decided by the {shallRows.length} required clauses only.
              The {shouldRows.length} recommended clauses are shown separately below.
            </p>
          </div>
          <Pill tone={certifiable ? "good" : blocking > 0 ? "bad" : "warn"}>
            {certifiable ? "✓ Likely certifiable" : blocking > 0 ? `${blocking} blocking gap${blocking !== 1 ? "s" : ""}` : "In progress"}
          </Pill>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 mt-4">
          <Stat label="Required answered" value={`${shallAnswered} / ${shallRows.length}`} />
          <Stat label="Auto-filled" value={`${autoFilledCount} clauses`} />
          <Stat label="Blocking gaps" value={blocking} />
          <Stat label="Certification progress" value={`${completion}%`} />
        </div>
        <Meter value={completion} tone={certifiable ? "good" : "brand"} />
      </Card>

      {/* ── Auto-fill breakdown ──────────────────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">What was auto-populated</h2>
        <div className="space-y-2">
          {[
            { label: "External domain scan (DNS, TLS, email auth, headers)", tool: "Nuclei + sslyze + checkdmarc", count: scan?.findings?.length ?? 0, icon: "🌐" },
            { label: "Device scan (AV, firewall, encryption, patches, accounts)", tool: "osquery / PowerShell", count: autoFilledCount, icon: "💻" },
          ].map((s) => (
            <div key={s.label} className="flex items-start gap-3 rounded-lg border border-ink-700/40 bg-ink-900/40 p-3">
              <span className="text-base mt-0.5">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white">{s.label}</p>
                <p className="text-[11px] text-brand-300/60 mt-0.5">Tool: {s.tool}</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-800/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                {s.count} filled
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Clause pass/fail breakdown ──────────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Clause results — pass / fail / unanswered</h2>
        <p className="text-[12px] text-brand-100/60">
          Rows sourced from the domain scan or device scan show automatically. Unanswered clauses need your input in the checklist below.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-ink-700/40 text-left text-brand-300/70">
                <th className="pb-2 pr-4 font-medium">Clause</th>
                <th className="pb-2 pr-4 font-medium">Requirement (summary)</th>
                <th className="pb-2 pr-4 font-medium">Source</th>
                <th className="pb-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/40">
              {rows.map((r) => {
                const tone =
                  r.answer === "yes" ? "pass"
                  : r.answer === "na" ? "na"
                  : r.answer === "partial" ? "partial"
                  : r.answer === "no" ? "fail"
                  : r.answer === "unanswered" ? "unanswered"
                  : "other";
                const pillCls =
                  tone === "pass" ? "bg-emerald-800/40 text-emerald-300"
                  : tone === "na" ? "bg-ink-700/60 text-brand-300/60"
                  : tone === "partial" ? "bg-amber-800/40 text-amber-300"
                  : tone === "fail" ? "bg-red-800/40 text-red-300"
                  : "bg-ink-800/60 text-brand-300/40";
                const label =
                  tone === "pass" ? "✓ Pass"
                  : tone === "na" ? "N/A"
                  : tone === "partial" ? "~ Partial"
                  : tone === "fail" ? "✗ Fail"
                  : "— Unanswered";
                return (
                  <tr key={r.clauseId} className="align-top">
                    <td className="py-1.5 pr-4 font-mono text-brand-300 whitespace-nowrap">{r.clauseId}</td>
                    <td className="py-1.5 pr-4 text-brand-100/70 leading-snug max-w-xs">{r.requirement?.slice(0, 80)}{r.requirement?.length > 80 ? "…" : ""}</td>
                    <td className="py-1.5 pr-4 text-brand-300/50 whitespace-nowrap">{r.source === "scan" ? "🌐 scan" : r.source === "user" ? "👤 you" : "—"}</td>
                    <td className="py-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${pillCls}`}>{label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Microsoft 365 connector ──────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">☁️</span>
            <div>
              <h2 className="text-base font-semibold text-white">Connect Microsoft 365 / Entra ID</h2>
              <p className="text-[12px] text-brand-100/60 mt-0.5">
                Auto-answers up to 8 cloud clauses by reading your tenant via Microsoft Graph API.
              </p>
            </div>
          </div>
          {!m365Connected ? (
            <button
              onClick={handleM365Connect}
              disabled={m365Busy}
              className="shrink-0 rounded-lg border border-blue-600/60 bg-blue-900/30 px-4 py-2 text-[13px] font-semibold text-blue-200 transition hover:bg-blue-800/40 disabled:opacity-50"
            >
              {m365Busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-300" />
                  Connecting…
                </span>
              ) : "Connect M365 →"}
            </button>
          ) : (
            <span className="rounded-full border border-emerald-600/50 bg-emerald-900/20 px-3 py-1 text-[12px] font-semibold text-emerald-300">✓ Connected</span>
          )}
        </div>

        {m365Busy && (
          <div className="rounded-lg bg-blue-950/30 border border-blue-700/30 p-4 space-y-1.5">
            <p className="text-[12px] font-semibold text-blue-200">Reading Microsoft Graph API…</p>
            {["Checking Conditional Access policies (MFA)", "Reading Entra ID Access Reviews", "Checking SSPR configuration", "Reading Intune device compliance baselines", "Reading Defender / Sentinel log sources"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-[11px] text-blue-200/60">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border border-blue-400/30 border-t-blue-300" style={{ animationDelay: `${i * 0.2}s` }} />
                {s}
              </div>
            ))}
          </div>
        )}

        {m365Connected && m365Results.length > 0 && (
          <div className="rounded-lg bg-emerald-950/20 border border-emerald-700/30 p-4 space-y-1">
            <p className="text-[12px] font-semibold text-emerald-200 mb-2">Auto-answered from tenant data:</p>
            {m365Results.map((r) => (
              <p key={r} className="text-[11px] text-emerald-200/70">{r}</p>
            ))}
          </div>
        )}

        {!m365Connected && !m365Busy && (
          <p className="text-[11px] text-brand-200/40">
            ⓘ Demo simulation — in production, this reads live tenant data via Microsoft Graph with admin consent OAuth.
            Answers MFA coverage, access reviews, SSPR, Intune mobile config, Defender logs, and more.
          </p>
        )}
      </Card>

      {/* ── Human wizard — Required (shall) clauses ──────────────────────── */}
      {(() => {
        const shallQs = HUMAN_WIZARD_QUESTIONS.filter((q) => q.obligation === "shall");
        const shouldQs = HUMAN_WIZARD_QUESTIONS.filter((q) => q.obligation === "should");
        const answeredCount = (qs: typeof HUMAN_WIZARD_QUESTIONS) =>
          qs.filter((q) => wizardAnswers[q.clauseId] || (answers[q.clauseId]?.value && answers[q.clauseId].value !== "unsure")).length;

        function WizardGroup({ qs, label, sublabel, accent }: {
          qs: typeof HUMAN_WIZARD_QUESTIONS;
          label: string;
          sublabel: string;
          accent: string;
        }) {
          const groups = groupByMeasure(qs);
          return (
            <div className="space-y-0">
              <div className={`rounded-t-xl border ${accent} px-6 py-4 flex items-center justify-between`}>
                <div>
                  <h2 className="text-base font-semibold text-white">{label}</h2>
                  <p className="text-[12px] text-brand-100/60 mt-0.5">{sublabel}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-brand-300/60">Answered</p>
                  <p className="text-lg font-bold text-white">
                    {answeredCount(qs)}
                    <span className="text-sm font-normal text-brand-300/60"> / {qs.length}</span>
                  </p>
                </div>
              </div>
              {groups.map((group, gi) => (
                <div key={group.measureId} className={`border-x border-b border-ink-700/60 ${gi === groups.length - 1 ? "rounded-b-xl" : ""} bg-ink-900/40`}>
                  <div className="px-6 py-3 border-b border-ink-800/60 bg-ink-950/40">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-300/70">{group.measureName}</span>
                  </div>
                  <div className="px-6 py-4 space-y-6">
                    {group.questions.map((q) => {
                      const existing = answers[q.clauseId]?.value;
                      const current = wizardAnswers[q.clauseId] ?? (existing && existing !== "unsure" ? existing : "");
                      const answered = !!current;
                      return (
                        <div key={q.clauseId} className="space-y-2.5">
                          <div className="flex items-start gap-2 flex-wrap">
                            <code className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] font-mono text-brand-300">{q.clauseId}</code>
                            <p className="text-[13px] font-medium text-white leading-snug flex-1">{q.question}</p>
                            {answered && (
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                current === "yes" ? "bg-emerald-800/40 text-emerald-300"
                                : current === "partial" ? "bg-amber-800/40 text-amber-300"
                                : current === "na" ? "bg-ink-700/60 text-brand-300/60"
                                : "bg-red-800/40 text-red-300"
                              }`}>
                                {current === "yes" ? "✓ Yes" : current === "partial" ? "~ Partial" : current === "na" ? "N/A" : "✗ No"}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setWizardAnswers((prev) => ({ ...prev, [q.clauseId]: opt.value }))}
                                data-on={current === opt.value}
                                className="rounded-lg border border-ink-700/60 px-3 py-1.5 text-[12px] font-medium text-brand-200 transition hover:border-brand-500/40 data-[on=true]:border-csa-500/60 data-[on=true]:bg-csa-900/40 data-[on=true]:text-csa-200"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {q.hint && <p className="text-[11px] text-brand-300/50 pl-0.5">{q.hint}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        return (
          <>
            <WizardGroup
              qs={shallQs}
              label={`Required clauses — ${shallQs.length} questions`}
              sublabel="These must all be answered 'Yes' or 'N/A' to pass certification. 'No' or 'Partial' on any shall clause is a blocking gap."
              accent="border-csa-700/50 bg-csa-950/30"
            />
            <WizardGroup
              qs={shouldQs}
              label={`Recommended clauses — ${shouldQs.length} questions`}
              sublabel="Assessors note these but cannot fail you on them. Answer them to strengthen your posture and evidence pack."
              accent="border-ink-700/60 bg-ink-900/60"
            />
          </>
        );
      })()}

      {/* ── A.1 Training section ─────────────────────────────────────────── */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <code className="rounded bg-ink-800 px-2 py-0.5 text-[11px] font-mono text-brand-300">A.1 · People</code>
          <h2 className="text-base font-semibold text-white">Cybersecurity awareness training</h2>
        </div>

        <p className="text-[13px] text-brand-100/60">
          All five A.1 clauses concern whether staff are trained and how. No scanner can
          verify this — the tools below create the evidence.
        </p>

        {/* CSA e-learning embed */}
        <div className="rounded-xl border border-brand-700/40 bg-brand-900/20 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <div>
              <p className="text-[13px] font-semibold text-white">SG Cyber Safe Employee e-Learning</p>
              <p className="text-[11px] text-brand-300/60">Free · 15 minutes · Certificate provided · By CSA Singapore</p>
            </div>
            <Link
              href="/training"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-700/60 px-4 py-2 text-[12px] font-semibold text-brand-100 transition hover:bg-brand-600/60"
            >
              Take the quiz →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px] text-brand-100/60">
            {CSA_ELEARNING.topics.map((t) => (
              <div key={t} className="flex gap-1.5">
                <span className="text-brand-400">·</span> {t}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-brand-300/50">
            After completing: screenshot the certificate and upload below as A.1 evidence.
          </p>
          <div className="flex gap-2">
            {(["csa", "other"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTrainingEvidence(v)}
                data-on={trainingEvidence === v}
                className="rounded-lg border border-ink-700/60 px-3 py-1.5 text-[12px] font-medium text-brand-200 transition data-[on=true]:border-emerald-600/60 data-[on=true]:bg-emerald-900/30 data-[on=true]:text-emerald-200"
              >
                {v === "csa" ? "✓ CSA e-learning completed" : "✓ We use another training provider"}
              </button>
            ))}
          </div>
        </div>

        {/* GoPhish simulation */}
        <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎣</span>
            <div>
              <p className="text-[13px] font-semibold text-white">Phishing simulation — GoPhish</p>
              <p className="text-[11px] text-amber-300/60">Free · Open source (MIT) · Self-hosted · Proves training effectiveness</p>
            </div>
          </div>
          <p className="text-[12px] text-brand-100/60">
            Send a simulated phishing email to staff. GoPhish tracks who clicked, who
            reported it, and auto-enrols clickers in follow-up training. The click rate
            and training completion become your A.1 evidence.
          </p>
          <div className="flex gap-3">
            <a
              href="https://getgophish.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-700/40 px-3 py-1.5 text-[12px] font-medium text-amber-300 transition hover:border-amber-600/60"
            >
              GoPhish website ↗
            </a>
            <a
              href="https://github.com/gophish/gophish"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700/40 px-3 py-1.5 text-[12px] font-medium text-brand-300 transition hover:border-ink-600"
            >
              GitHub (MIT) ↗
            </a>
          </div>
          <p className="text-[11px] text-brand-300/40">
            A managed GoPhish instance for CE Tool users is on the roadmap. For now,
            self-host or use a managed GoPhish SaaS (Lucy, KnowBe4 have free tiers).
          </p>
        </div>

        {/* Wazuh monitoring */}
        <div className="rounded-xl border border-brand-700/30 bg-ink-900/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡</span>
            <div>
              <p className="text-[13px] font-semibold text-white">Ongoing monitoring — Wazuh</p>
              <p className="text-[11px] text-brand-300/60">Free · Open source (GPL-2.0) · SIEM + EDR + CIS Benchmarks</p>
            </div>
          </div>
          <p className="text-[12px] text-brand-100/60">
            After certification, Wazuh keeps you continuously compliant — agent-based
            monitoring for all A.4–A.9 measures, drift alerts, and auto-remediation
            playbooks. Used by governments and enterprises worldwide.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a
              href="https://wazuh.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700/40 px-3 py-1.5 text-[12px] font-medium text-brand-300 transition hover:border-brand-600"
            >
              Wazuh.com ↗
            </a>
            <a
              href="https://documentation.wazuh.com/current/compliance/cis/index.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700/40 px-3 py-1.5 text-[12px] font-medium text-brand-300 transition hover:border-ink-600"
            >
              CIS Benchmark compliance ↗
            </a>
            <a
              href="https://github.com/wazuh/wazuh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700/40 px-3 py-1.5 text-[12px] font-medium text-brand-300 transition hover:border-ink-600"
            >
              GitHub ↗
            </a>
          </div>
          <p className="text-[11px] text-brand-300/40">
            GPL-2.0 — free to self-host. Managed cloud version available from Wazuh Inc.
            and qualified resellers. NCSS social service agencies: ask your CISOaaS provider
            about Wazuh deployment under the Transformation Sustainability Scheme.
          </p>
        </div>
      </Card>

      {/* ── A.9 IR Plan ──────────────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <code className="rounded bg-ink-800 px-2 py-0.5 text-[11px] font-mono text-brand-300">A.9 · Respond</code>
          <h2 className="text-base font-semibold text-white">Incident response plan</h2>
        </div>
        <p className="text-[13px] text-brand-100/60">
          An IR plan is required for A.9.4(a). We generate one pre-filled with your
          organisation details, sector obligations (PDPA, MAS, MOH), and CSA SingCERT
          contacts. Download, review, and have management sign it.
        </p>
        <button
          onClick={downloadIRPlan}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-600/40 bg-brand-900/40 px-5 py-2.5 text-[13px] font-semibold text-brand-200 transition hover:border-brand-500/60 hover:bg-brand-900/60"
        >
          ⬇ Download IR Plan (.md)
          {irplanDownloaded && <span className="text-emerald-400">✓</span>}
        </button>
        {irplanDownloaded && (
          <p className="text-[12px] text-emerald-400">
            IR Plan downloaded. A.9.4(a) has been pre-answered as &ldquo;Yes&rdquo;.
            Review the plan, add your IT contact and DPO details, and have it signed by management.
          </p>
        )}
      </Card>

      {/* ── Export ───────────────────────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Export submission-ready report</h2>
        <div className="rounded-lg bg-ink-900/50 border border-ink-700/40 p-4 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-brand-100/70">Completion</span>
            <span className="font-semibold text-white">{completion}%</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-brand-100/70">Blocking gaps (shall clauses not met)</span>
            <span className={`font-semibold ${blocking === 0 ? "text-emerald-400" : "text-csa-400"}`}>{blocking}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-brand-100/70">Certification status</span>
            <span className={`font-semibold ${certifiable ? "text-emerald-400" : "text-amber-400"}`}>
              {certifiable ? "Likely certifiable" : "Gaps to resolve"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={downloadJson}>⬇ Export JSON (for assessor)</Button>
          <Button onClick={downloadCsv}>⬇ Export CSV</Button>
        </div>

        {exported && (
          <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/15 p-4 space-y-1.5">
            <p className="text-[13px] font-semibold text-emerald-300">✓ Report exported</p>
            <p className="text-[12px] text-brand-100/60">
              Send the JSON or CSV to your chosen certification body. CSA-appointed CBs
              in Singapore: ISOCert, exida Asia Pacific, SOCOTEC, Bureau Veritas, TÜV SÜD PSB.
            </p>
          </div>
        )}

        {/* Cert bodies */}
        <div className="rounded-lg border border-ink-700/40 bg-ink-900/30 p-4 text-[12px]">
          <p className="font-semibold text-brand-200 mb-2">Appointed certification bodies (Singapore)</p>
          <div className="space-y-1 text-brand-100/60">
            {[
              ["ISOCert Pte Ltd", "sales@isocert.com.sg"],
              ["exida Asia Pacific Pte Ltd", ""],
              ["SOCOTEC Certification International Singapore", ""],
              ["Bureau Veritas Consumer Products Services Singapore Pte Ltd", ""],
              ["TÜV SÜD PSB Pte Ltd", ""],
            ].map(([name, email]) => (
              <div key={name} className="flex justify-between gap-4">
                <span className="shrink-0">{name}</span>
                {email
                  ? <a href={`mailto:${email}`} className="text-brand-300 hover:underline">{email}</a>
                  : <span className="text-brand-300/40 italic">contact via website</span>}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── End Session ───────────────────────────────────────────────────── */}
      <div className="border-t border-brand-700/30 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Done for now?</p>
          <p className="text-[12px] text-brand-100/60 mt-0.5">
            Return to home — your assessment progress is saved in this browser.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="shrink-0 rounded-lg border border-ink-600/60 bg-ink-900/60 px-4 py-2 text-[13px] font-semibold text-brand-200 transition hover:border-brand-500/60 hover:text-white active:scale-[0.97]"
        >
          ← End session
        </button>
      </div>

      {/* ── Reset all ─────────────────────────────────────────────────────── */}
      <div className="border-t border-brand-700/30 pt-8">
        <div className="rounded-xl border border-red-800/30 bg-red-950/20 p-5">
          <p className="text-sm font-semibold text-red-300">Reset all data</p>
          <p className="mt-1 text-[12px] leading-relaxed text-brand-100/60">
            Clears all answers, scan results, organisation details, Corppass login, and all
            assessment progress from this browser. This cannot be undone.
          </p>
          <button
            onClick={handleReset}
            className={`mt-4 rounded-lg border px-4 py-2 text-[13px] font-semibold transition ${
              confirmReset
                ? "border-red-500/60 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                : "border-red-800/40 bg-red-950/30 text-red-400/80 hover:border-red-700/60 hover:text-red-300"
            }`}
          >
            {confirmReset ? "⚠ Are you sure? Click again to confirm reset" : "Reset all default values"}
          </button>
        </div>
      </div>
    </div>
  );
}

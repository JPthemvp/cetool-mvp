"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/store";
import {
  Button,
  Card,
  Field,
  Pill,
  RequiredLegend,
  SectionTitle,
  Stat,
  inputCls,
} from "@/components/ui";
import {
  CHECKS,
  RISK_LABEL,
  buildAssessmentScript,
  buildBackupScript,
  type ChangeRisk,
} from "@/lib/scripts";
import { MEASURE_BY_ID } from "@/lib/ce-framework";
import { UNIX_CHECKS, buildUnixScript } from "@/lib/scripts-unix";

const RISK_TONE: Record<ChangeRisk, "good" | "warn" | "bad"> = {
  safe: "good",
  review: "warn",
  disruptive: "bad",
};

function download(name: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ToolkitPage() {
  const { org, applyLocalReport, endpoints, estate, removeEndpoint } = useStore();

  const [selected, setSelected] = useState<string[]>(CHECKS.map((c) => c.id));
  const [includeRemediation, setIncludeRemediation] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [preview, setPreview] = useState(false);

  const [source, setSource] = useState("C:\\Users");
  const [destination, setDestination] = useState("D:\\Backup");
  const [time, setTime] = useState("22:00");

  const [paste, setPaste] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const script = useMemo(
    () =>
      buildAssessmentScript({
        selected,
        includeRemediation: includeRemediation && acknowledged,
        org: org.name || undefined,
      }),
    [selected, includeRemediation, acknowledged, org.name],
  );

  // Hash the exact bytes the user is about to download, so the published value
  // cannot drift from the file.
  const [hash, setHash] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const bytes = new TextEncoder().encode(script);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hex = [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (!cancelled) setHash(hex.toUpperCase());
    })();
    return () => {
      cancelled = true;
    };
  }, [script]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const changeable = CHECKS.filter((c) => c.remediate && selected.includes(c.id));
  const disruptive = changeable.filter((c) => c.risk === "disruptive");

  return (
    <div>
      <SectionTitle
        eyebrow="Capability 03b · Harden"
        title="Check and harden the machines themselves"
        lead="The web scan sees your internet-facing estate. This sees the inside — but only because you run it yourself. It is plain PowerShell you can read, it makes no network calls, and nothing leaves the machine unless you paste it back here."
      />

      {/* The honest framing, up front */}
      <Card className="border-brand-500/35 bg-brand-700/15 p-5">
        <h2 className="text-sm font-semibold text-brand-300">Why this is provided as a script</h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-brand-50">
          An installed agent would be quicker, and it is what commercial tools do. It also
          means asking thousands of SMEs to run an opaque binary with administrator rights
          from a security portal — which makes that portal a target worth attacking, and
          makes the SME&apos;s trust decision impossible to verify. A script you can open in
          Notepad, read, and hand to your IT vendor for approval is slower and far harder to
          abuse. Same checks, no leap of faith.
        </p>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Checks available" value={CHECKS.length} />
        <Stat label="Selected" value={selected.length} />
        <Stat label="Can auto-fix" value={changeable.length} hint="The rest are report-only" />
        <Stat
          label="Clauses covered"
          value={new Set(CHECKS.flatMap((c) => c.clauseIds)).size}
          hint="Cyber Essentials clauses touched"
        />
      </div>

      {/* Check picker */}
      <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight text-white">
        1 · Choose what to check
      </h2>
      <div className="space-y-2">
        {CHECKS.map((c) => {
          const on = selected.includes(c.id);
          return (
            <Card key={c.id} className={`p-4 ${on ? "" : "opacity-55"}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(c.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-950 accent-[#2f7dbf]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-white">{c.title}</span>
                    <Pill tone={RISK_TONE[c.risk]}>{c.risk}</Pill>
                    {!c.remediate && <Pill>report only</Pill>}
                    {c.clauseIds.map((id) => (
                      <span
                        key={id}
                        className="rounded bg-brand-500/12 px-1.5 py-0.5 font-mono text-[11px] text-brand-300 ring-1 ring-inset ring-brand-500/25"
                      >
                        {id}
                      </span>
                    ))}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-relaxed text-brand-100/80">
                    {c.why}
                  </span>
                  {c.caution && (
                    <span className="mt-1.5 block text-[12px] leading-relaxed text-amber-300/90">
                      {c.caution}
                    </span>
                  )}
                </span>
              </label>
            </Card>
          );
        })}
      </div>

      {/* Remediation consent */}
      <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight text-white">
        2 · Report only, or fix as well?
      </h2>
      <Card className="p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={includeRemediation}
            onChange={(e) => {
              setIncludeRemediation(e.target.checked);
              if (!e.target.checked) setAcknowledged(false);
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-950 accent-[#e31736]"
          />
          <span>
            <span className="block text-[14px] font-medium text-white">
              Include the fixes ({changeable.length} of the selected checks can change settings)
            </span>
            <span className="mt-1 block text-[13px] leading-relaxed text-brand-100/80">
              Even with this on, the script still runs in audit mode by default. Changing
              anything needs <code className="text-brand-300">-Mode Remediate</code>, then
              typing CHANGE, then a yes for each individual fix. An undo script is written
              before the first change.
            </span>
          </span>
        </label>

        {includeRemediation && (
          <div className="mt-4 rounded-lg border border-csa-500/40 bg-csa-500/10 p-4">
            <p className="text-[13px] font-semibold text-csa-300">
              Read this before you generate it
            </p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-brand-50">
              <li>
                • Registry changes can break working software. {disruptive.length > 0 && (
                  <>
                    You have selected {disruptive.length} marked{" "}
                    <span className="font-semibold text-csa-300">disruptive</span> —{" "}
                    {disruptive.map((d) => d.title).join(", ")}.
                  </>
                )}
              </li>
              <li>• Run it on one machine first and confirm your business software still works.</li>
              <li>• Keep the rollback script it generates. That is your way back.</li>
              <li>• If you have an IT vendor, send them the script before running it.</li>
            </ul>
            <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-csa-500/25 pt-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600/80 bg-ink-950 accent-[#e31736]"
              />
              <span className="text-[13px] leading-relaxed text-white">
                I understand these change system settings, and I will test on one machine
                first.
              </span>
            </label>
          </div>
        )}
      </Card>

      {/* Generate */}
      <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight text-white">
        3 · Generate and run
      </h2>
      <Card className="p-5">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => download("cyber-essentials-tool-check.ps1", script)}
            disabled={selected.length === 0 || !hash}
          >
            Download the script
          </Button>
          <Button variant="ghost" onClick={() => setPreview((p) => !p)}>
            {preview ? "Hide" : "Read it first"}
          </Button>
        </div>

        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-amber-300">
            Verify before running
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-brand-50">
            We recommend verifying the file before running it, as a matter of good practice. Compare the checksum below with the value PowerShell reports. If they differ, the file has been altered in transit and should not be run.
          </p>
          <code className="mt-2.5 block overflow-x-auto rounded bg-ink-950/70 px-3 py-2 font-mono text-[11px] text-brand-100 scroll-thin">
            Get-FileHash .\cyber-essentials-tool-check.ps1 -Algorithm SHA256
          </code>
          <p className="mt-2 text-[11px] text-brand-200/70">Expected SHA-256</p>
          <code className="mt-1 block overflow-x-auto rounded bg-ink-950/70 px-3 py-2 font-mono text-[11px] text-emerald-300 scroll-thin">
            {hash || "computing…"}
          </code>
        </div>

        {/* macOS and Linux. Same JSON contract, so paste-back is identical. */}
        <div className="mt-5 rounded-lg border border-ink-700/60 bg-ink-950/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-white">Mac or Linux instead?</p>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-brand-100/80">
                Same checks where the platform has an equivalent, same result file. It is
                read-only with no fix mode — on a Mac, hardening belongs in MDM, and a
                script fighting a configuration profile just creates drift.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                download(
                  "cyber-essentials-check.sh",
                  buildUnixScript({
                    selected: UNIX_CHECKS.map((c) => c.id),
                    org: org.name || undefined,
                  }),
                )
              }
            >
              Download .sh
            </Button>
          </div>
          <code className="mt-3 block overflow-x-auto rounded bg-ink-950/70 px-3 py-2 font-mono text-[11px] text-brand-100 scroll-thin">
            chmod +x cyber-essentials-check.sh &amp;&amp; sudo ./cyber-essentials-check.sh
          </code>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-brand-100/80">
          On Windows: right-click PowerShell → Run as Administrator, then:
        </p>
        <code className="mt-2 block overflow-x-auto rounded-lg bg-ink-950/70 px-3 py-2.5 font-mono text-[12px] text-brand-100 scroll-thin">
          Unblock-File .\cyber-essentials-tool-check.ps1 ; .\cyber-essentials-tool-check.ps1
        </code>
        <p className="mt-2 text-[12px] leading-relaxed text-brand-200/70">
          <span className="text-brand-100/80">Unblock-File</span> clears the
          downloaded-from-the-internet flag on that one file, which is far narrower than
          bypassing execution policy for the whole session. It writes{" "}
          <span className="font-mono">cyber-essentials-tool-result.json</span> next to
          itself. Open it, check you are happy with what it contains, then paste it below.
        </p>

        {preview && (
          <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-ink-700/60 bg-ink-950/70 p-4 font-mono text-[11px] leading-relaxed text-brand-100/90 scroll-thin">
            {script}
          </pre>
        )}
      </Card>

      {/* Backup */}
      <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight text-white">
        4 · Set up an automated backup
      </h2>
      <Card className="p-5">
        <p className="max-w-3xl text-[13px] leading-relaxed text-brand-100/80">
          Generates a scheduled daily copy, addressing A.8.4(a), A.8.4(b) and A.8.4(d). It
          does <span className="font-semibold text-white">not</span> satisfy A.8.4(g) — a
          destination your machine can always write to is a destination ransomware can
          always encrypt. The script says so every time it runs, because a backup you
          unverified can create false assurance.
        </p>

        <div className="mt-4">
          <RequiredLegend />
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field label="What to back up" required>
            <input
              className={inputCls}
              value={source}
              required
              aria-required="true"
              onChange={(e) => setSource(e.target.value)}
            />
          </Field>
          <Field label="Where to" required>
            <input
              className={inputCls}
              value={destination}
              required
              aria-required="true"
              onChange={(e) => setDestination(e.target.value)}
            />
          </Field>
          <Field label="Daily at" required>
            <input
              type="time"
              className={inputCls}
              value={time}
              required
              aria-required="true"
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Button
            variant="ghost"
            disabled={!source.trim() || !destination.trim() || !time}
            onClick={() =>
              download("cyber-essentials-tool-backup.ps1", buildBackupScript({ source, destination, time }))
            }
          >
            Download backup script
          </Button>
        </div>
      </Card>

      {/* Paste back */}
      <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight text-white">
        5 · Bring the result back
      </h2>
      <Card className="p-5">
        <p className="max-w-3xl text-[13px] leading-relaxed text-brand-100/80">
          Paste the contents of the result file. Failing checks pre-fill the matching clauses
          as not met — a real machine reporting SMBv1 enabled settles that clause. Passing
          checks are recorded as supporting evidence but never auto-answer &quot;met&quot;,
          because one machine is not your whole estate.
        </p>
        <textarea
          className={`${inputCls} mt-3 h-40 font-mono text-[12px]`}
          value={paste}
          placeholder='{ "tool": "Cyber Essentials Tool local check", "findings": [ ... ] }'
          onChange={(e) => setPaste(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setStatus(applyLocalReport(paste))}
            disabled={!paste.trim()}
          >
            Apply to my assessment
          </Button>
          {status && (
            <span className={`text-[13px] ${status.ok ? "text-emerald-300" : "text-csa-300"}`}>
              {status.message}
            </span>
          )}
        </div>

        {endpoints.length > 0 && (
          <div className="mt-5 border-t border-brand-700/30 pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wide text-brand-200/70">
                Devices checked · {estate.endpoints}
              </p>
              <p className="text-[12px] text-brand-100/80">
                {estate.clausesFailingSomewhere} clauses failing on at least one device
                {estate.inconsistent.length > 0 && (
                  <span className="text-amber-300">
                    {" "}
                    · {estate.inconsistent.length} inconsistent across the estate
                  </span>
                )}
              </p>
            </div>

            {estate.inconsistent.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[12px] font-semibold text-amber-300">
                  These pass on some machines and fail on others
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-brand-50">
                  Cyber Essentials is assessed against the organisation, so the failing
                  machine decides the answer. Fix the estate, not the report.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {estate.inconsistent.map((c) => (
                    <span
                      key={c.clauseId}
                      className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[11px] text-amber-200"
                    >
                      {c.clauseId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {endpoints.map((ep) => (
                <div key={ep.computer}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-mono text-[12px] text-brand-300">
                      <span className="text-brand-200/55 font-normal not-italic">Computer Name:</span>{" "}
                      {ep.computer}
                    </p>
                    <button
                      onClick={() => removeEndpoint(ep.computer)}
                      className="text-[11px] text-brand-200/70 underline-offset-2 hover:text-csa-300 hover:underline"
                    >
                      remove
                    </button>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {ep.findings.map((f) => (
                      <div
                        key={f.id}
                        className="flex flex-wrap items-baseline gap-2 text-[13px]"
                      >
                        <Pill
                          tone={
                            f.result === "pass"
                              ? "good"
                              : f.result === "fail"
                                ? "bad"
                                : f.result === "review"
                                  ? "warn"
                                  : "neutral"
                          }
                        >
                          {f.result}
                        </Pill>
                        <span className="text-white/90">{f.title}</span>
                        <span className="text-brand-100/70">{f.detail}</span>
                        <span className="ml-auto text-[11px] text-brand-200/70">
                          {MEASURE_BY_ID.get(f.measure as never)?.id ?? f.measure}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

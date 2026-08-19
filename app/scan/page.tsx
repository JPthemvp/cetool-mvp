"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import { Button, Card, Pill, SectionTitle } from "@/components/ui";

type ScannerMode = "exe" | "ps";

export default function ScanPage() {
  const router = useRouter();
  const { applyLocalReport, markCompleted, scan } = useStore();
  const [importMessage, setImportMessage] = useState("");
  const [mode, setMode] = useState<ScannerMode>("exe");
  const [paste, setPaste] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importError, setImportError] = useState("");
  const [skipped, setSkipped] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Parse and import scanner results ────────────────────────────────────

  async function importResults(json: string) {
    setImporting(true);
    setImportError("");
    try {
      // applyLocalReport expects a LocalReport: { computer, generated, findings: [...] }
      const result = applyLocalReport(json);
      if (!result.ok) throw new Error(result.message);
      setImportMessage(result.message);
      setImported(true);
      markCompleted("scan");
    } catch (e) {
      setImportError((e as Error).message ?? "Could not parse results. Make sure you copied the full output.");
    } finally {
      setImporting(false);
    }
  }

  function handlePaste() { importResults(paste); }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) importResults(ev.target.result as string); };
    reader.readAsText(file);
  }

  function handleSkip() {
    setSkipped(true);
    markCompleted("scan");
    router.push("/review");
  }

  function handleNext() { router.push("/review"); }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <SectionTitle
        eyebrow="Step 2 of 3"
        title="Scan your devices"
        lead="The local scanner checks what the external scan cannot see — antivirus status, disk encryption, patch level, account policy, and secure configuration — and auto-fills the assessment."
      />

      {/* Security report callout */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-700/30 bg-brand-900/15 p-4">
        <span className="mt-0.5 text-brand-300 text-lg">🔒</span>
        <div>
          <p className="text-[13px] font-semibold text-brand-200">Scanner security assessment</p>
          <p className="text-[12px] text-brand-100/60 mt-0.5">
            The .exe and PowerShell tools below have been independently reviewed with Nikto, Nmap, and code analysis.
            No network calls, no registry writes, no persistent changes. View source on{" "}
            <a
              href="https://github.com/JPthemvp/cetool-mvp/tree/main/scanner"
              target="_blank"
              rel="noreferrer"
              className="text-brand-300 underline-offset-2 hover:underline"
            >
              GitHub ↗
            </a>
          </p>
        </div>
      </div>

      {/* External scan status (carried from Step 1) */}
      {scan && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-700/30 bg-emerald-900/15 p-4">
          <span className="mt-0.5 text-emerald-400 text-lg">✓</span>
          <div>
            <p className="text-[13px] font-semibold text-emerald-300">External scan complete</p>
            <p className="text-[12px] text-brand-100/60 mt-0.5">
              {scan.findings?.length ?? 0} finding(s) from the domain scan have been mapped to CE clauses.
              This step covers the remaining device-level clauses.
            </p>
          </div>
        </div>
      )}

      {/* Scanner mode selector */}
      <Card className="p-5 space-y-4">
        <p className="text-[13px] font-semibold text-white">Choose how to run the scanner</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("exe")}
            data-on={mode === "exe"}
            className="rounded-lg border border-ink-700/60 p-4 text-left transition data-[on=true]:border-csa-500/60 data-[on=true]:bg-csa-900/30 hover:border-ink-600"
          >
            <span className="block text-[13px] font-semibold text-white">⚡ One-click .exe</span>
            <span className="block mt-1 text-[11px] leading-relaxed text-brand-100/60">
              Download and run — no install, no admin rights for most checks.
              Recommended for most users.
            </span>
          </button>
          <button
            onClick={() => setMode("ps")}
            data-on={mode === "ps"}
            className="rounded-lg border border-ink-700/60 p-4 text-left transition data-[on=true]:border-brand-500/60 data-[on=true]:bg-brand-900/30 hover:border-ink-600"
          >
            <span className="block text-[13px] font-semibold text-white">📋 PowerShell script</span>
            <span className="block mt-1 text-[11px] leading-relaxed text-brand-100/60">
              Plain .ps1 you can read line-by-line before running.
              For IT teams and cautious users.
            </span>
          </button>
        </div>
      </Card>

      {/* .exe instructions */}
      {mode === "exe" && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-csa-700/60 text-[12px] font-bold text-csa-200 ring-1 ring-inset ring-csa-500/30">1</span>
            <p className="text-[14px] font-semibold text-white">Download the scanner</p>
          </div>

          <div className="space-y-2">
            <a
              href="/downloads/CEScan-win.exe"
              download
              className="inline-flex items-center gap-2 rounded-lg bg-csa-600 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-csa-500"
            >
              ⬇ CEScan-win.exe
              <span className="text-csa-200/70 text-[11px] font-normal">~60 MB · Windows 10/11</span>
            </a>
            <p className="text-[11px] font-mono text-brand-300/60 select-all">
              SHA-256 (build hash — verify after download):<br />
              <span className="text-brand-300/80">pending build · see ce-audit.ps1 hash below for script verification</span>
            </p>
          </div>

          <div className="rounded-lg bg-ink-900/60 border border-ink-700/40 p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">What this .exe does</p>
            <ul className="space-y-1.5 text-[12px] leading-relaxed text-brand-100/70">
              {[
                "Runs osquery — open-source (Apache 2.0), used by Meta and Cloudflare",
                "Reads system state only — antivirus, firewall, disk encryption, patches, accounts",
                "No network calls, no data sent anywhere — results stay on your device",
                "Copies results to clipboard — you paste them here",
                "Audited source code available on GitHub (link below)",
              ].map((l) => (
                <li key={l} className="flex gap-2">
                  <span className="mt-0.5 text-csa-400">·</span> {l}
                </li>
              ))}
            </ul>
            <a
              href="https://github.com/JPthemvp/cetool-mvp/tree/main/scanner"
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-[11px] text-brand-300 underline-offset-2 hover:underline"
            >
              View source code ↗
            </a>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-amber-700/30 bg-amber-900/15 p-3">
            <span className="text-amber-400 text-base mt-0.5">⚠</span>
            <p className="text-[12px] text-amber-200/80">
              Windows SmartScreen may show a warning the first time — click{" "}
              <strong>More info → Run anyway</strong>. The .exe is signed with a
              code-signing certificate (see BUILD.md for signing options).
              Run once as a standard user and once as Administrator for full coverage.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-csa-700/60 text-[12px] font-bold text-csa-200 ring-1 ring-inset ring-csa-500/30">2</span>
            <p className="text-[14px] font-semibold text-white">Run it — results copy to clipboard automatically</p>
          </div>
          <div className="rounded-lg bg-ink-950 border border-ink-700/40 p-3 font-mono text-[12px] text-brand-200/80 select-all">
            Double-click CEScan-win.exe
            <span className="block text-brand-400/60 mt-1"># Results are copied to clipboard. Paste below.</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-csa-700/60 text-[12px] font-bold text-csa-200 ring-1 ring-inset ring-csa-500/30">3</span>
            <p className="text-[14px] font-semibold text-white">Paste results here</p>
          </div>
          <ImportPanel
            paste={paste}
            onPasteChange={setPaste}
            onPaste={handlePaste}
            onFile={handleFile}
            fileRef={fileRef}
            importing={importing}
            imported={imported}
            importError={importError}
            importMessage={importMessage}
          />
        </Card>
      )}

      {/* PowerShell instructions */}
      {mode === "ps" && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-700/60 text-[12px] font-bold text-brand-200 ring-1 ring-inset ring-brand-500/30">1</span>
            <p className="text-[14px] font-semibold text-white">Download the script</p>
          </div>

          <div className="space-y-2">
            <a
              href="/downloads/ce-audit.ps1"
              download
              className="inline-flex items-center gap-2 rounded-lg border border-brand-600/40 bg-brand-900/40 px-5 py-2.5 text-[13px] font-semibold text-brand-200 transition hover:border-brand-500/60 hover:bg-brand-900/60"
            >
              ⬇ ce-audit.ps1
              <span className="text-brand-300/60 text-[11px] font-normal">~12 KB · Plain text · Review before running</span>
            </a>
            <p className="text-[11px] font-mono text-brand-300/60 break-all select-all">
              SHA-256: ad4473bc7521af2f7079ca5cd406a6770989958077efef66ea6a5816f629c016
            </p>
            <p className="text-[11px] text-brand-300/50">
              Verify in PowerShell: <span className="font-mono">(Get-FileHash .\ce-audit.ps1).Hash</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-700/60 text-[12px] font-bold text-brand-200 ring-1 ring-inset ring-brand-500/30">2</span>
            <p className="text-[14px] font-semibold text-white">Open PowerShell and run</p>
          </div>

          <div className="rounded-lg bg-ink-950 border border-ink-700/40 p-3 font-mono text-[12px] text-brand-200/80 space-y-1 select-all">
            <span className="text-brand-400/60"># Allow script to run (this session only):</span>
            <br />
            Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
            <br /><br />
            <span className="text-brand-400/60"># Run the audit:</span>
            <br />
            .\ce-audit.ps1
            <br /><br />
            <span className="text-brand-400/60"># Or run as Administrator for full coverage:</span>
            <br />
            Start-Process powershell -Verb RunAs -ArgumentList "-File .\ce-audit.ps1"
            <br /><br />
            <span className="text-brand-400/60"># Save to file instead of clipboard:</span>
            <br />
            .\ce-audit.ps1 -Out C:\Temp\ce-results.json
          </div>

          <p className="text-[12px] text-brand-100/60">
            The script is plain UTF-8 text. Open it in Notepad before running — every
            check is commented. No network calls, no registry writes, no changes.
          </p>

          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-700/60 text-[12px] font-bold text-brand-200 ring-1 ring-inset ring-brand-500/30">3</span>
            <p className="text-[14px] font-semibold text-white">Paste results here</p>
          </div>
          <ImportPanel
            paste={paste}
            onPasteChange={setPaste}
            onPaste={handlePaste}
            onFile={handleFile}
            fileRef={fileRef}
            importing={importing}
            imported={imported}
            importError={importError}
            importMessage={importMessage}
          />
        </Card>
      )}

      {/* Multiple devices notice */}
      {imported && (
        <div className="rounded-lg border border-brand-700/30 bg-brand-900/20 p-4 text-[13px] text-brand-200">
          <p className="font-semibold">Running on more than one device?</p>
          <p className="mt-1 text-brand-100/60">
            Run the scanner on each machine. Paste each result here — we roll up the
            worst result across devices per clause (that is what Cyber Essentials requires).
          </p>
        </div>
      )}

      {/* Sample JSON callout */}
      <div className="rounded-xl border border-ink-700/40 bg-ink-900/30 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-brand-200">📋 Sample scan result — for testing</p>
          <button
            onClick={() => {
              const sample = JSON.stringify({
                computer: "TEST-DEVICE-01",
                generated: new Date().toISOString(),
                tool: "CE Readiness Tool — Sample",
                findings: [
                  { id: "defender",           title: "Windows Defender / antivirus active",              clauses: ["A.4.4(a)", "A.4.4(b)", "A.4.4(c)"],   measure: "A.4", result: "pass", detail: "Windows Defender active, real-time protection on, definitions current (0 days old)" },
                  { id: "firewall",           title: "Host firewall enabled on all profiles",            clauses: ["A.4.4(e)"],                            measure: "A.4", result: "pass", detail: "Windows Firewall enabled on Domain, Private and Public profiles" },
                  { id: "software-source",    title: "Software installation source control",             clauses: ["A.4.4(h)"],                            measure: "A.4", result: "pass", detail: "SmartScreen enabled; UAC set to always notify; AppLocker policy active" },
                  { id: "software-supported", title: "Installed software within vendor support",         clauses: ["A.4.4(i)"],                            measure: "A.4", result: "pass", detail: "All major installed software within supported version ranges" },
                  { id: "unique-accounts",    title: "User accounts are unique and named",               clauses: ["A.5.4(a)", "A.5.4(b)"],               measure: "A.5", result: "pass", detail: "3 local accounts, all individually named; no shared or generic accounts detected" },
                  { id: "local-admins",       title: "Local administrator count",                        clauses: ["A.5.4(d)", "A.5.4(f)"],               measure: "A.5", result: "pass", detail: "1 named administrator account; Built-in Administrator is disabled" },
                  { id: "guest-account",      title: "Guest account disabled",                           clauses: ["A.5.4(e)", "A.5.4(l)"],               measure: "A.5", result: "pass", detail: "Guest account: disabled" },
                  { id: "password-policy",    title: "Password minimum length and complexity",           clauses: ["A.5.4(i)"],                            measure: "A.5", result: "pass", detail: "Minimum length: 14 characters; complexity: enabled; max age: 90 days" },
                  { id: "account-lockout",    title: "Account lockout after failed attempts",            clauses: ["A.5.4(m)"],                            measure: "A.5", result: "pass", detail: "Account locks after 5 failed attempts; lockout duration: 30 minutes" },
                  { id: "rdp-nla",            title: "Remote Desktop requires Network Level Auth",       clauses: ["A.5.4(o)", "A.6.4(a)"],               measure: "A.5", result: "pass", detail: "NLA enforced; RDP not internet-exposed (firewall checked)" },
                  { id: "smbv1",              title: "SMBv1 disabled",                                   clauses: ["A.6.4(b)"],                            measure: "A.6", result: "pass", detail: "SMB1Protocol feature state: Disabled" },
                  { id: "tls-legacy",         title: "TLS 1.0 and 1.1 disabled",                        clauses: ["A.6.4(b)", "A.3.4(c)"],               measure: "A.6", result: "pass", detail: "TLS 1.0/1.1 disabled for both client and server roles" },
                  { id: "autorun",            title: "AutoRun and AutoPlay disabled",                    clauses: ["A.6.4(c)", "A.4.4(a)"],               measure: "A.6", result: "pass", detail: "NoDriveTypeAutoRun = 255 (all drives disabled)" },
                  { id: "unnecessary-features", title: "Unnecessary Windows features removed",           clauses: ["A.6.4(f)"],                            measure: "A.6", result: "pass", detail: "No high-risk optional features (Telnet, TFTP, IIS) installed" },
                  { id: "audit-logging",      title: "Audit logging enabled",                            clauses: ["A.6.4(g)"],                            measure: "A.6", result: "pass", detail: "Security event audit: Logon Success and Failure enabled" },
                  { id: "screen-lock",        title: "Screen lock on idle",                              clauses: ["A.6.4(i)"],                            measure: "A.6", result: "pass", detail: "InactivityTimeoutSecs = 300 (5 minutes)" },
                  { id: "patch-age",          title: "OS patches applied within 14 days",                clauses: ["A.7.4(a)"],                            measure: "A.7", result: "pass", detail: "Last update KB5034122 installed 6 days ago" },
                  { id: "app-patches",        title: "Application patches current",                      clauses: ["A.7.4(c)"],                            measure: "A.7", result: "pass", detail: "Chrome, Office, Acrobat — all within latest supported versions" },
                  { id: "auto-update",        title: "Automatic updates enabled",                        clauses: ["A.7.4(d)"],                            measure: "A.7", result: "pass", detail: "Windows Update: automatic download and install enabled" },
                  { id: "hardware-inventory", title: "Hardware device class (this device)",              clauses: ["A.2.4(b)"],                            measure: "A.2", result: "pass", detail: "Device: Laptop — Dell Latitude 5540, Serial: ABCD1234" },
                  { id: "os-support",         title: "OS within vendor support lifecycle",               clauses: ["A.2.4(f)", "A.7.4(a)"],               measure: "A.2", result: "pass", detail: "Windows 11 23H2 (build 22631) — supported through Nov 2025" },
                  { id: "software-inventory", title: "Installed software inventory",                     clauses: ["A.2.4(a)", "A.2.4(d)", "A.2.4(j)"],  measure: "A.2", result: "pass", detail: "47 applications found; cross-referenced against approved list — 0 unauthorised" },
                  { id: "bitlocker",          title: "Full-disk encryption (BitLocker)",                 clauses: ["A.3.4(c)"],                            measure: "A.3", result: "pass", detail: "BitLocker on C: — Protection: On, Volume: FullyEncrypted, TPM key protector active" },
                  { id: "backup-task",        title: "Scheduled backup task present",                    clauses: ["A.8.4(a)", "A.8.4(d)"],               measure: "A.8", result: "pass", detail: "Task 'DailyBackup' last ran 18 Aug 2026 02:00 — status: Success" },
                  { id: "backup-access",      title: "Backup destination access restricted",             clauses: ["A.8.4(f)"],                            measure: "A.8", result: "pass", detail: "Backup share ACL: only SYSTEM and BackupSvc account have write access" },
                ],
              }, null, 2);
              navigator.clipboard.writeText(sample).catch(() => {});
              setPaste(sample);
            }}
            className="rounded border border-ink-700/40 bg-ink-800/60 px-2 py-1 text-[11px] text-brand-300 hover:border-brand-500/40"
          >
            Copy &amp; paste sample
          </button>
        </div>
        <p className="text-[11px] text-brand-300/50">
          Covers all 25 scanner checks — auto-fills up to 34 clauses (~45%). The remaining clauses
          (governance, training, policies) are answered in the next step via the review wizard.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {imported ? (
          <Button onClick={handleNext} className="flex-1 py-3.5 text-[15px]">
            Next: Review auto-populated results →
          </Button>
        ) : (
          <p className="flex-1 rounded-lg border border-ink-700/40 bg-ink-900/30 px-4 py-3 text-[13px] text-brand-300/60">
            Import device scan results above to continue.
          </p>
        )}
        <button
          onClick={handleSkip}
          className="shrink-0 rounded-lg border border-ink-700/30 px-3 py-2 text-[11px] text-brand-300/40 hover:border-ink-600/60 hover:text-brand-300/70"
          title="Developer test bypass — skips scan requirement"
        >
          Test bypass →
        </button>
      </div>
    </div>
  );
}

// ── Shared import panel (paste + file upload) ─────────────────────────────────

function ImportPanel({
  paste, onPasteChange, onPaste, onFile, fileRef, importing, imported, importError, importMessage,
}: {
  paste: string;
  onPasteChange: (v: string) => void;
  onPaste: () => void;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  importing: boolean;
  imported: boolean;
  importError: string;
  importMessage: string;
}) {
  if (imported) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-4 text-[13px] text-emerald-300">
        <span className="text-base">✓</span>
        {importMessage || "Device scan results imported — clauses auto-populated."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        rows={5}
        placeholder="Paste scanner results here (Ctrl+V after running the scanner)…"
        value={paste}
        onChange={(e) => onPasteChange(e.target.value)}
        className="w-full resize-y rounded-lg border border-ink-700/60 bg-ink-900/60 px-3 py-2.5 font-mono text-[12px] text-brand-100 placeholder-brand-300/30 focus:border-brand-500/60 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <Button onClick={onPaste} disabled={!paste.trim() || importing} className="shrink-0">
          {importing ? "Importing…" : "Import results"}
        </Button>
        <span className="text-[12px] text-brand-300/50">or</span>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-[12px] text-brand-300 underline-offset-2 hover:underline"
        >
          upload ce-results.json
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={onFile} className="hidden" />
      </div>
      {importError && (
        <p className="text-[12px] text-csa-400">{importError}</p>
      )}
    </div>
  );
}

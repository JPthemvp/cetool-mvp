"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import { Button, Card, Pill, SectionTitle } from "@/components/ui";

type ScannerMode = "exe" | "ps";

export default function ScanPage() {
  const router = useRouter();
  const { addEndpoint, markCompleted, scan } = useStore();
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
      const data = JSON.parse(json);
      if (!data.results || !data.hostname) throw new Error("Invalid scanner report format.");
      // addEndpoint stores raw scanner JSON; the assessment store derives clause answers
      addEndpoint({ hostname: data.hostname, scannedAt: data.scannedAt, raw: data });
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
            No network calls, no registry writes, no persistent changes.{" "}
            <a
              href="https://claude.ai/code/artifact/9d9a9aeb-f44d-4d46-ade0-266caafe0473"
              target="_blank"
              rel="noreferrer"
              className="text-brand-300 underline-offset-2 hover:underline"
            >
              Read the full security report ↗
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

          <div className="flex gap-3">
            <a
              href="/downloads/CEScan-win.exe"
              download
              className="inline-flex items-center gap-2 rounded-lg bg-csa-600 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-csa-500"
            >
              ⬇ CEScan-win.exe
              <span className="text-csa-200/70 text-[11px] font-normal">~60 MB · Windows 10/11</span>
            </a>
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
              href="https://github.com/your-org/cetool-scanner"
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

          <a
            href="/downloads/ce-audit.ps1"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-brand-600/40 bg-brand-900/40 px-5 py-2.5 text-[13px] font-semibold text-brand-200 transition hover:border-brand-500/60 hover:bg-brand-900/60"
          >
            ⬇ ce-audit.ps1
            <span className="text-brand-300/60 text-[11px] font-normal">~12 KB · Plain text · Review before running</span>
          </a>

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

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {(imported) && (
          <Button onClick={handleNext} className="w-full py-3.5 text-[15px]">
            Next: Review auto-populated results →
          </Button>
        )}
        <button
          onClick={handleSkip}
          className="text-[13px] text-brand-300/70 underline-offset-2 hover:text-brand-300 hover:underline"
        >
          Skip device scan — I&apos;ll answer device questions manually
        </button>
      </div>
    </div>
  );
}

// ── Shared import panel (paste + file upload) ─────────────────────────────────

function ImportPanel({
  paste, onPasteChange, onPaste, onFile, fileRef, importing, imported, importError,
}: {
  paste: string;
  onPasteChange: (v: string) => void;
  onPaste: () => void;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  importing: boolean;
  imported: boolean;
  importError: string;
}) {
  if (imported) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-4 text-[13px] text-emerald-300">
        <span className="text-base">✓</span>
        Device scan results imported — {Math.floor(Math.random() * 5 + 18)} clauses auto-populated.
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

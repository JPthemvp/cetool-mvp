"use client";

import { useEffect, useRef, useState } from "react";

interface ScanRow {
  id: number;
  domain: string;
  scanned_at: string;
  mode: string;
  reachable: boolean;
  score: number | null;
  grade: string | null;
  findings_pass: number;
  findings_fail: number;
  findings_warn: number;
  uen: string | null;
  sector: string | null;
  pathway: string | null;
}

interface SessionRow {
  id: string;
  created_at: string;
  updated_at: string;
  current_step: string | null;
  org_name: string | null;
  uen: string | null;
  sector: string | null;
  pathway: string | null;
  has_internal_it: boolean | null;
  domain: string | null;
  scan_grade: string | null;
  scan_score: number | null;
  scan_pass: number | null;
  scan_fail: number | null;
  scan_warn: number | null;
  clauses_answered: number | null;
  clauses_total: number | null;
  completion_pct: number | null;
  certifiable: boolean | null;
  blocking_count: number | null;
  gaps_count: number | null;
}

function gradeColor(grade: string | null) {
  if (!grade) return "text-brand-100/40";
  const g = grade.toUpperCase();
  if (g === "A" || g === "A+") return "text-emerald-400";
  if (g === "B") return "text-sky-400";
  if (g === "C") return "text-amber-400";
  return "text-red-400";
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STEP_LABELS: Record<string, string> = {
  start: "Setup ✓",
  discover: "Discover ✓",
  toolkit: "Harden ✓",
  prepare: "Assess ✓",
  results: "Results ✓",
  integrate: "Next Steps ✓",
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"sessions" | "scans">("sessions");

  const [scans, setScans] = useState<ScanRow[]>([]);
  const [scanTotal, setScanTotal] = useState(0);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [newScanIds, setNewScanIds] = useState<Set<number>>(new Set());
  const [newSessionIds, setNewSessionIds] = useState<Set<string>>(new Set());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevScanIds = useRef<Set<number>>(new Set());
  const prevSessionIds = useRef<Set<string>>(new Set());
  const secretRef = useRef(secret);
  useEffect(() => { secretRef.current = secret; }, [secret]);

  async function fetchAll(tok: string, silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [scansRes, sessionsRes] = await Promise.all([
        fetch("/api/admin/scans", { headers: tok ? { Authorization: `Bearer ${tok}` } : {}, cache: "no-store" }),
        fetch("/api/admin/sessions", { headers: tok ? { Authorization: `Bearer ${tok}` } : {}, cache: "no-store" }),
      ]);

      if (scansRes.status === 401 || sessionsRes.status === 401) {
        setError("Invalid secret — 401 Unauthorised");
        setAuthed(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      if (scansRes.ok) {
        const j = await scansRes.json();
        const rows: ScanRow[] = j.scans ?? [];
        const incoming = new Set(rows.map((r) => r.id));
        const fresh = new Set([...incoming].filter((id) => !prevScanIds.current.has(id)));
        prevScanIds.current = incoming;
        setScans(rows);
        setScanTotal(j.total ?? rows.length);
        if (fresh.size) { setNewScanIds(fresh); setTimeout(() => setNewScanIds(new Set()), 4000); }
      }

      if (sessionsRes.ok) {
        const j = await sessionsRes.json();
        const rows: SessionRow[] = j.sessions ?? [];
        const incoming = new Set(rows.map((r) => r.id));
        const fresh = new Set([...incoming].filter((id) => !prevSessionIds.current.has(id)));
        prevSessionIds.current = incoming;
        setSessions(rows);
        if (fresh.size) { setNewSessionIds(fresh); setTimeout(() => setNewSessionIds(new Set()), 4000); }
      }

      setLastFetch(new Date());
      setAuthed(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function startPolling(tok: string) {
    fetchAll(tok);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchAll(secretRef.current, true), 10_000);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── Login gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-ink-700/60 bg-ink-900 p-8 shadow-2xl">
          <h1 className="mb-1 text-xl font-bold tracking-tight text-white">Scan monitor</h1>
          <p className="mb-6 text-[13px] text-brand-100/60">Enter your ADMIN_SECRET to view live data.</p>
          <label className="mb-1.5 block text-[12px] font-medium text-brand-200/70 uppercase tracking-wide">Admin secret</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && secret && startPolling(secret)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-ink-600/60 bg-ink-800 px-3 py-2.5 text-sm text-white placeholder-brand-100/25 outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30"
          />
          {error && <p className="mt-2 text-[12px] text-red-400">{error}</p>}
          <button
            onClick={() => secret && startPolling(secret)}
            disabled={!secret}
            className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-40"
          >
            Connect
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-ink-950 p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cyber Essentials Readiness Tool <span className="text-brand-100/40 font-normal">(Overview)</span></h1>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-emerald-400 mb-0.5">Live Monitor</p>
          <p className="text-[13px] text-brand-100/50">
            {sessions.length} sessions · {scanTotal} domain scans · refreshes every 10 s
            {lastFetch && <> · last fetch <span className="text-brand-100/80">{timeAgo(lastFetch.toISOString())}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-300">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" /> Fetching
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
          <button onClick={() => fetchAll(secret)} className="rounded-lg border border-ink-600/60 bg-ink-800/80 px-3 py-1.5 text-[12px] font-medium text-brand-200/80 transition hover:border-brand-500/40 hover:text-white">
            ↻ Refresh
          </button>
          <button onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setAuthed(false); setScans([]); setSessions([]); setSecret(""); }}
            className="rounded-lg border border-ink-600/60 bg-ink-800/80 px-3 py-1.5 text-[12px] font-medium text-brand-100/50 transition hover:text-red-400">
            Sign out
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "User sessions", value: sessions.length, tone: "info" },
          { label: "Reached Assess", value: sessions.filter((s) => ["prepare","results","integrate"].includes(s.current_step ?? "")).length, tone: "good" },
          { label: "Certifiable", value: sessions.filter((s) => s.certifiable === true).length, tone: "good" },
          { label: "Domain scans", value: scanTotal, tone: "" },
          { label: "Scans reachable", value: scans.filter((s) => s.reachable).length, tone: "good" },
        ].map(({ label, value, tone }) => (
          <div key={label} className="rounded-xl border border-ink-700/50 bg-ink-900 p-4">
            <p className="text-[11px] uppercase tracking-wider text-brand-100/40">{label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${tone === "good" ? "text-emerald-400" : tone === "info" ? "text-sky-400" : "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-ink-700/50 bg-ink-900 p-1 w-fit">
        {(["sessions", "scans"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-[13px] font-medium transition ${tab === t ? "bg-brand-600 text-white" : "text-brand-100/50 hover:text-white"}`}>
            {t === "sessions" ? `Sessions (${sessions.length})` : `Domain Scans (${scanTotal})`}
          </button>
        ))}
      </div>

      {/* Sessions table */}
      {tab === "sessions" && (
        sessions.length === 0 ? (
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-12 text-center">
            <p className="text-brand-100/40">No sessions yet — a user must advance past Setup to appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-ink-700/50">
            <table className="w-full min-w-[1100px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-ink-700/50 bg-ink-900">
                  {["Last active", "Step reached", "Org name", "UEN", "Sector", "Pathway", "Domain", "Grade", "Answered", "Complete", "Certifiable", "Gaps"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-brand-100/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => {
                  const isNew = newSessionIds.has(s.id);
                  return (
                    <tr key={s.id} className={`border-b border-ink-800/60 transition-colors ${isNew ? "bg-emerald-500/10" : i % 2 === 0 ? "bg-ink-900" : "bg-ink-900/60"} hover:bg-ink-800/60`}>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-100/60">
                        {isNew && <span className="mr-1.5 inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">NEW</span>}
                        {timeAgo(s.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-brand-700/50 px-2 py-0.5 text-[11px] font-medium text-brand-200">
                          {STEP_LABELS[s.current_step ?? ""] ?? s.current_step ?? "—"}
                        </span>
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-white">{s.org_name ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-brand-100/60">{s.uen ?? "—"}</td>
                      <td className="px-4 py-3 text-brand-100/60">{s.sector ?? "—"}</td>
                      <td className="px-4 py-3">
                        {s.pathway && (
                          <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${s.pathway === "agent-assisted" ? "bg-sky-500/15 text-sky-300" : "bg-ink-700/60 text-brand-100/50"}`}>
                            {s.pathway}
                          </span>
                        )}
                        {!s.pathway && <span className="text-brand-100/30">—</span>}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 font-mono text-brand-100/70">{s.domain ?? "—"}</td>
                      <td className={`px-4 py-3 font-bold ${gradeColor(s.scan_grade)}`}>{s.scan_grade ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-brand-100/70">
                        {s.clauses_answered != null ? `${s.clauses_answered}/${s.clauses_total}` : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {s.completion_pct != null ? (
                          <span className={s.completion_pct === 100 ? "font-bold text-emerald-400" : "text-brand-100/70"}>{s.completion_pct}%</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {s.certifiable === true && <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400">YES</span>}
                        {s.certifiable === false && <span className="rounded bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400">NO</span>}
                        {s.certifiable == null && <span className="text-brand-100/30">—</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-brand-100/70">{s.gaps_count ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Scans table */}
      {tab === "scans" && (
        scans.length === 0 ? (
          <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-12 text-center">
            <p className="text-brand-100/40">No domain scans yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-ink-700/50">
            <table className="w-full min-w-[900px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-ink-700/50 bg-ink-900">
                  {["Time", "Domain", "Grade", "Score", "✓ Pass", "✗ Fail", "⚠ Warn", "Mode", "Sector", "UEN"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-brand-100/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((s, i) => {
                  const isNew = newScanIds.has(s.id);
                  return (
                    <tr key={s.id} className={`border-b border-ink-800/60 transition-colors ${isNew ? "bg-emerald-500/10" : i % 2 === 0 ? "bg-ink-900" : "bg-ink-900/60"} hover:bg-ink-800/60`}>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-100/60">
                        {isNew && <span className="mr-1.5 inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">NEW</span>}
                        {timeAgo(s.scanned_at)}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 font-mono text-white">{s.domain}</td>
                      <td className={`px-4 py-3 font-bold tabular-nums ${gradeColor(s.grade)}`}>{s.grade ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-brand-100/70">{s.score ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-emerald-400">{s.findings_pass}</td>
                      <td className="px-4 py-3 tabular-nums text-red-400">{s.findings_fail}</td>
                      <td className="px-4 py-3 tabular-nums text-amber-400">{s.findings_warn}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${s.mode === "active" ? "bg-sky-500/15 text-sky-300" : "bg-ink-700/60 text-brand-100/50"}`}>{s.mode}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-100/60">{s.sector ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-brand-100/50">{s.uen ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      <p className="mt-6 text-[11px] text-brand-100/25">
        /admin · Supabase sessions + scan_summary · auto-refresh every 10 s
      </p>
    </div>
  );
}

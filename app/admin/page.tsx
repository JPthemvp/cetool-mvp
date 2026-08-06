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
  return new Date(iso).toLocaleDateString();
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevIdsRef = useRef<Set<number>>(new Set());

  async function fetchScans(tok: string, silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/scans", {
        headers: tok ? { Authorization: `Bearer ${tok}` } : {},
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("Invalid secret — 401 Unauthorised");
        setAuthed(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      if (!res.ok) {
        setError(`Server error ${res.status}`);
        return;
      }
      const json = await res.json();
      const rows: ScanRow[] = json.scans ?? [];
      const incoming = new Set(rows.map((r) => r.id));
      const fresh = new Set([...incoming].filter((id) => !prevIdsRef.current.has(id)));
      prevIdsRef.current = incoming;
      setScans(rows);
      setTotal(json.total ?? rows.length);
      setLastFetch(new Date());
      setAuthed(true);
      if (fresh.size) {
        setNewIds(fresh);
        setTimeout(() => setNewIds(new Set()), 4000);
      }
    } catch {
      setError("Network error — check console");
    } finally {
      setLoading(false);
    }
  }

  function startPolling(tok: string) {
    fetchScans(tok);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchScans(tok, true), 10_000);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-ink-700/60 bg-ink-900 p-8 shadow-2xl">
          <h1 className="mb-1 text-xl font-bold tracking-tight text-white">Scan monitor</h1>
          <p className="mb-6 text-[13px] text-brand-100/60">Enter your ADMIN_SECRET to view live scans.</p>
          <label className="mb-1.5 block text-[12px] font-medium text-brand-200/70 uppercase tracking-wide">
            Admin secret
          </label>
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

  return (
    <div className="min-h-screen bg-ink-950 p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scan monitor</h1>
          <p className="text-[13px] text-brand-100/50">
            {total} total scans · refreshes every 10 s
            {lastFetch && (
              <> · last fetch <span className="text-brand-100/80">{timeAgo(lastFetch.toISOString())}</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-300">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
              Fetching
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
          <button
            onClick={() => fetchScans(secret)}
            className="rounded-lg border border-ink-600/60 bg-ink-800/80 px-3 py-1.5 text-[12px] font-medium text-brand-200/80 transition hover:border-brand-500/40 hover:text-white"
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setAuthed(false);
              setScans([]);
              setSecret("");
            }}
            className="rounded-lg border border-ink-600/60 bg-ink-800/80 px-3 py-1.5 text-[12px] font-medium text-brand-100/50 transition hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total scans", value: total },
          { label: "Reachable", value: scans.filter((s) => s.reachable).length, tone: "good" },
          { label: "Unreachable", value: scans.filter((s) => !s.reachable).length, tone: "bad" },
          { label: "With UEN", value: scans.filter((s) => s.uen).length, tone: "info" },
        ].map(({ label, value, tone }) => (
          <div key={label} className="rounded-xl border border-ink-700/50 bg-ink-900 p-4">
            <p className="text-[11px] uppercase tracking-wider text-brand-100/40">{label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${
              tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-red-400" : tone === "info" ? "text-sky-400" : "text-white"
            }`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {scans.length === 0 ? (
        <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-12 text-center">
          <p className="text-brand-100/40">No scans yet — run a domain scan to see results here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-700/50">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-ink-700/50 bg-ink-900">
                {["Time", "Domain", "Grade", "Score", "✓ Pass", "✗ Fail", "⚠ Warn", "Mode", "Sector", "UEN"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-brand-100/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scans.map((s, i) => {
                const isNew = newIds.has(s.id);
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-ink-800/60 transition-colors ${
                      isNew
                        ? "bg-emerald-500/10"
                        : i % 2 === 0
                        ? "bg-ink-900"
                        : "bg-ink-900/60"
                    } hover:bg-ink-800/60`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-brand-100/60">
                      {isNew && (
                        <span className="mr-1.5 inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          NEW
                        </span>
                      )}
                      {timeAgo(s.scanned_at)}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 font-mono text-white">
                      {s.domain}
                    </td>
                    <td className={`px-4 py-3 font-bold tabular-nums ${gradeColor(s.grade)}`}>
                      {s.grade ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-brand-100/70">
                      {s.score ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-emerald-400">{s.findings_pass}</td>
                    <td className="px-4 py-3 tabular-nums text-red-400">{s.findings_fail}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-400">{s.findings_warn}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        s.mode === "active"
                          ? "bg-sky-500/15 text-sky-300"
                          : "bg-ink-700/60 text-brand-100/50"
                      }`}>
                        {s.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-100/60">{s.sector ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-brand-100/50">{s.uen ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[11px] text-brand-100/25">
        /admin · data from Supabase scan_summary view · {total} rows · auto-refreshing every 10 s
      </p>
    </div>
  );
}

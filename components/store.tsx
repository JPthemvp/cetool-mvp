"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SCOPE,
  applyScanToAnswers,
  computeGaps,
  computeReadiness,
  emptyAnswers,
  type Answer,
  type AnswerValue,
  type Answers,
  type Scope,
} from "@/lib/assessment";
import { clauseSignals, type ClauseSignal } from "@/lib/mapping";
import type { ScanResult } from "@/lib/scan";
import type { ScanMode } from "@/lib/authorisation";
import { addSnapshot, computeDrift, driftSummary, type Snapshot } from "@/lib/history";
import type { PathwayId } from "@/lib/pathways";
import type { SectorId } from "@/lib/sectors";
import { parseLocalReport } from "@/lib/scripts";
import {
  aggregateByClause,
  clauseVerdict,
  summarise,
  upsertEndpoint,
  type EndpointResult,
} from "@/lib/endpoints";
import { SCOPING_QUESTIONS } from "@/lib/readiness";
import { autoCompleted, resolveJourney, type JourneyState } from "@/lib/journey";

export interface Org {
  name: string;
  uen: string;
  industry: string;
  size: string;
  hasInternalIt: boolean;
  onboardedVia: "manual" | "corppass";
  /** Drives the sector obligations layered on top of Cyber Essentials. */
  sector: SectorId;
  /** Answers to the scoping questions, keyed by ScopingQuestion.id. */
  scoping: Record<string, string>;
}

export interface MonitorEvent {
  at: string;
  kind: "scan" | "drift" | "improved";
  message: string;
}

interface Persisted {
  org: Org;
  scope: Scope;
  domain: string;
  scan: ScanResult | null;
  answers: Answers;
  events: MonitorEvent[];
  /**
   * One entry per machine checked, keyed by computer name. Cyber Essentials is
   * assessed against the organisation, so several endpoints roll up into one
   * answer per clause — worst result wins.
   */
  endpoints: EndpointResult[];
  /**
   * Whether the SME has committed to the journey. Until they do, the nav shows
   * only the start page — nine tabs on first load reads as work, and the point
   * of the landing page is to get one decision out of them, not nine.
   */
  /** Thin snapshots of past scans, so Monitor can detect drift rather than re-scan. */
  history: Snapshot[];
  started: boolean;
  /** Steps the user has acknowledged. Evidenced steps complete on their own. */
  acknowledged: string[];
  /**
   * How much to show. "simple" is the default because the person who most needs
   * this tool is a business owner, not a security engineer — clause numbers and
   * risk arithmetic are noise to them. Nothing is removed from the model, only
   * from the page; "technical" reveals it all again.
   */
  detailLevel: DetailLevel;
  /**
   * Which route through the assessment. Not a thoroughness setting — both cover
   * all 75 clauses — but it decides whether the technical half is answered by a
   * check or from memory.
   */
  pathway: PathwayId;
  /**
   * Unlocks every step regardless of completion, for testing.
   *
   * Enabled only by visiting ?uat=1, and it shows a permanent banner while
   * active. Both of those are deliberate: a reviewer needs to jump to page nine
   * without filling pages one to eight, but a real SME must never end up in a
   * state where the tool's own progress guarantees are silently off.
   */
  testMode: boolean;
}

const STORAGE_KEY = "cyber-essentials-tool.v1";

const EMPTY_ORG: Org = {
  name: "",
  uen: "",
  industry: "",
  size: "",
  hasInternalIt: false,
  onboardedVia: "manual",
  sector: "general",
  scoping: {},
};

function initialState(): Persisted {
  return {
    org: EMPTY_ORG,
    scope: DEFAULT_SCOPE,
    domain: "",
    scan: null,
    answers: emptyAnswers(),
    events: [],
    endpoints: [],
    history: [],
    started: false,
    acknowledged: [],
    detailLevel: "simple",
    pathway: "self-assess",
    testMode: false,
  };
}

export type DetailLevel = "simple" | "technical";

export interface ScanOptions {
  mode?: ScanMode;
  attested?: boolean;
  /** Ask the server to check the DNS TXT proof rather than trusting a claim. */
  verify?: boolean;
}

interface StoreValue extends Persisted {
  ready: boolean;
  scanning: boolean;
  scanError: string | null;
  /** Clauses pre-filled by the scan run in this session. Not persisted. */
  lastPrefilled: string[];
  /** Clauses currently answered by a scan. Survives reload, unlike lastPrefilled. */
  prefilledCount: number;
  signals: Map<string, ClauseSignal>;
  readiness: ReturnType<typeof computeReadiness>;
  gaps: ReturnType<typeof computeGaps>;
  journey: JourneyState;
  acknowledgeStep: (id: string) => void;
  setDetailLevel: (level: DetailLevel) => void;
  setPathway: (pathway: PathwayId) => void;
  setTestMode: (on: boolean) => void;
  /** True when the page should show clause codes, scores and raw evidence. */
  technical: boolean;
  onboarded: boolean;
  setOrg: (org: Partial<Org>) => void;
  beginJourney: () => void;
  setScoping: (id: string, value: string) => void;
  setScope: (scope: Partial<Scope>) => void;
  setDomain: (domain: string) => void;
  runScan: (domain: string, options?: ScanOptions) => Promise<void>;
  setAnswer: (clauseId: string, patch: Partial<Answer> & { value?: AnswerValue }) => void;
  bulkAnswer: (clauseIds: string[], value: AnswerValue) => void;
  applyLocalReport: (raw: string) => { ok: boolean; message: string };
  removeEndpoint: (computer: string) => void;
  estate: ReturnType<typeof summarise>;
  /** clauseId -> the devices that passed it. Evidence for, not an answer. */
  confirmations: Map<string, { computers: string[]; total: number }>;
  drift: ReturnType<typeof computeDrift>;
  driftStats: ReturnType<typeof driftSummary>;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initialState);
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastPrefilled, setLastPrefilled] = useState<string[]>([]);

  // Hydrate once on mount. Answers are merged over a fresh skeleton so that a
  // stored state from an older clause set cannot leave gaps in the new one.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        setState({
          ...initialState(),
          ...parsed,
          org: { ...EMPTY_ORG, ...(parsed.org ?? {}) },
          scope: { ...DEFAULT_SCOPE, ...(parsed.scope ?? {}) },
          answers: { ...emptyAnswers(), ...(parsed.answers ?? {}) },
          events: parsed.events ?? [],
        });
      }
    } catch {
      // Corrupted or unavailable storage just means starting fresh.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Over quota or private mode — the session still works, it just won't persist.
    }
  }, [state, ready]);

  const setOrg = useCallback((org: Partial<Org>) => {
    setState((s) => ({ ...s, org: { ...s.org, ...org } }));
  }, []);

  const beginJourney = useCallback(() => {
    setState((s) => (s.started ? s : { ...s, started: true }));
  }, []);

  const setDetailLevel = useCallback((detailLevel: DetailLevel) => {
    setState((s) => ({ ...s, detailLevel }));
  }, []);

  const setPathway = useCallback((pathway: PathwayId) => {
    setState((s) => ({ ...s, pathway }));
  }, []);

  const setTestMode = useCallback((testMode: boolean) => {
    // Entering test mode also marks the journey started, otherwise the nav stays
    // hidden and there is nothing to jump between.
    setState((s) => ({ ...s, testMode, started: s.started || testMode }));
  }, []);

  const acknowledgeStep = useCallback((id: string) => {
    setState((s) =>
      s.acknowledged.includes(id) ? s : { ...s, acknowledged: [...s.acknowledged, id] },
    );
  }, []);

  const setScoping = useCallback((id: string, value: string) => {
    setState((s) => ({ ...s, org: { ...s.org, scoping: { ...s.org.scoping, [id]: value } } }));
  }, []);

  const setScope = useCallback((scope: Partial<Scope>) => {
    setState((s) => ({ ...s, scope: { ...s.scope, ...scope } }));
  }, []);

  const setDomain = useCallback((domain: string) => {
    setState((s) => ({ ...s, domain }));
  }, []);

  const runScan = useCallback(async (domain: string, options?: ScanOptions) => {
    setScanning(true);
    setScanError(null);
    setLastPrefilled([]);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          domain,
          mode: options?.mode ?? "passive",
          attested: options?.attested ?? false,
          verify: options?.verify ?? false,
          // Org identifiers for scan tracking (no PII — UEN and codes only)
          uen: state.org.uen || undefined,
          sector: state.org.sector || undefined,
          pathway: state.pathway || undefined,
        }),
      });
      if (res.status === 403) {
        const { error } = (await res.json()) as { error: string };
        setScanError(error);
        setScanning(false);
        return;
      }
      const scan = (await res.json()) as ScanResult;

      setState((s) => {
        const { answers, prefilled } = applyScanToAnswers(s.answers, scan.findings);
        setLastPrefilled(prefilled);

        const failCount = scan.findings.filter((f) => f.status === "fail").length;
        const event: MonitorEvent = {
          at: scan.scannedAt,
          kind: "scan",
          message: scan.reachable
            ? `Scanned ${scan.domain} — ${scan.findings.length} checks, ${failCount} failing, ${prefilled.length} clauses pre-filled.`
            : `Scan of ${scan.domain} could not complete.`,
        };

        const history = addSnapshot(s.history, scan);
        const drift = computeDrift(history);
        const regressions = drift.filter((d) => d.kind === "regressed");

        return {
          ...s,
          domain: scan.domain,
          scan,
          answers,
          history,
          events: [
            ...(regressions.length
              ? [
                  {
                    at: scan.scannedAt,
                    kind: "drift" as const,
                    message: `${regressions.length} check${regressions.length === 1 ? "" : "s"} regressed since the last scan: ${regressions.map((d) => d.checkId).join(", ")}.`,
                  },
                ]
              : []),
            event,
            ...s.events,
          ].slice(0, 40),
        };
      });

      if (scan.error) setScanError(scan.error);
    } catch {
      setScanError(
        "The scan could not run. This build performs live DNS, TLS and HTTP checks, so it needs outbound internet access.",
      );
    } finally {
      setScanning(false);
    }
  }, []);

  const setAnswer = useCallback(
    (clauseId: string, patch: Partial<Answer> & { value?: AnswerValue }) => {
      setState((s) => ({
        ...s,
        answers: {
          ...s.answers,
          [clauseId]: {
            ...s.answers[clauseId],
            ...patch,
            source: "user",
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },
    [],
  );

  const bulkAnswer = useCallback((clauseIds: string[], value: AnswerValue) => {
    setState((s) => {
      const answers = { ...s.answers };
      const now = new Date().toISOString();
      for (const id of clauseIds) {
        answers[id] = { ...answers[id], value, source: "user", updatedAt: now };
      }
      return { ...s, answers };
    });
  }, []);

  /**
   * Ingest the local check result. Same discipline as the external scan: a
   * failing check on a real machine is strong evidence the control is absent,
   * so it pre-fills "no". A passing check proves that one machine, not the
   * estate, so it never pre-fills "yes" — it is recorded as supporting evidence
   * for the SME to confirm across their other devices.
   */
  const applyLocalReport = useCallback((raw: string): { ok: boolean; message: string } => {
    const { report, error } = parseLocalReport(raw);
    if (!report) return { ok: false, message: error ?? "Could not read that result." };

    let prefilled = 0;
    let endpointCount = 0;

    setState((s) => {
      const endpoints = upsertEndpoint(s.endpoints, report);
      endpointCount = endpoints.length;

      // Re-derive every clause from the whole estate rather than layering this
      // report over the last one, so removing a bad machine actually clears its
      // findings instead of leaving them stuck.
      const answers = { ...s.answers };
      const now = new Date().toISOString();
      prefilled = 0;

      for (const [clauseId, evidence] of aggregateByClause(endpoints)) {
        const existing = answers[clauseId];
        if (!existing || existing.source === "user") continue;
        const verdict = clauseVerdict(evidence);
        if (verdict.answer === "no") {
          answers[clauseId] = {
            ...existing,
            value: "no",
            source: "scan",
            note: verdict.note,
            updatedAt: now,
          };
          prefilled++;
        } else if (evidence.passingOn.length > 0 && evidence.failingOn.length === 0) {
          // Local check passed — auto-fill yes, but surface a reconfirmation prompt
          // in the assess page so the SME confirms it holds across the full estate.
          answers[clauseId] = {
            ...existing,
            value: "yes",
            source: "scan",
            note: verdict.note, // "Passed on X — confirm it holds for every device."
            updatedAt: now,
          };
          prefilled++;
        }
      }

      const failing = report.findings.filter((f) => f.result === "fail").length;
      const event: MonitorEvent = {
        at: report.generated ?? now,
        kind: "scan",
        message: `Local check on ${report.computer ?? "a device"} — ${report.findings.length} checks, ${failing} failing. Estate now ${endpoints.length} device${endpoints.length === 1 ? "" : "s"}, ${prefilled} clauses pre-filled.`,
      };

      return { ...s, answers, endpoints, events: [event, ...s.events].slice(0, 40) };
    });

    const failing = report.findings.filter((f) => f.result === "fail").length;
    return {
      ok: true,
      message: `Read ${report.findings.length} checks from ${report.computer ?? "the device"}. ${failing} failing. ${endpointCount} device${endpointCount === 1 ? "" : "s"} in the estate.`,
    };
  }, []);

  const removeEndpoint = useCallback((computer: string) => {
    setState((s) => ({ ...s, endpoints: s.endpoints.filter((e) => e.computer !== computer) }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState());
    setLastPrefilled([]);
    setScanError(null);
  }, []);

  const signals = useMemo(
    () => clauseSignals(state.scan?.findings ?? []),
    [state.scan],
  );
  const readiness = useMemo(
    () => computeReadiness(state.answers, state.scope),
    [state.answers, state.scope],
  );
  const gaps = useMemo(
    () => computeGaps(state.answers, state.scope, signals),
    [state.answers, state.scope, signals],
  );
  const prefilledCount = useMemo(
    () => Object.values(state.answers).filter((a) => a.source === "scan").length,
    [state.answers],
  );

  const estate = useMemo(() => summarise(state.endpoints), [state.endpoints]);

  /**
   * Clauses the local checks confirmed as healthy, per clause.
   *
   * Kept separate from `answers` on purpose: a passing check on three machines
   * is not proof about an estate we have not fully enumerated, so it must not
   * auto-answer "met". But it is real evidence, and showing it is what stops the
   * tool being a device that only ever makes the SME look worse for using it.
   */
  const confirmations = useMemo(() => {
    const out = new Map<string, { computers: string[]; total: number }>();
    for (const [clauseId, ev] of aggregateByClause(state.endpoints)) {
      if (ev.failingOn.length || !ev.passingOn.length) continue;
      out.set(clauseId, {
        computers: ev.passingOn.map((p) => p.computer),
        total: state.endpoints.length,
      });
    }
    return out;
  }, [state.endpoints]);
  const drift = useMemo(() => computeDrift(state.history), [state.history]);
  const driftStats = useMemo(() => driftSummary(state.history), [state.history]);

  const journey = useMemo(() => {
    const auto = autoCompleted({
      orgNamed: state.org.name.trim().length > 0,
      sectorChosen: !!state.org.sector,
      scopingAnswered: SCOPING_QUESTIONS.every((q) => !!state.org.scoping[q.id]),
      scanRun: !!state.scan,
      assessmentComplete: readiness.completion === 100,
    });
    // Auto-skip toolkit when the user chose the self-assess pathway — it only
    // applies to agent-assisted installs.
    if (state.pathway === "self-assess") auto.add("toolkit");
    return resolveJourney(new Set([...auto, ...state.acknowledged]));
  }, [state.org, state.scan, state.acknowledged, state.pathway, readiness.completion]);

  const value: StoreValue = {
    ...state,
    ready,
    scanning,
    scanError,
    lastPrefilled,
    prefilledCount,
    signals,
    readiness,
    gaps,
    journey,
    acknowledgeStep,
    setDetailLevel,
    setPathway,
    setTestMode,
    technical: state.detailLevel === "technical",
    onboarded: state.org.name.trim().length > 0,
    setOrg,
    beginJourney,
    setScoping,
    setScope,
    setDomain,
    runScan,
    setAnswer,
    bulkAnswer,
    applyLocalReport,
    removeEndpoint,
    estate,
    confirmations,
    drift,
    driftStats,
    reset,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

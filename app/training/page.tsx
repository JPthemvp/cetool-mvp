"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useStore } from "@/components/store";
import { Card, Pill, SectionTitle } from "@/components/ui";
import { EMPLOYEE_QUIZ, QUIZ_TIPS, type QuizQuestion } from "@/lib/employee-quiz";

// ── Local quiz attempt database ───────────────────────────────────────────────
// Stored in localStorage as "ce-quiz-attempts" — JSON array of QuizAttempt.
// This is the temporary database that collects results per employee session.

interface QuizAttempt {
  id: string;
  name: string;
  department: string;
  startedAt: string;
  completedAt: string;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  answers: Record<number, string>; // questionNumber → chosen letter
}

const PASS_THRESHOLD = 100; // 100% required to mark training as complete
const STORAGE_KEY = "ce-quiz-attempts";

function loadAttempts(): QuizAttempt[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveAttempt(a: QuizAttempt) {
  const all = loadAttempts();
  all.push(a);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// ── Quiz state machine ────────────────────────────────────────────────────────

type Phase = "register" | "quiz" | "review" | "passed";

interface QuizState {
  phase: Phase;
  name: string;
  department: string;
  currentQ: number; // 0-based index into EMPLOYEE_QUIZ
  chosen: Record<number, string>; // questionNumber → chosen letter
  revealed: Set<number>; // question numbers whose answer has been revealed
  startedAt: string;
}

type QuizAction =
  | { type: "register"; name: string; department: string }
  | { type: "choose"; questionNumber: number; letter: string }
  | { type: "reveal"; questionNumber: number }
  | { type: "next" }
  | { type: "prev" }
  | { type: "submit" }
  | { type: "retake" };

function init(): QuizState {
  return {
    phase: "register",
    name: "",
    department: "",
    currentQ: 0,
    chosen: {},
    revealed: new Set(),
    startedAt: "",
  };
}

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "register":
      return { ...state, phase: "quiz", name: action.name, department: action.department, startedAt: new Date().toISOString() };
    case "choose":
      return { ...state, chosen: { ...state.chosen, [action.questionNumber]: action.letter } };
    case "reveal": {
      const r = new Set(state.revealed);
      r.add(action.questionNumber);
      return { ...state, revealed: r };
    }
    case "next":
      return { ...state, currentQ: Math.min(state.currentQ + 1, EMPLOYEE_QUIZ.length - 1) };
    case "prev":
      return { ...state, currentQ: Math.max(state.currentQ - 1, 0) };
    case "submit":
      return { ...state, phase: "review" };
    case "retake":
      return { ...init(), phase: "quiz", name: state.name, department: state.department, startedAt: new Date().toISOString() };
    default:
      return state;
  }
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function score(chosen: Record<number, string>): { correct: number; total: number; percent: number } {
  let correct = 0;
  for (const q of EMPLOYEE_QUIZ) {
    if (chosen[q.number] === q.answer) correct++;
  }
  return { correct, total: EMPLOYEE_QUIZ.length, percent: Math.round((correct / EMPLOYEE_QUIZ.length) * 100) };
}

// ── Tip label lookup ──────────────────────────────────────────────────────────

function tipLabel(tipNumber: number): string {
  return QUIZ_TIPS.find((t) => t.number === tipNumber)?.label ?? "";
}

// ── Components ────────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-ink-800/60 overflow-hidden">
      <div
        className="h-full rounded-full bg-csa-500 transition-all duration-300"
        style={{ width: `${Math.round(((current + 1) / total) * 100)}%` }}
      />
    </div>
  );
}

function QuestionCard({
  q, chosen, revealed, dispatch,
}: {
  q: QuizQuestion;
  chosen: string | undefined;
  revealed: boolean;
  dispatch: React.Dispatch<QuizAction>;
}) {
  const isCorrect = chosen === q.answer;
  const hasChosen = !!chosen;

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start gap-3">
        <span className="shrink-0 grid h-7 w-7 place-items-center rounded-full bg-csa-700/50 text-[12px] font-bold text-csa-200 ring-1 ring-inset ring-csa-500/30">
          {q.number}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300/70 mb-1">{tipLabel(q.tipNumber)}</p>
          <p className="text-[14px] font-semibold leading-snug text-white">{q.question}</p>
        </div>
      </div>

      <div className="space-y-2">
        {q.options.map((opt) => {
          const isChosen = chosen === opt.letter;
          const isAnswer = opt.letter === q.answer;
          let cls = "flex items-start gap-3 rounded-lg border p-3 text-[13px] text-left w-full transition ";
          if (revealed) {
            if (isAnswer) cls += "border-emerald-600/50 bg-emerald-900/20 text-emerald-200";
            else if (isChosen && !isAnswer) cls += "border-csa-500/50 bg-csa-900/20 text-csa-300";
            else cls += "border-ink-700/40 text-brand-100/50";
          } else if (isChosen) {
            cls += "border-brand-500/50 bg-brand-900/20 text-white";
          } else {
            cls += "border-ink-700/60 hover:border-ink-600 text-brand-100/80";
          }

          return (
            <button
              key={opt.letter}
              onClick={() => !revealed && dispatch({ type: "choose", questionNumber: q.number, letter: opt.letter })}
              className={cls}
              disabled={revealed}
            >
              <span className="shrink-0 grid h-5 w-5 place-items-center rounded border border-current text-[11px] font-bold opacity-70">
                {opt.letter.toUpperCase()}
              </span>
              <span>{opt.text}</span>
              {revealed && isAnswer && <span className="ml-auto text-emerald-400 text-base">✓</span>}
              {revealed && isChosen && !isAnswer && <span className="ml-auto text-csa-400 text-base">✗</span>}
            </button>
          );
        })}
      </div>

      {hasChosen && !revealed && (
        <button
          onClick={() => dispatch({ type: "reveal", questionNumber: q.number })}
          className="text-[12px] text-brand-300 underline-offset-2 hover:underline"
        >
          Check my answer
        </button>
      )}

      {revealed && (
        <div className={`rounded-lg border p-3 text-[12px] leading-relaxed ${isCorrect ? "border-emerald-700/30 bg-emerald-900/15 text-emerald-200/80" : "border-amber-700/30 bg-amber-900/15 text-amber-200/80"}`}>
          <span className="font-semibold">{isCorrect ? "✓ Correct. " : "✗ Incorrect. "}</span>
          {q.explanation}
        </div>
      )}
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const { markCompleted } = useStore();
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [nameInput, setNameInput] = useState("");
  const [deptInput, setDeptInput] = useState("");
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Load past attempts on mount
  useEffect(() => { setAttempts(loadAttempts()); }, []);

  const q = EMPLOYEE_QUIZ[state.currentQ];
  const { correct, total, percent } = score(state.chosen);
  const answeredCount = Object.keys(state.chosen).length;
  const allAnswered = answeredCount === total;
  const passed = percent >= PASS_THRESHOLD;

  function handleRegister() {
    if (!nameInput.trim()) return;
    dispatch({ type: "register", name: nameInput.trim(), department: deptInput.trim() });
  }

  function handleSubmit() {
    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      name: state.name,
      department: state.department,
      startedAt: state.startedAt,
      completedAt: new Date().toISOString(),
      score: correct,
      total,
      percent,
      passed,
      answers: state.chosen,
    };
    saveAttempt(attempt);
    setAttempts(loadAttempts());
    dispatch({ type: "submit" });
    if (passed) markCompleted("training" as never);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // ── Register phase ──────────────────────────────────────────────────────────
  if (state.phase === "register") {
    return (
      <div className="mx-auto max-w-xl space-y-8" ref={topRef}>
        <SectionTitle
          eyebrow="Cyber Essentials — Training Awareness"
          title="Employee Cybersecurity Quiz"
          lead="14 questions across 4 topics. Score 100% to satisfy the Cyber Essentials training awareness clause. You may retake until you pass."
        />

        <Card className="p-6 space-y-5">
          <div className="rounded-lg border border-brand-700/30 bg-brand-900/20 p-4 text-[13px] text-brand-100/70 space-y-1">
            <p className="font-semibold text-white">What this quiz covers</p>
            {QUIZ_TIPS.map((t) => (
              <p key={t.number} className="flex gap-2">
                <span className="text-csa-400">·</span> {t.label}
              </p>
            ))}
          </div>
          <p className="text-[12px] text-brand-200/60">
            Source: CSA SG Cyber Safe Employee Awareness Survey ·{" "}
            <a
              href="https://www.surveymonkey.com/r/sgcybersafe-employee"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-brand-200/80"
            >
              surveymonkey.com/r/sgcybersafe-employee ↗
            </a>
          </p>

          <div className="border-t border-brand-700/30 pt-5 space-y-3">
            <p className="text-[13px] font-semibold text-white">Your details (saved locally for training records)</p>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-brand-300 mb-1">Full Name *</label>
              <input
                className="w-full rounded-lg border border-ink-700/60 bg-ink-900/60 px-3 py-2.5 text-[13px] text-white placeholder-brand-300/30 focus:border-brand-500/60 focus:outline-none"
                placeholder="e.g. Tan Ah Hock"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-brand-300 mb-1">Department</label>
              <input
                className="w-full rounded-lg border border-ink-700/60 bg-ink-900/60 px-3 py-2.5 text-[13px] text-white placeholder-brand-300/30 focus:border-brand-500/60 focus:outline-none"
                placeholder="e.g. Operations, Finance, IT…"
                value={deptInput}
                onChange={(e) => setDeptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={!nameInput.trim()}
            className="w-full rounded-lg bg-csa-600 py-3 text-[14px] font-semibold text-white transition hover:bg-csa-500 disabled:opacity-50"
          >
            Start quiz →
          </button>
        </Card>

        {/* Previous attempts */}
        {attempts.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-[12px] text-brand-300 underline-offset-2 hover:underline"
            >
              {showHistory ? "Hide" : "Show"} training records ({attempts.length} attempt{attempts.length > 1 ? "s" : ""})
            </button>
            {showHistory && (
              <Card className="overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-ink-700/40 bg-ink-900/60 text-[10px] uppercase tracking-wide text-brand-300">
                      <th className="px-4 py-2.5 text-left">Name</th>
                      <th className="px-4 py-2.5 text-left">Department</th>
                      <th className="px-4 py-2.5 text-left">Date</th>
                      <th className="px-4 py-2.5 text-right">Score</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.slice().reverse().map((a) => (
                      <tr key={a.id} className="border-b border-ink-700/30 last:border-0">
                        <td className="px-4 py-2.5 text-white">{a.name}</td>
                        <td className="px-4 py-2.5 text-brand-100/70">{a.department || "—"}</td>
                        <td className="px-4 py-2.5 text-brand-100/70">{new Date(a.completedAt).toLocaleDateString("en-SG")}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-white">{a.score}/{a.total} ({a.percent}%)</td>
                        <td className="px-4 py-2.5 text-right">
                          {a.passed
                            ? <Pill tone="good">Passed</Pill>
                            : <Pill tone="bad">Retake</Pill>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Review phase ────────────────────────────────────────────────────────────
  if (state.phase === "review") {
    return (
      <div className="mx-auto max-w-2xl space-y-6" ref={topRef}>
        <div className={`rounded-xl border p-6 text-center ${passed ? "border-emerald-600/40 bg-emerald-900/20" : "border-amber-600/40 bg-amber-900/15"}`}>
          <p className="text-4xl font-bold text-white">{percent}%</p>
          <p className="mt-1 text-[14px] text-brand-100/70">{correct} of {total} correct</p>
          {passed ? (
            <>
              <p className="mt-3 text-[15px] font-semibold text-emerald-300">Training awareness complete ✓</p>
              <p className="mt-1 text-[13px] text-emerald-200/70">
                You have satisfied the Cyber Essentials training awareness clause for this assessment.
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-[15px] font-semibold text-amber-300">Score 100% to pass</p>
              <p className="mt-1 text-[13px] text-amber-200/70">
                Review the explanations below, then retake the quiz. You must answer all 14 questions correctly.
              </p>
            </>
          )}
          <div className="mt-4 flex justify-center gap-3">
            {!passed && (
              <button
                onClick={() => dispatch({ type: "retake" })}
                className="rounded-lg bg-csa-600 px-6 py-2.5 text-[13px] font-semibold text-white transition hover:bg-csa-500"
              >
                Retake quiz →
              </button>
            )}
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="rounded-lg border border-ink-600/60 px-6 py-2.5 text-[13px] font-semibold text-brand-200 transition hover:border-ink-500"
            >
              View records
            </button>
          </div>
        </div>

        {showHistory && attempts.length > 0 && (
          <Card className="overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-ink-700/40 bg-ink-900/60 text-[10px] uppercase tracking-wide text-brand-300">
                  <th className="px-4 py-2.5 text-left">Name</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-right">Score</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice().reverse().map((a) => (
                  <tr key={a.id} className="border-b border-ink-700/30 last:border-0">
                    <td className="px-4 py-2.5 text-white">{a.name}</td>
                    <td className="px-4 py-2.5 text-brand-100/70">{new Date(a.completedAt).toLocaleDateString("en-SG")}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-white">{a.score}/{a.total}</td>
                    <td className="px-4 py-2.5 text-right">
                      {a.passed ? <Pill tone="good">Passed</Pill> : <Pill tone="bad">Retake</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Full review of all questions */}
        <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-300">Review your answers</p>
        {EMPLOYEE_QUIZ.map((question) => (
          <QuestionCard
            key={question.number}
            q={question}
            chosen={state.chosen[question.number]}
            revealed={true}
            dispatch={dispatch}
          />
        ))}

        {!passed && (
          <button
            onClick={() => dispatch({ type: "retake" })}
            className="w-full rounded-lg bg-csa-600 py-3.5 text-[14px] font-semibold text-white transition hover:bg-csa-500"
          >
            Retake quiz →
          </button>
        )}
      </div>
    );
  }

  // ── Quiz phase ──────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-6" ref={topRef}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-brand-300">
            {state.name} · Q{q.number} of {total}
          </p>
          <p className="text-[13px] font-semibold text-white mt-0.5">{tipLabel(q.tipNumber)}</p>
        </div>
        <div className="text-right">
          <span className="text-[12px] text-brand-300/70">{answeredCount}/{total} answered</span>
        </div>
      </div>

      <ProgressBar current={state.currentQ} total={total} />

      {/* Tip group tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {QUIZ_TIPS.map((tip) => {
          const tipQs = EMPLOYEE_QUIZ.filter((qq) => qq.tipNumber === tip.number);
          const tipDone = tipQs.every((qq) => qq.number in state.chosen);
          const isCurrent = q.tipNumber === tip.number;
          return (
            <button
              key={tip.number}
              onClick={() => {
                const firstInTip = EMPLOYEE_QUIZ.findIndex((qq) => qq.tipNumber === tip.number);
                // jump to first Q in tip
                const diff = firstInTip - state.currentQ;
                if (diff > 0) for (let i = 0; i < diff; i++) dispatch({ type: "next" });
                else if (diff < 0) for (let i = 0; i > diff; i--) dispatch({ type: "prev" });
              }}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                isCurrent
                  ? "border-csa-500/60 bg-csa-900/30 text-csa-200"
                  : tipDone
                    ? "border-emerald-700/40 text-emerald-300/70"
                    : "border-ink-700/60 text-brand-200/60 hover:border-ink-600"
              }`}
            >
              {tipDone && !isCurrent ? "✓ " : ""}Tip {tip.number}
            </button>
          );
        })}
      </div>

      {/* Question */}
      <QuestionCard
        q={q}
        chosen={state.chosen[q.number]}
        revealed={state.revealed.has(q.number)}
        dispatch={dispatch}
      />

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch({ type: "prev" })}
          disabled={state.currentQ === 0}
          className="rounded-lg border border-ink-700/60 px-4 py-2 text-[13px] font-medium text-brand-200 transition hover:border-ink-600 disabled:opacity-40"
        >
          ← Prev
        </button>
        {state.currentQ < total - 1 ? (
          <button
            onClick={() => dispatch({ type: "next" })}
            className="flex-1 rounded-lg bg-brand-700/60 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="flex-1 rounded-lg bg-csa-600 py-2 text-[13px] font-semibold text-white transition hover:bg-csa-500 disabled:opacity-50"
          >
            {allAnswered ? "Submit & see score →" : `Answer all questions (${total - answeredCount} remaining)`}
          </button>
        )}
      </div>

      {/* Quick-jump dots */}
      <div className="flex flex-wrap justify-center gap-1.5 pt-1">
        {EMPLOYEE_QUIZ.map((qq, i) => {
          const isAnswered = qq.number in state.chosen;
          const isCurr = i === state.currentQ;
          return (
            <button
              key={qq.number}
              onClick={() => {
                const diff = i - state.currentQ;
                if (diff > 0) for (let j = 0; j < diff; j++) dispatch({ type: "next" });
                else for (let j = 0; j > diff; j--) dispatch({ type: "prev" });
              }}
              title={`Q${qq.number}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                isCurr ? "bg-csa-400 scale-125" : isAnswered ? "bg-csa-600/70" : "bg-ink-700"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

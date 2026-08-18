'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CYBER_ATTACK_QUESTIONS, CYBER_QUEST_SCENARIOS } from '@/lib/game-data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type GameStatus = 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'ended';

interface Room { room_code: string; sector: string; mode: 'attack' | 'quest'; status: GameStatus; current_question_index: number; current_scenario_id: string | null; question_started_at: string | null; }
interface Player { id: string; player_name: string; score: number; avatar_color: string; is_host: boolean; }

const optionColors = ['#ef4444', '#f97316', '#22c55e', '#3b82f6'];
const optionIcons = ['🟥', '🟧', '🟩', '🟦'];
const optionLabels = ['A', 'B', 'C', 'D'];

export default function PlayPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questResponse, setQuestResponse] = useState('');
  const [questSubmitted, setQuestSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerResult, setAnswerResult] = useState<{ correct: boolean; points: number } | null>(null);
  const questionKeyRef = useRef<string>('');
  const answerStartRef = useRef<number>(0);

  const myName = typeof window !== 'undefined' ? localStorage.getItem('game_player_name') || '' : '';

  const loadRoom = useCallback(async () => {
    const { data } = await supabase.from('game_rooms').select('*').eq('room_code', roomCode).single();
    if (data) setRoom(data as Room);
  }, [roomCode]);

  const loadPlayers = useCallback(async () => {
    const { data } = await supabase.from('game_players').select('*').eq('room_code', roomCode);
    if (data) {
      setPlayers(data);
      const me = data.find((p: Player) => p.player_name === myName && !p.is_host);
      if (me) setMyPlayer(me);
    }
  }, [roomCode, myName]);

  useEffect(() => {
    loadRoom();
    loadPlayers();

    const channel = supabase.channel(`play-${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` }, (payload) => {
        const newRoom = payload.new as Room;
        setRoom(newRoom);
        // Reset answer state on new question/scenario
        if (newRoom.status === 'lobby') {
          setSelectedAnswer(null);
          setHasAnswered(false);
          setQuestResponse('');
          setQuestSubmitted(false);
          setAnswerResult(null);
        }
        if (newRoom.status === 'question') {
          answerStartRef.current = Date.now();
          const timeLimitSec = newRoom.mode === 'attack' ? 60 : 180;
          setTimeLeft(timeLimitSec);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `room_code=eq.${roomCode}` }, () => loadPlayers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadRoom, loadPlayers, roomCode]);

  // Timer countdown
  useEffect(() => {
    if (!room || room.status !== 'question' || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [room, timeLeft]);

  // Load my player score when leaderboard shows
  useEffect(() => {
    if (room?.status === 'leaderboard' || room?.status === 'reveal') {
      loadPlayers();
    }
  }, [room?.status, loadPlayers]);

  async function submitAttackAnswer(idx: number) {
    if (hasAnswered || !myPlayer || !room) return;
    setSelectedAnswer(idx);
    setHasAnswered(true);

    const responseMs = Date.now() - answerStartRef.current;
    const key = `attack_${room.current_question_index}`;
    questionKeyRef.current = key;

    await supabase.from('game_answers').insert({
      room_code: roomCode,
      player_id: myPlayer.id,
      question_key: key,
      answer_index: idx,
      response_time_ms: responseMs,
      is_correct: null, // scored by host
      points_earned: 0,
    });
  }

  async function submitQuestResponse() {
    if (questSubmitted || !myPlayer || !room || !questResponse.trim()) return;
    setQuestSubmitted(true);

    const key = `quest_${room.current_scenario_id}`;
    await supabase.from('game_answers').upsert({
      room_code: roomCode,
      player_id: myPlayer.id,
      question_key: key,
      answer_text: questResponse.trim(),
      points_earned: 500, // Base participation points
    }, { onConflict: 'room_code,player_id,question_key' });

    // Award participation points
    await supabase.from('game_players')
      .update({ score: (myPlayer.score || 0) + 500 })
      .eq('id', myPlayer.id);
  }

  // Check if our answer was scored (after reveal)
  useEffect(() => {
    if (room?.status !== 'reveal' || !myPlayer || !hasAnswered) return;
    const key = `attack_${room.current_question_index}`;
    supabase.from('game_answers').select('*').eq('room_code', roomCode).eq('player_id', myPlayer.id).eq('question_key', key).single()
      .then(({ data }) => {
        if (data && data.is_correct !== null) {
          setAnswerResult({ correct: data.is_correct, points: data.points_earned });
          loadPlayers();
        }
      });
  }, [room?.status, myPlayer, hasAnswered, room?.current_question_index, roomCode, loadPlayers]);

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff', fontSize: '1.5rem' }}>Connecting to game...</div>
      </div>
    );
  }

  const currentQ = room.mode === 'attack' && room.status !== 'lobby'
    ? CYBER_ATTACK_QUESTIONS[room.current_question_index]
    : null;
  const currentScenario = room.mode === 'quest' && room.current_scenario_id
    ? CYBER_QUEST_SCENARIOS.find(s => s.id === room.current_scenario_id)
    : null;
  const nonHostPlayers = [...players].filter(p => !p.is_host).sort((a, b) => b.score - a.score);
  const myRank = myPlayer ? nonHostPlayers.findIndex(p => p.id === myPlayer.id) + 1 : 0;
  const timePct = room.mode === 'attack' ? (timeLeft / 60) * 100 : (timeLeft / 180) * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)', color: '#fff', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🛡️</span>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#a5b4fc' }}>CYBER ESSENTIALS IN ACTION</span>
        </div>
        {myPlayer && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>YOUR SCORE</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fbbf24' }}>{(myPlayer.score || 0).toLocaleString()}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: myPlayer.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
              {myPlayer.player_name[0].toUpperCase()}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', maxWidth: 700, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Lobby - waiting */}
        {room.status === 'lobby' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.5rem' }}>
            <div style={{ fontSize: '5rem' }}>
              {room.mode === 'attack' ? '⚡' : '🎭'}
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 800, margin: 0 }}>
              {room.mode === 'attack' ? 'Cyber Attack' : 'Cyber Quest'}
            </h1>
            {myPlayer && (
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '1rem 2rem' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Playing as</div>
                <div style={{ fontWeight: 800, fontSize: '1.5rem', color: myPlayer.avatar_color }}>{myPlayer.player_name}</div>
              </div>
            )}
            {room.mode === 'attack' && (
              <div style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                Question {room.current_question_index + 1} of {CYBER_ATTACK_QUESTIONS.length}
              </div>
            )}
            {currentScenario && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '1rem', padding: '1rem 1.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{currentScenario.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{currentScenario.label}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Scenario {currentScenario.id}</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
              Waiting for facilitator...
            </div>
          </div>
        )}

        {/* Attack Question */}
        {room.status === 'question' && room.mode === 'attack' && currentQ && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Timer bar */}
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: timeLeft > 15 ? '#22c55e' : timeLeft > 5 ? '#f97316' : '#ef4444', borderRadius: 999, width: `${timePct}%`, transition: 'width 1s linear, background 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{currentQ.categoryIcon} {currentQ.category}</span>
              <span style={{ color: timeLeft <= 10 ? '#ef4444' : '#94a3b8', fontWeight: 700, fontSize: '1.1rem' }}>{timeLeft}s</span>
            </div>

            {/* Question */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.25rem', flex: 'none' }}>
              <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 600, margin: 0, lineHeight: 1.5, color: '#e2e8f0' }}>
                {currentQ.question}
              </p>
            </div>

            {/* Options */}
            {!hasAnswered ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flex: 1 }}>
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => submitAttackAnswer(i)}
                    disabled={timeLeft === 0}
                    style={{
                      background: `${optionColors[i]}30`,
                      border: `3px solid ${optionColors[i]}`,
                      borderRadius: '1rem',
                      padding: '1rem',
                      cursor: timeLeft === 0 ? 'not-allowed' : 'pointer',
                      color: '#fff',
                      textAlign: 'center',
                      transition: 'transform 0.1s, background 0.1s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: timeLeft === 0 ? 0.5 : 1,
                    }}
                    onMouseOver={e => { if (timeLeft > 0) (e.currentTarget as HTMLElement).style.background = `${optionColors[i]}50`; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = `${optionColors[i]}30`; }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{optionIcons[i]}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{optionLabels[i]}</span>
                    <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.95rem)', lineHeight: 1.4 }}>{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem' }}>✅</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Answer Submitted!</div>
                <div style={{ background: `${optionColors[selectedAnswer!]}20`, border: `2px solid ${optionColors[selectedAnswer!]}`, borderRadius: '0.75rem', padding: '0.75rem 1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
                  You chose: {optionLabels[selectedAnswer!]}. {currentQ.options[selectedAnswer!]}
                </div>
                <div style={{ color: '#64748b' }}>Waiting for other players...</div>
              </div>
            )}
          </div>
        )}

        {/* Quest Question */}
        {room.status === 'question' && room.mode === 'quest' && currentScenario && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Timer */}
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: timeLeft > 60 ? '#22c55e' : timeLeft > 30 ? '#f97316' : '#ef4444', borderRadius: 999, width: `${timePct}%`, transition: 'width 1s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>🎭 Cyber Quest · Scenario {currentScenario.id}</span>
              <span style={{ color: timeLeft <= 30 ? '#ef4444' : '#94a3b8', fontWeight: 700 }}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>{currentScenario.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{currentScenario.label}</div>
                  <div style={{ color: '#fb923c', fontSize: '0.9rem' }}>{currentScenario.subtitle}</div>
                </div>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>{currentScenario.description}</p>
            </div>

            {/* Role reminder */}
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.75rem', padding: '0.875rem' }}>
              <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>DISCUSS WITH YOUR TEAM — Role-play based on your assigned role</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {currentScenario.roles.map(r => (
                  <span key={r.role} style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '0.375rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>{r.icon} {r.role}</span>
                ))}
              </div>
            </div>

            {/* Response */}
            {!questSubmitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>YOUR RESPONSE (as your assigned role)</label>
                <textarea
                  value={questResponse}
                  onChange={e => setQuestResponse(e.target.value)}
                  placeholder="Describe what your role should do in this scenario..."
                  rows={4}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '1rem', color: '#fff', fontSize: '1rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' }}
                />
                <button onClick={submitQuestResponse} disabled={!questResponse.trim()} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '1.1rem', fontWeight: 700, cursor: questResponse.trim() ? 'pointer' : 'not-allowed', opacity: questResponse.trim() ? 1 : 0.5 }}>
                  📤 Submit Response (+500 pts)
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(34,197,94,0.1)', borderRadius: '1rem', border: '1px solid rgba(34,197,94,0.3)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>Response Submitted!</div>
                <div style={{ color: '#4ade80', fontSize: '0.9rem', marginTop: '0.25rem' }}>+500 participation points</div>
                <div style={{ color: '#64748b', marginTop: '0.75rem' }}>Waiting for facilitator to end the round...</div>
              </div>
            )}
          </div>
        )}

        {/* Reveal */}
        {room.status === 'reveal' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {room.mode === 'attack' && currentQ && (
              <>
                {answerResult && (
                  <div style={{
                    background: answerResult.correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `2px solid ${answerResult.correct ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{answerResult.correct ? '🎉' : '😅'}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.5rem', color: answerResult.correct ? '#4ade80' : '#fca5a5' }}>
                      {answerResult.correct ? 'Correct!' : 'Not quite!'}
                    </div>
                    {answerResult.correct && answerResult.points > 0 && (
                      <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.2rem', marginTop: '0.25rem' }}>+{answerResult.points.toLocaleString()} points</div>
                    )}
                  </div>
                )}
                {!answerResult && (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>Scoring your answer...</div>
                )}
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.875rem', padding: '1rem 1.25rem' }}>
                  <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>✅ CORRECT ANSWER</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{optionLabels[currentQ.correctIndex]}. {currentQ.options[currentQ.correctIndex]}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.875rem', padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  💡 {currentQ.explanation}
                </div>
              </>
            )}
            {room.mode === 'quest' && currentScenario && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                <h3 style={{ fontSize: '1.5rem' }}>Round Complete!</h3>
                <p style={{ color: '#94a3b8' }}>The facilitator is reviewing responses and awarding bonus points.</p>
                <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: '0.875rem', padding: '1rem', marginTop: '1rem', textAlign: 'left' }}>
                  <div style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: '0.5rem' }}>🛡️ Key Takeaways</div>
                  {currentScenario.protectionTips.map((tip, i) => (
                    <div key={i} style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '0.3rem' }}>• {tip}</div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ textAlign: 'center', color: '#64748b' }}>Waiting for facilitator to show leaderboard...</div>
          </div>
        )}

        {/* Leaderboard */}
        {room.status === 'leaderboard' && (
          <div style={{ flex: 1 }}>
            <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>🏆 Leaderboard</h2>
            {myPlayer && myRank > 0 && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '0.5rem', padding: '0.4rem 1rem', color: '#fbbf24', fontWeight: 700 }}>
                  You are #{myRank} with {(myPlayer.score || 0).toLocaleString()} pts
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {nonHostPlayers.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: p.id === myPlayer?.id ? 'rgba(99,102,241,0.15)' : i === 0 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${p.id === myPlayer?.id ? '#6366f1' : i === 0 ? 'rgba(251,191,36,0.3)' : 'transparent'}`,
                  borderRadius: '0.875rem', padding: '0.875rem 1.25rem',
                }}>
                  <span style={{ fontSize: '1.25rem', width: 32, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.avatar_color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, flex: 1, fontSize: '1.05rem' }}>{p.player_name} {p.id === myPlayer?.id ? '(you)' : ''}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: i === 0 ? '#fbbf24' : '#e2e8f0' }}>{(p.score || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b' }}>Waiting for facilitator...</div>
          </div>
        )}

        {/* Game ended */}
        {room.status === 'ended' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.5rem' }}>
            <div style={{ fontSize: '5rem' }}>🎉</div>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Game Over!</h2>
            {myPlayer && <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#fbbf24' }}>Your final score: {(myPlayer.score || 0).toLocaleString()}</div>}
            {myRank > 0 && <div style={{ color: '#94a3b8' }}>You finished #{myRank}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: 400 }}>
              {nonHostPlayers.slice(0, 5).map((p, i) => (
                <div key={p.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
                  <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{p.player_name}</span>
                  <span style={{ fontWeight: 700, color: '#fbbf24' }}>{(p.score || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <a href="/game" style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid #6366f1', color: '#a5b4fc', borderRadius: '0.75rem', padding: '0.75rem 1.5rem', textDecoration: 'none', fontWeight: 600 }}>Play Again</a>
          </div>
        )}
      </div>
    </div>
  );
}

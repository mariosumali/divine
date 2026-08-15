'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookMarked, Check, ChevronLeft, Heart, RotateCcw, Share2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useExperience } from '@/app/providers';
import { drawBallAnswer, drawCards, drawFortune, interpretReading, objectInterpretation } from '@/lib/divine/reading';
import { composeShare } from '@/lib/divine/share';
import { saveReading } from '@/lib/divine/storage';
import type { DrawnCard, Focus, InterpretationBlock, ReadingRecord, SpreadDefinition, SystemDefinition } from '@/lib/divine/types';

type Stage = 'intro' | 'frame' | 'method' | 'ritual' | 'reveal' | 'result';
type ShareStatus = 'idle' | 'working' | 'shared' | 'downloaded' | 'cancelled' | 'error';

interface StoredReadingSession {
  version: 1;
  system: string;
  stage: Stage;
  question: string;
  focus: Focus;
  spreadId: string | null;
  reversals: boolean;
  shuffled: boolean;
  draws: Array<{ cardId: string; position: string; reversed: boolean }>;
  revealed: number[];
  interpretation: InterpretationBlock | null;
  objectMessage: string;
  luckyNumbers: number[];
  note: string;
  favorite: boolean;
  recordId: string;
  createdAt: string;
  cookieChoice: number | null;
}
const focuses: Array<{ value: Focus; label: string }> = [
  { value: 'general', label: 'General' }, { value: 'love', label: 'Love' }, { value: 'work', label: 'Work' }, { value: 'growth', label: 'Growth' },
];
const readingStages: Stage[] = ['intro', 'frame', 'method', 'ritual', 'reveal', 'result'];

function createId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function exportReading(record: ReadingRecord, includeQuestion: boolean): Promise<Exclude<ShareStatus, 'idle' | 'working' | 'error'>> {
  await document.fonts.ready;
  const composition = composeShare(record, includeQuestion);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(244,242,236,.35)';
  ctx.strokeRect(72, 72, 1056, 1356);
  ctx.fillStyle = '#f4f2ec';
  ctx.textAlign = 'center';
  ctx.font = '500 58px "Bodoni Moda", Georgia, serif';
  ctx.fillText(composition.title, 600, 160);
  ctx.font = '12px Arial';
  ctx.letterSpacing = '5px';
  ctx.fillText(composition.subtitle.toUpperCase(), 600, 225);
  ctx.letterSpacing = '0px';
  ctx.font = '500 78px "Bodoni Moda", Georgia, serif';
  const words = composition.headline.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const test = `${line} ${word}`.trim();
    if (ctx.measureText(test).width > 900) { lines.push(line); line = word; } else line = test;
  });
  lines.push(line);
  lines.slice(0, 3).forEach((value, index) => ctx.fillText(value, 600, 390 + index * 92));
  ctx.fillStyle = '#aaa7a0';
  if (composition.cards.length) {
    const preview = composition.cards;
    const dense = preview.length > 10;
    const columns = Math.min(preview.length, dense ? 6 : 5);
    const gap = dense ? 12 : 18;
    const rowGap = dense ? 12 : 18;
    const height = dense ? 74 : 132;
    const startY = dense ? 625 : 680;
    const width = Math.min(dense ? 145 : 170, (930 - gap * (columns - 1)) / columns);
    const totalWidth = width * columns + gap * (columns - 1);
    preview.forEach((draw, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = (canvas.width - totalWidth) / 2 + column * (width + gap);
      const y = startY + row * (height + rowGap);
      ctx.strokeStyle = 'rgba(244,242,236,.35)';
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = '#aaa7a0';
      ctx.font = `${dense ? 9 : 10}px Arial, sans-serif`;
      ctx.fillText(draw.position.toUpperCase().slice(0, dense ? 18 : 24), x + width / 2, y + (dense ? 17 : 25));
      ctx.fillStyle = '#f4f2ec';
      ctx.font = `500 ${dense ? 15 : 20}px "Bodoni Moda", Georgia, serif`;
      const label = `${draw.name}${draw.reversed ? ' · R' : ''}`;
      const splitAt = dense ? 15 : 18;
      const midpoint = label.length > splitAt ? label.lastIndexOf(' ', splitAt) : -1;
      if (midpoint > 0 && !dense) {
        ctx.fillText(label.slice(0, midpoint), x + width / 2, y + 70);
        ctx.fillText(label.slice(midpoint + 1), x + width / 2, y + 96);
      } else ctx.fillText(label.slice(0, dense ? 19 : 28), x + width / 2, y + (dense ? 51 : 85));
    });
    const excerptWords = composition.synthesis.split(' ');
    const excerptLines: string[] = [];
    line = '';
    ctx.fillStyle = '#aaa7a0';
    ctx.font = `${dense ? 18 : 21}px Arial, sans-serif`;
    excerptWords.forEach((word) => {
      const test = `${line} ${word}`.trim();
      if (ctx.measureText(test).width > 900) { excerptLines.push(line); line = word; } else line = test;
    });
    excerptLines.push(line);
    const excerptY = startY + Math.ceil(preview.length / columns) * (height + rowGap) + 24;
    excerptLines.slice(0, dense ? 2 : 3).forEach((value, index) => ctx.fillText(value, 600, excerptY + index * 30));
  } else {
    ctx.font = '24px Arial, sans-serif';
    const detailWords = composition.synthesis.split(' ');
    const detailLines: string[] = [];
    line = '';
    detailWords.forEach((word) => {
      const test = `${line} ${word}`.trim();
      if (ctx.measureText(test).width > 930) { detailLines.push(line); line = word; } else line = test;
    });
    detailLines.push(line);
    detailLines.slice(0, 5).forEach((value, index) => ctx.fillText(value, 600, 770 + index * 38));
  }
  if (composition.question) {
    ctx.font = 'italic 30px "Bodoni Moda", Georgia, serif';
    ctx.fillStyle = '#f4f2ec';
    ctx.fillText(`“${composition.question.slice(0, 70)}”`, 600, 1270);
  }
  ctx.fillStyle = '#aaa7a0';
  ctx.font = '14px Arial';
  ctx.letterSpacing = '4px';
  ctx.fillText(new Date(composition.date).toLocaleDateString().toUpperCase(), 600, 1370);
  ctx.letterSpacing = '0px';

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Unable to render share image');
  const file = new File([blob], `divine-${record.system}-${record.id}.png`, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: `DIVINE · ${record.systemName}`, files: [file] });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

function Progress({ stage }: { stage: Stage }) {
  const current = readingStages.indexOf(stage);
  return (
    <>
      <div className="reading-progress" aria-hidden="true">{readingStages.map((item, index) => <span key={item} className={index <= current ? 'active' : ''} />)}</div>
      <progress className="sr-only" aria-label="Reading progress" max={readingStages.length} value={current + 1} aria-valuetext={`Step ${current + 1} of ${readingStages.length}: ${stage}`} />
    </>
  );
}

function CardFace({ draw, revealed, index, compact, disabled, onReveal }: { draw: DrawnCard; revealed: boolean; index: number; compact: boolean; disabled: boolean; onReveal: () => void }) {
  return (
    <motion.button
      type="button"
      className={`reading-card ${revealed ? 'is-revealed' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={onReveal}
      disabled={disabled}
      aria-label={revealed ? `${draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}` : `Reveal card ${index + 1}, ${draw.position}`}
      initial={{ opacity: 0, y: 30, rotate: index % 2 ? 1.5 : -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.65), duration: 0.5 }}
      whileHover={{ y: compact ? -2 : -7 }}
    >
      <span className="card-inner">
        <span className="card-back" aria-hidden="true"><i /><b>DIVINE</b><i /></span>
        <span className={`card-front ${draw.reversed ? 'is-reversed' : ''}`}>
          <small>{draw.position}</small>
          {draw.card.image ? (
            <span className="card-art"><Image src={draw.card.image} alt="" width={520} height={820} sizes="(max-width: 720px) 25vw, 18vw" /></span>
          ) : <strong>{draw.card.glyph}</strong>}
          <span>{draw.card.name}</span>
          {draw.reversed && <em>Reversed</em>}
        </span>
      </span>
    </motion.button>
  );
}

export function ReadingExperience({ system }: { system: SystemDefinition }) {
  const { cue } = useExperience();
  const [stage, setStage] = useState<Stage>('intro');
  const [question, setQuestion] = useState('');
  const [focus, setFocus] = useState<Focus>('general');
  const [spread, setSpread] = useState<SpreadDefinition | null>(system.spreads[0] ?? null);
  const [reversals, setReversals] = useState(system.slug === 'tarot');
  const [shuffled, setShuffled] = useState(false);
  const [draws, setDraws] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [interpretation, setInterpretation] = useState<InterpretationBlock | null>(null);
  const [objectMessage, setObjectMessage] = useState('');
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [includeQuestion, setIncludeQuestion] = useState(false);
  const [recordId, setRecordId] = useState(createId);
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [motionSupported, setMotionSupported] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [cookieChoice, setCookieChoice] = useState<number | null>(null);
  const [objectAnimating, setObjectAnimating] = useState(false);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [sessionReady, setSessionReady] = useState(false);
  const motionHandler = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const ritualLock = useRef(false);
  const revealTimers = useRef<number[]>([]);
  const objectTimer = useRef<number | null>(null);
  const sessionKey = `divine-session:${system.slug}`;

  useEffect(() => {
    queueMicrotask(() => setMotionSupported('DeviceMotionEvent' in window));
    return () => {
      if (motionHandler.current) window.removeEventListener('devicemotion', motionHandler.current);
      revealTimers.current.forEach((timer) => window.clearTimeout(timer));
      if (objectTimer.current !== null) window.clearTimeout(objectTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let restored: StoredReadingSession | null = null;
    try {
      const raw = sessionStorage.getItem(sessionKey);
      restored = raw ? JSON.parse(raw) as StoredReadingSession : null;
    } catch {
      restored = null;
    }
    queueMicrotask(() => {
      if (cancelled) return;
      if (restored?.version === 1 && restored.system === system.slug) {
        const restoredSpread = system.spreads.find((item) => item.id === restored.spreadId) ?? system.spreads[0] ?? null;
        const restoredDraws = (Array.isArray(restored.draws) ? restored.draws : []).flatMap((draw) => {
          const card = system.cards.find((item) => item.id === draw.cardId);
          return card ? [{ card, position: draw.position, reversed: draw.reversed }] : [];
        });
        const candidateStage = readingStages.includes(restored.stage) ? restored.stage : 'intro';
        const canRestoreStage = candidateStage !== 'reveal' || restoredDraws.length > 0;
        const nextStage = candidateStage === 'result' && !restored.interpretation ? 'frame' : canRestoreStage ? candidateStage : 'method';
        setStage(nextStage);
        setQuestion(typeof restored.question === 'string' ? restored.question : '');
        setFocus(focuses.some((item) => item.value === restored.focus) ? restored.focus : 'general');
        setSpread(restoredSpread);
        setReversals(restored.reversals);
        setShuffled(restored.shuffled);
        setDraws(restoredDraws);
        setRevealed(new Set((Array.isArray(restored.revealed) ? restored.revealed : []).filter((index) => index >= 0 && index < restoredDraws.length)));
        setInterpretation(restored.interpretation ?? null);
        setObjectMessage(typeof restored.objectMessage === 'string' ? restored.objectMessage : '');
        setLuckyNumbers(Array.isArray(restored.luckyNumbers) ? restored.luckyNumbers : []);
        setNote(typeof restored.note === 'string' ? restored.note : '');
        setFavorite(Boolean(restored.favorite));
        setRecordId(typeof restored.recordId === 'string' ? restored.recordId : createId());
        setCreatedAt(typeof restored.createdAt === 'string' ? restored.createdAt : new Date().toISOString());
        setCookieChoice(restored.cookieChoice === 0 || restored.cookieChoice === 1 || restored.cookieChoice === 2 ? restored.cookieChoice : null);
        ritualLock.current = nextStage === 'result';
        if (nextStage !== 'intro') setAnnouncement('Your unfinished reading has been restored.');
      }
      setSessionReady(true);
    });
    return () => { cancelled = true; };
  }, [sessionKey, system]);

  useEffect(() => {
    if (!sessionReady) return;
    const session: StoredReadingSession = {
      version: 1,
      system: system.slug,
      stage,
      question,
      focus,
      spreadId: spread?.id ?? null,
      reversals,
      shuffled,
      draws: draws.map((draw) => ({ cardId: draw.card.id, position: draw.position, reversed: draw.reversed })),
      revealed: [...revealed],
      interpretation,
      objectMessage,
      luckyNumbers,
      note,
      favorite,
      recordId,
      createdAt,
      cookieChoice,
    };
    try { sessionStorage.setItem(sessionKey, JSON.stringify(session)); } catch { /* Session recovery is an enhancement. */ }
  }, [sessionReady, sessionKey, system.slug, stage, question, focus, spread, reversals, shuffled, draws, revealed, interpretation, objectMessage, luckyNumbers, note, favorite, recordId, createdAt, cookieChoice]);

  const record = useMemo<ReadingRecord | null>(() => interpretation ? {
    id: recordId, system: system.slug, systemName: system.name, spreadId: spread?.id ?? system.kind,
    spreadName: spread?.name ?? (system.kind === 'ball' ? 'Ask & shake' : 'Crack & reveal'), createdAt,
    focus, question: question.trim() || undefined, draws, interpretation, note, favorite,
  } : null, [interpretation, system, spread, focus, question, draws, note, favorite, recordId, createdAt]);

  const beginRecord = () => {
    setRecordId(createId());
    setCreatedAt(new Date().toISOString());
  };

  const clearRevealTimers = () => {
    revealTimers.current.forEach((timer) => window.clearTimeout(timer));
    revealTimers.current = [];
    setIsRevealingAll(false);
  };

  const move = (next: Stage) => {
    cue('tick');
    setStage(next);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };
  const continueFromFrame = () => move(system.kind === 'cards' ? 'method' : 'ritual');

  const goBack = () => {
    clearRevealTimers();
    if (motionHandler.current) {
      window.removeEventListener('devicemotion', motionHandler.current);
      motionHandler.current = null;
    }
    setMotionEnabled(false);
    if (stage === 'frame') move('intro');
    if (stage === 'method') move('frame');
    if (stage === 'ritual') move(system.kind === 'cards' ? 'method' : 'frame');
    if (stage === 'reveal') {
      setDraws([]);
      setRevealed(new Set());
      setShuffled(false);
      move('method');
    }
  };

  const shuffleDeck = () => {
    cue('shuffle');
    setShuffled(true);
  };

  const deal = () => {
    if (!spread) return;
    const next = drawCards(system, spread, reversals);
    setDraws(next);
    setRevealed(new Set());
    cue('deal');
    move('reveal');
  };

  const revealCard = (index: number) => {
    if (revealed.has(index)) return;
    cue('reveal');
    setRevealed((current) => new Set(current).add(index));
    setAnnouncement(`${draws[index].position}: ${draws[index].card.name}${draws[index].reversed ? ', reversed' : ''}.`);
  };

  const revealAll = () => {
    if (isRevealingAll) return;
    cue('reveal');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(new Set(draws.map((_, index) => index)));
      setAnnouncement(`All ${draws.length} cards revealed.`);
      return;
    }
    setIsRevealingAll(true);
    draws.forEach((draw, index) => {
      const timer = window.setTimeout(() => {
        setRevealed((current) => new Set(current).add(index));
        setAnnouncement(`${draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}.`);
        if (index === draws.length - 1) {
          setIsRevealingAll(false);
          setAnnouncement(`All ${draws.length} cards revealed.`);
          revealTimers.current = [];
        }
      }, index * Math.max(45, Math.min(120, 650 / Math.max(draws.length - 1, 1))));
      revealTimers.current.push(timer);
    });
  };

  const performObjectRitual = () => {
    if (system.kind === 'cookie' && cookieChoice === null) return;
    if (ritualLock.current) return;
    ritualLock.current = true;
    setObjectAnimating(true);
    beginRecord();
    if (system.kind === 'ball') {
      cue('liquid');
      const message = drawBallAnswer();
      setObjectMessage(message);
      setInterpretation(objectInterpretation(system, message, focus));
    } else {
      cue('crack');
      const result = drawFortune();
      setObjectMessage(result.fortune);
      setLuckyNumbers(result.numbers);
      setInterpretation(objectInterpretation(system, result.fortune, focus, result.reflectionPrompt));
    }
    objectTimer.current = window.setTimeout(() => {
      setObjectAnimating(false);
      cue('resolve');
      setStage('result');
      objectTimer.current = null;
    }, 900);
  };

  const enableDeviceMotion = async () => {
    type PermissionMotionEvent = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
    const motionEvent = window.DeviceMotionEvent as PermissionMotionEvent;
    const permission = motionEvent.requestPermission ? await motionEvent.requestPermission() : 'granted';
    if (permission !== 'granted') {
      setAnnouncement('Motion access was not granted. Use the shake button instead.');
      return;
    }
    if (motionHandler.current) window.removeEventListener('devicemotion', motionHandler.current);
    const handler = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      const force = Math.abs(acceleration?.x ?? 0) + Math.abs(acceleration?.y ?? 0) + Math.abs(acceleration?.z ?? 0);
      if (force < 32) return;
      window.removeEventListener('devicemotion', handler);
      motionHandler.current = null;
      setMotionEnabled(false);
      performObjectRitual();
    };
    motionHandler.current = handler;
    window.addEventListener('devicemotion', handler, { passive: true });
    setMotionEnabled(true);
    setAnnouncement('Motion enabled. Shake your device for the answer.');
    cue('tick');
  };

  const finishCards = () => {
    if (!spread) return;
    beginRecord();
    const result = interpretReading(system, spread, draws, focus);
    setInterpretation(result);
    cue('resolve');
    move('result');
  };

  const save = async () => {
    if (!record) return;
    try {
      await saveReading(record);
      setSaved(true);
      setStorageError(false);
      cue('resolve');
    } catch {
      setStorageError(true);
    }
  };

  const share = async () => {
    if (!record || shareStatus === 'working') return;
    setShareStatus('working');
    try {
      const result = await exportReading({ ...record, note, favorite }, includeQuestion);
      setShareStatus(result);
      setAnnouncement(result === 'shared' ? 'Reading shared.' : result === 'downloaded' ? 'Reading image downloaded.' : 'Sharing cancelled.');
    } catch {
      setShareStatus('error');
      setAnnouncement('The share image could not be created. Your reading is unchanged.');
    }
  };

  const restart = () => {
    clearRevealTimers();
    ritualLock.current = false;
    setStage('frame');
    setShuffled(false);
    setDraws([]);
    setRevealed(new Set());
    setInterpretation(null);
    setObjectMessage('');
    setLuckyNumbers([]);
    setNote('');
    setFavorite(false);
    setSaved(false);
    setAnnouncement('');
    setCookieChoice(null);
    setObjectAnimating(false);
    setShareStatus('idle');
    cue('tick');
  };

  if (!sessionReady) {
    return <main className="reading-shell session-loading" aria-busy="true"><span>DIVINE</span><small>Preparing the instrument</small></main>;
  }

  return (
    <main className="reading-shell">
      <header className="reading-titlebar">
        <Link href="/#systems" className="back-link"><ArrowLeft /> All systems</Link>
        <span>{system.index} / 08</span>
        <span>{system.countLabel}</span>
      </header>
      <Progress stage={stage} />
      {stage !== 'intro' && stage !== 'result' && <button type="button" className="stage-back" onClick={goBack}><ChevronLeft /> Back</button>}

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.section className="reading-stage intro-stage" key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
            <div className="stage-copy">
              <p className="eyebrow">{system.eyebrow}</p>
              <h1>{system.name}</h1>
              <p className="lede">{system.introduction}</p>
              <Button className="primary-action" onClick={() => move('frame')}>Begin the reading <ArrowRight /></Button>
            </div>
            <div className="stage-art"><Image src={system.cover} alt="" width={1122} height={1402} priority /><span>{system.index}</span></div>
          </motion.section>
        )}

        {stage === 'frame' && (
          <motion.section className="reading-stage centered-stage" key="frame" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">Frame the question</p>
            <h2>What are you ready to know?</h2>
            <label className="field-label" htmlFor="question">Your question <span>Optional · kept on this device</span></label>
            <Input id="question" className="question-input" maxLength={180} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) continueFromFrame(); }} placeholder={system.kind === 'ball' ? 'Ask a yes or no question…' : 'Write the question without explaining it…'} />
            <fieldset className="focus-field">
              <legend>Choose a focus</legend>
              <div>{focuses.map((item) => <label key={item.value} className={focus === item.value ? 'selected' : ''}><input type="radio" name="focus" value={item.value} checked={focus === item.value} onChange={() => { setFocus(item.value); cue('tick'); }} /><span>{item.label}</span></label>)}</div>
            </fieldset>
            <Button className="primary-action" onClick={continueFromFrame}>Continue <ArrowRight /></Button>
          </motion.section>
        )}

        {stage === 'method' && (
          <motion.section className="reading-stage method-stage" key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <header><p className="eyebrow">Choose the depth</p><h2>How much should the pattern reveal?</h2></header>
            <div className="spread-list">
              {system.spreads.map((item, index) => (
                <button type="button" key={item.id} className={spread?.id === item.id ? 'selected' : ''} aria-pressed={spread?.id === item.id} onClick={() => { setSpread(item); cue('tick'); }}>
                  <span>0{index + 1}</span><strong>{item.name}</strong><p>{item.description}</p><em>{item.positions.length} {item.positions.length === 1 ? 'card' : 'cards'}</em>
                </button>
              ))}
            </div>
            {system.slug === 'tarot' && <label className="reversal-toggle"><input type="checkbox" checked={reversals} onChange={(event) => setReversals(event.target.checked)} /><span>Include reversals</span><small>Allow the cards to arrive inverted.</small></label>}
            <Button className="primary-action" onClick={() => move('ritual')}>Prepare the deck <ArrowRight /></Button>
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'cards' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">The ritual</p><h2>{shuffled ? 'The deck is listening.' : 'Cut through the noise.'}</h2><p>{system.instruction}</p>
            <div className={`deck-object ${shuffled ? 'is-shuffled' : ''}`}>
              {[3, 2, 1].map((layer) => <span key={layer} style={{ '--layer': layer } as React.CSSProperties} />)}
              <motion.button type="button" drag dragConstraints={{ left: -80, right: 80, top: -20, bottom: 20 }} dragElastic={0.18} onDragEnd={shuffleDeck} onClick={shuffleDeck} whileTap={{ scale: 0.97 }} aria-label="Drag or tap to shuffle the deck"><b>DIVINE</b><i>{system.shortName}</i></motion.button>
            </div>
            <div className="ritual-actions">
              {!shuffled ? <Button className="quiet-action" onClick={shuffleDeck}>Shuffle the deck</Button> : <Button className="primary-action" onClick={deal}>Deal {spread?.positions.length} {spread?.positions.length === 1 ? 'card' : 'cards'} <Sparkles /></Button>}
            </div>
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'ball' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-ball" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">The ritual</p><h2>Disturb the certainty.</h2><p>{system.instruction}</p>
            <motion.button drag dragConstraints={{ left: -90, right: 90, top: -40, bottom: 40 }} dragElastic={0.25} onDragEnd={performObjectRitual} onClick={performObjectRitual} disabled={objectAnimating} className={`eight-ball ${objectAnimating ? 'is-resolving' : ''}`} aria-label="Drag or tap to shake and reveal the answer" animate={objectAnimating ? { x: [0, -18, 16, -12, 9, 0], rotate: [0, -7, 8, -5, 3, 0], scale: [1, 1.025, 1] } : { x: 0, rotate: 0, scale: 1 }} transition={{ duration: .75 }} whileDrag={{ rotate: [0, -8, 9, -6, 0] }}><span>8</span><i aria-hidden="true">···</i></motion.button>
            <Button className="primary-action" onClick={performObjectRitual} disabled={objectAnimating}>{objectAnimating ? 'The answer is rising…' : 'Shake for the answer'}</Button>
            {motionSupported && <Button className="quiet-action" onClick={() => void enableDeviceMotion()} disabled={objectAnimating}>{motionEnabled ? 'Shake your device…' : 'Use device motion'}</Button>}
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'cookie' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-cookie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">The ritual</p><h2>{cookieChoice === null ? 'Choose without studying.' : 'Break the quiet open.'}</h2><p>{system.instruction}</p>
            {cookieChoice === null ? (
              <fieldset className="cookie-choices"><legend className="sr-only">Choose one of three fortune cookies</legend>
                {[0, 1, 2].map((choice) => <motion.button type="button" key={choice} onClick={() => { setCookieChoice(choice); cue('tick'); }} whileHover={{ y: -12, rotate: choice === 0 ? -4 : choice === 2 ? 4 : 0 }} whileTap={{ scale: .96 }} aria-label={`Choose fortune cookie ${choice + 1}`}><span /><span /><i /></motion.button>)}
              </fieldset>
            ) : (
              <>
                <motion.button drag="x" dragConstraints={{ left: -45, right: 45 }} dragElastic={0.25} onDragEnd={performObjectRitual} onClick={performObjectRitual} disabled={objectAnimating} className={`cookie-object ${objectAnimating ? 'is-cracking' : ''}`} aria-label="Drag or tap to crack the fortune cookie"><span /><span /><i /></motion.button>
                <div className="ritual-actions object-actions">
                  <Button className="quiet-action" onClick={() => setCookieChoice(null)} disabled={objectAnimating}>Choose another</Button>
                  <Button className="primary-action" onClick={performObjectRitual} disabled={objectAnimating}>{objectAnimating ? 'The paper is opening…' : 'Crack the cookie'}</Button>
                </div>
              </>
            )}
          </motion.section>
        )}

        {stage === 'reveal' && spread && (
          <motion.section className="reading-stage reveal-stage" key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <header><p className="eyebrow">{spread.name}</p><h2>{revealed.size === draws.length ? 'The pattern is visible.' : 'Turn each card when you are ready.'}</h2></header>
            <div className={`cards-layout spread-${spread.layout} count-${draws.length} ${draws.length > 10 ? 'many-cards' : ''}`}>
              {draws.map((draw, index) => <CardFace key={`${draw.card.id}-${index}`} draw={draw} index={index} compact={draws.length > 10} disabled={isRevealingAll} revealed={revealed.has(index)} onReveal={() => revealCard(index)} />)}
            </div>
            <div className="reveal-actions">
              {revealed.size < draws.length && <Button className="quiet-action" onClick={revealAll} disabled={isRevealingAll}>{isRevealingAll ? 'Revealing…' : 'Reveal all'}</Button>}
              {revealed.size === draws.length && <Button className="primary-action" onClick={finishCards}>Read the pattern <ArrowRight /></Button>}
            </div>
          </motion.section>
        )}

        {stage === 'result' && interpretation && record && (
          <motion.section className="reading-stage result-stage" key="result" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            <header className="result-hero"><p className="eyebrow">The reading</p><h1>{interpretation.headline}</h1><p>{interpretation.overview}</p></header>
            {system.kind !== 'cards' && <div className={`object-result ${system.kind}`}><span>{objectMessage}</span>{luckyNumbers.length > 0 && <small>Lucky numbers · {luckyNumbers.join(' · ')}</small>}</div>}
            {interpretation.reflectionPrompt && <p className="fortune-reflection"><small>Reflection</small>{interpretation.reflectionPrompt}</p>}
            {draws.length > 0 && <div className={`result-cards ${draws.length > 10 ? 'dense' : ''}`}>{draws.map((draw, index) => <div key={`${draw.card.id}-${index}`}><span>{draw.position}</span><strong>{draw.card.name}</strong><p>{interpretation.positions[index]?.text}</p></div>)}</div>}
            <blockquote>{interpretation.synthesis}</blockquote>
            <p className="closing-reading">{interpretation.closing}</p>
            <div className="journal-compose">
              <label htmlFor="note">Your reflection</label>
              <Textarea id="note" value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} placeholder="Write what you noticed…" />
              <label className="privacy-check"><input type="checkbox" checked={includeQuestion} onChange={(event) => setIncludeQuestion(event.target.checked)} /><span>Include my question in shared images</span></label>
              {storageError && <output className="error-note">The private journal is unavailable. You can still download this reading.</output>}
              {shareStatus === 'error' && <output className="error-note">The share image could not be created. Your reading is unchanged.</output>}
              <div className="result-actions">
                <Button className={`quiet-action ${favorite ? 'is-active' : ''}`} onClick={() => { setFavorite((value) => !value); setSaved(false); }}><Heart fill={favorite ? 'currentColor' : 'none'} /> Favorite</Button>
                <Button className="quiet-action" onClick={() => void share()} disabled={shareStatus === 'working'}><Share2 /> {shareStatus === 'working' ? 'Preparing image…' : shareStatus === 'downloaded' ? 'Image downloaded' : shareStatus === 'shared' ? 'Shared' : 'Share / download'}</Button>
                <Button className="primary-action" onClick={() => void save()}>{saved ? <Check /> : <BookMarked />}{saved ? 'Saved' : 'Save to journal'}</Button>
              </div>
            </div>
            <div className="reading-again"><Button className="quiet-action" onClick={restart}><RotateCcw /> Begin another reading</Button><Link href="/#systems">Choose another system <ArrowRight /></Link></div>
          </motion.section>
        )}
      </AnimatePresence>
      <div className="sr-only" aria-live="polite">{stage === 'result' && interpretation ? `Reading complete. ${interpretation.headline}` : announcement}</div>
    </main>
  );
}

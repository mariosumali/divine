'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate as motionAnimate, motion, useMotionValue, useTransform } from 'motion/react';
import { ArrowLeft, ArrowRight, BookMarked, Check, ChevronLeft, ChevronRight, Heart, RotateCcw, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useExperience } from '@/app/providers';
import { OBJECT_RITUAL_STEPS, drawBallAnswer, drawCards, drawFortune, interpretReading, nextObjectRitualStep, objectInterpretation } from '@/lib/divine/reading';
import { composeShare } from '@/lib/divine/share';
import { saveReading } from '@/lib/divine/storage';
import type { DrawnCard, Focus, InterpretationBlock, ReadingRecord, SpreadDefinition, SystemDefinition } from '@/lib/divine/types';

type Stage = 'intro' | 'frame' | 'method' | 'ritual' | 'reveal' | 'result';
type ShareStatus = 'idle' | 'working' | 'shared' | 'downloaded' | 'cancelled' | 'error';
type DeckPhase = 'stacked' | 'shuffling' | 'cut' | 'fanned' | 'dealing';

interface StoredReadingSession {
  version: 1 | 2;
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
  objectStep?: number;
}
const focuses: Array<{ value: Focus; label: string }> = [
  { value: 'general', label: 'General' }, { value: 'love', label: 'Love' }, { value: 'work', label: 'Work' }, { value: 'growth', label: 'Growth' },
];
const readingStages: Stage[] = ['intro', 'frame', 'method', 'ritual', 'reveal', 'result'];
const deckLayers = Array.from({ length: 9 }, (_, index) => index + 1);
const fanCards = Array.from({ length: 15 }, (_, index) => index);
const cookieCrumbs = [
  { x: -114, y: -42, r: -18 }, { x: -76, y: 62, r: 22 }, { x: -35, y: 86, r: -8 },
  { x: 42, y: 78, r: 14 }, { x: 88, y: 48, r: -24 }, { x: 126, y: -26, r: 18 },
];

function sentenceExcerpt(text: string, limit: number) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, limit).join(' ');
}

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

function CardFace({ draw, revealed, index, compact, disabled, onPeelStart, onReveal }: { draw: DrawnCard; revealed: boolean; index: number; compact: boolean; disabled: boolean; onPeelStart: () => void; onReveal: () => void }) {
  const peel = useMotionValue(revealed ? 1 : 0);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const coverX = useTransform(peel, [0, .34, 1], [0, compact ? -8 : -18, compact ? -54 : -132]);
  const coverY = useTransform(peel, [0, .34, 1], [0, compact ? 7 : 16, compact ? 38 : 92]);
  const coverRotateX = useTransform(peel, [0, .4, 1], [0, 15, 34]);
  const coverRotateY = useTransform(peel, [0, .4, 1], [0, -16, -42]);
  const coverRotateZ = useTransform(peel, [0, .4, 1], [0, -5, -17]);
  const coverScale = useTransform(peel, [0, .5, 1], [1, .96, .76]);
  const coverOpacity = useTransform(peel, [0, .84, 1], [1, 1, 0]);
  const coverClip = useTransform(peel, [0, .45, .82, 1], [
    'polygon(0 0,100% 0,100% 100%,0 100%)',
    'polygon(0 0,48% 0,100% 48%,100% 100%,0 100%)',
    'polygon(0 0,8% 0,100% 92%,100% 100%,0 100%)',
    'polygon(0 0,0 0,100% 100%,100% 100%,0 100%)',
  ]);
  const foldScale = useTransform(peel, [0, .06, .72, 1], [0, .18, 1, .28]);
  const foldOpacity = useTransform(peel, [0, .05, .82, 1], [0, 1, 1, 0]);
  const foldRotate = useTransform(peel, [0, 1], [0, -10]);
  const peelShadow = useTransform(peel, [0, .18, .75, 1], [0, .22, .54, 0]);
  const suppressClick = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      peel.set(revealed ? 1 : 0);
      return;
    }
    motionAnimate(peel, revealed ? 1 : 0, { duration: revealed ? .48 : .3, ease: [0.22, 1, 0.36, 1] });
  }, [peel, revealed]);

  const completePeel = () => {
    if (revealed || disabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) peel.set(1);
    else motionAnimate(peel, 1, { duration: .52, ease: [0.22, 1, 0.36, 1] });
    onReveal();
  };
  const peelProgress = (x: number, y: number) => Math.min(0.96, Math.max(0, (-x + Math.max(0, y) * 0.28) / (compact ? 76 : 125)));
  const settleTilt = () => {
    motionAnimate(tiltX, 0, { type: 'spring', stiffness: 180, damping: 20 });
    motionAnimate(tiltY, 0, { type: 'spring', stiffness: 180, damping: 20 });
  };

  return (
    <motion.button
      type="button"
      className={`reading-card ${revealed ? 'is-revealed' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={() => {
        if (suppressClick.current) return;
        completePeel();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        completePeel();
      }}
      disabled={disabled}
      drag={revealed && !disabled}
      dragConstraints={{ left: compact ? -12 : -32, right: compact ? 12 : 32, top: compact ? -10 : -24, bottom: compact ? 10 : 24 }}
      dragElastic={0.12}
      dragMomentum={false}
      style={{ rotateX: tiltX, rotateY: tiltY }}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        tiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 18);
        tiltX.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 14);
      }}
      onPointerLeave={settleTilt}
      onDrag={(_, info) => {
        tiltY.set(Math.max(-18, Math.min(18, info.offset.x * 0.18)));
        tiltX.set(Math.max(-14, Math.min(14, -info.offset.y * 0.18)));
      }}
      onDragEnd={settleTilt}
      aria-label={revealed ? `${draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}` : `Peel card ${index + 1}, ${draw.position}`}
      initial={{ opacity: 0, x: (index % 2 ? 1 : -1) * (compact ? 55 : 120), y: compact ? -55 : -160, rotateZ: index % 2 ? 10 : -10, scale: 0.72 }}
      animate={{ opacity: 1, x: 0, y: 0, rotateZ: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 125, damping: 18, mass: 0.9, delay: Math.min(index * (compact ? 0.025 : 0.065), 0.9) }}
      whileHover={{ y: compact ? -2 : -7 }}
    >
      <span className="card-scene">
        <span className={`card-front ${draw.reversed ? 'is-reversed' : ''}`} aria-hidden={revealed ? undefined : true}>
          <small>{draw.position}</small>
          {draw.card.image ? (
            <span className="card-art"><Image src={draw.card.image} alt="" width={520} height={820} sizes="(max-width: 720px) 25vw, 18vw" /></span>
          ) : <strong>{draw.card.glyph}</strong>}
          <span>{draw.card.name}</span>
          {draw.reversed && <em>Reversed</em>}
        </span>
        <motion.span className="card-peel" style={{ x: coverX, y: coverY, rotateX: coverRotateX, rotateY: coverRotateY, rotateZ: coverRotateZ, scale: coverScale, opacity: coverOpacity, clipPath: coverClip }} aria-hidden="true">
          <span className="card-back"><i /><b>DIVINE</b><i /></span>
        </motion.span>
        <motion.span className="peel-fold" style={{ scale: foldScale, opacity: foldOpacity, rotateZ: foldRotate }} aria-hidden="true"><i /></motion.span>
        <motion.span className="peel-shadow" style={{ opacity: peelShadow }} aria-hidden="true" />
        {!revealed && !disabled && (
          <motion.span
            className="peel-corner"
            aria-hidden="true"
            onPanStart={() => onPeelStart()}
            onPan={(_, info) => {
              peel.set(peelProgress(info.offset.x, info.offset.y));
            }}
            onPanEnd={(_, info) => {
              const progress = peelProgress(info.offset.x, info.offset.y);
              if (progress > 0.03) {
                suppressClick.current = true;
                window.setTimeout(() => { suppressClick.current = false; }, 0);
              }
              if (progress >= 0.22) completePeel();
              else motionAnimate(peel, 0, { duration: .28, ease: [0.22, 1, 0.36, 1] });
            }}
          ><i /></motion.span>
        )}
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
  const [objectStep, setObjectStep] = useState(0);
  const [objectAnimating, setObjectAnimating] = useState(false);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [deckPhase, setDeckPhase] = useState<DeckPhase>('stacked');
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [resultCardIndex, setResultCardIndex] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const motionHandler = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const ritualLock = useRef(false);
  const completionQueued = useRef(false);
  const revealTimers = useRef<number[]>([]);
  const objectTimer = useRef<number | null>(null);
  const deckTimer = useRef<number | null>(null);
  const fieldTiltX = useMotionValue(-3);
  const fieldTiltY = useMotionValue(5);
  const sessionKey = `divine-session:${system.slug}`;

  useEffect(() => {
    queueMicrotask(() => setMotionSupported('DeviceMotionEvent' in window));
    return () => {
      if (motionHandler.current) window.removeEventListener('devicemotion', motionHandler.current);
      revealTimers.current.forEach((timer) => window.clearTimeout(timer));
      if (objectTimer.current !== null) window.clearTimeout(objectTimer.current);
      if (deckTimer.current !== null) window.clearTimeout(deckTimer.current);
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
      if ((restored?.version === 1 || restored?.version === 2) && restored.system === system.slug) {
        const restoredSpread = system.spreads.find((item) => item.id === restored.spreadId) ?? system.spreads[0] ?? null;
        const restoredDraws = (Array.isArray(restored.draws) ? restored.draws : []).flatMap((draw) => {
          const card = system.cards.find((item) => item.id === draw.cardId);
          return card ? [{ card, position: draw.position, reversed: draw.reversed }] : [];
        });
        const candidateStage = readingStages.includes(restored.stage) ? restored.stage : 'intro';
        const canRestoreStage = candidateStage !== 'reveal' || restoredDraws.length > 0;
        const resolvedObject = candidateStage === 'ritual' && system.kind !== 'cards' && restored.objectStep === OBJECT_RITUAL_STEPS && restored.interpretation;
        const nextStage = resolvedObject ? 'result' : candidateStage === 'result' && !restored.interpretation ? 'frame' : canRestoreStage ? candidateStage : 'method';
        setStage(nextStage);
        setQuestion(typeof restored.question === 'string' ? restored.question : '');
        setFocus(focuses.some((item) => item.value === restored.focus) ? restored.focus : 'general');
        setSpread(restoredSpread);
        setReversals(restored.reversals);
        setShuffled(restored.shuffled);
        setDeckPhase(restored.shuffled ? 'cut' : 'stacked');
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
        setObjectStep(typeof restored.objectStep === 'number' ? Math.max(0, Math.min(OBJECT_RITUAL_STEPS, restored.objectStep)) : 0);
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
      version: 2,
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
      objectStep,
    };
    try { sessionStorage.setItem(sessionKey, JSON.stringify(session)); } catch { /* Session recovery is an enhancement. */ }
  }, [sessionReady, sessionKey, system.slug, stage, question, focus, spread, reversals, shuffled, draws, revealed, interpretation, objectMessage, luckyNumbers, note, favorite, recordId, createdAt, cookieChoice, objectStep]);

  const record = useMemo<ReadingRecord | null>(() => interpretation ? {
    id: recordId, system: system.slug, systemName: system.name, spreadId: spread?.id ?? system.kind,
    spreadName: spread?.name ?? (system.kind === 'ball' ? 'Ask & shake' : 'Crack & reveal'), createdAt,
    focus, question: question.trim() || undefined, draws, interpretation, note, favorite,
  } : null, [interpretation, system, spread, focus, question, draws, note, favorite, recordId, createdAt]);

  const resultOverview = useMemo(() => interpretation
    ? `${sentenceExcerpt(interpretation.overview, 2)} ${sentenceExcerpt(interpretation.synthesis, 1)}`.trim()
    : '', [interpretation]);
  const safeResultCardIndex = Math.min(resultCardIndex, Math.max(0, draws.length - 1));
  const selectedResultDraw = draws[safeResultCardIndex] ?? null;
  const selectedResultPosition = interpretation?.positions[safeResultCardIndex] ?? null;

  const beginRecord = () => {
    setRecordId(createId());
    setCreatedAt(new Date().toISOString());
  };

  const tiltField = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    fieldTiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 24);
    fieldTiltX.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 18);
  };

  const settleField = () => {
    motionAnimate(fieldTiltX, -3, { type: 'spring', stiffness: 165, damping: 20 });
    motionAnimate(fieldTiltY, 5, { type: 'spring', stiffness: 165, damping: 20 });
  };

  const dragField = (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    fieldTiltY.set(Math.max(-24, Math.min(24, info.offset.x * 0.14)));
    fieldTiltX.set(Math.max(-18, Math.min(18, -info.offset.y * 0.14)));
  };

  const clearRevealTimers = () => {
    revealTimers.current.forEach((timer) => window.clearTimeout(timer));
    revealTimers.current = [];
    setIsRevealingAll(false);
  };

  const clearDeckTimer = () => {
    if (deckTimer.current !== null) window.clearTimeout(deckTimer.current);
    deckTimer.current = null;
  };

  const clearObjectTimer = () => {
    if (objectTimer.current !== null) window.clearTimeout(objectTimer.current);
    objectTimer.current = null;
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
    clearDeckTimer();
    clearObjectTimer();
    ritualLock.current = false;
    completionQueued.current = false;
    if (motionHandler.current) {
      window.removeEventListener('devicemotion', motionHandler.current);
      motionHandler.current = null;
    }
    setMotionEnabled(false);
    if (stage === 'frame') move('intro');
    if (stage === 'method') move('frame');
    if (stage === 'ritual') {
      if (system.kind === 'cards') {
        setShuffled(false);
        setDeckPhase('stacked');
      }
      setCookieChoice(null);
      setObjectStep(0);
      setObjectAnimating(false);
      move(system.kind === 'cards' ? 'method' : 'frame');
    }
    if (stage === 'reveal') {
      setDraws([]);
      setRevealed(new Set());
      setShuffled(false);
      setDeckPhase('stacked');
      completionQueued.current = false;
      move('method');
    }
  };

  const shuffleDeck = () => {
    if (deckPhase === 'shuffling' || deckPhase === 'dealing') return;
    clearDeckTimer();
    cue('shuffle');
    setShuffled(false);
    setDeckPhase('shuffling');
    setAnnouncement('The deck is moving. Let the fixed order loosen.');
    deckTimer.current = window.setTimeout(() => {
      setShuffled(true);
      setDeckPhase('cut');
      setAnnouncement('The deck is shuffled. Cut and open the fan when ready.');
      deckTimer.current = null;
    }, 950);
  };

  const fanDeck = () => {
    if (!shuffled || deckPhase === 'dealing') return;
    cue('deal');
    setDeckPhase('fanned');
    setAnnouncement('The deck is fanned. The field is open.');
  };

  const advanceDeckRitual = () => {
    if (deckPhase === 'stacked') shuffleDeck();
    else if (deckPhase === 'cut') fanDeck();
    else if (deckPhase === 'fanned') deal();
  };

  const deal = () => {
    if (!spread || deckPhase !== 'fanned') return;
    const next = drawCards(system, spread, reversals);
    completionQueued.current = false;
    ritualLock.current = false;
    setDraws(next);
    setRevealed(new Set());
    setResultCardIndex(0);
    cue('deal');
    setDeckPhase('dealing');
    setAnnouncement(`${spread.positions.length} ${spread.positions.length === 1 ? 'card is' : 'cards are'} leaving the fan.`);
    const reveal = () => {
      setStage('reveal');
      window.scrollTo({ top: 0, behavior: 'auto' });
      deckTimer.current = null;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) reveal();
    else deckTimer.current = window.setTimeout(reveal, 720);
  };

  const finishCards = () => {
    if (!spread || ritualLock.current) return;
    ritualLock.current = true;
    beginRecord();
    const result = interpretReading(system, spread, draws, focus);
    setInterpretation(result);
    cue('resolve');
    move('result');
  };

  const queueCardFinish = (delay = 1500) => {
    if (completionQueued.current) return;
    completionQueued.current = true;
    const timer = window.setTimeout(() => {
      finishCards();
      revealTimers.current = [];
    }, delay);
    revealTimers.current.push(timer);
  };

  const revealCard = (index: number) => {
    setRevealed((current) => {
      if (current.has(index)) return current;
      cue('reveal');
      const next = new Set(current).add(index);
      setAnnouncement(`${draws[index].position}: ${draws[index].card.name}${draws[index].reversed ? ', reversed' : ''}.`);
      if (next.size === draws.length) queueCardFinish();
      return next;
    });
  };

  const revealAll = () => {
    if (isRevealingAll) return;
    cue('reveal');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(new Set(draws.map((_, index) => index)));
      setAnnouncement(`All ${draws.length} cards revealed.`);
      queueCardFinish(80);
      return;
    }
    setIsRevealingAll(true);
    const interval = draws.length > 16 ? 56 : draws.length > 6 ? 125 : 235;
    draws.forEach((draw, index) => {
      const timer = window.setTimeout(() => {
        setRevealed((current) => new Set(current).add(index));
        setAnnouncement(`${draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}.`);
        if (index === draws.length - 1) {
          setIsRevealingAll(false);
          setAnnouncement(`All ${draws.length} cards revealed.`);
          queueCardFinish();
        }
      }, index * interval);
      revealTimers.current.push(timer);
    });
  };

  const resolveObjectRitual = () => {
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
    }, system.kind === 'cookie' ? 1900 : 1450);
  };

  const advanceObjectRitual = () => {
    if (system.kind === 'cookie' && cookieChoice === null) return;
    if (objectAnimating || ritualLock.current) return;
    const next = nextObjectRitualStep(objectStep);
    setObjectStep(next);
    setObjectAnimating(true);
    if (next === OBJECT_RITUAL_STEPS) {
      resolveObjectRitual();
      return;
    }
    cue(system.kind === 'ball' ? 'liquid' : 'crack');
    setAnnouncement(system.kind === 'ball'
      ? next === 1 ? 'The answer is moving. Shake again.' : 'The window is clouding. One final shake.'
      : next === 1 ? 'A hairline crack appears. Press again.' : 'The shell gives way. One final press.');
    objectTimer.current = window.setTimeout(() => {
      setObjectAnimating(false);
      objectTimer.current = null;
    }, 560);
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
      advanceObjectRitual();
    };
    motionHandler.current = handler;
    window.addEventListener('devicemotion', handler, { passive: true });
    setMotionEnabled(true);
    setAnnouncement('Motion enabled. Shake your device for the answer.');
    cue('tick');
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
    clearDeckTimer();
    clearObjectTimer();
    ritualLock.current = false;
    completionQueued.current = false;
    setStage('frame');
    setShuffled(false);
    setDeckPhase('stacked');
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
    setObjectStep(0);
    setObjectAnimating(false);
    setShareStatus('idle');
    setResultCardIndex(0);
    cue('tick');
  };

  if (!sessionReady) {
    return <main className="reading-shell session-loading" aria-busy="true"><span>DIVINE</span><small>Preparing the instrument</small></main>;
  }

  return (
    <main className={`reading-shell stage-${stage}`}>
      {stage !== 'ritual' && stage !== 'reveal' && (
        <>
          <header className="reading-titlebar">
            <Link href="/#systems" className="back-link"><ArrowLeft /> All systems</Link>
            <span>{system.shortName}</span>
          </header>
          <Progress stage={stage} />
          {stage !== 'intro' && stage !== 'result' && <button type="button" className="stage-back" onClick={goBack}><ChevronLeft /> Back</button>}
        </>
      )}
      {(stage === 'ritual' || stage === 'reveal') && <button type="button" className="field-exit sr-only" onClick={goBack}><ChevronLeft /> Leave the ritual</button>}

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.section className="reading-stage intro-stage" key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
            <span className="stage-index" aria-hidden="true">{system.index}</span>
            <div className="stage-copy">
              <p className="eyebrow">{system.eyebrow}</p>
              <h1>{system.name}</h1>
              <Button className="primary-action" onClick={() => move('frame')}>Begin <ArrowRight /></Button>
            </div>
          </motion.section>
        )}

        {stage === 'frame' && (
          <motion.section className="reading-stage centered-stage" key="frame" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">Focus</p>
            <h2>Ask.</h2>
            <label className="field-label" htmlFor="question">Question <span>Optional · private</span></label>
            <Input id="question" className="question-input" maxLength={180} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) continueFromFrame(); }} placeholder={system.kind === 'ball' ? 'Ask a yes or no question…' : 'Write the question without explaining it…'} />
            <fieldset className="focus-field">
              <legend>Lens</legend>
              <div>{focuses.map((item) => <label key={item.value} className={focus === item.value ? 'selected' : ''}><input type="radio" name="focus" value={item.value} checked={focus === item.value} onChange={() => { setFocus(item.value); cue('tick'); }} /><span>{item.label}</span></label>)}</div>
            </fieldset>
            <Button className="primary-action" onClick={continueFromFrame}>Continue <ArrowRight /></Button>
          </motion.section>
        )}

        {stage === 'method' && (
          <motion.section className="reading-stage method-stage" key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <header><p className="eyebrow">Spread</p><h2>Choose.</h2></header>
            <div className="spread-list">
              {system.spreads.map((item, index) => (
                <button type="button" key={item.id} className={spread?.id === item.id ? 'selected' : ''} aria-pressed={spread?.id === item.id} onClick={() => { setSpread(item); cue('tick'); }}>
                  <span>0{index + 1}</span><strong>{item.name}</strong><em>{item.positions.length} {item.positions.length === 1 ? 'card' : 'cards'}</em>
                </button>
              ))}
            </div>
            {system.slug === 'tarot' && <label className="reversal-toggle"><input type="checkbox" checked={reversals} onChange={(event) => setReversals(event.target.checked)} /><span>Include reversals</span><small>Allow the cards to arrive inverted.</small></label>}
            <Button className="primary-action" onClick={() => move('ritual')}>Prepare the deck <ArrowRight /></Button>
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'cards' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className={`deck-ritual-surface phase-${deckPhase}`}>
              {deckPhase === 'fanned' || deckPhase === 'dealing' ? (
                <motion.button
                  type="button"
                  className={`card-fan phase-${deckPhase}`}
                  onClick={advanceDeckRitual}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advanceDeckRitual(); } }}
                  disabled={deckPhase === 'dealing'}
                  drag={deckPhase === 'fanned'}
                  dragConstraints={{ left: -70, right: 70, top: -35, bottom: 35 }}
                  dragElastic={0.14}
                  dragMomentum={false}
                  style={{ rotateX: fieldTiltX, rotateY: fieldTiltY }}
                  onPointerMove={tiltField}
                  onPointerLeave={settleField}
                  onDrag={dragField}
                  onDragEnd={settleField}
                  whileTap={{ scale: .985 }}
                  aria-label={deckPhase === 'fanned' ? `Rotate the card fan or press to deal ${spread?.positions.length} cards` : 'The cards are being dealt'}
                >
                  <i className="fan-orbit" />
                  {fanCards.map((index) => {
                    const middle = (fanCards.length - 1) / 2;
                    return (
                      <span
                        key={index}
                        style={{
                          '--angle': `${(index - middle) * 6.1}deg`,
                          '--lift': `${Math.abs(index - middle) * 3.4}px`,
                          '--fan-index': index,
                          '--direction': index % 2 ? 1 : -1,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  className={`deck-object phase-${deckPhase}`}
                  onClick={advanceDeckRitual}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advanceDeckRitual(); } }}
                  disabled={deckPhase === 'shuffling'}
                  drag={deckPhase !== 'shuffling'}
                  dragConstraints={{ left: -70, right: 70, top: -45, bottom: 45 }}
                  dragElastic={0.14}
                  dragMomentum={false}
                  style={{ rotateX: fieldTiltX, rotateY: fieldTiltY }}
                  onPointerMove={tiltField}
                  onPointerLeave={settleField}
                  onDrag={dragField}
                  onDragEnd={settleField}
                  whileTap={{ scale: 0.97 }}
                  aria-label={deckPhase === 'cut' ? 'Rotate the deck or press to cut and open the fan' : deckPhase === 'shuffling' ? 'The deck is shuffling' : 'Rotate the deck or press to shuffle'}
                >
                  {deckLayers.map((layer) => <span className="deck-layer" aria-hidden="true" key={layer} style={{ '--layer': layer, '--direction': layer % 2 ? 1 : -1 } as React.CSSProperties} />)}
                  <span className="deck-face"><b>DIVINE</b><i>{system.shortName}</i></span>
                  <span className="deck-band" aria-hidden="true"><i>Break the seal</i></span>
                </motion.button>
              )}
            </div>
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'ball' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-ball" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.button
              drag
              dragConstraints={{ left: -110, right: 110, top: -70, bottom: 70 }}
              dragElastic={0.16}
              dragMomentum={false}
              style={{ rotateX: fieldTiltX, rotateY: fieldTiltY }}
              onPointerMove={tiltField}
              onPointerLeave={settleField}
              onDrag={dragField}
              onDragEnd={settleField}
              onClick={advanceObjectRitual}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advanceObjectRitual(); } }}
              disabled={objectAnimating}
              className={`eight-ball object-step-${objectStep} ${objectAnimating ? 'is-moving' : ''}`}
              aria-label={objectStep === 0 ? 'Rotate the ball or press for the first shake' : objectStep === 1 ? 'Rotate the ball or press for the second shake' : 'Rotate the ball or press for the final shake'}
              animate={objectAnimating ? { x: [0, -28, 25, -21, 17, -12, 8, -4, 0], y: [0, 5, -4, 3, -3, 2, -1, 0], rotateZ: [0, -9, 10, -8, 7, -5, 3, -1, 0], scale: [1, 1.035, .99, 1.025, 1] } : { x: 0, y: 0, rotateZ: 0, scale: 1 }}
              transition={{ duration: objectStep === OBJECT_RITUAL_STEPS ? 1.25 : .54, ease: [0.22, 0.8, 0.2, 1] }}
              whileDrag={{ scale: 1.035 }}
            ><span className="ball-mark">8</span><i className="ball-window" aria-hidden="true">{objectStep >= OBJECT_RITUAL_STEPS ? objectMessage : '···'}</i></motion.button>
            {motionSupported && <button type="button" className="field-shortcut sr-only" onClick={() => void enableDeviceMotion()} disabled={objectAnimating}>{motionEnabled ? 'Device motion enabled' : 'Use device motion'}</button>}
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'cookie' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-cookie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {cookieChoice === null ? (
              <fieldset className="cookie-choices"><legend className="sr-only">Choose one of three fortune cookies</legend>
                {[0, 1, 2].map((choice) => <motion.button type="button" className="cookie-choice" key={choice} onClick={() => { setCookieChoice(choice); setObjectStep(0); settleField(); cue('tick'); }} whileHover={{ y: -16, rotateX: -7, rotateY: choice === 0 ? -12 : choice === 2 ? 12 : 0, rotateZ: choice === 0 ? -4 : choice === 2 ? 4 : 0 }} whileTap={{ scale: .95 }} aria-label={`Choose fortune cookie ${choice + 1}`}><Image src="/art/fortune-cookie-object-v2.webp" alt="" width={550} height={367} sizes="(max-width: 720px) 30vw, 220px" /></motion.button>)}
              </fieldset>
            ) : (
                <motion.button
                  drag
                  dragConstraints={{ left: -100, right: 100, top: -60, bottom: 60 }}
                  dragElastic={0.16}
                  dragMomentum={false}
                  style={{ rotateX: fieldTiltX, rotateY: fieldTiltY }}
                  onPointerMove={tiltField}
                  onPointerLeave={settleField}
                  onDrag={dragField}
                  onDragEnd={settleField}
                  onClick={advanceObjectRitual}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advanceObjectRitual(); } }}
                  disabled={objectAnimating}
                  className={`cookie-object object-step-${objectStep} ${objectStep === OBJECT_RITUAL_STEPS ? 'is-cracking' : ''} ${objectAnimating ? 'is-moving' : ''}`}
                  aria-label={objectStep === 0 ? 'Rotate the cookie or press to begin cracking it' : objectStep === 1 ? 'Rotate the cookie or press again to widen the crack' : 'Rotate the cookie or press a third time to break it open'}
                  animate={objectAnimating && objectStep < OBJECT_RITUAL_STEPS ? { rotateZ: [0, -1.7, 1.3, -.8, 0], scale: [1, .985, 1.008, 1] } : { rotateZ: 0, scale: 1 }}
                  transition={{ duration: .52, ease: [0.22, 0.8, 0.2, 1] }}
                  whileDrag={{ scale: 1.025 }}
                >
                  <span className="cookie-aura" aria-hidden="true" />
                  <span className="cookie-half cookie-half-left" aria-hidden="true"><Image src="/art/fortune-cookie-object-v2.webp" alt="" width={1100} height={733} priority /></span>
                  <span className="cookie-half cookie-half-right" aria-hidden="true"><Image src="/art/fortune-cookie-object-v2.webp" alt="" width={1100} height={733} priority /></span>
                  <span className="cookie-paper" aria-hidden="true"><em>{objectMessage}</em></span>
                  <span className="cookie-crumbs" aria-hidden="true">{cookieCrumbs.map((crumb, index) => <b key={index} style={{ '--crumb-x': `${crumb.x}px`, '--crumb-y': `${crumb.y}px`, '--crumb-r': `${crumb.r}deg`, '--crumb-index': index } as React.CSSProperties} />)}</span>
                </motion.button>
            )}
          </motion.section>
        )}

        {stage === 'reveal' && spread && (
          <motion.section className="reading-stage reveal-stage" key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {revealed.size < draws.length && <button type="button" className="field-shortcut sr-only" onClick={revealAll} disabled={isRevealingAll}>{isRevealingAll ? `Revealing ${revealed.size} of ${draws.length} cards` : 'Reveal every card'}</button>}
            <div className={`cards-layout spread-${spread.layout} count-${draws.length} ${draws.length > 10 ? 'many-cards' : ''}`}>
              {draws.map((draw, index) => <CardFace key={`${draw.card.id}-${index}`} draw={draw} index={index} compact={draws.length > 10} disabled={isRevealingAll} revealed={revealed.has(index)} onPeelStart={() => cue('peel')} onReveal={() => revealCard(index)} />)}
            </div>
          </motion.section>
        )}

        {stage === 'result' && interpretation && record && (
          <motion.section className="reading-stage result-stage" key="result" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            <header className="result-hero">
              <p className="eyebrow">The reading</p>
              <h1>{interpretation.headline}</h1>
              <p className="result-overview">{resultOverview}</p>
            </header>
            {system.kind !== 'cards' && luckyNumbers.length > 0 && <div className={`object-result ${system.kind}`}><small>Lucky numbers · {luckyNumbers.join(' · ')}</small></div>}
            {selectedResultDraw && selectedResultPosition && (
              <section className="result-reading" aria-label="Cards in this reading">
                <div className="result-reading-focus">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.article
                      className="result-card-detail"
                      key={`${selectedResultDraw.card.id}-${safeResultCardIndex}`}
                      initial={{ opacity: 0, x: 74, rotateZ: 4 }}
                      animate={{ opacity: 1, x: 0, rotateZ: 0 }}
                      exit={{ opacity: 0, x: -58, rotateZ: -3 }}
                      transition={{ duration: .42, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.div
                        className="result-card-object"
                        initial={{ y: 28, rotateX: -8, rotateY: 12, rotateZ: safeResultCardIndex % 2 ? 1.4 : -1.4, scale: .92 }}
                        animate={{ y: 0, rotateX: 0, rotateY: 0, rotateZ: safeResultCardIndex % 2 ? .7 : -.7, scale: 1 }}
                        transition={{ duration: .58, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -9, rotateX: -2, rotateY: safeResultCardIndex % 2 ? -4 : 4, scale: 1.015 }}
                      >
                        <div className={`result-card-sticker ${selectedResultDraw.reversed ? 'is-reversed' : ''}`}>
                          <small>{selectedResultDraw.position}</small>
                          {selectedResultDraw.card.image ? (
                            <span className="result-card-art"><Image src={selectedResultDraw.card.image} alt={`${selectedResultDraw.card.name} card artwork`} width={520} height={820} sizes="(max-width: 720px) 54vw, 260px" /></span>
                          ) : <strong aria-hidden="true">{selectedResultDraw.card.glyph}</strong>}
                          <span>{selectedResultDraw.card.name}</span>
                          {selectedResultDraw.reversed && <em>Reversed</em>}
                        </div>
                      </motion.div>
                      <div className="result-card-copy" aria-live="polite">
                        <span className="result-card-count">{String(safeResultCardIndex + 1).padStart(2, '0')} / {String(draws.length).padStart(2, '0')}</span>
                        <p className="eyebrow">{selectedResultDraw.position}</p>
                        <h2>{selectedResultDraw.card.name}</h2>
                        <p>{sentenceExcerpt(selectedResultPosition.text, 2)}</p>
                        <div className="result-keywords" aria-label="Keywords">{selectedResultDraw.card.keywords.slice(0, 3).map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
                        <div className="result-card-nav">
                          <button type="button" onClick={() => { setResultCardIndex((current) => Math.max(0, current - 1)); cue('deal'); }} disabled={safeResultCardIndex === 0}><ChevronLeft /> Previous</button>
                          <button type="button" onClick={() => { setResultCardIndex((current) => Math.min(draws.length - 1, current + 1)); cue('deal'); }} disabled={safeResultCardIndex === draws.length - 1}>Next <ChevronRight /></button>
                        </div>
                      </div>
                    </motion.article>
                  </AnimatePresence>
                </div>
                {draws.length > 1 && (
                  <div className="result-card-strip" role="tablist" aria-label="Choose a card to interpret">
                    {draws.map((draw, index) => (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={safeResultCardIndex === index}
                        aria-label={`${index + 1}. ${draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}`}
                        className={safeResultCardIndex === index ? 'active' : ''}
                        key={`${draw.card.id}-${index}`}
                        onClick={() => { setResultCardIndex(index); cue('deal'); }}
                      >
                        {draw.card.image ? <Image src={draw.card.image} alt="" width={72} height={112} /> : <strong aria-hidden="true">{draw.card.glyph}</strong>}
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
            {interpretation.reflectionPrompt && <p className="result-prompt">{interpretation.reflectionPrompt}</p>}
            <details className="reflection-drawer">
              <summary>Keep this reading <ArrowRight /></summary>
              <div className="journal-compose">
                <label htmlFor="note">Your reflection</label>
                <Textarea id="note" value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} placeholder="What stayed with you?" />
                <label className="privacy-check"><input type="checkbox" checked={includeQuestion} onChange={(event) => setIncludeQuestion(event.target.checked)} /><span>Include my question in shared images</span></label>
                {storageError && <output className="error-note">The private journal is unavailable. You can still download this reading.</output>}
                {shareStatus === 'error' && <output className="error-note">The share image could not be created. Your reading is unchanged.</output>}
                <div className="result-actions">
                  <Button className={`quiet-action ${favorite ? 'is-active' : ''}`} onClick={() => { setFavorite((value) => !value); setSaved(false); }}><Heart fill={favorite ? 'currentColor' : 'none'} /> Favorite</Button>
                  <Button className="quiet-action" onClick={() => void share()} disabled={shareStatus === 'working'}><Share2 /> {shareStatus === 'working' ? 'Preparing image…' : shareStatus === 'downloaded' ? 'Image downloaded' : shareStatus === 'shared' ? 'Shared' : 'Share / download'}</Button>
                  <Button className="primary-action" onClick={() => void save()}>{saved ? <Check /> : <BookMarked />}{saved ? 'Saved' : 'Save to journal'}</Button>
                </div>
              </div>
            </details>
            <div className="reading-again"><Button className="quiet-action" onClick={restart}><RotateCcw /> Begin another reading</Button><Link href="/#systems">Choose another system <ArrowRight /></Link></div>
          </motion.section>
        )}
      </AnimatePresence>
      <div className="sr-only" aria-live="polite">{stage === 'result' && interpretation ? `Reading complete. ${interpretation.headline}` : announcement}</div>
    </main>
  );
}

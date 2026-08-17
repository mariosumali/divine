'use client';

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate as motionAnimate,
  motion,
  useMotionValue,
  useTransform,
} from 'motion/react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Check,
  ChevronDown,
  ChevronLeft,
  Heart,
  RotateCcw,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SystemRitual } from '@/components/divine/system-ritual';
import { ReadingShare } from '@/components/divine/reading-share';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useExperience } from '@/app/providers';
import {
  deckColors,
  imageForFinish,
  isCardSystemSlug,
  type DeckFinish,
} from '@/lib/divine/decks';
import {
  COOKIE_RITUAL_STEPS,
  OBJECT_RITUAL_STEPS,
  drawBallAnswer,
  drawCards,
  drawFortune,
  interpretReading,
  nextObjectRitualStep,
  objectInterpretation,
} from '@/lib/divine/reading';
import { DIVINE_RITUAL, ritualForSystem } from '@/lib/divine/rituals';
import { setReadingAmbience } from '@/lib/divine/audio';
import { composeShare, decodeReadingShareToken } from '@/lib/divine/share';
import { saveReading } from '@/lib/divine/storage';
import type {
  DrawnCard,
  Focus,
  InterpretationBlock,
  ReadingRecord,
  SpreadDefinition,
  SystemDefinition,
} from '@/lib/divine/types';

const FortuneCookie3D = lazy(() =>
  import('@/components/divine/fortune-cookie-3d').then((module) => ({
    default: module.FortuneCookie3D,
  })),
);

const MagicEightBall3D = lazy(() =>
  import('@/components/divine/magic-eight-ball-3d').then((module) => ({
    default: module.MagicEightBall3D,
  })),
);

type Stage = 'intro' | 'frame' | 'method' | 'ritual' | 'reveal' | 'result';
// Temporarily skip the card-unwrapping ritual between choosing a spread and
// revealing the face-down cards. Keep the implementation below for re-enabling.
const CARD_UNWRAPPING_ENABLED = false;
type ShareStatus =
  | 'idle'
  | 'working'
  | 'shared'
  | 'downloaded'
  | 'cancelled'
  | 'error';
interface StoredReadingSession {
  version: 1 | 2 | 3 | 4;
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
  objectStep?: number;
  cardRitualStep?: number;
  ramlLines?: number[];
}
const focuses: Array<{ value: Focus; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'love', label: 'Love' },
  { value: 'work', label: 'Work' },
  { value: 'growth', label: 'Growth' },
];
const readingStages: Stage[] = [
  'intro',
  'frame',
  'method',
  'ritual',
  'reveal',
  'result',
];
const visibleReadingStages = (systemKind: SystemDefinition['kind']) =>
  systemKind === 'cards' && !CARD_UNWRAPPING_ENABLED
    ? readingStages.filter((stage) => stage !== 'ritual')
    : readingStages;
const stageMotion = {
  initial: { opacity: 0, y: 30, scale: 0.992, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -22, scale: 0.995, filter: 'blur(6px)' },
  transition: {
    duration: 0.58,
    delay: 0.16,
    ease: [0.22, 1, 0.36, 1],
  },
} as const;
const cookieCrumbs = [
  { x: -114, y: -42, r: -18 },
  { x: -76, y: 62, r: 22 },
  { x: -35, y: 86, r: -8 },
  { x: 42, y: 78, r: 14 },
  { x: 88, y: 48, r: -24 },
  { x: 126, y: -26, r: 18 },
];

function KineticText({ text }: { text: string }) {
  return (
    <span className="kinetic-text" aria-label={text}>
      {text.split(' ').map((word, index) => (
        <span aria-hidden="true" key={`${word}-${index}`}>
          <motion.i
            initial={{ y: '112%', rotate: 2.5 }}
            animate={{ y: '0%', rotate: 0 }}
            transition={{
              duration: 0.72,
              delay: Math.min(index * 0.055, 0.5),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.i>
        </span>
      ))}
    </span>
  );
}

type PerformanceNavigator = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

function supportsEnhancedObjects() {
  const performanceNavigator = navigator as PerformanceNavigator;
  if (performanceNavigator.connection?.saveData) return false;
  if (
    performanceNavigator.deviceMemory !== undefined &&
    performanceNavigator.deviceMemory <= 4
  )
    return false;
  return (
    navigator.hardwareConcurrency === undefined ||
    navigator.hardwareConcurrency > 4
  );
}

function LightweightObject({
  kind,
  step,
  answer,
  disabled,
  ariaLabel,
  onAdvance,
}: {
  kind: 'ball' | 'cookie';
  step: number;
  answer: string;
  disabled: boolean;
  ariaLabel: string;
  onAdvance: () => void;
}) {
  const isBall = kind === 'ball';
  return (
    <button
      type="button"
      className={`lightweight-object lightweight-${kind} object-step-${step}`}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onAdvance}
    >
      <Image
        src={
          isBall
            ? '/index-art-v2/magic-8-ball.webp'
            : '/art/fortune-cookie-object-v2.webp'
        }
        alt=""
        width={isBall ? 760 : 1100}
        height={isBall ? 760 : 733}
        sizes={
          isBall
            ? '(max-width: 720px) 82vw, 620px'
            : '(max-width: 720px) 94vw, 900px'
        }
      />
      {isBall && step >= OBJECT_RITUAL_STEPS && (
        <span aria-hidden="true">{answer}</span>
      )}
    </button>
  );
}

function createId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function exportReading(
  record: ReadingRecord,
  includeQuestion: boolean,
): Promise<Exclude<ShareStatus, 'idle' | 'working' | 'error'>> {
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
    if (ctx.measureText(test).width > 900) {
      lines.push(line);
      line = word;
    } else line = test;
  });
  lines.push(line);
  lines
    .slice(0, 3)
    .forEach((value, index) => ctx.fillText(value, 600, 390 + index * 92));
  ctx.fillStyle = '#aaa7a0';
  if (composition.cards.length) {
    const preview = composition.cards;
    const dense = preview.length > 10;
    const columns = Math.min(preview.length, dense ? 6 : 5);
    const gap = dense ? 12 : 18;
    const rowGap = dense ? 12 : 18;
    const height = dense ? 74 : 132;
    const startY = dense ? 625 : 680;
    const width = Math.min(
      dense ? 145 : 170,
      (930 - gap * (columns - 1)) / columns,
    );
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
      ctx.fillText(
        draw.position.toUpperCase().slice(0, dense ? 18 : 24),
        x + width / 2,
        y + (dense ? 17 : 25),
      );
      ctx.fillStyle = '#f4f2ec';
      ctx.font = `500 ${dense ? 15 : 20}px "Bodoni Moda", Georgia, serif`;
      const label = `${draw.name}${draw.reversed ? ' · R' : ''}`;
      const splitAt = dense ? 15 : 18;
      const midpoint =
        label.length > splitAt ? label.lastIndexOf(' ', splitAt) : -1;
      if (midpoint > 0 && !dense) {
        ctx.fillText(label.slice(0, midpoint), x + width / 2, y + 70);
        ctx.fillText(label.slice(midpoint + 1), x + width / 2, y + 96);
      } else
        ctx.fillText(
          label.slice(0, dense ? 19 : 28),
          x + width / 2,
          y + (dense ? 51 : 85),
        );
    });
    const excerptWords = composition.synthesis.split(' ');
    const excerptLines: string[] = [];
    line = '';
    ctx.fillStyle = '#aaa7a0';
    ctx.font = `${dense ? 18 : 21}px Arial, sans-serif`;
    excerptWords.forEach((word) => {
      const test = `${line} ${word}`.trim();
      if (ctx.measureText(test).width > 900) {
        excerptLines.push(line);
        line = word;
      } else line = test;
    });
    excerptLines.push(line);
    const excerptY =
      startY + Math.ceil(preview.length / columns) * (height + rowGap) + 24;
    excerptLines
      .slice(0, dense ? 2 : 3)
      .forEach((value, index) =>
        ctx.fillText(value, 600, excerptY + index * 30),
      );
  } else {
    ctx.font = '24px Arial, sans-serif';
    const detailWords = composition.synthesis.split(' ');
    const detailLines: string[] = [];
    line = '';
    detailWords.forEach((word) => {
      const test = `${line} ${word}`.trim();
      if (ctx.measureText(test).width > 930) {
        detailLines.push(line);
        line = word;
      } else line = test;
    });
    detailLines.push(line);
    detailLines
      .slice(0, 5)
      .forEach((value, index) => ctx.fillText(value, 600, 770 + index * 38));
  }
  if (composition.question) {
    ctx.font = 'italic 30px "Bodoni Moda", Georgia, serif';
    ctx.fillStyle = '#f4f2ec';
    ctx.fillText(`“${composition.question.slice(0, 70)}”`, 600, 1270);
  }
  ctx.fillStyle = '#aaa7a0';
  ctx.font = '14px Arial';
  ctx.letterSpacing = '4px';
  ctx.fillText(
    new Date(composition.date).toLocaleDateString().toUpperCase(),
    600,
    1370,
  );
  ctx.letterSpacing = '0px';

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('Unable to render share image');
  const file = new File([blob], `divine-${record.system}-${record.id}.png`, {
    type: 'image/png',
  });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: `DIVINE · ${record.systemName}`,
        files: [file],
      });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        return 'cancelled';
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

function Progress({
  stage,
  systemKind,
}: {
  stage: Stage;
  systemKind: SystemDefinition['kind'];
}) {
  const stages = visibleReadingStages(systemKind);
  const current = stages.indexOf(stage);
  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        {stages.map((item, index) => (
          <span key={item} className={index <= current ? 'active' : ''} />
        ))}
      </div>
      <progress
        className="sr-only"
        aria-label="Reading progress"
        max={stages.length}
        value={current + 1}
        aria-valuetext={`Step ${current + 1} of ${stages.length}: ${stage}`}
      />
    </>
  );
}

function CardFace({
  draw,
  systemSlug,
  finish,
  revealed,
  index,
  compact,
  disabled,
  onPeelStart,
  onReveal,
}: {
  draw: DrawnCard;
  systemSlug: SystemDefinition['slug'];
  finish: DeckFinish;
  revealed: boolean;
  index: number;
  compact: boolean;
  disabled: boolean;
  onPeelStart: () => void;
  onReveal: () => void;
}) {
  const peel = useMotionValue(revealed ? 1 : 0);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const coverX = useTransform(
    peel,
    [0, 0.34, 1],
    [0, compact ? -8 : -18, compact ? -54 : -132],
  );
  const coverY = useTransform(
    peel,
    [0, 0.34, 1],
    [0, compact ? 7 : 16, compact ? 38 : 92],
  );
  const coverRotateX = useTransform(peel, [0, 0.4, 1], [0, 15, 34]);
  const coverRotateY = useTransform(peel, [0, 0.4, 1], [0, -16, -42]);
  const coverRotateZ = useTransform(peel, [0, 0.4, 1], [0, -5, -17]);
  const coverScale = useTransform(peel, [0, 0.5, 1], [1, 0.96, 0.76]);
  const coverOpacity = useTransform(peel, [0, 0.84, 1], [1, 1, 0]);
  const coverClip = useTransform(
    peel,
    [0, 0.45, 0.82, 1],
    [
      'polygon(0 0,100% 0,100% 100%,0 100%)',
      'polygon(0 0,48% 0,100% 48%,100% 100%,0 100%)',
      'polygon(0 0,8% 0,100% 92%,100% 100%,0 100%)',
      'polygon(0 0,0 0,100% 100%,100% 100%,0 100%)',
    ],
  );
  const foldScale = useTransform(peel, [0, 0.06, 0.72, 1], [0, 0.18, 1, 0.28]);
  const foldOpacity = useTransform(peel, [0, 0.05, 0.82, 1], [0, 1, 1, 0]);
  const foldRotate = useTransform(peel, [0, 1], [0, -10]);
  const peelShadow = useTransform(peel, [0, 0.18, 0.75, 1], [0, 0.22, 0.54, 0]);
  const suppressClick = useRef(false);
  const image = imageForFinish(draw.card, finish);
  const colors = isCardSystemSlug(systemSlug)
    ? deckColors(systemSlug, draw.card.id, finish)
    : undefined;

  useEffect(() => {
    motionAnimate(peel, revealed ? 1 : 0, {
      duration: revealed ? 0.48 : 0.3,
      ease: [0.22, 1, 0.36, 1],
    });
  }, [peel, revealed]);

  const completePeel = () => {
    if (revealed || disabled) return;
    motionAnimate(peel, 1, { duration: 0.52, ease: [0.22, 1, 0.36, 1] });
    onReveal();
  };
  const peelProgress = (x: number, y: number) =>
    Math.min(
      0.96,
      Math.max(0, (-x + Math.max(0, y) * 0.28) / (compact ? 76 : 125)),
    );
  const settleTilt = () => {
    motionAnimate(tiltX, 0, { type: 'spring', stiffness: 180, damping: 20 });
    motionAnimate(tiltY, 0, { type: 'spring', stiffness: 180, damping: 20 });
  };

  return (
    <motion.button
      type="button"
      className={`reading-card ${revealed ? 'is-revealed' : ''} ${compact ? 'is-compact' : ''}`}
      data-system={systemSlug}
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
      dragConstraints={{
        left: compact ? -12 : -32,
        right: compact ? 12 : 32,
        top: compact ? -10 : -24,
        bottom: compact ? 10 : 24,
      }}
      dragElastic={0.12}
      dragMomentum={false}
      style={{
        rotateX: tiltX,
        rotateY: tiltY,
        aspectRatio: draw.card.aspectRatio,
      }}
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
      aria-label={
        revealed
          ? `${draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}`
          : `Peel card ${index + 1}, ${draw.position}`
      }
      initial={{
        opacity: 0,
        x: (index % 2 ? 1 : -1) * (compact ? 70 : 170),
        y: compact ? -90 : -250,
        z: -180,
        rotateZ: index % 2 ? 16 : -16,
        scale: 0.58,
      }}
      animate={{ opacity: 1, x: 0, y: 0, z: 0, rotateZ: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 112,
        damping: 17,
        mass: 1.05,
        delay: Math.min(index * (compact ? 0.032 : 0.082), 1.05),
      }}
      whileHover={{ y: compact ? -2 : -7 }}
    >
      <span className="card-scene">
        <span
          className={`card-front deck-${finish} ${draw.reversed ? 'is-reversed' : ''}`}
          style={colors}
          aria-hidden={revealed ? undefined : true}
        >
          <small>{draw.card.sourceSystemName ?? draw.position}</small>
          {image ? (
            <span className="card-art">
              <Image
                src={image}
                alt=""
                width={520}
                height={820}
                sizes="(max-width: 720px) 25vw, 18vw"
              />
            </span>
          ) : (
            <strong>{draw.card.glyph}</strong>
          )}
          <span>{draw.card.name}</span>
          {draw.reversed && <em>Reversed</em>}
        </span>
        <motion.span
          className="card-peel"
          style={{
            x: coverX,
            y: coverY,
            rotateX: coverRotateX,
            rotateY: coverRotateY,
            rotateZ: coverRotateZ,
            scale: coverScale,
            opacity: coverOpacity,
            clipPath: coverClip,
          }}
          aria-hidden="true"
        >
          <span className="card-back" data-system={systemSlug} />
        </motion.span>
        <motion.span
          className="peel-fold"
          style={{
            scale: foldScale,
            opacity: foldOpacity,
            rotateZ: foldRotate,
          }}
          aria-hidden="true"
        >
          <i />
        </motion.span>
        <motion.span
          className="peel-shadow"
          style={{ opacity: peelShadow }}
          aria-hidden="true"
        />
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
                window.setTimeout(() => {
                  suppressClick.current = false;
                }, 0);
              }
              if (progress >= 0.22) completePeel();
              else
                motionAnimate(peel, 0, {
                  duration: 0.28,
                  ease: [0.22, 1, 0.36, 1],
                });
            }}
          >
            <i />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}

function cardFacts(card: DrawnCard['card']) {
  return [
    ['Deck', card.sourceSystemName],
    ['Domain', card.domain],
    ['Element', card.element],
    [
      'Number',
      card.numerology === undefined ? undefined : `${card.numerology}`,
    ],
    ['Subject', card.subject],
    ['Modifier', card.modifier],
    ['Polarity', card.polarity],
    ['Timing', card.timing],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
}

function InteractiveResultCard({
  draw,
  systemSlug,
  finish,
  opening = false,
  onTurn,
}: {
  draw: DrawnCard;
  systemSlug: SystemDefinition['slug'];
  finish: DeckFinish;
  opening?: boolean;
  onTurn: () => void;
}) {
  const [faceUp, setFaceUp] = useState(true);
  const tiltX = useMotionValue(opening ? -2 : 0);
  const tiltY = useMotionValue(opening ? 5 : 0);
  const suppressFlip = useRef(false);
  const image = imageForFinish(draw.card, finish);
  const colors = isCardSystemSlug(systemSlug)
    ? deckColors(systemSlug, draw.card.id, finish)
    : undefined;

  const settle = () => {
    motionAnimate(tiltX, opening ? -2 : 0, {
      type: 'spring',
      stiffness: 180,
      damping: 20,
    });
    motionAnimate(tiltY, opening ? 5 : 0, {
      type: 'spring',
      stiffness: 180,
      damping: 20,
    });
  };

  const turn = () => {
    if (suppressFlip.current) return;
    setFaceUp((current) => !current);
    onTurn();
  };

  return (
    <motion.button
      type="button"
      className={`result-card-object ${opening ? 'is-opening' : ''}`}
      data-system={systemSlug}
      style={{
        aspectRatio: draw.card.aspectRatio,
        rotateX: tiltX,
        rotateY: tiltY,
      }}
      aria-label={`${faceUp ? 'View the back of' : 'Return to'} ${draw.card.name}`}
      aria-pressed={!faceUp}
      onClick={turn}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        tiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 16);
        tiltX.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 12);
      }}
      onPointerLeave={settle}
      drag
      dragConstraints={{ left: -22, right: 22, top: -18, bottom: 18 }}
      dragElastic={0.12}
      dragMomentum={false}
      onDragStart={() => {
        suppressFlip.current = true;
      }}
      onDrag={(_, info) => {
        tiltY.set(Math.max(-16, Math.min(16, info.offset.x * 0.2)));
        tiltX.set(Math.max(-12, Math.min(12, -info.offset.y * 0.16)));
      }}
      onDragEnd={() => {
        settle();
        window.setTimeout(() => {
          suppressFlip.current = false;
        }, 100);
      }}
      whileHover={{ y: -10, scale: 1.018 }}
      whileTap={{ scale: 0.985 }}
    >
      <motion.span
        className="result-card-turn"
        animate={{ rotateY: faceUp ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 170, damping: 21 }}
      >
        <span
          className={`result-card-sticker deck-${finish} ${draw.reversed ? 'is-reversed' : ''}`}
          style={colors}
        >
          {draw.card.sourceSystemName && (
            <small>{draw.card.sourceSystemName}</small>
          )}
          {image ? (
            <span className="result-card-art">
              <Image
                src={image}
                alt={`${draw.card.name} card artwork`}
                width={640}
                height={960}
                sizes={
                  opening
                    ? '(max-width: 720px) 64vw, 34vw'
                    : '(max-width: 720px) 74vw, 34vw'
                }
              />
            </span>
          ) : (
            <strong aria-hidden="true">{draw.card.glyph}</strong>
          )}
          {draw.card.sourceSystemName && <span>{draw.card.name}</span>}
          {draw.reversed && <em>Reversed</em>}
        </span>
        <span
          className="result-card-back card-back"
          data-system={systemSlug}
          aria-hidden="true"
        />
      </motion.span>
    </motion.button>
  );
}

export function ReadingExperience({ system }: { system: SystemDefinition }) {
  const { cue, deckFinishes } = useExperience();
  const [stage, setStage] = useState<Stage>('intro');
  const [question, setQuestion] = useState('');
  const [focus, setFocus] = useState<Focus>('general');
  const [spread, setSpread] = useState<SpreadDefinition | null>(
    system.spreads[0] ?? null,
  );
  const [reversals, setReversals] = useState(Boolean(system.reversalStyle));
  const [shuffled, setShuffled] = useState(false);
  const [draws, setDraws] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [interpretation, setInterpretation] =
    useState<InterpretationBlock | null>(null);
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
  const [objectStep, setObjectStep] = useState(0);
  const [objectAnimating, setObjectAnimating] = useState(false);
  const [cookieGestureProgress, setCookieGestureProgress] = useState(0);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [cardRitualStep, setCardRitualStep] = useState(0);
  const [cardRitualAnimating, setCardRitualAnimating] = useState(false);
  const [cardRitualDealing, setCardRitualDealing] = useState(false);
  const [cardGestureProgress, setCardGestureProgress] = useState(0);
  const [ramlLines, setRamlLines] = useState<number[]>([]);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [isSharedView, setIsSharedView] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [enhancedObjects, setEnhancedObjects] = useState(false);
  const motionHandler = useRef<((event: DeviceMotionEvent) => void) | null>(
    null,
  );
  const ritualLock = useRef(false);
  const completionQueued = useRef(false);
  const revealTimers = useRef<number[]>([]);
  const objectTimer = useRef<number | null>(null);
  const deckTimer = useRef<number | null>(null);
  const sessionKey = `divine-session:${system.slug}`;
  const objectRitualSteps =
    system.kind === 'cookie' ? COOKIE_RITUAL_STEPS : OBJECT_RITUAL_STEPS;
  const readingAmbienceActive = sessionReady && stage !== 'intro';

  useEffect(() => {
    setReadingAmbience(readingAmbienceActive);
    return () => setReadingAmbience(false);
  }, [readingAmbienceActive]);

  useEffect(() => {
    queueMicrotask(() => {
      setEnhancedObjects(supportsEnhancedObjects());
      setMotionSupported('DeviceMotionEvent' in window);
    });
    return () => {
      if (motionHandler.current)
        window.removeEventListener('devicemotion', motionHandler.current);
      revealTimers.current.forEach((timer) => window.clearTimeout(timer));
      if (objectTimer.current !== null)
        window.clearTimeout(objectTimer.current);
      if (deckTimer.current !== null) window.clearTimeout(deckTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let restored: StoredReadingSession | null = null;
    let sharedReading: ReturnType<typeof decodeReadingShareToken> = null;
    try {
      const token = new URLSearchParams(window.location.hash.slice(1)).get(
        'reading',
      );
      sharedReading = token ? decodeReadingShareToken(token, system) : null;
      const raw = sessionStorage.getItem(sessionKey);
      restored = raw ? (JSON.parse(raw) as StoredReadingSession) : null;
    } catch {
      restored = null;
    }
    queueMicrotask(() => {
      if (cancelled) return;
      if (sharedReading) {
        const shared = sharedReading.record;
        const sharedSpread =
          system.spreads.find((item) => item.id === shared.spreadId) ??
          system.spreads[0] ??
          null;
        setStage('result');
        setQuestion(shared.question ?? '');
        setFocus(shared.focus);
        setSpread(sharedSpread);
        setReversals(shared.draws.some((draw) => draw.reversed));
        setShuffled(true);
        setDraws(shared.draws);
        setRevealed(new Set(shared.draws.map((_, index) => index)));
        setInterpretation(shared.interpretation);
        setObjectMessage(
          system.kind === 'cards' ? '' : shared.interpretation.headline,
        );
        setLuckyNumbers(sharedReading.luckyNumbers);
        setNote('');
        setFavorite(false);
        setRecordId(shared.id);
        setCreatedAt(shared.createdAt);
        setObjectStep(system.kind === 'cards' ? 0 : objectRitualSteps);
        setIsSharedView(true);
        ritualLock.current = true;
        setAnnouncement('A shared reading has opened.');
        setSessionReady(true);
        return;
      }
      if (
        (restored?.version === 1 ||
          restored?.version === 2 ||
          restored?.version === 3 ||
          restored?.version === 4) &&
        restored.system === system.slug
      ) {
        const restoredSpread =
          system.spreads.find((item) => item.id === restored.spreadId) ??
          system.spreads[0] ??
          null;
        const restoredDraws = (
          Array.isArray(restored.draws) ? restored.draws : []
        ).flatMap((draw) => {
          const card = system.cards.find((item) => item.id === draw.cardId);
          return card
            ? [{ card, position: draw.position, reversed: draw.reversed }]
            : [];
        });
        const candidateStage = readingStages.includes(restored.stage)
          ? restored.stage
          : 'intro';
        const canRestoreStage =
          candidateStage !== 'reveal' || restoredDraws.length > 0;
        const resolvedObject =
          candidateStage === 'ritual' &&
          system.kind !== 'cards' &&
          typeof restored.objectStep === 'number' &&
          restored.objectStep >= objectRitualSteps &&
          restored.interpretation;
        const nextStage = resolvedObject
          ? 'result'
          : !CARD_UNWRAPPING_ENABLED &&
              candidateStage === 'ritual' &&
              system.kind === 'cards'
            ? restoredDraws.length
              ? 'reveal'
              : 'method'
            : candidateStage === 'result' && !restored.interpretation
              ? 'frame'
              : canRestoreStage
                ? candidateStage
                : 'method';
        setStage(nextStage);
        setQuestion(
          typeof restored.question === 'string' ? restored.question : '',
        );
        setFocus(
          focuses.some((item) => item.value === restored.focus)
            ? restored.focus
            : 'general',
        );
        setSpread(restoredSpread);
        setReversals(
          system.reversalStyle === 'required' ? true : restored.reversals,
        );
        setShuffled(restored.shuffled);
        setCardRitualStep(
          typeof restored.cardRitualStep === 'number'
            ? Math.max(
                0,
                Math.min(
                  isCardSystemSlug(system.slug)
                    ? ritualForSystem(system.slug).actions.length - 1
                    : system.slug === 'divine'
                      ? DIVINE_RITUAL.actions.length - 1
                      : 0,
                  Math.floor(restored.cardRitualStep),
                ),
              )
            : restored.shuffled
              ? 1
              : 0,
        );
        setRamlLines(
          Array.isArray(restored.ramlLines)
            ? restored.ramlLines
                .filter((line) => line === 1 || line === 2)
                .slice(0, 4)
            : [],
        );
        setDraws(restoredDraws);
        setRevealed(
          new Set(
            (Array.isArray(restored.revealed) ? restored.revealed : []).filter(
              (index) => index >= 0 && index < restoredDraws.length,
            ),
          ),
        );
        setInterpretation(
          candidateStage === 'result' &&
            system.kind === 'cards' &&
            restoredSpread &&
            restoredDraws.length
            ? interpretReading(
                system,
                restoredSpread,
                restoredDraws,
                focuses.some((item) => item.value === restored.focus)
                  ? restored.focus
                  : 'general',
                typeof restored.createdAt === 'string'
                  ? restored.createdAt
                  : '',
              )
            : (restored.interpretation ?? null),
        );
        setObjectMessage(
          typeof restored.objectMessage === 'string'
            ? restored.objectMessage
            : '',
        );
        setLuckyNumbers(
          Array.isArray(restored.luckyNumbers) ? restored.luckyNumbers : [],
        );
        setNote(typeof restored.note === 'string' ? restored.note : '');
        setFavorite(Boolean(restored.favorite));
        setRecordId(
          typeof restored.recordId === 'string'
            ? restored.recordId
            : createId(),
        );
        setCreatedAt(
          typeof restored.createdAt === 'string'
            ? restored.createdAt
            : new Date().toISOString(),
        );
        setObjectStep(
          typeof restored.objectStep === 'number'
            ? Math.max(0, Math.min(objectRitualSteps, restored.objectStep))
            : 0,
        );
        ritualLock.current = nextStage === 'result';
        if (nextStage !== 'intro')
          setAnnouncement('Your unfinished reading has been restored.');
      }
      setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [objectRitualSteps, sessionKey, system]);

  useEffect(() => {
    if (!sessionReady) return;
    const session: StoredReadingSession = {
      version: 4,
      system: system.slug,
      stage,
      question,
      focus,
      spreadId: spread?.id ?? null,
      reversals,
      shuffled,
      draws: draws.map((draw) => ({
        cardId: draw.card.id,
        position: draw.position,
        reversed: draw.reversed,
      })),
      revealed: [...revealed],
      interpretation,
      objectMessage,
      luckyNumbers,
      note,
      favorite,
      recordId,
      createdAt,
      objectStep,
      cardRitualStep,
      ramlLines,
    };
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(session));
    } catch {
      /* Session recovery is an enhancement. */
    }
  }, [
    sessionReady,
    sessionKey,
    system.slug,
    stage,
    question,
    focus,
    spread,
    reversals,
    shuffled,
    draws,
    revealed,
    interpretation,
    objectMessage,
    luckyNumbers,
    note,
    favorite,
    recordId,
    createdAt,
    objectStep,
    cardRitualStep,
    ramlLines,
  ]);

  const record = useMemo<ReadingRecord | null>(
    () =>
      interpretation
        ? {
            id: recordId,
            system: system.slug,
            systemName: system.name,
            spreadId: spread?.id ?? system.kind,
            spreadName:
              spread?.name ??
              (system.kind === 'ball' ? 'Ask & shake' : 'Crack & reveal'),
            createdAt,
            focus,
            question: question.trim() || undefined,
            draws,
            interpretation,
            luckyNumbers: luckyNumbers.length ? luckyNumbers : undefined,
            note,
            favorite,
          }
        : null,
    [
      interpretation,
      system,
      spread,
      focus,
      question,
      draws,
      luckyNumbers,
      note,
      favorite,
      recordId,
      createdAt,
    ],
  );

  const resultOverview = useMemo(
    () => (interpretation ? interpretation.overview : ''),
    [interpretation],
  );
  const deckFinish = isCardSystemSlug(system.slug)
    ? deckFinishes[system.slug]
    : 'ink';
  const cardSystemSlug = isCardSystemSlug(system.slug) ? system.slug : null;
  const ritualSystemSlug =
    cardSystemSlug ?? (system.slug === 'divine' ? 'divine' : null);
  const cardRitual =
    system.slug === 'divine'
      ? DIVINE_RITUAL
      : cardSystemSlug
        ? ritualForSystem(cardSystemSlug)
        : null;
  const openingDraw = draws[0] ?? null;
  const visualSystemFor = (draw: DrawnCard) =>
    draw.card.sourceSystem ?? system.slug;
  const finishFor = (draw: DrawnCard): DeckFinish => {
    const sourceSystem = visualSystemFor(draw);
    return isCardSystemSlug(sourceSystem)
      ? deckFinishes[sourceSystem]
      : deckFinish;
  };

  const beginRecord = () => {
    const nextRecord = {
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    setRecordId(nextRecord.id);
    setCreatedAt(nextRecord.createdAt);
    return nextRecord;
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const continueFromFrame = () =>
    move(system.kind === 'cards' ? 'method' : 'ritual');

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
        setCardRitualStep(0);
        setCardRitualAnimating(false);
        setCardRitualDealing(false);
        setCardGestureProgress(0);
        setRamlLines([]);
      }
      setObjectStep(0);
      setObjectAnimating(false);
      setCookieGestureProgress(0);
      move(system.kind === 'cards' ? 'method' : 'frame');
    }
    if (stage === 'reveal') {
      setDraws([]);
      setRevealed(new Set());
      setShuffled(false);
      setCardRitualStep(0);
      setCardRitualAnimating(false);
      setCardRitualDealing(false);
      setCardGestureProgress(0);
      setRamlLines([]);
      completionQueued.current = false;
      move('method');
    }
  };

  const deal = (delay: number, geomanticLines = ramlLines) => {
    if (!spread || cardRitualDealing) return;
    const next = drawCards(system, spread, reversals);
    if (system.slug === 'ilm-al-raml' && geomanticLines.length === 4) {
      const figureIndex = geomanticLines.reduce(
        (index, line) => (index << 1) | (line === 1 ? 1 : 0),
        0,
      );
      next[0] = { ...next[0], card: system.cards[figureIndex] };
    }
    completionQueued.current = false;
    ritualLock.current = false;
    setDraws(next);
    setRevealed(new Set());
    setCardRitualAnimating(false);
    setCardRitualDealing(true);
    setAnnouncement(
      cardRitual?.completion ??
        `${spread.positions.length} ${spread.positions.length === 1 ? 'card is' : 'cards are'} entering the field.`,
    );
    const reveal = () => {
      setCardRitualDealing(false);
      setStage('reveal');
      window.scrollTo({ top: 0, behavior: 'auto' });
      deckTimer.current = null;
    };
    if (delay <= 0) {
      reveal();
      return;
    }
    deckTimer.current = window.setTimeout(reveal, delay);
  };

  const continueFromMethod = () => {
    if (CARD_UNWRAPPING_ENABLED) {
      move('ritual');
      return;
    }
    cue('tick');
    setShuffled(true);
    deal(0);
  };

  const advanceCardRitual = (gestureValue?: number) => {
    if (!cardRitual || cardRitualAnimating || cardRitualDealing) return;
    const action = cardRitual.actions[cardRitualStep];
    if (!action) return;
    clearDeckTimer();
    cue(action.cue);
    setAnnouncement(action.announcement);
    setCardGestureProgress(0);
    setShuffled(true);
    const nextRamlLines =
      cardRitual.id === 'sand-figure' &&
      cardRitualStep > 0 &&
      (gestureValue === 1 || gestureValue === 2)
        ? [...ramlLines, gestureValue].slice(0, 4)
        : ramlLines;
    if (nextRamlLines !== ramlLines) setRamlLines(nextRamlLines);
    const next = cardRitualStep + 1;
    if (next >= cardRitual.actions.length) {
      deal(action.duration, nextRamlLines);
      return;
    }
    setCardRitualAnimating(true);
    setCardRitualStep(next);
    deckTimer.current = window.setTimeout(() => {
      setCardRitualAnimating(false);
      deckTimer.current = null;
    }, action.duration);
  };

  const finishCards = () => {
    if (!spread || ritualLock.current) return;
    ritualLock.current = true;
    const nextRecord = beginRecord();
    const result = interpretReading(
      system,
      spread,
      draws,
      focus,
      nextRecord.createdAt,
    );
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
      setAnnouncement(
        `${draws[index].position}: ${draws[index].card.name}${draws[index].reversed ? ', reversed' : ''}.`,
      );
      if (next.size === draws.length) queueCardFinish();
      return next;
    });
  };

  const revealAll = () => {
    if (isRevealingAll) return;
    cue('reveal');
    setIsRevealingAll(true);
    const interval = draws.length > 16 ? 56 : draws.length > 6 ? 125 : 235;
    draws.forEach((draw, index) => {
      const timer = window.setTimeout(() => {
        setRevealed((current) => new Set(current).add(index));
        setAnnouncement(
          `${draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}.`,
        );
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
      setInterpretation(
        objectInterpretation(
          system,
          result.fortune,
          focus,
          result.reflectionPrompt,
        ),
      );
    }
    objectTimer.current = window.setTimeout(
      () => {
        setObjectAnimating(false);
        cue('resolve');
        setStage('result');
        objectTimer.current = null;
      },
      system.kind === 'cookie' ? 1900 : 1450,
    );
  };

  const advanceObjectRitual = () => {
    if (objectAnimating || ritualLock.current) return;
    const next = nextObjectRitualStep(objectStep, objectRitualSteps);
    setCookieGestureProgress(0);
    setObjectStep(next);
    setObjectAnimating(true);
    if (next === objectRitualSteps) {
      resolveObjectRitual();
      return;
    }
    cue(system.kind === 'ball' ? 'liquid' : 'crack');
    setAnnouncement(
      system.kind === 'ball'
        ? next === 1
          ? 'The answer is moving. Shake again.'
          : 'The window is clouding. One final shake.'
        : 'A hairline crack appears. Break the shell open.',
    );
    objectTimer.current = window.setTimeout(() => {
      setObjectAnimating(false);
      objectTimer.current = null;
    }, 560);
  };

  const enableDeviceMotion = async () => {
    type PermissionMotionEvent = typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    const motionEvent = window.DeviceMotionEvent as PermissionMotionEvent;
    const permission = motionEvent.requestPermission
      ? await motionEvent.requestPermission()
      : 'granted';
    if (permission !== 'granted') {
      setAnnouncement(
        'Motion access was not granted. Use the shake button instead.',
      );
      return;
    }
    if (motionHandler.current)
      window.removeEventListener('devicemotion', motionHandler.current);
    const handler = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      const force =
        Math.abs(acceleration?.x ?? 0) +
        Math.abs(acceleration?.y ?? 0) +
        Math.abs(acceleration?.z ?? 0);
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

  const shareImage = async () => {
    if (!record || shareStatus === 'working') return;
    setShareStatus('working');
    try {
      const result = await exportReading(
        { ...record, note, favorite },
        includeQuestion,
      );
      setShareStatus(result);
      setAnnouncement(
        result === 'shared'
          ? 'Reading shared.'
          : result === 'downloaded'
            ? 'Reading image downloaded.'
            : 'Sharing cancelled.',
      );
    } catch {
      setShareStatus('error');
      setAnnouncement(
        'The share image could not be created. Your reading is unchanged.',
      );
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
    setCardRitualStep(0);
    setCardRitualAnimating(false);
    setCardRitualDealing(false);
    setCardGestureProgress(0);
    setRamlLines([]);
    setDraws([]);
    setRevealed(new Set());
    setInterpretation(null);
    setObjectMessage('');
    setLuckyNumbers([]);
    setNote('');
    setFavorite(false);
    setSaved(false);
    setAnnouncement('');
    setObjectStep(0);
    setObjectAnimating(false);
    setCookieGestureProgress(0);
    setShareStatus('idle');
    if (isSharedView) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
      setIsSharedView(false);
    }
    cue('tick');
  };

  if (!sessionReady) {
    return (
      <main className="reading-shell session-loading" aria-busy="true">
        <span>DIVINE</span>
        <small>Preparing</small>
      </main>
    );
  }

  return (
    <main className={`reading-shell stage-${stage}`}>
      {stage !== 'ritual' && stage !== 'reveal' && (
        <>
          <header className="reading-titlebar">
            <Link href="/#readings" className="back-link">
              <ArrowLeft /> Readings
            </Link>
            <span>{system.shortName}</span>
          </header>
          <Progress stage={stage} systemKind={system.kind} />
          {stage !== 'intro' && stage !== 'result' && (
            <button type="button" className="stage-back" onClick={goBack}>
              <ChevronLeft /> Back
            </button>
          )}
        </>
      )}
      {(stage === 'ritual' || stage === 'reveal') && (
        <button type="button" className="field-exit sr-only" onClick={goBack}>
          <ChevronLeft /> Leave the ritual
        </button>
      )}

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.section
            className="reading-stage intro-stage"
            key="intro"
            {...stageMotion}
          >
            <div className="stage-copy">
              <h1>
                <KineticText text={system.name} />
              </h1>
              <Button
                className="primary-action"
                onClick={() => move('frame')}
                aria-label={`Begin ${system.name} reading`}
              >
                <ArrowRight />
              </Button>
            </div>
          </motion.section>
        )}

        {stage === 'frame' && (
          <motion.section
            className="reading-stage centered-stage ask-stage"
            key="frame"
            {...stageMotion}
          >
            <label className="sr-only" htmlFor="question">
              Optional private question
            </label>
            <Input
              id="question"
              className="question-input"
              maxLength={180}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing)
                  continueFromFrame();
              }}
              placeholder="Ask, if you want."
            />
            <Button
              className="ask-submit"
              onClick={continueFromFrame}
              aria-label="Continue"
            >
              <ArrowRight />
            </Button>
          </motion.section>
        )}

        {stage === 'method' && (
          <motion.section
            className="reading-stage method-stage"
            key="method"
            {...stageMotion}
          >
            <div className="spread-list">
              {system.spreads.map((item) => (
                <motion.button
                  type="button"
                  key={item.id}
                  className={spread?.id === item.id ? 'selected' : ''}
                  aria-pressed={spread?.id === item.id}
                  onClick={() => {
                    setSpread(item);
                    cue('turn');
                  }}
                  whileHover={{ x: 8 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <strong>{item.name}</strong>
                  <ArrowRight aria-hidden="true" />
                </motion.button>
              ))}
            </div>
            <div className="method-footer">
              {system.reversalStyle && (
                <label className="reversal-toggle">
                  <input
                    type="checkbox"
                    checked={reversals}
                    disabled={system.reversalStyle === 'required'}
                    onChange={(event) => setReversals(event.target.checked)}
                  />
                  <span>
                    Reversals
                    {system.reversalStyle === 'required' ? ' · intrinsic' : ''}
                  </span>
                </label>
              )}
              <Button
                className="primary-action"
                onClick={continueFromMethod}
                aria-label="Continue to the deck"
              >
                <ArrowRight />
              </Button>
            </div>
          </motion.section>
        )}

        {stage === 'ritual' &&
          system.kind === 'cards' &&
          ritualSystemSlug &&
          cardRitual &&
          spread && (
            <motion.section
              className="reading-stage ritual-stage"
              key="ritual-cards"
              {...stageMotion}
            >
              <SystemRitual
                profile={cardRitual}
                systemSlug={ritualSystemSlug}
                spreadCount={spread.positions.length}
                step={Math.min(cardRitualStep, cardRitual.actions.length - 1)}
                disabled={cardRitualAnimating}
                dealing={cardRitualDealing}
                ritualValues={ramlLines}
                gestureProgress={cardGestureProgress}
                onGestureProgress={setCardGestureProgress}
                onAdvance={advanceCardRitual}
              />
            </motion.section>
          )}

        {stage === 'ritual' && system.kind === 'ball' && (
          <motion.section
            className="reading-stage ritual-stage"
            key="ritual-ball"
            {...stageMotion}
          >
            {enhancedObjects ? (
              <Suspense fallback={<span className="object-webgl-fallback" />}>
                <MagicEightBall3D
                  answer={objectMessage}
                  step={objectStep}
                  disabled={objectAnimating}
                  onAdvance={advanceObjectRitual}
                  ariaLabel={
                    objectStep === 0
                      ? 'Rotate the ball or press for the first shake'
                      : objectStep === 1
                        ? 'Rotate the ball or press for the second shake'
                        : 'Rotate the ball or press for the final shake'
                  }
                />
              </Suspense>
            ) : (
              <LightweightObject
                kind="ball"
                answer={objectMessage}
                step={objectStep}
                disabled={objectAnimating}
                onAdvance={advanceObjectRitual}
                ariaLabel={
                  objectStep === 0
                    ? 'Press for the first shake'
                    : objectStep === 1
                      ? 'Press for the second shake'
                      : 'Press for the final shake'
                }
              />
            )}
            <div className="system-ritual-caption object-ritual-caption">
              <span>A liquid answer chamber</span>
              <strong>
                {objectStep === 0
                  ? 'Shake'
                  : objectStep === 1
                    ? 'Shake again'
                    : 'Final shake'}
              </strong>
              <p>Move the ball or press to perform the shake.</p>
              <div className="system-ritual-progress" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <i
                    key={index}
                    className={
                      index < objectStep
                        ? 'is-complete'
                        : index === objectStep
                          ? 'is-current'
                          : ''
                    }
                  />
                ))}
              </div>
            </div>
            {motionSupported && (
              <button
                type="button"
                className="field-shortcut sr-only"
                onClick={() => void enableDeviceMotion()}
                disabled={objectAnimating}
              >
                {motionEnabled ? 'Device motion enabled' : 'Use device motion'}
              </button>
            )}
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'cookie' && (
          <motion.section
            className="reading-stage ritual-stage"
            key="ritual-cookie"
            {...stageMotion}
          >
            <>
              <div
                className={`cookie-object object-step-${objectStep} ${objectStep >= COOKIE_RITUAL_STEPS ? 'is-cracking is-unfurling' : ''} ${objectAnimating ? 'is-moving' : ''}`}
                style={
                  {
                    '--cookie-gesture': cookieGestureProgress,
                    '--cookie-pull': `${cookieGestureProgress * 120}px`,
                  } as React.CSSProperties
                }
              >
                {enhancedObjects ? (
                  <Suspense
                    fallback={<span className="cookie-webgl-fallback" />}
                  >
                    <FortuneCookie3D
                      step={objectStep}
                      disabled={objectAnimating}
                      onAdvance={advanceObjectRitual}
                      onGestureProgress={setCookieGestureProgress}
                      gestureProgress={cookieGestureProgress}
                      ariaLabel={
                        objectStep === 0
                          ? 'Bend the cookie apart or press to begin cracking it'
                          : 'Break the cookie open and unfurl the fortune'
                      }
                    />
                  </Suspense>
                ) : (
                  <LightweightObject
                    kind="cookie"
                    answer={objectMessage}
                    step={objectStep}
                    disabled={objectAnimating}
                    onAdvance={advanceObjectRitual}
                    ariaLabel={
                      objectStep === 0
                        ? 'Press to begin cracking the cookie'
                        : 'Press to break the cookie open and unfurl the fortune'
                    }
                  />
                )}
                <span className="cookie-paper" aria-hidden="true">
                  <em>{objectMessage}</em>
                </span>
                <span className="cookie-crumbs" aria-hidden="true">
                  {cookieCrumbs.map((crumb, index) => (
                    <b
                      key={index}
                      style={
                        {
                          '--crumb-x': `${crumb.x}px`,
                          '--crumb-y': `${crumb.y}px`,
                          '--crumb-r': `${crumb.r}deg`,
                          '--crumb-index': index,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </span>
              </div>
              <div className="system-ritual-caption object-ritual-caption">
                <span>The chosen shell</span>
                <strong>
                  {objectStep === 0
                    ? 'Bend'
                    : objectStep === 1
                      ? 'Break'
                      : 'Unfurling'}
                </strong>
                <p>
                  {objectStep === 0
                    ? 'Move the two sides apart and let the fracture deepen.'
                    : objectStep === 1
                      ? 'Pull firmly enough for the shell to give way.'
                      : 'The fortune opens itself.'}
                </p>
                <div className="system-ritual-progress" aria-hidden="true">
                  {[0, 1].map((index) => (
                    <i
                      key={index}
                      className={
                        index < objectStep
                          ? 'is-complete'
                          : index === objectStep
                            ? 'is-current'
                            : ''
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          </motion.section>
        )}

        {stage === 'reveal' && spread && (
          <motion.section
            className="reading-stage reveal-stage"
            key="reveal"
            {...stageMotion}
          >
            {revealed.size < draws.length && (
              <button
                type="button"
                className="field-shortcut sr-only"
                onClick={revealAll}
                disabled={isRevealingAll}
              >
                {isRevealingAll
                  ? `Revealing ${revealed.size} of ${draws.length} cards`
                  : 'Reveal every card'}
              </button>
            )}
            <div
              className={`cards-layout spread-${spread.layout} count-${draws.length} ${draws.length > 10 ? 'many-cards' : ''}`}
            >
              {draws.map((draw, index) => (
                <CardFace
                  key={`${draw.card.id}-${index}`}
                  draw={draw}
                  systemSlug={visualSystemFor(draw)}
                  finish={finishFor(draw)}
                  index={index}
                  compact={draws.length > 10}
                  disabled={isRevealingAll}
                  revealed={revealed.has(index)}
                  onPeelStart={() => cue('peel')}
                  onReveal={() => revealCard(index)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {stage === 'result' && interpretation && record && (
          <motion.section
            className="reading-stage result-stage"
            key="result"
            {...stageMotion}
          >
            {isSharedView && (
              <motion.aside
                className="shared-reading-arrival"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6 }}
              >
                <div>
                  <span>Shared with you</span>
                  <time dateTime={record.createdAt}>
                    {new Date(record.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>
                <p>
                  {record.systemName} · {record.spreadName}
                </p>
                {record.question && (
                  <blockquote>“{record.question}”</blockquote>
                )}
              </motion.aside>
            )}
            <header
              className={`result-hero ${openingDraw ? 'has-opening-card' : 'object-only'}`}
            >
              <div className="result-hero-copy">
                <h1>
                  <KineticText text={interpretation.headline} />
                </h1>
                {openingDraw ? (
                  <motion.a
                    href="#full-reading"
                    className="result-scroll-cue"
                    aria-label="Go to the full reading"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <ArrowDown />
                  </motion.a>
                ) : (
                  <motion.p
                    className="result-overview"
                    initial={{ opacity: 0, clipPath: 'inset(0 0 100%)' }}
                    animate={{ opacity: 1, clipPath: 'inset(0)' }}
                    transition={{
                      duration: 0.8,
                      delay: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {resultOverview}
                  </motion.p>
                )}
              </div>
              {openingDraw && (
                <motion.div
                  className="result-opening-card"
                  initial={{ opacity: 0, y: 120, rotateZ: 7, scale: 0.78 }}
                  animate={{ opacity: 1, y: 0, rotateZ: -1.4, scale: 1 }}
                  transition={{
                    duration: 0.92,
                    delay: 0.22,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <InteractiveResultCard
                    draw={openingDraw}
                    systemSlug={visualSystemFor(openingDraw)}
                    finish={finishFor(openingDraw)}
                    opening
                    onTurn={() => cue('turn')}
                  />
                </motion.div>
              )}
            </header>
            {system.kind !== 'cards' && luckyNumbers.length > 0 && (
              <div className={`object-result ${system.kind}`}>
                <small>Lucky numbers · {luckyNumbers.join(' · ')}</small>
              </div>
            )}
            {interpretation.connections &&
              interpretation.connections.length > 0 && (
                <section
                  className="result-connections"
                  aria-labelledby="connections-title"
                >
                  <header>
                    <p className="eyebrow">Every deck in conversation</p>
                    <h2 id="connections-title">The cross-deck thread</h2>
                    <p>
                      Follow the handoff from one tradition to the next. Every
                      card changes what the one before it can mean.
                    </p>
                  </header>
                  <ol>
                    {interpretation.connections.map((connection, index) => (
                      <li key={`${connection.from}-${connection.to}`}>
                        <span>{`${index + 1}`.padStart(2, '0')}</span>
                        <div>
                          <strong>{connection.from}</strong>
                          <ArrowRight aria-hidden="true" />
                          <strong>{connection.to}</strong>
                        </div>
                        <p>{connection.text}.</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            {draws.length > 0 && (
              <details id="full-reading" className="result-reading">
                <summary className="result-reading-summary">
                  <span>The reading in full</span>
                  <span>
                    Read every card
                    <ChevronDown aria-hidden="true" />
                  </span>
                </summary>
                <div className="result-reading-content">
                  <header className="result-reading-intro">
                    <p>{resultOverview}</p>
                  </header>
                  <div
                    id="result-cards"
                    className="result-card-list"
                    aria-label="Cards in this reading"
                  >
                    {draws.map((draw, index) => {
                      const position = interpretation.positions[index];
                      const orientationMeaning =
                        draw.reversed && draw.card.reversedMeaning
                          ? draw.card.reversedMeaning
                          : draw.card.meaning;
                      const focusMeaning = draw.card.focusModifiers?.[focus];
                      const facts = cardFacts(draw.card);

                      return (
                        <motion.article
                          className="result-card-detail"
                          key={`${draw.card.id}-${index}`}
                          initial={{ opacity: 0, y: 72 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.18 }}
                          transition={{
                            duration: 0.68,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <InteractiveResultCard
                            draw={draw}
                            systemSlug={visualSystemFor(draw)}
                            finish={finishFor(draw)}
                            onTurn={() => cue('turn')}
                          />
                          <div className="result-card-copy">
                            <p className="eyebrow">
                              {`${index + 1}`.padStart(2, '0')} /{' '}
                              {draw.card.sourceSystemName
                                ? `${draw.card.sourceSystemName} · ${draw.position}`
                                : draw.position}
                            </p>
                            <h2>
                              <KineticText text={draw.card.name} />
                            </h2>
                            <p className="result-position-meaning">
                              {position?.text ?? orientationMeaning}
                            </p>
                            <div className="result-meaning-grid">
                              <div>
                                <small>
                                  {draw.reversed ? 'Reversed' : 'Upright'}
                                </small>
                                <p>{orientationMeaning}</p>
                              </div>
                              {focusMeaning && (
                                <div>
                                  <small>{focus}</small>
                                  <p>{focusMeaning}</p>
                                </div>
                              )}
                            </div>
                            <div
                              className="result-keywords"
                              aria-label="Keywords"
                            >
                              {draw.card.keywords.map((keyword) => (
                                <span key={keyword}>{keyword}</span>
                              ))}
                            </div>
                            {facts.length > 0 && (
                              <dl className="result-card-facts">
                                {facts.map(([label, value]) => (
                                  <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{value}</dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                            {draw.card.provenance && (
                              <p className="result-card-provenance">
                                {draw.card.provenance}
                              </p>
                            )}
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </div>
              </details>
            )}
            {draws.length > 1 && (
              <section
                className="result-synthesis"
                aria-labelledby="synthesis-title"
              >
                <p className="eyebrow">How the cards connect</p>
                <h2 id="synthesis-title">The pattern</h2>
                <p>{interpretation.synthesis}</p>
                <p className="result-closing">{interpretation.closing}</p>
              </section>
            )}
            {interpretation.reflectionPrompt && (
              <p className="result-prompt">{interpretation.reflectionPrompt}</p>
            )}
            <ReadingShare
              record={{ ...record, note, favorite }}
              includeQuestion={includeQuestion}
              onIncludeQuestionChange={setIncludeQuestion}
              onImageExport={() => void shareImage()}
              imageStatus={shareStatus}
              onAnnounce={setAnnouncement}
            />
            <details className="reflection-drawer">
              <summary>
                Keep this reading <ArrowRight />
              </summary>
              <div className="journal-compose">
                <label htmlFor="note">Your reflection</label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="What stayed with you?"
                />
                {storageError && (
                  <output className="error-note">
                    The private journal is unavailable. You can still download
                    this reading.
                  </output>
                )}
                <div className="result-actions">
                  <Button
                    className={`quiet-action ${favorite ? 'is-active' : ''}`}
                    onClick={() => {
                      setFavorite((value) => !value);
                      setSaved(false);
                    }}
                  >
                    <Heart fill={favorite ? 'currentColor' : 'none'} /> Favorite
                  </Button>
                  <Button
                    className="primary-action"
                    onClick={() => void save()}
                  >
                    {saved ? <Check /> : <BookMarked />}
                    {saved ? 'Saved' : 'Save to journal'}
                  </Button>
                </div>
              </div>
            </details>
            <div className="reading-again">
              <Button className="quiet-action" onClick={restart}>
                <RotateCcw /> Again
              </Button>
              <Link href="/#readings">
                Another reading <ArrowRight />
              </Link>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <div className="sr-only" aria-live="polite">
        {stage === 'result' && interpretation
          ? `Reading complete. ${interpretation.headline}`
          : announcement}
      </div>
    </main>
  );
}

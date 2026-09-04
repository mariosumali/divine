'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate as motionAnimate,
  motion,
  useMotionValue,
  useTransform,
} from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  BookMarked,
  Check,
  ChevronDown,
  ChevronLeft,
  Heart,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import Image from '@/components/divine/responsive-image';
import Link from 'next/link';
// import { SystemRitual } from '@/components/divine/system-ritual';
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
import { READING_INDEX_ART } from '@/lib/divine/catalog';
import { composeShare, decodeReadingShareToken } from '@/lib/divine/share';
import { saveReading } from '@/lib/divine/storage';
import {
  optimizedImageSource,
  prewarmResponsiveImages,
} from '@/lib/divine/responsive-images';
import {
  createCustomSpread,
  loadCustomSpreads,
  storeCustomSpreads,
  validateCustomSpread,
  type CustomSpread,
  type CustomSpreadLayout,
} from '@/lib/divine/custom-spreads';
import type {
  DrawnCard,
  Focus,
  InterpretationBlock,
  ReadingRecord,
  SpreadDefinition,
  SystemDefinition,
} from '@/lib/divine/types';

// 3D ritual objects are temporarily benched in favor of the site's 2D artwork.
// Keep their component files and models in place so they can be restored later.

type Stage = 'frame' | 'method' | 'ritual' | 'reveal' | 'result';
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
  version: 1 | 2 | 3 | 4 | 5;
  system: string;
  stage: Stage | 'intro';
  question: string;
  focus: Focus;
  spreadId: string | null;
  customSpread?: SpreadDefinition | null;
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
  'frame',
  'method',
  'ritual',
  'reveal',
  'result',
];
const stageLabels: Record<Stage, string> = {
  frame: 'Your question',
  method: 'Choose a spread',
  ritual: 'Prepare the reading',
  reveal: 'Reveal the cards',
  result: 'Your reading',
};
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

function loadShareImage(
  source?: string,
  requestedWidth = 768,
): Promise<HTMLImageElement | null> {
  if (!source) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new window.Image();
    let settled = false;
    const finish = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(null), 5000);
    image.decoding = 'async';
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    image.src = optimizedImageSource(source, requestedWidth);
    if (image.complete && image.naturalWidth > 0) finish(image);
  });
}

function canvasTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/u)) {
    const candidate = `${line} ${word}`.trim();
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = candidate;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  const represented = lines.join(' ').length;
  if (represented < text.trim().length && lines.length) {
    let last = lines.at(-1) ?? '';
    while (last && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

function drawShareImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  reversed = false,
) {
  const scale = Math.min(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.save();
  ctx.filter = 'grayscale(1) contrast(1.04)';
  if (reversed) {
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight,
    );
  } else {
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }
  ctx.restore();
}

function shareArtworkSize(
  image: HTMLImageElement | null,
  fallbackRatio: number,
  maxWidth: number,
  maxHeight: number,
) {
  const naturalRatio = image
    ? image.naturalWidth / image.naturalHeight
    : fallbackRatio;
  const ratio =
    Number.isFinite(naturalRatio) && naturalRatio > 0 ? naturalRatio : 2 / 3;
  const width = Math.min(maxWidth, maxHeight * ratio);
  return { width, height: width / ratio };
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
  const [methodImage, ...cardImages] = await Promise.all([
    loadShareImage(composition.methodArt, 640),
    ...composition.cards.map((card) => loadShareImage(card.image)),
  ]);

  ctx.fillStyle = '#efede5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(5,5,5,.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, 1132, 1432);
  ctx.strokeRect(52, 52, 1096, 1396);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#050505';
  ctx.font = '500 28px "Bodoni Moda", Georgia, serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(composition.title, 80, 112);
  ctx.textAlign = 'right';
  ctx.font = '12px Arial, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillStyle = 'rgba(5,5,5,.58)';
  ctx.fillText(
    new Date(composition.date)
      .toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase(),
    1120,
    110,
  );
  ctx.beginPath();
  ctx.moveTo(80, 140);
  ctx.lineTo(1120, 140);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '12px Arial, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(composition.subtitle.toUpperCase(), 80, 210);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#050505';
  ctx.font = '500 72px "Bodoni Moda", Georgia, serif';
  const headlineLines = canvasTextLines(
    ctx,
    composition.displayHeadline,
    750,
    3,
  );
  headlineLines.forEach((value, index) =>
    ctx.fillText(value, 80, 290 + index * 76),
  );

  if (methodImage) {
    drawShareImage(ctx, methodImage, 830, 158, 280, 280);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(5,5,5,.58)';
  ctx.font = '10px Arial, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(record.systemName.toUpperCase(), 970, 456);
  ctx.letterSpacing = '0px';

  let contentStart = Math.max(500, 316 + headlineLines.length * 76);
  if (composition.question) {
    ctx.strokeStyle = 'rgba(5,5,5,.18)';
    ctx.strokeRect(80, contentStart, 1040, 76);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#050505';
    ctx.font = 'italic 24px "Bodoni Moda", Georgia, serif';
    const question = canvasTextLines(ctx, `“${composition.question}”`, 960, 2);
    question.forEach((value, index) =>
      ctx.fillText(value, 600, contentStart + 32 + index * 26),
    );
    contentStart += 112;
  }

  if (composition.cards.length) {
    const preview = composition.cards;
    const dense = preview.length > 10;
    const columns = Math.min(
      preview.length,
      preview.length <= 5
        ? preview.length
        : dense
          ? preview.length > 20
            ? 12
            : 8
          : 5,
    );
    const gap = dense ? 10 : 18;
    const maxCellWidth =
      preview.length === 1
        ? 560
        : preview.length <= 3
          ? 340
          : preview.length <= 5
            ? 230
            : 180;
    const width = Math.min(
      maxCellWidth,
      (1040 - gap * (columns - 1)) / columns,
    );
    const captionHeight = dense ? 0 : 62;
    const rowGap = dense ? 14 : 22;
    const rows = Math.ceil(preview.length / columns);
    const availableArtHeight =
      (1332 - contentStart - captionHeight * rows - rowGap * (rows - 1)) / rows;
    const idealArtHeight =
      preview.length === 1
        ? 620
        : preview.length <= 3
          ? 420
          : preview.length <= 10
            ? 290
            : 190;
    const artBoxHeight = Math.max(
      100,
      Math.min(idealArtHeight, availableArtHeight),
    );
    const cellHeight = artBoxHeight + captionHeight;
    const totalWidth = width * columns + gap * (columns - 1);
    ctx.beginPath();
    ctx.moveTo(80, contentStart - 20);
    ctx.lineTo(1120, contentStart - 20);
    ctx.strokeStyle = 'rgba(5,5,5,.22)';
    ctx.stroke();
    preview.forEach((draw, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cellX = (canvas.width - totalWidth) / 2 + column * (width + gap);
      const rowY = contentStart + row * (cellHeight + rowGap);
      const image = cardImages[index];
      const artwork = shareArtworkSize(
        image,
        record.draws[index]?.card.aspectRatio ?? 2 / 3,
        width,
        artBoxHeight,
      );
      const x = cellX + (width - artwork.width) / 2;
      const y = rowY + (artBoxHeight - artwork.height) / 2;
      ctx.fillStyle = '#dedbd2';
      ctx.fillRect(x, y, artwork.width, artwork.height);
      ctx.strokeStyle = 'rgba(5,5,5,.28)';
      ctx.strokeRect(x, y, artwork.width, artwork.height);
      if (image) {
        drawShareImage(
          ctx,
          image,
          x + 4,
          y + 4,
          artwork.width - 8,
          artwork.height - 8,
          draw.reversed,
        );
      } else {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#050505';
        ctx.font = `400 ${dense ? 32 : 48}px "Bodoni Moda", Georgia, serif`;
        ctx.fillText(
          draw.glyph,
          x + artwork.width / 2,
          y + artwork.height / 2 + 14,
        );
      }
      ctx.fillStyle = 'rgba(239,237,229,.9)';
      ctx.fillRect(x + artwork.width - 28, y + artwork.height - 25, 24, 21);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#050505';
      ctx.font = '8px Arial, sans-serif';
      ctx.fillText(
        String(index + 1).padStart(2, '0'),
        x + artwork.width - 16,
        y + artwork.height - 11,
      );
      if (!dense) {
        ctx.fillStyle = 'rgba(5,5,5,.5)';
        ctx.font = '8px Arial, sans-serif';
        ctx.fillText(
          draw.position.toUpperCase().slice(0, 22),
          cellX + width / 2,
          rowY + artBoxHeight + 19,
        );
        ctx.fillStyle = '#050505';
        ctx.font = '500 13px "Bodoni Moda", Georgia, serif';
        const label = `${draw.name}${draw.reversed ? ' · R' : ''}`;
        ctx.fillText(
          label.slice(0, 25),
          cellX + width / 2,
          rowY + artBoxHeight + 42,
        );
      }
    });
    contentStart += rows * (cellHeight + rowGap) + 8;
  } else {
    ctx.beginPath();
    ctx.moveTo(80, contentStart - 20);
    ctx.lineTo(1120, contentStart - 20);
    ctx.strokeStyle = 'rgba(5,5,5,.22)';
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(5,5,5,.5)';
    ctx.font = '10px Arial, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('THE ANSWER', 600, contentStart + 58);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = '#050505';
    ctx.font = '500 74px "Bodoni Moda", Georgia, serif';
    const answerLines = canvasTextLines(ctx, composition.headline, 880, 4);
    answerLines.forEach((value, index) =>
      ctx.fillText(value, 600, contentStart + 150 + index * 78),
    );
    if (record.luckyNumbers?.length) {
      ctx.font = '15px Arial, sans-serif';
      ctx.letterSpacing = '7px';
      ctx.fillText(record.luckyNumbers.join(' · '), 600, contentStart + 500);
      ctx.letterSpacing = '0px';
    }
  }

  ctx.beginPath();
  ctx.moveTo(80, 1370);
  ctx.lineTo(1120, 1370);
  ctx.strokeStyle = 'rgba(5,5,5,.22)';
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(5,5,5,.58)';
  ctx.font = '10px Arial, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(`${composition.focus.toUpperCase()} FOCUS`, 80, 1412);
  ctx.textAlign = 'right';
  ctx.fillText(
    composition.cards.length
      ? `${composition.cards.length} ${composition.cards.length === 1 ? 'CARD' : 'CARDS'} DRAWN`
      : record.systemName.toUpperCase(),
    1120,
    1412,
  );
  ctx.letterSpacing = '0px';

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('Unable to render share image');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `divine-${record.system}-${record.id}.png`;
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
      <div
        className="reading-progress"
        aria-hidden="true"
        style={{
          gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`,
        }}
      >
        {stages.map((item, index) => (
          <span key={item} className={index <= current ? 'active' : ''} />
        ))}
      </div>
      <progress
        className="sr-only"
        aria-label="Reading progress"
        max={stages.length}
        value={current + 1}
        aria-valuetext={`Step ${current + 1} of ${stages.length}: ${stageLabels[stage]}`}
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
  imageSizes,
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
  imageSizes: string;
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
                sizes={imageSizes}
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
                priority={opening}
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

export function ReadingExperience({
  system,
  startWithOpening = false,
}: {
  system: SystemDefinition;
  startWithOpening?: boolean;
}) {
  const { cue, deckFinishes } = useExperience();
  const [stage, setStage] = useState<Stage>('frame');
  const [showOpening, setShowOpening] = useState(startWithOpening);
  const [question, setQuestion] = useState('');
  const [focus, setFocus] = useState<Focus>('general');
  const [spread, setSpread] = useState<SpreadDefinition | null>(
    system.spreads[0] ?? null,
  );
  const [customSpreads, setCustomSpreads] = useState<CustomSpread[]>([]);
  const [customSpreadsReady, setCustomSpreadsReady] = useState(
    system.kind !== 'cards',
  );
  const [showSpreadBuilder, setShowSpreadBuilder] = useState(false);
  const [editingSpreadId, setEditingSpreadId] = useState<string | null>(null);
  const [spreadName, setSpreadName] = useState('');
  const [spreadLayout, setSpreadLayout] = useState<CustomSpreadLayout>('line');
  const [spreadPositions, setSpreadPositions] = useState(['']);
  const [spreadBuilderError, setSpreadBuilderError] = useState('');
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
  const [, setCardRitualAnimating] = useState(false);
  const [cardRitualDealing, setCardRitualDealing] = useState(false);
  const [, setCardGestureProgress] = useState(0);
  const [ramlLines, setRamlLines] = useState<number[]>([]);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [isSharedView, setIsSharedView] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const motionHandler = useRef<((event: DeviceMotionEvent) => void) | null>(
    null,
  );
  const customSpreadsRef = useRef<CustomSpread[]>([]);
  const ritualLock = useRef(false);
  const completionQueued = useRef(false);
  const revealTimers = useRef<number[]>([]);
  const objectTimer = useRef<number | null>(null);
  const deckTimer = useRef<number | null>(null);
  const sessionKey = `divine-session:${system.slug}`;
  const objectRitualSteps =
    system.kind === 'cookie' ? COOKIE_RITUAL_STEPS : OBJECT_RITUAL_STEPS;
  const readingAmbienceActive = sessionReady;

  useEffect(() => {
    if (system.kind !== 'cards') return;
    let loaded: CustomSpread[] = [];
    let failed = false;
    try {
      loaded = loadCustomSpreads().filter(
        (item) => item.system === system.slug,
      );
      customSpreadsRef.current = loaded;
    } catch {
      failed = true;
    }
    queueMicrotask(() => {
      setCustomSpreads(loaded);
      if (failed) setStorageError(true);
      setCustomSpreadsReady(true);
    });
  }, [system.kind, system.slug]);

  useEffect(() => {
    setReadingAmbience(readingAmbienceActive);
    return () => setReadingAmbience(false);
  }, [readingAmbienceActive]);

  useEffect(() => {
    if (!startWithOpening) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('opening');
    window.history.replaceState(
      null,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [startWithOpening]);

  useEffect(() => {
    queueMicrotask(() => {
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
    if (!customSpreadsReady) return;
    let cancelled = false;
    let restored: StoredReadingSession | null = null;
    let sharedReading: ReturnType<typeof decodeReadingShareToken> = null;
    try {
      const url = new URL(window.location.href);
      // Query parameters make new links visible to social preview crawlers.
      // Continue accepting fragment links that were shared by older versions.
      const token =
        url.searchParams.get('reading') ??
        new URLSearchParams(url.hash.slice(1)).get('reading');
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
          restored?.version === 4 ||
          restored?.version === 5) &&
        restored.system === system.slug
      ) {
        const savedCustomSpread = customSpreadsRef.current.find(
          (item) => item.id === restored.spreadId,
        );
        const sessionCustomSpread =
          restored.customSpread?.id === restored.spreadId &&
          restored.customSpread.id.startsWith('custom:') &&
          restored.customSpread.positions.length >= 1 &&
          restored.customSpread.positions.length <= 10
            ? restored.customSpread
            : null;
        const restoredSpread =
          system.spreads.find((item) => item.id === restored.spreadId) ??
          savedCustomSpread ??
          sessionCustomSpread ??
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
        const candidateStage: Stage =
          restored.stage !== 'intro' && readingStages.includes(restored.stage)
            ? restored.stage
            : 'frame';
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
        setAnnouncement('Your unfinished reading has been restored.');
      }
      setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [customSpreadsReady, objectRitualSteps, sessionKey, system]);

  useEffect(() => {
    if (!sessionReady) return;
    const session: StoredReadingSession = {
      version: 5,
      system: system.slug,
      stage,
      question,
      focus,
      spreadId: spread?.id ?? null,
      customSpread: spread?.id.startsWith('custom:') ? spread : null,
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

  useEffect(() => {
    if (
      CARD_UNWRAPPING_ENABLED ||
      !sessionReady ||
      system.kind !== 'cards' ||
      stage !== 'ritual'
    )
      return;
    queueMicrotask(() => setStage(draws.length ? 'reveal' : 'method'));
  }, [draws.length, sessionReady, stage, system.kind]);

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
  const openingDraw = draws[0] ?? null;
  const visualSystemFor = (draw: DrawnCard) =>
    draw.card.sourceSystem ?? system.slug;
  const finishFor = (draw: DrawnCard): DeckFinish => {
    const sourceSystem = visualSystemFor(draw);
    return isCardSystemSlug(sourceSystem)
      ? deckFinishes[sourceSystem]
      : deckFinish;
  };
  const revealImageSizes = spread
    ? spread.layout === 'single'
      ? '(max-width: 720px) 62vw, 330px'
      : spread.layout === 'tableau'
        ? '(max-width: 720px) 16vw, 84px'
        : spread.layout === 'grid'
          ? '(max-width: 720px) 31vw, 140px'
          : spread.layout === 'cross'
            ? '(max-width: 720px) 31vw, 180px'
            : '(max-width: 720px) 32vw, 250px'
    : '(max-width: 720px) 25vw, 18vw';

  const beginRecord = () => {
    const nextRecord = {
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    setRecordId(nextRecord.id);
    setCreatedAt(nextRecord.createdAt);
    return nextRecord;
  };

  const closeSpreadBuilder = () => {
    setShowSpreadBuilder(false);
    setEditingSpreadId(null);
    setSpreadName('');
    setSpreadLayout('line');
    setSpreadPositions(['']);
    setSpreadBuilderError('');
  };

  const editCustomSpread = (item: CustomSpread) => {
    setEditingSpreadId(item.id);
    setSpreadName(item.name);
    setSpreadLayout(item.layout);
    setSpreadPositions([...item.positions]);
    setSpreadBuilderError('');
    setShowSpreadBuilder(true);
  };

  const persistSystemSpreads = (next: CustomSpread[]) => {
    const otherSystems = loadCustomSpreads().filter(
      (item) => item.system !== system.slug,
    );
    storeCustomSpreads([...otherSystems, ...next]);
    customSpreadsRef.current = next;
    setCustomSpreads(next);
  };

  const saveCustomSpread = () => {
    const input = {
      id: editingSpreadId ?? undefined,
      name: spreadName,
      positions: spreadPositions,
      layout: spreadLayout,
    };
    const errors = validateCustomSpread(input);
    if (errors.length) {
      setSpreadBuilderError(errors[0]);
      return;
    }
    try {
      const existing = customSpreads.find(
        (item) => item.id === editingSpreadId,
      );
      const created = createCustomSpread(system.slug, input);
      const nextSpread = existing
        ? { ...created, createdAt: existing.createdAt }
        : created;
      const next = existing
        ? customSpreads.map((item) =>
            item.id === existing.id ? nextSpread : item,
          )
        : [...customSpreads, nextSpread];
      persistSystemSpreads(next);
      setSpread(nextSpread);
      closeSpreadBuilder();
      cue('turn');
    } catch {
      setSpreadBuilderError('This spread could not be saved.');
    }
  };

  const deleteCustomSpread = (item: CustomSpread) => {
    try {
      const next = customSpreads.filter(
        (spreadItem) => spreadItem.id !== item.id,
      );
      persistSystemSpreads(next);
      if (spread?.id === item.id) setSpread(system.spreads[0] ?? null);
      if (editingSpreadId === item.id) closeSpreadBuilder();
      cue('tick');
    } catch {
      setStorageError(true);
    }
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
    prewarmResponsiveImages(
      next.map((draw) => imageForFinish(draw.card, finishFor(draw))),
      next.length <= 3 ? 768 : next.length > 10 ? 192 : 384,
    );
    completionQueued.current = false;
    ritualLock.current = false;
    setDraws(next);
    setRevealed(new Set());
    setCardRitualAnimating(false);
    setCardRitualDealing(true);
    setAnnouncement(
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
    // move('ritual'); // Card unwrapping is temporarily disabled.
    cue('tick');
    setShuffled(true);
    deal(0);
  };

  /* Card-unwrapping interaction temporarily disabled.
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
  */

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
        {showOpening && (
          <div className="reading-route-transition" aria-hidden="true">
            <div className="route-transition-panels">
              {Array.from({ length: 6 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <div className="route-transition-object">
              <Image
                src={READING_INDEX_ART[system.slug]}
                alt=""
                fill
                sizes="380px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <div className="route-transition-copy">
              <strong>{system.name}</strong>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className={`reading-shell stage-${stage}`}>
      {stage !== 'ritual' && stage !== 'reveal' && (
        <>
          <Progress stage={stage} systemKind={system.kind} />
          {stage !== 'result' && stage !== 'frame' && (
            <button type="button" className="stage-back" onClick={goBack}>
              <ChevronLeft /> Back
            </button>
          )}
        </>
      )}
      {(stage === 'ritual' || stage === 'reveal') && (
        <button type="button" className="field-exit sr-only" onClick={goBack}>
          <ChevronLeft /> Back to reading options
        </button>
      )}

      <AnimatePresence mode="wait">
        {stage === 'frame' && (
          <motion.section
            className="reading-stage centered-stage ask-stage"
            key="frame"
            {...stageMotion}
          >
            <label className="sr-only" htmlFor="question">
              Optional question
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
              className="primary-action ask-submit"
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
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </motion.button>
              ))}
            </div>
            <section
              className="custom-spreads"
              aria-labelledby="custom-spreads-heading"
            >
              <div className="custom-spreads-heading">
                <div>
                  <h3 id="custom-spreads-heading">Your spreads</h3>
                </div>
                <button
                  type="button"
                  className="custom-spread-add"
                  onClick={() => {
                    if (showSpreadBuilder) closeSpreadBuilder();
                    else setShowSpreadBuilder(true);
                  }}
                >
                  <Plus aria-hidden="true" />
                  {showSpreadBuilder ? 'Cancel' : 'New spread'}
                </button>
              </div>

              {customSpreads.length > 0 && (
                <div className="custom-spread-list">
                  {customSpreads.map((item) => (
                    <div
                      className={spread?.id === item.id ? 'selected' : ''}
                      key={item.id}
                    >
                      <button
                        type="button"
                        className="custom-spread-select"
                        aria-pressed={spread?.id === item.id}
                        onClick={() => {
                          setSpread(item);
                          cue('turn');
                        }}
                      >
                        <strong>{item.name}</strong>
                        <small>{item.positions.join(' · ')}</small>
                      </button>
                      <button
                        type="button"
                        className="custom-spread-icon"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => editCustomSpread(item)}
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="custom-spread-icon"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => deleteCustomSpread(item)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showSpreadBuilder && (
                <div className="custom-spread-builder">
                  <label htmlFor="custom-spread-name">
                    <span>Spread name</span>
                    <Input
                      id="custom-spread-name"
                      value={spreadName}
                      maxLength={80}
                      onChange={(event) => setSpreadName(event.target.value)}
                      placeholder="A turning point"
                    />
                  </label>
                  <div className="custom-spread-fields">
                    <label htmlFor="custom-spread-card-count">
                      <span>Cards</span>
                      <select
                        id="custom-spread-card-count"
                        value={spreadPositions.length}
                        onChange={(event) => {
                          const count = Number(event.target.value);
                          setSpreadPositions((current) =>
                            Array.from(
                              { length: count },
                              (_, index) => current[index] ?? '',
                            ),
                          );
                        }}
                      >
                        {Array.from({ length: 10 }, (_, index) => (
                          <option value={index + 1} key={index + 1}>
                            {index + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label htmlFor="custom-spread-layout">
                      <span>Layout</span>
                      <select
                        id="custom-spread-layout"
                        value={
                          spreadPositions.length === 1 ? 'single' : spreadLayout
                        }
                        disabled={spreadPositions.length === 1}
                        onChange={(event) =>
                          setSpreadLayout(
                            event.target.value as CustomSpreadLayout,
                          )
                        }
                      >
                        <option value="single">Single</option>
                        <option value="line">Line</option>
                        <option value="cross">Cross</option>
                        <option value="grid">Grid</option>
                        <option value="tableau">Tableau</option>
                      </select>
                    </label>
                  </div>
                  <fieldset>
                    <legend>Position names</legend>
                    {spreadPositions.map((position, index) => (
                      <label
                        htmlFor={`custom-spread-position-${index}`}
                        key={index}
                      >
                        <span>{index + 1}</span>
                        <Input
                          id={`custom-spread-position-${index}`}
                          value={position}
                          maxLength={80}
                          onChange={(event) =>
                            setSpreadPositions((current) =>
                              current.map((value, positionIndex) =>
                                positionIndex === index
                                  ? event.target.value
                                  : value,
                              ),
                            )
                          }
                          placeholder={
                            index === 0
                              ? 'What is present'
                              : `Position ${index + 1}`
                          }
                        />
                      </label>
                    ))}
                  </fieldset>
                  {spreadBuilderError && (
                    <p className="custom-spread-error" role="alert">
                      {spreadBuilderError}
                    </p>
                  )}
                  <Button type="button" onClick={saveCustomSpread}>
                    {editingSpreadId ? 'Save changes' : 'Save spread'}
                  </Button>
                </div>
              )}
            </section>
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
                    {system.reversalStyle === 'required'
                      ? 'Reversed meanings are always included'
                      : 'Include reversed cards'}
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

        {/* Card-unwrapping UI temporarily disabled.
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
        */}

        {stage === 'ritual' && system.kind === 'ball' && (
          <motion.section
            className="reading-stage ritual-stage"
            key="ritual-ball"
            {...stageMotion}
          >
            {/* MagicEightBall3D is temporarily benched. */}
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
            <div className="system-ritual-caption object-ritual-caption">
              <span>A liquid answer chamber</span>
              <strong>
                {objectStep === 0
                  ? 'Shake'
                  : objectStep === 1
                    ? 'Shake again'
                    : 'Final shake'}
              </strong>
              <p>Press the ball to perform the shake.</p>
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
                {/* FortuneCookie3D is temporarily benched. */}
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
                    ? 'Press the cookie and let the fracture deepen.'
                    : objectStep === 1
                      ? 'Press again for the shell to give way.'
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
                  imageSizes={revealImageSizes}
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
                {!openingDraw && (
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
              {openingDraw && (
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
                      Compare each neighboring pair. These links suggest how one
                      tradition may clarify or challenge the next.
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
              <>
                <details id="full-reading" className="result-reading">
                  <summary className="result-reading-summary">
                    <span>The reading in full</span>
                    <span>
                      Read the overview
                      <ChevronDown aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="result-reading-content">
                    <header className="result-reading-intro">
                      <p>{resultOverview}</p>
                    </header>
                  </div>
                </details>
                <details className="result-cards-disclosure" open>
                  <summary className="result-reading-summary result-cards-summary">
                    <span>All card information</span>
                    <span>
                      <span className="result-cards-hide">Hide all cards</span>
                      <span className="result-cards-show">Show all cards</span>
                      <ChevronDown aria-hidden="true" />
                    </span>
                  </summary>
                  <div
                    id="result-cards"
                    className="result-card-list"
                    aria-label="Cards in this reading"
                  >
                    {draws.map((draw, index) => {
                      const position = interpretation.positions[index];
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
                              {position?.text ??
                                (draw.reversed && draw.card.reversedMeaning
                                  ? draw.card.reversedMeaning
                                  : draw.card.meaning)}
                            </p>
                            {focusMeaning && focus !== 'general' && (
                              <div className="result-meaning-grid">
                                <div>
                                  <small>{focus}</small>
                                  <p>{focusMeaning}</p>
                                </div>
                              </div>
                            )}
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
                </details>
              </>
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
                    The journal is unavailable. You can still download this
                    reading.
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
              <Button
                className="quiet-action icon-action"
                onClick={restart}
                aria-label="Start this reading again"
                title="Start this reading again"
              >
                <RotateCcw />
              </Button>
              <Link className="quiet-action" href="/#readings">
                Another reading <ArrowRight />
              </Link>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {showOpening && (
        <motion.div
          className="reading-route-transition route-transition-arrival"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{
            duration: 0.95,
            delay: 1.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={() => setShowOpening(false)}
        >
          <div className="route-transition-panels">
            {Array.from({ length: 6 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <div className="route-transition-object">
            <Image
              src={READING_INDEX_ART[system.slug]}
              alt=""
              fill
              sizes="380px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className="route-transition-copy">
            <strong>{system.name}</strong>
          </div>
        </motion.div>
      )}
      <div className="sr-only" aria-live="polite">
        {stage === 'result' && interpretation
          ? `Reading complete. ${interpretation.headline}`
          : announcement}
      </div>
    </main>
  );
}

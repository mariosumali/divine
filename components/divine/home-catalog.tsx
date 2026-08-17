'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { MotionStyle, MotionValue } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useExperience } from '@/app/providers';
import { CATALOG_SYSTEMS } from '@/lib/divine/catalog';
import archiveManifest from '@/public/collage-archive/manifest.json';

const INDEX_ART: Record<string, string> = {
  divine: '/hero/divine-crystal.webp',
  tarot: '/collage-v1/hand.webp',
  oracle: '/collage-v1/eye.webp',
  lenormand: '/collage-v1/key.webp',
  spellcraft: '/collage-v1/matches.webp',
  'ancient-egypt': '/collage-v1/bust.webp',
  zodiac: '/collage-v1/star.webp',
  kipper: '/collage-v1/envelope.webp',
  belline: '/collage-v1/prism.webp',
  'playing-card-cartomancy': '/collage-v1/domino.webp',
  sibilla: '/collage-v1/rose.webp',
  'runic-cards': '/collage-v1/crystal.webp',
  'i-ching-cards': '/collage-v1/compass.webp',
  'fal-e-hafez': '/collage-v1/pen.webp',
  hanafuda: '/collage-v1/peony.webp',
  zigeunerkarten: '/traditional-decks-v1/zigeunerkarten/zigeunerkarten-17.webp',
  'ilm-al-raml': '/traditional-decks-v1/ilm-al-raml/ilm-al-raml-16.webp',
  'magic-8-ball': '/index-art-v2/magic-8-ball.webp',
  'fortune-cookie': '/index-art/fortune-cookie.webp',
};

const ART_MOTIONS = [
  { angle: -2, x: 5, y: -7, duration: 6.8 },
  { angle: 1.4, x: -7, y: -5, duration: 8.2 },
  { angle: -1, x: 3, y: -9, duration: 7.4 },
  { angle: 1.7, x: -5, y: -6, duration: 9.1 },
  { angle: 1.2, x: 7, y: -4, duration: 7.8 },
  { angle: -1.4, x: -4, y: -8, duration: 8.7 },
  { angle: -1.2, x: 5, y: -6, duration: 7.1 },
  { angle: 1.4, x: -6, y: -4, duration: 9.4 },
  { angle: -1.7, x: 4, y: -8, duration: 8.4 },
  { angle: 0.9, x: -7, y: -6, duration: 7.6 },
  { angle: 1.8, x: 6, y: -5, duration: 9.2 },
  { angle: -1.1, x: -4, y: -9, duration: 7.3 },
  { angle: 1.3, x: 5, y: -7, duration: 8.9 },
  { angle: -1.6, x: -6, y: -5, duration: 7.9 },
  { angle: 0.8, x: 4, y: -8, duration: 9.5 },
  { angle: -1.2, x: -5, y: -6, duration: 8.1 },
] as const;
const HERO_LETTERS = 'DIVINE'.split('');
type HeroPlacement = {
  x: string;
  y: string;
  size: string;
  rotate: number;
};
type HeroSigilStyle = MotionStyle & Record<`--${string}`, string>;

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const ARCHIVE_HERO_OBJECTS = archiveManifest.map((asset, index) => {
  const desktopColumn = index % 11;
  const desktopRow = Math.floor(index / 11);
  const mobileColumn = index % 5;
  const mobileRow = Math.floor(index / 5);
  const seed = asset.objectID + index * 97;
  const jitterX = seededUnit(seed) - 0.5;
  const jitterY = seededUnit(seed + 1) - 0.5;
  const scale = seededUnit(seed + 2);
  const rotation = -44 + seededUnit(seed + 3) * 88;
  const isGiant = index % 20 === 0;
  const isLarge = !isGiant && (index % 9 === 0 || index % 13 === 0);
  const isSmall = !isGiant && !isLarge && index % 3 === 0;
  const desktopSize = isGiant
    ? `clamp(${118 + Math.round(scale * 32)}px, ${13 + scale * 3}vw, ${210 + Math.round(scale * 50)}px)`
    : isLarge
      ? `clamp(${72 + Math.round(scale * 22)}px, ${7.4 + scale * 2.4}vw, ${136 + Math.round(scale * 46)}px)`
      : isSmall
        ? `clamp(${22 + Math.round(scale * 12)}px, ${2 + scale * 1.8}vw, ${44 + Math.round(scale * 30)}px)`
        : `clamp(${42 + Math.round(scale * 18)}px, ${4.2 + scale * 2.4}vw, ${82 + Math.round(scale * 38)}px)`;
  const mobileSize = isGiant
    ? `${104 + Math.round(scale * 28)}px`
    : isLarge
      ? `${72 + Math.round(scale * 24)}px`
      : isSmall
        ? `${26 + Math.round(scale * 16)}px`
        : `${44 + Math.round(scale * 24)}px`;

  return {
    ...asset,
    placement: {
      x: `${desktopColumn * 9.6 - 3 + jitterX * 4}%`,
      y: `${desktopRow * 13.8 - 2 + jitterY * 5}%`,
      size: desktopSize,
      rotate: rotation,
    },
    mobilePlacement: {
      x: `${mobileColumn * 21 - 3 + jitterX * 5}%`,
      y: `${mobileRow * 6.25 - 1 + jitterY * 4}%`,
      size: mobileSize,
      rotate: rotation,
    },
    opacity: 0.42 + seededUnit(seed + 4) * 0.24,
  };
});

const HERO_OBJECTS = [
  {
    src: '/collage-v1/prism.webp',
    position: 'prism',
    layer: 'front',
    depth: 0.7,
    drift: [9, -14, 2.4, 8.4, -2.1],
    placement: {
      x: '2%',
      y: '4%',
      size: 'clamp(112px, 12vw, 210px)',
      rotate: -9,
    },
    mobilePlacement: { x: '-5%', y: '4%', size: '96px', rotate: -9 },
  },
  {
    src: '/collage-v1/hand.webp',
    position: 'hand',
    layer: 'front',
    depth: 1.05,
    drift: [-7, -18, -2.2, 9.6, -4.7],
    placement: {
      x: '82%',
      y: '-1%',
      size: 'clamp(142px, 15vw, 250px)',
      rotate: 8,
    },
    mobilePlacement: { x: '78%', y: '5%', size: '104px', rotate: 8 },
  },
  {
    src: '/collage-v1/peony.webp',
    position: 'peony',
    layer: 'front',
    depth: 0.9,
    drift: [12, -10, 1.8, 10.2, -6.3],
    placement: {
      x: '-4%',
      y: '65%',
      size: 'clamp(180px, 19vw, 310px)',
      rotate: -7,
    },
    mobilePlacement: { x: '-14%', y: '68%', size: '135px', rotate: -7 },
  },
  {
    src: '/collage-v1/key.webp',
    position: 'key',
    layer: 'front',
    depth: 1.3,
    drift: [-9, -16, -3.2, 7.9, -3.5],
    placement: {
      x: '91%',
      y: '69%',
      size: 'clamp(76px, 8vw, 132px)',
      rotate: 9,
    },
    mobilePlacement: { x: '84%', y: '72%', size: '82px', rotate: 9 },
  },
  {
    src: '/collage-v1/star.webp',
    position: 'star',
    layer: 'front',
    depth: 1.5,
    drift: [8, -20, 5.5, 6.9, -5.1],
    placement: {
      x: '14%',
      y: '79%',
      size: 'clamp(46px, 5vw, 82px)',
      rotate: 12,
    },
    mobilePlacement: { x: '72%', y: '84%', size: '52px', rotate: 12 },
  },
  {
    src: '/collage-v1/eye.webp',
    position: 'eye',
    layer: 'front',
    depth: 1.15,
    drift: [-10, -11, -3.6, 8.8, -1.8],
    placement: {
      x: '76%',
      y: '18%',
      size: 'clamp(72px, 8vw, 128px)',
      rotate: -8,
    },
    mobilePlacement: { x: '77%', y: '27%', size: '66px', rotate: -8 },
  },
  {
    src: '/collage-v1/moth.webp',
    position: 'moth',
    layer: 'back',
    depth: 0.28,
    drift: [15, -8, 2.2, 12.4, -8.2],
    placement: {
      x: '14%',
      y: '-3%',
      size: 'clamp(142px, 16vw, 260px)',
      rotate: -13,
    },
    mobilePlacement: { x: '19%', y: '-2%', size: '115px', rotate: -13 },
  },
  {
    src: '/collage-v1/watch.webp',
    position: 'watch',
    layer: 'back',
    depth: 0.38,
    drift: [-6, -13, -2.8, 10.8, -3.4],
    placement: { x: '63%', y: '4%', size: 'clamp(62px, 6vw, 98px)', rotate: 7 },
    mobilePlacement: { x: '60%', y: '8%', size: '54px', rotate: 7 },
  },
  {
    src: '/collage-v1/feather.webp',
    position: 'feather',
    layer: 'front',
    depth: 1.7,
    drift: [11, -22, 4.2, 9.7, -7.6],
    placement: {
      x: '7%',
      y: '35%',
      size: 'clamp(62px, 7vw, 112px)',
      rotate: -17,
    },
    mobilePlacement: { x: '4%', y: '28%', size: '50px', rotate: -17 },
  },
  {
    src: '/collage-v1/shell.webp',
    position: 'shell',
    layer: 'back',
    depth: 0.32,
    drift: [-12, -7, -1.9, 11.6, -4.3],
    placement: {
      x: '85%',
      y: '43%',
      size: 'clamp(132px, 15vw, 240px)',
      rotate: 13,
    },
    mobilePlacement: { x: '82%', y: '46%', size: '100px', rotate: 13 },
  },
  {
    src: '/collage-v1/snake.webp',
    position: 'snake',
    layer: 'back',
    depth: 0.5,
    drift: [14, -12, 3.4, 13.1, -9.4],
    placement: {
      x: '21%',
      y: '66%',
      size: 'clamp(140px, 16vw, 260px)',
      rotate: -8,
    },
    mobilePlacement: { x: '2%', y: '77%', size: '120px', rotate: -8 },
  },
  {
    src: '/collage-v1/hourglass.webp',
    position: 'hourglass',
    layer: 'front',
    depth: 1.35,
    drift: [-8, -17, -3.8, 8.2, -2.7],
    placement: {
      x: '69%',
      y: '73%',
      size: 'clamp(72px, 7vw, 118px)',
      rotate: 8,
    },
    mobilePlacement: { x: '57%', y: '79%', size: '58px', rotate: 8 },
  },
  {
    src: '/collage-v1/apple.webp',
    position: 'apple',
    layer: 'back',
    depth: 0.42,
    drift: [10, -9, 2.1, 10.5, -5.8],
    placement: {
      x: '27%',
      y: '4%',
      size: 'clamp(98px, 10vw, 166px)',
      rotate: 6,
    },
    mobilePlacement: { x: '28%', y: '8%', size: '75px', rotate: 6 },
  },
  {
    src: '/collage-v1/scissors.webp',
    position: 'scissors',
    layer: 'back',
    depth: 0.62,
    drift: [-11, -15, -4.1, 9.3, -6.9],
    placement: {
      x: '72%',
      y: '35%',
      size: 'clamp(76px, 8vw, 132px)',
      rotate: 12,
    },
    mobilePlacement: { x: '69%', y: '36%', size: '66px', rotate: 12 },
  },
  {
    src: '/collage-v1/pomegranate.webp',
    position: 'pomegranate',
    layer: 'back',
    depth: 0.36,
    drift: [7, -12, -2.4, 9.8, -4.4],
    placement: {
      x: '43%',
      y: '-5%',
      size: 'clamp(126px, 14vw, 226px)',
      rotate: -6,
    },
    mobilePlacement: { x: '42%', y: '-3%', size: '95px', rotate: -6 },
  },
  {
    src: '/collage-v1/domino.webp',
    position: 'domino',
    layer: 'front',
    depth: 1.45,
    drift: [-8, -16, 3.2, 8.6, -3.1],
    placement: {
      x: '94%',
      y: '24%',
      size: 'clamp(68px, 7vw, 116px)',
      rotate: 16,
    },
    mobilePlacement: { x: '88%', y: '18%', size: '62px', rotate: 16 },
  },
  {
    src: '/collage-v1/bell.webp',
    position: 'bell',
    layer: 'back',
    depth: 0.46,
    drift: [12, -10, 2.8, 11.2, -5.9],
    placement: {
      x: '-2%',
      y: '40%',
      size: 'clamp(86px, 9vw, 148px)',
      rotate: 10,
    },
    mobilePlacement: { x: '-5%', y: '45%', size: '74px', rotate: 10 },
  },
  {
    src: '/collage-v1/compass.webp',
    position: 'compass',
    layer: 'back',
    depth: 0.3,
    drift: [-10, -8, -1.8, 12.2, -7.2],
    placement: {
      x: '38%',
      y: '70%',
      size: 'clamp(108px, 12vw, 190px)',
      rotate: -10,
    },
    mobilePlacement: { x: '28%', y: '69%', size: '90px', rotate: -10 },
  },
  {
    src: '/collage-v1/bust.webp',
    position: 'bust',
    layer: 'front',
    depth: 0.95,
    drift: [8, -14, 2.1, 10.1, -5.2],
    placement: {
      x: '54%',
      y: '66%',
      size: 'clamp(132px, 14vw, 232px)',
      rotate: 5,
    },
    mobilePlacement: { x: '67%', y: '66%', size: '112px', rotate: 5 },
  },
  {
    src: '/collage-v1/pen.webp',
    position: 'pen',
    layer: 'back',
    depth: 0.55,
    drift: [-6, -17, -3.8, 9.1, -2.8],
    placement: {
      x: '20%',
      y: '35%',
      size: 'clamp(54px, 5vw, 88px)',
      rotate: 19,
    },
    mobilePlacement: { x: '18%', y: '42%', size: '48px', rotate: 19 },
  },
  {
    src: '/collage-v1/crystal.webp',
    position: 'crystal',
    layer: 'back',
    depth: 0.25,
    drift: [9, -7, 1.5, 13.4, -8.8],
    placement: {
      x: '49%',
      y: '18%',
      size: 'clamp(60px, 6vw, 102px)',
      rotate: -5,
    },
    mobilePlacement: { x: '47%', y: '21%', size: '54px', rotate: -5 },
  },
  {
    src: '/collage-v1/ribbon.webp',
    position: 'ribbon',
    layer: 'front',
    depth: 1.2,
    drift: [-12, -13, -2.7, 8.9, -6.1],
    placement: {
      x: '10%',
      y: '12%',
      size: 'clamp(78px, 9vw, 148px)',
      rotate: 12,
    },
    mobilePlacement: { x: '-1%', y: '17%', size: '68px', rotate: 12 },
  },
  {
    src: '/collage-v1/rose.webp',
    position: 'rose',
    layer: 'back',
    depth: 0.4,
    drift: [10, -11, 2.3, 11.7, -4.9],
    placement: {
      x: '-1%',
      y: '74%',
      size: 'clamp(102px, 11vw, 180px)',
      rotate: 7,
    },
    mobilePlacement: { x: '-9%', y: '79%', size: '90px', rotate: 7 },
  },
  {
    src: '/collage-v1/heart.webp',
    position: 'heart',
    layer: 'front',
    depth: 1.55,
    drift: [-9, -19, 4.8, 7.6, -3.7],
    placement: {
      x: '83%',
      y: '72%',
      size: 'clamp(78px, 8vw, 134px)',
      rotate: -9,
    },
    mobilePlacement: { x: '80%', y: '80%', size: '65px', rotate: -9 },
  },
  {
    src: '/collage-v1/pearl.webp',
    position: 'pearl',
    layer: 'back',
    depth: 0.34,
    drift: [7, -9, -1.7, 12.8, -7.5],
    placement: {
      x: '56%',
      y: '7%',
      size: 'clamp(74px, 8vw, 128px)',
      rotate: 8,
    },
    mobilePlacement: { x: '55%', y: '2%', size: '60px', rotate: 8 },
  },
  {
    src: '/collage-v1/mask.webp',
    position: 'mask',
    layer: 'back',
    depth: 0.48,
    drift: [-8, -12, -3.1, 10.7, -5.6],
    placement: {
      x: '91%',
      y: '3%',
      size: 'clamp(92px, 10vw, 164px)',
      rotate: -11,
    },
    mobilePlacement: { x: '84%', y: '2%', size: '80px', rotate: -11 },
  },
  {
    src: '/collage-v1/matches.webp',
    position: 'matches',
    layer: 'front',
    depth: 1.25,
    drift: [11, -15, 3.6, 9.4, -6.6],
    placement: {
      x: '32%',
      y: '76%',
      size: 'clamp(92px, 10vw, 168px)',
      rotate: -8,
    },
    mobilePlacement: { x: '35%', y: '83%', size: '80px', rotate: -8 },
  },
  {
    src: '/collage-v1/glove.webp',
    position: 'glove',
    layer: 'back',
    depth: 0.6,
    drift: [-10, -14, -3.4, 10.3, -4.2],
    placement: {
      x: '66%',
      y: '49%',
      size: 'clamp(72px, 8vw, 128px)',
      rotate: 12,
    },
    mobilePlacement: { x: '68%', y: '51%', size: '62px', rotate: 12 },
  },
  {
    src: '/collage-v1/door.webp',
    position: 'door',
    layer: 'back',
    depth: 0.28,
    drift: [6, -8, 1.9, 13.8, -9.1],
    placement: {
      x: '35%',
      y: '13%',
      size: 'clamp(88px, 9vw, 150px)',
      rotate: -4,
    },
    mobilePlacement: { x: '27%', y: '20%', size: '75px', rotate: -4 },
  },
  {
    src: '/collage-v1/envelope.webp',
    position: 'envelope',
    layer: 'front',
    depth: 1.05,
    drift: [-11, -16, -2.9, 8.3, -5.4],
    placement: {
      x: '46%',
      y: '81%',
      size: 'clamp(98px, 11vw, 178px)',
      rotate: 7,
    },
    mobilePlacement: { x: '44%', y: '66%', size: '86px', rotate: 7 },
  },
] satisfies ReadonlyArray<{
  src: string;
  position: string;
  layer: 'front' | 'back';
  depth: number;
  drift: readonly [number, number, number, number, number];
  placement: HeroPlacement;
  mobilePlacement: HeroPlacement;
}>;

type HeroObject = (typeof HERO_OBJECTS)[number];

function FloatingHeroObject({
  object,
  index,
  pointerX,
  pointerY,
}: {
  object: HeroObject;
  index: number;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}) {
  const parallaxX = useTransform(pointerX, (value) => value * object.depth);
  const parallaxY = useTransform(pointerY, (value) => value * object.depth);
  const [driftX, driftY, driftRotate, duration, delay] = object.drift;
  const { placement, mobilePlacement } = object;
  const sigilStyle: HeroSigilStyle = {
    x: parallaxX,
    y: parallaxY,
    '--sigil-x': placement.x,
    '--sigil-y': placement.y,
    '--sigil-size': placement.size,
    '--sigil-rotate': `${placement.rotate}deg`,
    '--sigil-mobile-x': mobilePlacement.x,
    '--sigil-mobile-y': mobilePlacement.y,
    '--sigil-mobile-size': mobilePlacement.size,
    '--sigil-mobile-rotate': `${mobilePlacement.rotate}deg`,
  };

  return (
    <motion.span
      className={`hero-sigil hero-sigil-${object.position}`}
      style={sigilStyle}
      initial={{ opacity: 0, scale: 0.65, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 1.1,
        delay: 0.7 + index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <span
        style={
          {
            '--drift-x': `${driftX}px`,
            '--drift-y': `${driftY}px`,
            '--drift-rotate': `${driftRotate}deg`,
            '--drift-duration': `${duration}s`,
            '--drift-delay': `${delay}s`,
          } as CSSProperties
        }
      >
        <Image
          src={object.src}
          alt=""
          fill
          sizes="180px"
          style={{ objectFit: 'contain' }}
        />
      </span>
    </motion.span>
  );
}

function ArchiveHeroObject({
  object,
  index,
}: {
  object: (typeof ARCHIVE_HERO_OBJECTS)[number];
  index: number;
}) {
  const { placement, mobilePlacement } = object;

  return (
    <span
      className="hero-sigil hero-sigil-archive"
      style={
        {
          '--sigil-x': placement.x,
          '--sigil-y': placement.y,
          '--sigil-size': placement.size,
          '--sigil-rotate': `${placement.rotate}deg`,
          '--sigil-mobile-x': mobilePlacement.x,
          '--sigil-mobile-y': mobilePlacement.y,
          '--sigil-mobile-size': mobilePlacement.size,
          '--sigil-mobile-rotate': `${mobilePlacement.rotate}deg`,
          '--archive-delay': `${-((index % 12) * 0.7)}s`,
          '--archive-opacity': object.opacity.toFixed(2),
        } as CSSProperties
      }
    >
      <span>
        <Image
          src={object.src}
          alt=""
          fill
          sizes="(max-width: 720px) 86px, 174px"
          style={{ objectFit: 'contain' }}
        />
      </span>
    </span>
  );
}

export function HomeCatalog() {
  const { cue } = useExperience();
  const router = useRouter();
  const departureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [departingSystem, setDepartingSystem] = useState<
    (typeof CATALOG_SYSTEMS)[number] | null
  >(null);
  const heroXSource = useMotionValue(0);
  const heroYSource = useMotionValue(0);
  const heroX = useSpring(heroXSource, { stiffness: 80, damping: 18 });
  const heroY = useSpring(heroYSource, { stiffness: 80, damping: 18 });
  const heroRotateY = useTransform(heroX, [-28, 28], [-5, 5]);
  const heroRotateX = useTransform(heroY, [-20, 20], [4, -4]);

  useEffect(
    () => () => {
      if (departureTimer.current) clearTimeout(departureTimer.current);
    },
    [],
  );

  const enterReading = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    system: (typeof CATALOG_SYSTEMS)[number],
  ) => {
    cue('tick');
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    event.preventDefault();
    if (departingSystem) return;
    setDepartingSystem(system);
    departureTimer.current = setTimeout(() => {
      router.push(`/read/${system.slug}`);
    }, 980);
  };

  return (
    <main className="home-index">
      <section
        className="divine-hero"
        aria-labelledby="home-title"
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') return;
          const bounds = event.currentTarget.getBoundingClientRect();
          heroXSource.set(
            ((event.clientX - bounds.left) / bounds.width - 0.5) * 56,
          );
          heroYSource.set(
            ((event.clientY - bounds.top) / bounds.height - 0.5) * 40,
          );
        }}
        onPointerLeave={() => {
          heroXSource.set(0);
          heroYSource.set(0);
        }}
      >
        <div className="hero-shutters" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <motion.i
              key={index}
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{
                duration: 0.82,
                delay: 0.04 + index * 0.065,
                ease: [0.76, 0, 0.24, 1],
              }}
            />
          ))}
        </div>

        {(['back', 'front'] as const).map((layer) => (
          <div
            className={`hero-sigils hero-sigils-${layer}`}
            aria-hidden="true"
            key={layer}
          >
            {layer === 'back'
              ? ARCHIVE_HERO_OBJECTS.map((object, index) => (
                  <ArchiveHeroObject
                    object={object}
                    index={index}
                    key={object.objectID}
                  />
                ))
              : null}
            {HERO_OBJECTS.map((object, index) =>
              object.layer === layer ? (
                <FloatingHeroObject
                  object={object}
                  index={index}
                  pointerX={heroX}
                  pointerY={heroY}
                  key={object.position}
                />
              ) : null,
            )}
          </div>
        ))}

        <div className="hero-stage">
          <h1 id="home-title" aria-label="DIVINE">
            {HERO_LETTERS.map((letter, index) => (
              <span className="hero-letter-mask" key={`${letter}-${index}`}>
                <motion.span
                  initial={{ y: '112%', rotate: index % 2 ? 3 : -3 }}
                  animate={{ y: '0%', rotate: 0 }}
                  transition={{
                    duration: 0.92,
                    delay: 0.42 + index * 0.065,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {letter}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            className="hero-crystal"
            style={{
              x: heroX,
              y: heroY,
              rotateX: heroRotateX,
              rotateY: heroRotateY,
            }}
          >
            <motion.span
              className="hero-crystal-entry"
              initial={{
                opacity: 0,
                scale: 0.62,
                y: 76,
                filter: 'blur(16px)',
              }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 1.35,
                delay: 0.24,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span className="hero-crystal-float">
                <Image
                  src="/hero/divine-crystal.webp"
                  alt="A clouded crystal ball"
                  width={1080}
                  height={1080}
                  sizes="(max-width: 720px) 72vw, 42vw"
                  priority
                />
                <i aria-hidden="true" />
              </span>
            </motion.span>
          </motion.div>
        </div>

        <motion.a
          className="hero-enter"
          href="#readings"
          onClick={() => cue('tick')}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.65 }}
        >
          Enter <span aria-hidden="true">↓</span>
        </motion.a>
      </section>

      <Link
        className="astrology-home-entry"
        href="/astrology"
        onClick={() => cue('tick')}
      >
        <span className="astrology-home-art">
          <Image
            src="/astrology/zodiac-circle-medieval.webp"
            alt=""
            fill
            sizes="(max-width: 720px) 100vw, 50vw"
          />
        </span>
        <span className="astrology-home-copy">
          <small>New / Astrology studio</small>
          <strong>
            Read the sky.
            <br />
            Keep your agency.
          </strong>
          <span>Horoscopes · signs · alignment · open chart atlas</span>
          <i>
            Enter <span aria-hidden="true">↗</span>
          </i>
        </span>
      </Link>

      <section className="reading-index" id="readings" aria-label="Readings">
        {CATALOG_SYSTEMS.map((system, index) => {
          const artMotion = ART_MOTIONS[index % ART_MOTIONS.length];

          return (
            <Link
              className="reading-index-item"
              data-system={system.slug}
              href={`/read/${system.slug}`}
              key={system.slug}
              onClick={(event) => enterReading(event, system)}
              onPointerMove={(event) => {
                if (event.pointerType === 'touch') return;
                const bounds = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty(
                  '--pointer-x',
                  `${event.clientX - bounds.left}px`,
                );
                event.currentTarget.style.setProperty(
                  '--pointer-y',
                  `${event.clientY - bounds.top}px`,
                );
              }}
              style={{ '--reading-order': index } as CSSProperties}
            >
              <span className="reading-index-aura" aria-hidden="true" />
              <span className="reading-index-chrome" aria-hidden="true">
                <small>{`${index + 1}`.padStart(2, '0')}</small>
                <i />
                <em>Enter</em>
              </span>
              <motion.span
                className="reading-index-art"
                initial={{
                  opacity: 0,
                  y: 46,
                  rotate: artMotion.angle * 2,
                  filter: 'blur(8px)',
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  rotate: artMotion.angle,
                  filter: 'blur(0px)',
                }}
                whileHover={{
                  y: -8,
                  rotate: -artMotion.angle * 1.35,
                  scale: 1.035,
                }}
                viewport={{ once: true, amount: 0.22 }}
                transition={{
                  duration: 0.82,
                  delay: (index % 4) * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span
                  className="reading-index-art-float"
                  style={
                    {
                      '--art-x': `${artMotion.x}px`,
                      '--art-y': `${artMotion.y}px`,
                      '--art-duration': `${artMotion.duration}s`,
                      '--art-delay': `${-index * 0.63}s`,
                      '--art-rotate': `${artMotion.angle * -0.55}deg`,
                    } as CSSProperties
                  }
                >
                  <Image
                    src={INDEX_ART[system.slug]}
                    alt=""
                    fill
                    sizes="(max-width: 720px) 45vw, 25vw"
                    priority={index < 4}
                    style={{ objectFit: 'contain' }}
                  />
                </span>
              </motion.span>
              <span className="reading-index-name">
                <span>{system.name}</span>
                {system.slug === 'divine' && (
                  <small>One card from every deck · one connected answer</small>
                )}
              </span>
            </Link>
          );
        })}
      </section>

      {departingSystem && (
        <motion.div
          className="reading-route-transition"
          aria-hidden="true"
          initial="closed"
          animate="open"
        >
          <div className="route-transition-panels">
            {Array.from({ length: 6 }, (_, index) => (
              <motion.i
                key={index}
                variants={{ closed: { y: '102%' }, open: { y: '0%' } }}
                transition={{
                  duration: 0.58,
                  delay: index * 0.045,
                  ease: [0.76, 0, 0.24, 1],
                }}
              />
            ))}
          </div>
          <motion.div
            className="route-transition-object"
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 0.62,
              delay: 0.32,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Image
              src={INDEX_ART[departingSystem.slug]}
              alt=""
              fill
              sizes="220px"
              style={{ objectFit: 'contain' }}
            />
          </motion.div>
          <motion.div
            className="route-transition-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.43 }}
          >
            <small>Opening the reading</small>
            <strong>{departingSystem.name}</strong>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}

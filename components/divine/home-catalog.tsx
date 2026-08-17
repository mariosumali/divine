'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useExperience } from '@/app/providers';
import { SYSTEMS } from '@/lib/divine/systems';

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
const HERO_OBJECTS = [
  {
    src: '/collage-v1/prism.webp',
    position: 'prism',
    layer: 'front',
    depth: 0.7,
    drift: [9, -14, 2.4, 8.4, -2.1],
  },
  {
    src: '/collage-v1/hand.webp',
    position: 'hand',
    layer: 'front',
    depth: 1.05,
    drift: [-7, -18, -2.2, 9.6, -4.7],
  },
  {
    src: '/collage-v1/peony.webp',
    position: 'peony',
    layer: 'front',
    depth: 0.9,
    drift: [12, -10, 1.8, 10.2, -6.3],
  },
  {
    src: '/collage-v1/key.webp',
    position: 'key',
    layer: 'front',
    depth: 1.3,
    drift: [-9, -16, -3.2, 7.9, -3.5],
  },
  {
    src: '/collage-v1/star.webp',
    position: 'star',
    layer: 'front',
    depth: 1.5,
    drift: [8, -20, 5.5, 6.9, -5.1],
  },
  {
    src: '/collage-v1/eye.webp',
    position: 'eye',
    layer: 'front',
    depth: 1.15,
    drift: [-10, -11, -3.6, 8.8, -1.8],
  },
  {
    src: '/collage-v1/moth.webp',
    position: 'moth',
    layer: 'back',
    depth: 0.28,
    drift: [15, -8, 2.2, 12.4, -8.2],
  },
  {
    src: '/collage-v1/watch.webp',
    position: 'watch',
    layer: 'back',
    depth: 0.38,
    drift: [-6, -13, -2.8, 10.8, -3.4],
  },
  {
    src: '/collage-v1/feather.webp',
    position: 'feather',
    layer: 'front',
    depth: 1.7,
    drift: [11, -22, 4.2, 9.7, -7.6],
  },
  {
    src: '/collage-v1/shell.webp',
    position: 'shell',
    layer: 'back',
    depth: 0.32,
    drift: [-12, -7, -1.9, 11.6, -4.3],
  },
  {
    src: '/collage-v1/snake.webp',
    position: 'snake',
    layer: 'back',
    depth: 0.5,
    drift: [14, -12, 3.4, 13.1, -9.4],
  },
  {
    src: '/collage-v1/hourglass.webp',
    position: 'hourglass',
    layer: 'front',
    depth: 1.35,
    drift: [-8, -17, -3.8, 8.2, -2.7],
  },
  {
    src: '/collage-v1/apple.webp',
    position: 'apple',
    layer: 'back',
    depth: 0.42,
    drift: [10, -9, 2.1, 10.5, -5.8],
  },
  {
    src: '/collage-v1/scissors.webp',
    position: 'scissors',
    layer: 'back',
    depth: 0.62,
    drift: [-11, -15, -4.1, 9.3, -6.9],
  },
] as const;

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

  return (
    <motion.span
      className={`hero-sigil hero-sigil-${object.position}`}
      style={{ x: parallaxX, y: parallaxY }}
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

export function HomeCatalog() {
  const { cue } = useExperience();
  const heroXSource = useMotionValue(0);
  const heroYSource = useMotionValue(0);
  const heroX = useSpring(heroXSource, { stiffness: 80, damping: 18 });
  const heroY = useSpring(heroYSource, { stiffness: 80, damping: 18 });
  const heroRotateY = useTransform(heroX, [-28, 28], [-5, 5]);
  const heroRotateX = useTransform(heroY, [-20, 20], [4, -4]);

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

        <div className="hero-orbits" aria-hidden="true">
          <span className="hero-orbit hero-orbit-wide">
            <i />
          </span>
          <span className="hero-orbit hero-orbit-tall">
            <i />
          </span>
          <span className="hero-orbit hero-orbit-small">
            <i />
          </span>
        </div>

        {(['back', 'front'] as const).map((layer) => (
          <div
            className={`hero-sigils hero-sigils-${layer}`}
            aria-hidden="true"
            key={layer}
          >
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

      <section className="reading-index" id="readings" aria-label="Readings">
        {SYSTEMS.map((system, index) => {
          const artMotion = ART_MOTIONS[index % ART_MOTIONS.length];

          return (
            <Link
              className="reading-index-item"
              data-system={system.slug}
              href={`/read/${system.slug}`}
              key={system.slug}
              onClick={() => cue('tick')}
            >
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
                {system.name}
                {system.slug === 'divine' && (
                  <small>One card from every deck · one connected answer</small>
                )}
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

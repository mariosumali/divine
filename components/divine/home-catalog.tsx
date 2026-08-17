'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useExperience } from '@/app/providers';
import { SYSTEMS } from '@/lib/divine/systems';

const INDEX_ART: Record<string, string> = {
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
  'magic-8-ball': '/index-art-v2/magic-8-ball.webp',
  'fortune-cookie': '/index-art/fortune-cookie.webp',
};

const RESTING_ANGLES = [-2, 1.4, -1, 1.7, 1.2, -1.4, -1.2, 1.4];
const HERO_LETTERS = 'DIVINE'.split('');
const HERO_SIGILS = [
  { src: '/collage-v1/prism.webp', position: 'prism' },
  { src: '/collage-v1/hand.webp', position: 'hand' },
  { src: '/collage-v1/peony.webp', position: 'peony' },
  { src: '/collage-v1/key.webp', position: 'key' },
  { src: '/collage-v1/star.webp', position: 'star' },
  { src: '/collage-v1/eye.webp', position: 'eye' },
] as const;

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

        <motion.div
          className="hero-meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          <span>Private divination</span>
          <span>Read the unknown</span>
        </motion.div>

        <div className="hero-sigils" aria-hidden="true">
          {HERO_SIGILS.map((sigil, index) => (
            <motion.span
              className={`hero-sigil hero-sigil-${sigil.position}`}
              key={sigil.position}
              initial={{ opacity: 0, scale: 0.72, y: 18 }}
              animate={{ opacity: 0.72, scale: 1, y: 0 }}
              transition={{
                duration: 1.1,
                delay: 0.82 + index * 0.11,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span>
                <Image src={sigil.src} alt="" fill sizes="150px" />
              </span>
            </motion.span>
          ))}
        </div>

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
        {SYSTEMS.map((system, index) => (
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
                rotate: RESTING_ANGLES[index] * 2,
                filter: 'blur(8px)',
              }}
              whileInView={{
                opacity: 1,
                y: 0,
                rotate: RESTING_ANGLES[index],
                filter: 'blur(0px)',
              }}
              whileHover={{
                y: -10,
                rotate: -RESTING_ANGLES[index] * 1.4,
                scale: 1.045,
              }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.82,
                delay: (index % 4) * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Image
                src={INDEX_ART[system.slug]}
                alt=""
                fill
                sizes="(max-width: 720px) 45vw, 25vw"
                priority={index < 4}
              />
            </motion.span>
            <span className="reading-index-name">{system.name}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

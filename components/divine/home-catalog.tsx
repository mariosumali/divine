'use client';

import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useExperience } from '@/app/providers';
import { SYSTEMS } from '@/lib/divine/systems';

const INDEX_ART: Record<string, string> = {
  tarot: '/index-art/tarot.webp',
  oracle: '/index-art/oracle.webp',
  lenormand: '/index-art/lenormand.webp',
  spellcraft: '/index-art/spellcraft.webp',
  'ancient-egypt': '/index-art/ancient-egypt.webp',
  zodiac: '/index-art/zodiac.webp',
  'magic-8-ball': '/index-art/magic-8-ball.webp',
  'fortune-cookie': '/index-art/fortune-cookie.webp',
};

const RESTING_ANGLES = [-3, 2, -1, 3, 2, -2, -2, 2];

export function HomeCatalog() {
  const { cue } = useExperience();
  const reduceMotion = useReducedMotion();

  return (
    <main className="home-index">
      <section className="index-masthead" aria-labelledby="home-title">
        <motion.h1
          id="home-title"
          initial={reduceMotion ? false : { clipPath: 'inset(100% 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0)' }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        >
          DIVINE
        </motion.h1>
      </section>

      <section className="reading-index" id="readings" aria-label="Readings">
        {SYSTEMS.map((system, index) => (
          <Link
            className="reading-index-item"
            href={`/read/${system.slug}`}
            key={system.slug}
            onClick={() => cue('tick')}
          >
            <motion.span
              className="reading-index-art"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 28, rotate: RESTING_ANGLES[index] * 2 }
              }
              whileInView={{
                opacity: 1,
                y: 0,
                rotate: RESTING_ANGLES[index],
              }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -10,
                      rotate: -RESTING_ANGLES[index] * 1.4,
                      scale: 1.045,
                    }
              }
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.7,
                delay: reduceMotion ? 0 : (index % 4) * 0.045,
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

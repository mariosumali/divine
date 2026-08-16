'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SYSTEMS } from '@/lib/divine/systems';
import { useExperience } from '@/app/providers';

export function HomeCatalog() {
  const [active, setActive] = useState(0);
  const { cue } = useExperience();

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-line" />
        <span />
        <h1 id="hero-title" className="wordmark">
          DIVINE
        </h1>
        <div className="hero-footer">
          <p>Private. Local. Yours.</p>
          <a href="#readings" className="text-link">
            Begin <ArrowDown />
          </a>
        </div>
      </section>

      <section
        className="catalog"
        id="readings"
        aria-labelledby="readings-title"
      >
        <h2 className="sr-only" id="readings-title">
          Readings
        </h2>
        <div className="catalog-layout">
          <div className="system-list">
            {SYSTEMS.map((system, index) => (
              <Link
                className={`system-row ${active === index ? 'active' : ''}`}
                href={`/read/${system.slug}`}
                key={system.slug}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => cue('tick')}
              >
                <span className="system-name">{system.name}</span>
                <span className="system-arrow" aria-hidden="true">
                  <ArrowUpRight />
                </span>
                <Image
                  className="mobile-system-image"
                  src={system.cover}
                  alt=""
                  width={1122}
                  height={1402}
                />
              </Link>
            ))}
          </div>
          <div className="catalog-art" aria-hidden="true">
            <AnimatePresence mode="wait">
              <motion.img
                key={SYSTEMS[active].slug}
                src={SYSTEMS[active].cover}
                alt=""
                initial={{
                  opacity: 0,
                  clipPath: 'inset(12% 0 88% 0)',
                  scale: 1.04,
                }}
                animate={{ opacity: 1, clipPath: 'inset(0% 0 0% 0)', scale: 1 }}
                exit={{ opacity: 0, clipPath: 'inset(88% 0 12% 0)' }}
                transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
              />
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="home-statement">
        <Link href="/library">
          <span>Library</span>
          <small>History & meanings</small>
          <ArrowUpRight />
        </Link>
      </section>
      <footer className="site-footer">
        <span>For reflection and entertainment</span>
        <span>© DIVINE</span>
      </footer>
    </main>
  );
}

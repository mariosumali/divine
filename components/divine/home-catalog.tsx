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
        <p className="eyebrow">Eight instruments for the unknown</p>
        <h1 id="hero-title" className="wordmark">DIVINE</h1>
        <div className="hero-footer">
          <p>Ask clearly. Draw slowly.<br />Keep what follows.</p>
          <a href="#systems" className="text-link">Choose a system <ArrowDown /></a>
        </div>
      </section>

      <section className="catalog" id="systems" aria-labelledby="systems-title">
        <header className="catalog-heading">
          <p className="eyebrow">The collection</p>
          <h2 id="systems-title">Choose your instrument.</h2>
          <p>Every reading begins with attention. The method only changes how the answer arrives.</p>
        </header>
        <div className="catalog-layout">
          <div className="system-list">
            {SYSTEMS.map((system, index) => (
              <Link className={`system-row ${active === index ? 'active' : ''}`} href={`/read/${system.slug}`} key={system.slug} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => cue('tick')}>
                <span className="system-index">{system.index}</span>
                <span className="system-name">{system.name}</span>
                <span className="system-note">{system.eyebrow}</span>
                <span className="system-arrow" aria-hidden="true"><ArrowUpRight /></span>
                <Image className="mobile-system-image" src={system.cover} alt="" width={1122} height={1402} />
              </Link>
            ))}
          </div>
          <div className="catalog-art" aria-hidden="true">
            <AnimatePresence mode="wait">
              <motion.img key={SYSTEMS[active].slug} src={SYSTEMS[active].cover} alt="" initial={{ opacity: 0, clipPath: 'inset(12% 0 88% 0)', scale: 1.04 }} animate={{ opacity: 1, clipPath: 'inset(0% 0 0% 0)', scale: 1 }} exit={{ opacity: 0, clipPath: 'inset(88% 0 12% 0)' }} transition={{ duration: .58, ease: [0.22, 1, 0.36, 1] }} />
            </AnimatePresence>
            <span>{SYSTEMS[active].index}</span>
          </div>
        </div>
      </section>

      <section className="home-statement">
        <p className="eyebrow">Private by design</p>
        <p>No accounts. No audience. No answer leaves your device unless you choose to share it.</p>
        <Link href="/about">Read the method <ArrowUpRight /></Link>
      </section>
      <footer className="site-footer"><Link href="/about">Method & privacy</Link><span>For reflection and entertainment</span><span>© DIVINE</span></footer>
    </main>
  );
}

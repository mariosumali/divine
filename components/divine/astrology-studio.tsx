'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useExperience } from '@/app/providers';
import {
  alignmentFor,
  ASTROLOGY_CHARTS,
  ASTROLOGY_SIGNS,
} from '@/lib/divine/astrology';
import { ZodiacMark } from './zodiac-mark';

function SignSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="alignment-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(+event.target.value)}>
        {ASTROLOGY_SIGNS.map((sign, index) => (
          <option value={index} key={sign.name}>
            {sign.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AstrologyStudio() {
  const { cue } = useExperience();
  const [activeIndex, setActiveIndex] = useState(10);
  const [firstIndex, setFirstIndex] = useState(0);
  const [secondIndex, setSecondIndex] = useState(6);
  const activeSign = ASTROLOGY_SIGNS[activeIndex];
  const alignment = useMemo(
    () => alignmentFor(firstIndex, secondIndex),
    [firstIndex, secondIndex],
  );

  const chooseSign = (index: number, moveToReading = false) => {
    setActiveIndex(index);
    cue('tick');

    if (moveToReading) {
      document.querySelector('#today')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="astrology-studio astrology-studio-condensed">
      <section className="astrology-hero" aria-labelledby="astrology-title">
        <div className="astrology-hero-copy">
          <p className="astro-kicker">DIVINE / Astrology</p>
          <h1 id="astrology-title">
            Read the sky.
            <br />
            Keep your agency.
          </h1>
          <p>Signs, signals, and celestial archives.</p>
          <a href="#today" onClick={() => cue('tick')}>
            Choose a sign <ArrowDown aria-hidden="true" />
          </a>
        </div>
        <motion.div
          className="astrology-hero-art"
          initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/astrology/zodiac-circle-medieval.webp"
            alt="Medieval zodiac circle"
            fill
            sizes="(max-width: 760px) 100vw, 48vw"
            priority
          />
        </motion.div>
      </section>

      <nav className="astrology-subnav" aria-label="Astrology sections">
        <a href="#today">Today</a>
        <a href="#signs">Signs</a>
        <a href="#alignment">Alignment</a>
        <a href="#atlas">Atlas</a>
      </nav>

      <section
        className="daily-horoscope"
        id="today"
        aria-labelledby="today-title"
      >
        <header className="astro-section-heading">
          <p>01 / Daily signal</p>
          <h2 id="today-title">Today, briefly.</h2>
        </header>

        <div className="sign-switcher" aria-label="Choose your sun sign">
          {ASTROLOGY_SIGNS.map((sign, index) => (
            <button
              type="button"
              className={activeIndex === index ? 'active' : ''}
              aria-pressed={activeIndex === index}
              onClick={() => chooseSign(index)}
              key={sign.name}
            >
              <ZodiacMark sign={sign.name} />
              {sign.name}
            </button>
          ))}
        </div>

        <motion.article
          className="horoscope-reading"
          key={activeSign.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="horoscope-signature">
            <ZodiacMark
              sign={activeSign.name}
              label={`${activeSign.name} zodiac sign`}
            />
            <p>{activeSign.name}</p>
            <small>{activeSign.dates}</small>
          </div>
          <div className="horoscope-copy">
            <p className="astro-kicker">Your signal</p>
            <h3>{activeSign.headline}</h3>
            <p>{activeSign.overview}</p>
          </div>
        </motion.article>
      </section>

      <section
        className="sign-architecture"
        id="signs"
        aria-labelledby="signs-title"
      >
        <header className="astro-section-heading inverse">
          <p>02 / Star signs</p>
          <h2 id="signs-title">Twelve ways energy moves.</h2>
        </header>
        <div className="sign-profile-grid">
          {ASTROLOGY_SIGNS.map((sign, index) => (
            <button
              type="button"
              onClick={() => chooseSign(index, true)}
              key={sign.name}
            >
              <span className="sign-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <ZodiacMark sign={sign.name} />
              <h3>{sign.name}</h3>
              <p>
                {sign.element} / {sign.modality}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section
        className="alignment-lab"
        id="alignment"
        aria-labelledby="alignment-title"
      >
        <header className="astro-section-heading">
          <p>03 / Alignment</p>
          <h2 id="alignment-title">Two energies.</h2>
        </header>

        <div className="alignment-controls">
          <SignSelect
            label="First sign"
            value={firstIndex}
            onChange={(value) => {
              setFirstIndex(value);
              cue('tick');
            }}
          />
          <span aria-hidden="true">×</span>
          <SignSelect
            label="Second sign"
            value={secondIndex}
            onChange={(value) => {
              setSecondIndex(value);
              cue('tick');
            }}
          />
        </div>

        <motion.article
          className="alignment-result"
          key={`${firstIndex}-${secondIndex}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p>{alignment.dynamic}</p>
          <strong>{alignment.score}</strong>
          <h3>{alignment.headline}</h3>
        </motion.article>
      </section>

      <section
        className="astrology-atlas"
        id="atlas"
        aria-labelledby="atlas-title"
      >
        <header className="astro-section-heading inverse">
          <p>04 / Open atlas</p>
          <h2 id="atlas-title">Enter the charts.</h2>
        </header>

        <div className="atlas-grid">
          {ASTROLOGY_CHARTS.map((chart, index) => (
            <Link href={`/astrology/charts/${chart.slug}`} key={chart.slug}>
              <article>
                <div className="atlas-image">
                  <Image
                    src={chart.src}
                    alt={chart.alt}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                </div>
                <div className="atlas-meta">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{chart.title}</h3>
                    <p>{chart.date}</p>
                  </div>
                  <ArrowRight aria-hidden="true" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <footer className="astrology-footnote">
        <p>For reflection, not instruction.</p>
      </footer>
    </main>
  );
}

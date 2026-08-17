'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowRight, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useExperience } from '@/app/providers';
import {
  alignmentFor,
  ASTROLOGY_CHARTS,
  ASTROLOGY_SIGNS,
} from '@/lib/divine/astrology';

const PLANETS = [
  ['☉', 'Sun', 'identity'],
  ['☽', 'Moon', 'instinct'],
  ['☿', 'Mercury', 'mind'],
  ['♀', 'Venus', 'desire'],
  ['♂', 'Mars', 'will'],
  ['♃', 'Jupiter', 'growth'],
] as const;

function ChartWheel({ activeIndex }: { activeIndex: number }) {
  const signs = ASTROLOGY_SIGNS;
  const points = [
    [50, 18],
    [75, 31],
    [68, 63],
    [37, 73],
    [23, 46],
    [48, 38],
  ];

  return (
    <figure
      className="astro-wheel"
      aria-label={`Symbolic chart wheel with ${signs[activeIndex].name} rising`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" />
        <circle cx="50" cy="50" r="34" />
        <circle cx="50" cy="50" r="19" />
        {signs.map((sign, index) => {
          const angle = (index * 30 - 90) * (Math.PI / 180);
          const outerX = 50 + Math.cos(angle) * 46;
          const outerY = 50 + Math.sin(angle) * 46;
          const innerX = 50 + Math.cos(angle) * 19;
          const innerY = 50 + Math.sin(angle) * 19;
          return (
            <line
              className={index === activeIndex ? 'active' : ''}
              x1={innerX}
              y1={innerY}
              x2={outerX}
              y2={outerY}
              key={sign.name}
            />
          );
        })}
        <path d="M50 18 L75 31 L68 63 L37 73 L23 46 L48 38 Z" />
        <path d="M50 18 L68 63 M75 31 L37 73 M23 46 L68 63" />
        {points.map(([x, y], index) => (
          <circle className="planet-point" cx={x} cy={y} r="1.6" key={index} />
        ))}
      </svg>
      {signs.map((sign, index) => {
        const angle = (index * 30 - 75) * (Math.PI / 180);
        return (
          <span
            className={index === activeIndex ? 'active' : ''}
            style={{
              left: `${50 + Math.cos(angle) * 40}%`,
              top: `${50 + Math.sin(angle) * 40}%`,
            }}
            key={sign.name}
            aria-hidden="true"
          >
            {sign.glyph}
          </span>
        );
      })}
      <strong aria-hidden="true">{signs[activeIndex].glyph}</strong>
    </figure>
  );
}

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
            {sign.glyph} {sign.name}
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

  const chooseSign = (index: number) => {
    setActiveIndex(index);
    cue('tick');
  };

  return (
    <main className="astrology-studio">
      <section className="astrology-hero" aria-labelledby="astrology-title">
        <div className="astrology-hero-copy">
          <p className="astro-kicker">DIVINE / Astrology</p>
          <h1 id="astrology-title">
            Read the sky.
            <br />
            Keep your agency.
          </h1>
          <p>
            Daily horoscopes, sign architecture, and relationship alignments for
            reflection—never instruction.
          </p>
          <a href="#today" onClick={() => cue('tick')}>
            Find your sign <ArrowDown aria-hidden="true" />
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
        <a href="#chart">Chart</a>
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
          <h2 id="today-title">Today is not a prophecy.</h2>
          <p>Choose your sun sign. Take what clarifies; leave the rest.</p>
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
              <span>{sign.glyph}</span>
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
            <span>{activeSign.glyph}</span>
            <p>{activeSign.name}</p>
            <small>{activeSign.dates}</small>
          </div>
          <div className="horoscope-copy">
            <p className="astro-kicker">Your signal</p>
            <h3>{activeSign.headline}</h3>
            <p>{activeSign.overview}</p>
            <dl>
              <div>
                <dt>Do</dt>
                <dd>{activeSign.do}</dd>
              </div>
              <div>
                <dt>Avoid</dt>
                <dd>{activeSign.avoid}</dd>
              </div>
            </dl>
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
          <p>Sun-sign language is one layer of a much larger chart.</p>
        </header>
        <div className="sign-profile-grid">
          {ASTROLOGY_SIGNS.map((sign, index) => (
            <button
              type="button"
              onClick={() => chooseSign(index)}
              key={sign.name}
            >
              <span className="sign-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <strong>{sign.glyph}</strong>
              <h3>{sign.name}</h3>
              <p>
                {sign.element} / {sign.modality}
              </p>
              <blockquote>{sign.gift}</blockquote>
              <small>{sign.tension}</small>
            </button>
          ))}
        </div>
      </section>

      <section
        className="chart-anatomy"
        id="chart"
        aria-labelledby="chart-title"
      >
        <div className="chart-wheel-column">
          <ChartWheel activeIndex={activeIndex} />
          <p>
            Symbolic chart anatomy. This wheel explains the visual grammar of a
            natal chart; it does not calculate astronomical positions.
          </p>
        </div>
        <div className="chart-anatomy-copy">
          <p className="astro-kicker">03 / Chart anatomy</p>
          <h2 id="chart-title">A chart is a system, not a label.</h2>
          <p className="chart-lede">
            Signs describe <em>how</em>. Planets describe <em>what</em>. Houses
            describe <em>where</em>. Aspects show how those parts speak to one
            another.
          </p>
          <div className="planet-legend">
            {PLANETS.map(([glyph, name, meaning]) => (
              <div key={name}>
                <span>{glyph}</span>
                <p>{name}</p>
                <small>{meaning}</small>
              </div>
            ))}
          </div>
          <Link href="/read/zodiac" onClick={() => cue('tick')}>
            Draw from the Zodiac oracle <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section
        className="alignment-lab"
        id="alignment"
        aria-labelledby="alignment-title"
      >
        <header className="astro-section-heading">
          <p>04 / Alignment</p>
          <h2 id="alignment-title">Compare two energies.</h2>
          <p>
            A sign-to-sign reflection on pace, communication, and productive
            tension—not a verdict on compatibility.
          </p>
        </header>
        <div className="alignment-controls">
          <SignSelect
            label="First sign"
            value={firstIndex}
            onChange={setFirstIndex}
          />
          <span aria-hidden="true">&times;</span>
          <SignSelect
            label="Second sign"
            value={secondIndex}
            onChange={setSecondIndex}
          />
        </div>
        <motion.div
          className="alignment-result"
          key={`${firstIndex}-${secondIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="alignment-score">
            <span>{alignment.score}</span>
            <small>alignment index / 100</small>
          </div>
          <div className="alignment-reading">
            <p className="astro-kicker">{alignment.dynamic}</p>
            <h3>{alignment.headline}</h3>
            <dl>
              <div>
                <dt>Communication</dt>
                <dd>{alignment.communication}</dd>
              </div>
              <div>
                <dt>Rhythm</dt>
                <dd>{alignment.rhythm}</dd>
              </div>
            </dl>
          </div>
        </motion.div>
      </section>

      <section
        className="astrology-atlas"
        id="atlas"
        aria-labelledby="atlas-title"
      >
        <header className="astro-section-heading inverse">
          <p>05 / Open atlas</p>
          <h2 id="atlas-title">Charts worth keeping.</h2>
          <p>Public-domain celestial maps, restored in DIVINE monochrome.</p>
        </header>
        <div className="atlas-grid">
          {ASTROLOGY_CHARTS.map((chart, index) => (
            <article key={chart.title}>
              <div className="atlas-image">
                <Image
                  src={chart.src}
                  alt={chart.alt}
                  fill
                  sizes="(max-width: 760px) 100vw, 34vw"
                />
              </div>
              <div className="atlas-meta">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{chart.title}</h3>
                  <p>
                    {chart.date} / {chart.detail}
                  </p>
                </div>
                <a
                  href={chart.download}
                  download
                  aria-label={`Download ${chart.title}`}
                >
                  <Download aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="astrology-note">
        <p>For entertainment and personal reflection.</p>
        <p>
          Sun-sign readings are intentionally broad. A verified natal chart
          requires an exact birth time, location, and ephemeris calculation.
        </p>
      </footer>
    </main>
  );
}

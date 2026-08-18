'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowDown, X } from 'lucide-react';
import Image from 'next/image';
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

  const chooseSign = (index: number) => {
    setActiveIndex(index);
    cue('tick');
  };

  return (
    <main className="astrology-studio astrology-studio-condensed">
      <section className="astrology-hero" aria-labelledby="astrology-title">
        <div className="astrology-hero-copy">
          <p className="astro-kicker">DIVINE / Astrology</p>
          <h1 id="astrology-title">Read the sky.</h1>
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

        <div
          className="sign-profile-grid daily-sign-grid"
          aria-label="Choose your sun sign"
        >
          {ASTROLOGY_SIGNS.map((sign, index) => (
            <button
              type="button"
              className={activeIndex === index ? 'active' : ''}
              aria-pressed={activeIndex === index}
              onClick={() => chooseSign(index)}
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

        <motion.article
          className="horoscope-reading"
          key={activeSign.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="horoscope-signature">
            <div className="horoscope-signature-art">
              <Image
                src={activeSign.art}
                alt={`${activeSign.name} from John Bevis's historical zodiac atlas`}
                fill
                sizes="(max-width: 720px) 100vw, 36vw"
              />
            </div>
            <div className="horoscope-signature-label">
              <p>{activeSign.name}</p>
              <small>{activeSign.dates}</small>
            </div>
          </div>
          <div className="horoscope-copy">
            <p className="astro-kicker">Your signal</p>
            <h3>{activeSign.headline}</h3>
            <p>{activeSign.overview}</p>
          </div>
        </motion.article>
      </section>

      <section
        className="alignment-lab"
        id="alignment"
        aria-labelledby="alignment-title"
      >
        <header className="astro-section-heading">
          <p>02 / Alignment</p>
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
        aria-label="Historical astrology charts"
      >
        <div className="atlas-grid">
          {ASTROLOGY_CHARTS.map((chart) => (
            <Dialog.Root key={chart.slug}>
              <Dialog.Trigger
                type="button"
                className="atlas-chart-trigger"
                aria-label={`View ${chart.title} full size`}
                onClick={() => cue('turn')}
              >
                <span className="atlas-image">
                  <Image
                    src={chart.src}
                    alt={chart.alt}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                </span>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Backdrop className="atlas-lightbox-backdrop" />
                <Dialog.Popup className="atlas-lightbox">
                  <Dialog.Title className="sr-only">
                    {chart.title}
                  </Dialog.Title>
                  <Dialog.Close
                    type="button"
                    className="atlas-lightbox-close"
                    aria-label="Close full-size chart"
                    onClick={() => cue('tick')}
                  >
                    <X aria-hidden="true" />
                  </Dialog.Close>
                  <div className="atlas-lightbox-image">
                    <Image
                      src={chart.src}
                      alt={chart.alt}
                      fill
                      sizes="100vw"
                      priority
                    />
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          ))}
        </div>
      </section>

    </main>
  );
}

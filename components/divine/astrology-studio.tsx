'use client';

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'motion/react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowDown, ChevronDown, ChevronUp, X } from 'lucide-react';
import Image from 'next/image';
import { useExperience } from '@/app/providers';
import {
  alignmentFor,
  ASTROLOGY_CHARTS,
  ASTROLOGY_SIGNS,
} from '@/lib/divine/astrology';
import { ZodiacMark } from './zodiac-mark';

function SignPrism({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const dragStart = useRef<number | null>(null);
  const didDrag = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const selectedSign = ASTROLOGY_SIGNS[value];

  const changeBy = (amount: number) => {
    onChange(
      (value + amount + ASTROLOGY_SIGNS.length) % ASTROLOGY_SIGNS.length,
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const changes: Partial<Record<string, number>> = {
      ArrowUp: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      ArrowRight: 1,
      PageUp: 3,
      PageDown: -3,
    };
    const change = changes[event.key];

    if (change !== undefined) {
      event.preventDefault();
      changeBy(change);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      onChange(event.key === 'Home' ? 0 : ASTROLOGY_SIGNS.length - 1);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStart.current = event.clientY;
    didDrag.current = false;
    setDragOffset(0);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current === null) return;

    const distance = event.clientY - dragStart.current;
    didDrag.current ||= Math.abs(distance) > 4;
    setDragOffset(Math.max(-96, Math.min(96, distance)));
  };

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current === null) return;

    const distance = event.clientY - dragStart.current;
    dragStart.current = null;
    setDragOffset(0);
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(distance) > 18) {
      const steps = Math.min(
        3,
        Math.max(1, Math.round(Math.abs(distance) / 48)),
      );
      changeBy(distance > 0 ? steps : -steps);
    }
  };

  const cancelDrag = () => {
    dragStart.current = null;
    didDrag.current = false;
    setDragOffset(0);
    setIsDragging(false);
  };

  return (
    <div className="sign-prism" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`}>{label}</p>
      <div className="sign-prism-control">
        <button
          type="button"
          className="sign-prism-step"
          aria-label={`Previous ${label.toLowerCase()}`}
          onClick={() => changeBy(1)}
        >
          <ChevronUp aria-hidden="true" />
        </button>
        <button
          type="button"
          className="sign-prism-stage"
          aria-label={`${label}: ${selectedSign.name}. Drag vertically or use the arrow keys to choose a sign.`}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={cancelDrag}
          onClick={(event) => {
            if (didDrag.current) {
              event.preventDefault();
              didDrag.current = false;
              return;
            }

            changeBy(-1);
          }}
        >
          <div
            className={`sign-prism-ring${isDragging ? ' is-dragging' : ''}`}
            style={
              {
                '--prism-index': value,
                '--prism-drag': `${dragOffset * -0.28}deg`,
              } as CSSProperties
            }
          >
            {ASTROLOGY_SIGNS.map((sign, index) => (
              <span
                className="sign-prism-face"
                data-active={index === value}
                aria-hidden={index !== value}
                style={{ '--face-index': index } as CSSProperties}
                key={sign.name}
              >
                <small>{String(index + 1).padStart(2, '0')}</small>
                <ZodiacMark sign={sign.name} />
                <strong>{sign.name}</strong>
                <em>{sign.element}</em>
              </span>
            ))}
          </div>
        </button>
        <button
          type="button"
          className="sign-prism-step"
          aria-label={`Next ${label.toLowerCase()}`}
          onClick={() => changeBy(-1)}
        >
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
      <small className="sign-prism-hint">Drag the wheel or use ↑ ↓</small>
    </div>
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
          <h2 id="alignment-title">How you meet.</h2>
        </header>

        <div className="alignment-controls">
          <SignPrism
            id="first-sign"
            label="First sign"
            value={firstIndex}
            onChange={(value) => {
              setFirstIndex(value);
              cue('tick');
            }}
          />
          <span aria-hidden="true">×</span>
          <SignPrism
            id="second-sign"
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
          <div className="alignment-pair">
            <div aria-hidden="true">
              <ZodiacMark sign={ASTROLOGY_SIGNS[firstIndex].name} />
              <span>×</span>
              <ZodiacMark sign={ASTROLOGY_SIGNS[secondIndex].name} />
            </div>
            <p>
              {ASTROLOGY_SIGNS[firstIndex].name} +{' '}
              {ASTROLOGY_SIGNS[secondIndex].name}
            </p>
            <small>{alignment.label}</small>
          </div>
          <div className="alignment-message">
            <h3>{alignment.headline}</h3>
            <p>{alignment.summary}</p>
          </div>
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
                  <Dialog.Title className="sr-only">{chart.title}</Dialog.Title>
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

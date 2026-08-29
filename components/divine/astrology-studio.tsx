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
  alignmentProfileFor,
  ASTROLOGY_CHARTS,
  ASTROLOGY_SIGNS,
} from '@/lib/divine/astrology';
import { ZodiacMark } from './zodiac-mark';

const ORBIT_CENTER = 260;

function orbitPoint(index: number, radius: number) {
  const angle = ((index * 30 - 90) * Math.PI) / 180;
  return {
    x: ORBIT_CENTER + Math.cos(angle) * radius,
    y: ORBIT_CENTER + Math.sin(angle) * radius,
  };
}

function orbitArc(firstIndex: number, secondIndex: number, radius: number) {
  if (firstIndex === secondIndex) return '';

  const start = orbitPoint(firstIndex, radius);
  const end = orbitPoint(secondIndex, radius);
  const clockwiseDistance =
    (secondIndex - firstIndex + ASTROLOGY_SIGNS.length) %
    ASTROLOGY_SIGNS.length;
  const sweep = clockwiseDistance <= ASTROLOGY_SIGNS.length / 2 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`;
}

function AlignmentOrbit({
  firstIndex,
  secondIndex,
  angle,
  aspect,
}: {
  firstIndex: number;
  secondIndex: number;
  angle: number;
  aspect: { name: string; symbol: string };
}) {
  const firstPoint = orbitPoint(firstIndex, 190);
  const secondPoint = orbitPoint(secondIndex, 190);

  return (
    <figure className="alignment-orbit">
      <svg viewBox="0 0 520 520">
        <title>{`${ASTROLOGY_SIGNS[firstIndex].name} and ${ASTROLOGY_SIGNS[secondIndex].name} form a sign-based ${aspect.name.toLowerCase()} at ${angle} degrees.`}</title>
        <circle className="alignment-orbit-frame" cx="260" cy="260" r="224" />
        <circle className="alignment-orbit-ring" cx="260" cy="260" r="190" />
        <circle className="alignment-orbit-ring" cx="260" cy="260" r="128" />
        <circle className="alignment-orbit-ring" cx="260" cy="260" r="76" />

        {ASTROLOGY_SIGNS.map((sign, index) => {
          const tickStart = orbitPoint(index, 198);
          const tickEnd = orbitPoint(index, 218);
          const mark = orbitPoint(index, 190);
          const isFirst = index === firstIndex;
          const isSecond = index === secondIndex;
          const state =
            isFirst && isSecond
              ? ' is-both'
              : isFirst
                ? ' is-first'
                : isSecond
                  ? ' is-second'
                  : '';

          return (
            <g className={`alignment-orbit-sign${state}`} key={sign.name}>
              <line
                x1={tickStart.x}
                y1={tickStart.y}
                x2={tickEnd.x}
                y2={tickEnd.y}
              />
              <circle cx={mark.x} cy={mark.y} r="18" />
              <g transform={`translate(${mark.x - 10} ${mark.y - 10})`}>
                <ZodiacMark sign={sign.name} size={20} />
              </g>
            </g>
          );
        })}

        <path
          className="alignment-orbit-arc"
          d={orbitArc(firstIndex, secondIndex, 208)}
        />
        <line
          className="alignment-orbit-connection"
          x1={firstPoint.x}
          y1={firstPoint.y}
          x2={secondPoint.x}
          y2={secondPoint.y}
        />
        <line
          className="alignment-orbit-axis"
          x1="260"
          y1="260"
          x2={firstPoint.x}
          y2={firstPoint.y}
        />
        <line
          className="alignment-orbit-axis"
          x1="260"
          y1="260"
          x2={secondPoint.x}
          y2={secondPoint.y}
        />

        <circle className="alignment-orbit-center" cx="260" cy="260" r="58" />
        <text className="alignment-orbit-symbol" x="260" y="250">
          {aspect.symbol}
        </text>
        <text className="alignment-orbit-angle" x="260" y="279">
          {angle}° / {aspect.name}
        </text>
      </svg>
      <figcaption>
        <span>{ASTROLOGY_SIGNS[firstIndex].name}</span>
        <i>{angle}°</i>
        <span>{ASTROLOGY_SIGNS[secondIndex].name}</span>
      </figcaption>
    </figure>
  );
}

function SignPrism({
  label,
  value,
  onChange,
}: {
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
    <div className="sign-prism" aria-label={label}>
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
    () => alignmentProfileFor(firstIndex, secondIndex),
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
            alt="A medieval manuscript zodiac circle with planetary symbols"
            fill
            sizes="(max-width: 760px) 100vw, 48vw"
            priority
          />
        </motion.div>
      </section>

      <nav className="astrology-subnav" aria-label="Astrology sections">
        <a href="#today">Sign reading</a>
        <a href="#alignment">Alignment</a>
        <a href="#atlas">Source plates</a>
      </nav>

      <section
        className="daily-horoscope"
        id="today"
        aria-labelledby="today-title"
      >
        <div
          className="astrology-plate-backdrop astrology-plate-hyginus"
          aria-hidden="true"
        >
          <Image
            src="/astrology/backgrounds/hyginus-equus-1482.webp"
            alt=""
            fill
            sizes="32vw"
          />
        </div>
        <div
          className="astrology-plate-backdrop astrology-plate-stars"
          aria-hidden="true"
        >
          <Image
            src="/astrology/zodiac-star-charts-1750.webp"
            alt=""
            fill
            sizes="75vw"
          />
        </div>
        <header className="astro-section-heading">
          <p>01 / Sign reading</p>
          <h2 id="today-title">A reading for your sign.</h2>
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
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className="horoscope-signature-label">
              <p>{activeSign.name}</p>
              <small>{activeSign.dates}</small>
            </div>
          </div>
          <div className="horoscope-copy">
            <div className="horoscope-copy-backdrop" aria-hidden="true">
              <Image
                src="/astrology/backgrounds/al-sufi-fixed-stars-ca1430.webp"
                alt=""
                fill
                sizes="(max-width: 720px) 100vw, 56vw"
              />
            </div>
            <p className="astro-kicker">Your reading</p>
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
        <div
          className="astrology-plate-backdrop astrology-plate-urania"
          aria-hidden="true"
        >
          <Image
            src="/astrology/backgrounds/uranias-mirror-1825.webp"
            alt=""
            fill
            sizes="58vw"
          />
        </div>
        <div
          className="astrology-plate-backdrop astrology-plate-zodiac-man"
          aria-hidden="true"
        >
          <Image
            src="/astrology/backgrounds/astrological-man-15c.webp"
            alt=""
            fill
            sizes="42vw"
          />
        </div>
        <header className="astro-section-heading alignment-section-heading">
          <h2 id="alignment-title">ALIGNMENT</h2>
        </header>

        <div className="alignment-controls">
          <SignPrism
            label="First sign"
            value={firstIndex}
            onChange={(value) => {
              setFirstIndex(value);
              cue('tick');
            }}
          />
          <span aria-hidden="true">×</span>
          <SignPrism
            label="Second sign"
            value={secondIndex}
            onChange={(value) => {
              setSecondIndex(value);
              cue('tick');
            }}
          />
        </div>

        <motion.article
          className="alignment-field"
          key={`${firstIndex}-${secondIndex}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="alignment-map">
            <header>
              <span>Sign-based aspect map</span>
              <strong>
                {alignment.aspect.symbol} {alignment.aspect.name}
              </strong>
            </header>
            <AlignmentOrbit
              firstIndex={firstIndex}
              secondIndex={secondIndex}
              angle={alignment.angle}
              aspect={alignment.aspect}
            />
          </div>

          <div className="alignment-interpretation">
            <div className="alignment-signature" aria-hidden="true">
              <span>
                <ZodiacMark sign={ASTROLOGY_SIGNS[firstIndex].name} />
                {ASTROLOGY_SIGNS[firstIndex].name}
              </span>
              <i>×</i>
              <span>
                <ZodiacMark sign={ASTROLOGY_SIGNS[secondIndex].name} />
                {ASTROLOGY_SIGNS[secondIndex].name}
              </span>
            </div>
            <p className="astro-kicker">
              Relationship field / {alignment.label}
            </p>
            <h3>{alignment.headline}</h3>
            <p className="alignment-summary">{alignment.summary}</p>

            <div className="alignment-lenses">
              <section>
                <span>01 / Aspect</span>
                <h4>
                  {alignment.aspect.name} <i>{alignment.angle}°</i>
                </h4>
                <p>{alignment.aspect.detail}</p>
              </section>
              <section>
                <span>02 / Element</span>
                <h4>
                  {ASTROLOGY_SIGNS[firstIndex].element} /{' '}
                  {ASTROLOGY_SIGNS[secondIndex].element}
                </h4>
                <p>{alignment.element.detail}</p>
              </section>
              <section>
                <span>03 / Modality</span>
                <h4>
                  {ASTROLOGY_SIGNS[firstIndex].modality} /{' '}
                  {ASTROLOGY_SIGNS[secondIndex].modality}
                </h4>
                <p>{alignment.modality.detail}</p>
              </section>
            </div>
          </div>

          <footer className="alignment-method">
            <p>
              A symbolic Sun-sign comparison using sign geometry, element, and
              modality. Full synastry compares both complete birth charts,
              including planets, houses, and exact degrees.
            </p>
            <nav aria-label="Alignment methodology sources">
              <a
                href="https://www.astro.com/astrology/in_aspect_e.htm"
                target="_blank"
                rel="noreferrer"
              >
                Aspect framework ↗
              </a>
              <a
                href="https://theastrologypodcast.com/2018/07/28/synastry-the-astrology-of-relationships/"
                target="_blank"
                rel="noreferrer"
              >
                Synastry method ↗
              </a>
            </nav>
          </footer>
        </motion.article>
      </section>

      <section
        className="astrology-atlas"
        id="atlas"
        aria-label="Historical astrology charts"
      >
        <div className="atlas-figure-backdrop" aria-hidden="true">
          <Image
            src="/astrology/backgrounds/planetary-personification-detail-1464.webp"
            alt=""
            fill
            sizes="100vw"
          />
        </div>
        <header className="atlas-source-heading">
          <p>Source plates</p>
          <span>
            Historical diagrams used throughout this page. Open any plate to
            inspect the original composition.
          </span>
        </header>
        <div className="atlas-grid">
          {ASTROLOGY_CHARTS.map((chart, index) => (
            <Dialog.Root key={chart.slug}>
              <Dialog.Trigger
                type="button"
                className="atlas-source-trigger"
                aria-label={`View ${chart.title} full size`}
                onClick={() => cue('turn')}
              >
                <span className="atlas-source-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="atlas-source-title">
                  <strong>{chart.title}</strong>
                  <small>{chart.date}</small>
                </span>
                <span className="atlas-source-action">View ↗</span>
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

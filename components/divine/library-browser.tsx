'use client';

import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { animate as motionAnimate, motion, useMotionValue } from 'motion/react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import Image from '@/components/divine/responsive-image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useExperience } from '@/app/providers';
import {
  deckColors,
  imageForFinish,
  isCardSystemSlug,
} from '@/lib/divine/decks';
import {
  LIBRARY_BACKGROUNDS,
  LIBRARY_MASTHEAD_BACKGROUNDS,
  LIBRARY_NAVIGATOR_BACKGROUNDS,
  METHOD_HISTORIES,
} from '@/lib/divine/library';
import { SYSTEMS } from '@/lib/divine/systems';
import type { CardDefinition, SystemSlug } from '@/lib/divine/types';

function CardPortrait({
  card,
  systemSlug,
}: {
  card: CardDefinition;
  systemSlug: SystemSlug;
}) {
  const { cue, deckFinishes } = useExperience();
  const [faceUp, setFaceUp] = useState(true);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const suppressFlip = useRef(false);
  const visualSystem =
    card.sourceSystem && isCardSystemSlug(card.sourceSystem)
      ? card.sourceSystem
      : systemSlug;
  const finish = isCardSystemSlug(visualSystem)
    ? deckFinishes[visualSystem]
    : 'ink';
  const image = imageForFinish(card, finish);

  const settle = () => {
    motionAnimate(tiltX, 0, {
      type: 'spring',
      stiffness: 180,
      damping: 20,
    });
    motionAnimate(tiltY, 0, {
      type: 'spring',
      stiffness: 180,
      damping: 20,
    });
  };

  const turn = () => {
    if (suppressFlip.current) return;
    setFaceUp((current) => !current);
    cue('turn');
  };

  return (
    <motion.button
      type="button"
      className="library-card-object"
      data-system={visualSystem}
      aria-label={`${faceUp ? 'View the back of' : 'Return to'} ${card.name}`}
      aria-pressed={!faceUp}
      onClick={turn}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        turn();
      }}
      style={{
        aspectRatio: card.aspectRatio,
        rotateX: tiltX,
        rotateY: tiltY,
        rotateZ: -1.8,
      }}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        tiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 16);
        tiltX.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 12);
      }}
      onPointerLeave={settle}
      drag
      dragConstraints={{ left: -22, right: 22, top: -18, bottom: 18 }}
      dragElastic={0.12}
      dragMomentum={false}
      onDragStart={() => {
        suppressFlip.current = true;
      }}
      onDrag={(_, info) => {
        tiltY.set(Math.max(-16, Math.min(16, info.offset.x * 0.2)));
        tiltX.set(Math.max(-12, Math.min(12, -info.offset.y * 0.16)));
      }}
      onDragEnd={() => {
        settle();
        window.setTimeout(() => {
          suppressFlip.current = false;
        }, 100);
      }}
      whileHover={{ y: -8, scale: 1.018 }}
      whileTap={{ scale: 0.985 }}
    >
      <motion.span
        className="library-card-turn"
        animate={{ rotateY: faceUp ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 170, damping: 21 }}
      >
        <span
          className={`library-card-portrait deck-${finish}`}
          data-system={visualSystem}
          style={
            isCardSystemSlug(visualSystem)
              ? deckColors(visualSystem, card.id, finish)
              : undefined
          }
        >
          {image ? (
            <Image
              src={image}
              alt=""
              width={520}
              height={820}
              sizes="(max-width: 720px) 42vw, 230px"
              draggable={false}
            />
          ) : (
            <strong aria-hidden="true">{card.glyph}</strong>
          )}
        </span>
        <span
          className="library-card-back card-back"
          data-system={visualSystem}
          aria-hidden="true"
        />
      </motion.span>
    </motion.button>
  );
}

export function LibraryBrowser() {
  const { cue } = useExperience();
  const [activeSlug, setActiveSlug] = useState<SystemSlug>('tarot');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeIndex = Math.max(
    0,
    SYSTEMS.findIndex((item) => item.slug === activeSlug),
  );
  const system = SYSTEMS[activeIndex] ?? SYSTEMS[0];
  const previousSystem =
    SYSTEMS[(activeIndex - 1 + SYSTEMS.length) % SYSTEMS.length];
  const nextSystem = SYSTEMS[(activeIndex + 1) % SYSTEMS.length];
  const history = METHOD_HISTORIES[system.slug];
  const navigatorBackgrounds = LIBRARY_NAVIGATOR_BACKGROUNDS[system.slug];
  const cardBackground = navigatorBackgrounds.card;
  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return system.cards;
    return system.cards.filter((card) =>
      [
        card.name,
        card.domain,
        card.element,
        card.subject,
        card.modifier,
        card.sourceSystemName,
        ...card.keywords,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [query, system]);
  const selected =
    system.cards.find((card) => card.id === selectedId) ??
    filteredCards[0] ??
    system.cards[0] ??
    null;

  const chooseSystem = (slug: SystemSlug) => {
    cue('turn');
    setActiveSlug(slug);
    setQuery('');
    setSelectedId(null);
  };

  const flipSystem = (direction: -1 | 1) => {
    const nextIndex =
      (activeIndex + direction + SYSTEMS.length) % SYSTEMS.length;
    chooseSystem(SYSTEMS[nextIndex].slug);
  };

  const handleRolodexKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      flipSystem(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      flipSystem(1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      chooseSystem(SYSTEMS[0].slug);
    } else if (event.key === 'End') {
      event.preventDefault();
      chooseSystem(SYSTEMS[SYSTEMS.length - 1].slug);
    }
  };

  return (
    <main className="library-page">
      <header className="library-masthead">
        <div className="library-masthead-backgrounds" aria-hidden="true">
          {LIBRARY_MASTHEAD_BACKGROUNDS.map((background) => (
            <div
              className={`library-masthead-background is-${background.backgroundLayer}`}
              data-fit={background.backgroundFit}
              data-mobile-hidden={background.hideOnMobile || undefined}
              data-tone={background.backgroundTone}
              key={background.backgroundImage}
              style={
                {
                  '--library-masthead-opacity': background.backgroundOpacity,
                  '--library-masthead-position': background.backgroundPosition,
                  '--library-masthead-position-mobile':
                    background.backgroundPositionMobile,
                  '--library-masthead-scale': background.backgroundScale,
                } as CSSProperties
              }
            >
              <Image
                alt=""
                draggable={false}
                fill
                priority={background.backgroundLayer === 'field'}
                sizes={
                  background.backgroundLayer === 'field'
                    ? '100vw'
                    : background.backgroundLayer === 'right'
                      ? '(max-width: 760px) 52vw, 30vw'
                      : '58vw'
                }
                src={background.backgroundImage}
              />
            </div>
          ))}
        </div>
        <p className="eyebrow">Reference</p>
        <h1>Library</h1>
      </header>

      <nav className="library-system-nav" aria-label="Reading methods">
        <button
          className="library-rolodex-control is-previous"
          type="button"
          aria-label={`Previous reading method: ${previousSystem.name}`}
          onClick={() => flipSystem(-1)}
          onKeyDown={handleRolodexKeyDown}
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        <div className="library-rolodex-deck" aria-live="polite">
          <article className="library-rolodex-card" key={system.slug}>
            <div
              className="library-rolodex-card-art"
              data-fit={navigatorBackgrounds.cardFit ?? 'cover'}
              data-tone={cardBackground.backgroundTone}
              aria-hidden="true"
            >
              <Image
                alt=""
                draggable={false}
                fill
                sizes="80vw"
                src={cardBackground.backgroundImage}
                style={
                  {
                    '--library-card-position':
                      navigatorBackgrounds.cardPosition ??
                      cardBackground.backgroundPosition,
                    '--library-card-position-mobile':
                      navigatorBackgrounds.cardPositionMobile ??
                      cardBackground.backgroundPositionMobile,
                    '--library-card-scale':
                      navigatorBackgrounds.cardScale ??
                      cardBackground.backgroundScale,
                  } as CSSProperties
                }
              />
            </div>
            <span className="library-rolodex-tab" aria-hidden="true">
              {`${activeIndex + 1}`.padStart(2, '0')}
            </span>
            <strong>{system.name}</strong>
            <small>
              {`${activeIndex + 1}`.padStart(2, '0')} / {SYSTEMS.length}
            </small>
          </article>
        </div>

        <button
          className="library-rolodex-control is-next"
          type="button"
          aria-label={`Next reading method: ${nextSystem.name}`}
          onClick={() => flipSystem(1)}
          onKeyDown={handleRolodexKeyDown}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </nav>

      <section className="method-history" aria-labelledby="method-title">
        <div className="method-history-backgrounds" aria-hidden="true">
          {LIBRARY_BACKGROUNDS[system.slug].map((background) => (
            <div
              className={`method-history-background is-${background.backgroundLayer}`}
              data-fit={background.backgroundFit ?? 'cover'}
              data-tone={background.backgroundTone}
              key={background.backgroundImage}
              style={
                {
                  '--library-background-position':
                    background.backgroundPosition,
                  '--library-background-position-mobile':
                    background.backgroundPositionMobile,
                  '--library-background-scale': background.backgroundScale,
                  '--library-background-scale-mobile':
                    background.backgroundScaleMobile,
                  '--library-background-opacity': background.backgroundOpacity,
                } as CSSProperties
              }
            >
              <Image
                alt=""
                draggable={false}
                fill
                sizes={
                  background.backgroundLayer === 'field' ||
                  background.backgroundLayer === 'top' ||
                  background.backgroundLayer === 'bottom'
                    ? '100vw'
                    : '(max-width: 760px) 100vw, 46vw'
                }
                src={background.backgroundImage}
              />
            </div>
          ))}
        </div>
        <div className="method-history-layout">
          <header>
            <p>{history.period}</p>
            <p>{history.origin}</p>
          </header>
          <div className="method-history-copy">
            <p className="eyebrow">{system.name} / History</p>
            <h2 id="method-title">{history.title}</h2>
            {history.history.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {history.variant && (
              <aside>
                <small>Variant note</small>
                <p>{history.variant}</p>
              </aside>
            )}
            <div className="method-history-actions">
              <Link href={`/read/${system.slug}`}>
                Begin a reading <ArrowRight />
              </Link>
              {history.source && (
                <a href={history.source.url} target="_blank" rel="noreferrer">
                  Source · {history.source.label} <ExternalLink />
                </a>
              )}
              {system.slug === 'fortune-cookie' && (
                <a
                  href="https://poly.pizza/m/8diHwxl9PEK"
                  target="_blank"
                  rel="noreferrer"
                >
                  3D model · Poly by Google <ExternalLink />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card-library" aria-labelledby="cards-title">
        <header>
          <div>
            <p className="eyebrow">The symbols</p>
            <h2 id="cards-title">
              {system.cards.length
                ? `${system.cards.length} meanings`
                : 'No fixed deck'}
            </h2>
          </div>
          {system.cards.length > 0 && (
            <label className="library-search">
              <Search />
              <span className="sr-only">Search {system.name} cards</span>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, keyword, element…"
              />
            </label>
          )}
        </header>

        {selected ? (
          <div className="card-library-layout">
            <div className="card-index" aria-label={`${system.name} cards`}>
              {filteredCards.map((card) => (
                <button
                  type="button"
                  key={card.id}
                  className={selected.id === card.id ? 'active' : ''}
                  aria-pressed={selected.id === card.id}
                  onClick={() => setSelectedId(card.id)}
                >
                  <strong>{card.name}</strong>
                  <em>
                    {card.sourceSystemName
                      ? `${card.sourceSystemName} · ${card.keywords[0]}`
                      : card.keywords[0]}
                  </em>
                </button>
              ))}
              {filteredCards.length === 0 && (
                <p className="library-empty">No cards match that search.</p>
              )}
            </div>
            <article className="card-profile" key={selected.id}>
              <CardPortrait card={selected} systemSlug={system.slug} />
              <div className="card-profile-copy">
                <p className="eyebrow">
                  {selected.sourceSystemName ?? system.name} /{' '}
                  {selected.domain ?? 'Card'}
                </p>
                <h3>{selected.name}</h3>
                <p className="card-keywords">{selected.keywords.join(' · ')}</p>
                <section>
                  <small>Upright</small>
                  <p>{selected.meaning}</p>
                </section>
                {selected.reversedMeaning && (
                  <section>
                    <small>Reversed / Obscured</small>
                    <p>{selected.reversedMeaning}</p>
                  </section>
                )}
                <dl>
                  {selected.element && (
                    <>
                      <dt>Element</dt>
                      <dd>{selected.element}</dd>
                    </>
                  )}
                  {selected.numerology !== undefined && (
                    <>
                      <dt>Number</dt>
                      <dd>{selected.numerology}</dd>
                    </>
                  )}
                  {selected.timing && (
                    <>
                      <dt>Timing</dt>
                      <dd>{selected.timing}</dd>
                    </>
                  )}
                  {selected.polarity && (
                    <>
                      <dt>Polarity</dt>
                      <dd>{selected.polarity}</dd>
                    </>
                  )}
                </dl>
                {selected.provenance && (
                  <p className="card-provenance">{selected.provenance}</p>
                )}
              </div>
            </article>
          </div>
        ) : (
          <div className="library-no-deck">
            <strong>This method has no fixed deck.</strong>
            <p>
              {system.kind === 'ball'
                ? 'Ask a yes-or-no question, then shake the ball for one of twenty-four answers.'
                : 'Choose and break a cookie to receive one of 144 messages.'}
            </p>
            <Link href={`/read/${system.slug}`}>
              Begin <ArrowRight />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

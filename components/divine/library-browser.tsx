'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useExperience } from '@/app/providers';
import {
  deckColors,
  imageForFinish,
  isCardSystemSlug,
} from '@/lib/divine/decks';
import { METHOD_HISTORIES } from '@/lib/divine/library';
import { SYSTEMS } from '@/lib/divine/systems';
import type { CardDefinition, SystemSlug } from '@/lib/divine/types';

function circularOffset(index: number, activeIndex: number, total: number) {
  let offset = index - activeIndex;
  const midpoint = total / 2;

  if (offset > midpoint) offset -= total;
  if (offset < -midpoint) offset += total;

  return offset;
}

function CardPortrait({
  card,
  systemSlug,
}: {
  card: CardDefinition;
  systemSlug: SystemSlug;
}) {
  const { deckFinishes } = useExperience();
  const visualSystem =
    card.sourceSystem && isCardSystemSlug(card.sourceSystem)
      ? card.sourceSystem
      : systemSlug;
  const finish = isCardSystemSlug(visualSystem)
    ? deckFinishes[visualSystem]
    : 'ink';
  const image = imageForFinish(card, finish);
  return (
    <div
      className={`library-card-portrait deck-${finish}`}
      data-system={visualSystem}
      style={{
        ...(isCardSystemSlug(visualSystem)
          ? deckColors(visualSystem, card.id, finish)
          : undefined),
        aspectRatio: card.aspectRatio,
      }}
      aria-hidden="true"
    >
      {image ? (
        <Image
          src={image}
          alt=""
          width={520}
          height={820}
          sizes="(max-width: 720px) 42vw, 230px"
        />
      ) : (
        <strong>{card.glyph}</strong>
      )}
    </div>
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
  const history = METHOD_HISTORIES[system.slug];
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
    cue('tick');
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
        <p className="eyebrow">Reference</p>
        <h1>Library</h1>
      </header>

      <nav className="library-system-nav" aria-label="Reading methods">
        <div className="library-rolodex-heading" aria-hidden="true">
          <span>Reading index</span>
          <span>Flip through the archive</span>
        </div>

        <button
          className="library-rolodex-control is-previous"
          type="button"
          aria-label="Previous reading method"
          onClick={() => flipSystem(-1)}
          onKeyDown={handleRolodexKeyDown}
        >
          <ChevronLeft aria-hidden="true" />
          <span>Previous</span>
        </button>

        <div className="library-rolodex-deck">
          {SYSTEMS.map((item, index) => {
            const offset = circularOffset(index, activeIndex, SYSTEMS.length);
            const distance = Math.abs(offset);
            const itemHistory = METHOD_HISTORIES[item.slug];
            const isActive = item.slug === system.slug;

            return (
              <button
                type="button"
                key={item.slug}
                className={`library-rolodex-card${isActive ? ' active' : ''}${distance > 2 ? ' is-hidden' : ''}`}
                aria-pressed={isActive}
                aria-label={`Select ${item.name}`}
                tabIndex={distance <= 2 ? 0 : -1}
                onClick={() => chooseSystem(item.slug)}
                style={
                  {
                    '--rolodex-x': `${offset * 44}%`,
                    '--rolodex-mobile-x': `${offset * 78}%`,
                    '--rolodex-y': `${distance * 14}px`,
                    '--rolodex-z': `${distance * -72}px`,
                    '--rolodex-rotate-y': `${offset * -7}deg`,
                    '--rolodex-rotate-z': `${offset * 0.8}deg`,
                    '--rolodex-hover-rotate-y': `${offset * -4}deg`,
                    '--rolodex-hover-rotate-z': `${offset * 0.4}deg`,
                    zIndex: SYSTEMS.length - distance,
                  } as CSSProperties
                }
              >
                <span className="library-rolodex-tab" aria-hidden="true">
                  {`${index + 1}`.padStart(2, '0')}
                </span>
                <span className="library-rolodex-card-top">
                  <small>Reading method</small>
                  <small>
                    {`${index + 1}`.padStart(2, '0')} / {SYSTEMS.length}
                  </small>
                </span>
                <strong>{item.name}</strong>
                <span className="library-rolodex-card-bottom">
                  <small>{itemHistory.origin}</small>
                  <small>{itemHistory.period}</small>
                </span>
              </button>
            );
          })}
          <span className="library-rolodex-spindle" aria-hidden="true">
            <i />
            <i />
          </span>
        </div>

        <button
          className="library-rolodex-control is-next"
          type="button"
          aria-label="Next reading method"
          onClick={() => flipSystem(1)}
          onKeyDown={handleRolodexKeyDown}
        >
          <span>Next</span>
          <ChevronRight aria-hidden="true" />
        </button>

        <div
          className="library-rolodex-index"
          aria-label="Choose a reading method"
        >
          {SYSTEMS.map((item, index) => (
            <button
              type="button"
              key={item.slug}
              className={item.slug === system.slug ? 'active' : ''}
              aria-label={item.name}
              aria-current={item.slug === system.slug ? 'true' : undefined}
              onClick={() => chooseSystem(item.slug)}
              onKeyDown={handleRolodexKeyDown}
            >
              <span>{`${index + 1}`.padStart(2, '0')}</span>
            </button>
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          {system.name}, method {activeIndex + 1} of {SYSTEMS.length}
        </p>
      </nav>

      <section className="method-history" aria-labelledby="method-title">
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
                <p className="library-empty">No symbol answers that name.</p>
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
            <strong>Chance has no index.</strong>
            <p>
              {system.kind === 'ball'
                ? 'Twenty-four original verdicts appear only after the object is disturbed.'
                : 'One of 144 original messages appears only after the shell is broken.'}
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

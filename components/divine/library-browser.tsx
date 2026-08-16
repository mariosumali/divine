'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Search } from 'lucide-react';
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

function CardPortrait({
  card,
  systemSlug,
}: {
  card: CardDefinition;
  systemSlug: SystemSlug;
}) {
  const { deckFinishes } = useExperience();
  const finish = isCardSystemSlug(systemSlug)
    ? deckFinishes[systemSlug]
    : 'ink';
  const image = imageForFinish(card, finish);
  return (
    <div
      className={`library-card-portrait deck-${finish}`}
      style={
        isCardSystemSlug(systemSlug)
          ? deckColors(systemSlug, card.id, finish)
          : undefined
      }
      aria-hidden="true"
    >
      <small>{card.domain ?? 'symbol'}</small>
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
      <span>DIVINE</span>
    </div>
  );
}

export function LibraryBrowser() {
  const [activeSlug, setActiveSlug] = useState<SystemSlug>('tarot');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const system = SYSTEMS.find((item) => item.slug === activeSlug) ?? SYSTEMS[0];
  const history = METHOD_HISTORIES[system.slug];
  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return system.cards;
    return system.cards.filter((card) =>
      [card.name, card.domain, card.element, ...card.keywords]
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
    setActiveSlug(slug);
    setQuery('');
    setSelectedId(null);
  };

  return (
    <main className="library-page">
      <header className="library-masthead">
        <p className="eyebrow">Reference</p>
        <h1>Library</h1>
        <p>History above. Meaning below.</p>
      </header>

      <nav className="library-system-nav" aria-label="Reading methods">
        {SYSTEMS.map((item) => (
          <button
            type="button"
            key={item.slug}
            className={item.slug === system.slug ? 'active' : ''}
            aria-pressed={item.slug === system.slug}
            onClick={() => chooseSystem(item.slug)}
          >
            {item.name}
          </button>
        ))}
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
                  <em>{card.keywords[0]}</em>
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
                  {system.name} / {selected.domain ?? 'Card'}
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

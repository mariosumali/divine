'use client';

import { Dialog } from '@base-ui/react/dialog';
import { ArrowLeft, ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import Image from '@/components/divine/responsive-image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useExperience } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CATALOG_SYSTEMS,
  READING_INDEX_ART,
  readingIndexArtTreatment,
} from '@/lib/divine/catalog';
import type { GalleryItem } from '@/lib/divine/gallery';

const BATCH_SIZE = 56;
const BASES_PER_BOARD = 14;
const OBJECTS_PER_BOARD = 5;

const READING_SYMBOLS = [
  ...new Set(
    CATALOG_SYSTEMS.filter(
      (system) => readingIndexArtTreatment(system.slug) === 'cutout',
    ).map((system) => READING_INDEX_ART[system.slug]),
  ),
];

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

const PIECE_SLOTS = [
  { left: -3, top: -4, width: 29, rotate: -4, z: 5 },
  { left: 16, top: 3, width: 28, rotate: 2, z: 7 },
  { left: 36, top: -5, width: 31, rotate: -1, z: 10 },
  { left: 59, top: 3, width: 29, rotate: 3, z: 6 },
  { left: 81, top: -3, width: 25, rotate: -3, z: 8 },
  { left: -5, top: 29, width: 30, rotate: 3, z: 8 },
  { left: 16, top: 34, width: 27, rotate: -4, z: 6 },
  { left: 36, top: 29, width: 33, rotate: 1, z: 10 },
  { left: 62, top: 34, width: 29, rotate: -3, z: 7 },
  { left: 84, top: 30, width: 24, rotate: 4, z: 9 },
  { left: -4, top: 63, width: 31, rotate: -3, z: 7 },
  { left: 22, top: 60, width: 30, rotate: 3, z: 9 },
  { left: 48, top: 65, width: 31, rotate: -2, z: 8 },
  { left: 74, top: 60, width: 33, rotate: 3, z: 7 },
] as const;

const OBJECT_SLOTS = [
  { left: 8, top: 14, width: 14, rotate: -10 },
  { left: 43, top: 12, width: 13, rotate: 8 },
  { left: 78, top: 18, width: 14, rotate: -8 },
  { left: 20, top: 57, width: 15, rotate: 7 },
  { left: 67, top: 60, width: 14, rotate: -9 },
] as const;

function shuffleItems(items: GalleryItem[], seed: number) {
  const shuffled = [...items];
  let state = seed || 0x6d2b79f5;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function collagePieceStyle(
  item: GalleryItem,
  index: number,
  boardIndex: number,
  visitSeed: number,
) {
  const slot = PIECE_SLOTS[(index + boardIndex * 3) % PIECE_SLOTS.length];
  const value = hash(`${visitSeed}-${item.id}-${boardIndex}`);
  const isPortrait = item.kind === 'card' || item.kind === 'portrait';
  const scale = isPortrait ? 0.82 : item.kind === 'portal' ? 0.88 : 1;
  return {
    '--piece-left': `${slot.left + ((value >> 3) % 5) - 2}%`,
    '--piece-top': `${slot.top + ((value >> 5) % 5) - 2}%`,
    '--piece-width': `${Math.max(17, slot.width * scale)}%`,
    '--piece-aspect': `${Math.min(2.05, Math.max(0.52, item.aspectRatio))}`,
    '--piece-rotate': `${slot.rotate + ((value % 7) - 3) * 0.4}deg`,
    '--piece-z': slot.z + (value % 3),
  } as CSSProperties;
}

function collageObjectStyle(
  item: GalleryItem,
  index: number,
  boardIndex: number,
  visitSeed: number,
) {
  const value = hash(`${visitSeed}-${item.id}-${boardIndex}`);
  const slot = OBJECT_SLOTS[(index + boardIndex * 3) % OBJECT_SLOTS.length];
  const original = item.collection === 'DIVINE objects';
  return {
    '--object-left': `${slot.left + ((value >> 3) % 7) - 3}%`,
    '--object-top': `${slot.top + ((value >> 6) % 7) - 3}%`,
    '--object-width': `${slot.width * (original ? 1.08 : 0.9)}%`,
    '--object-rotate': `${slot.rotate + ((value % 9) - 4) * 0.65}deg`,
    '--object-z': 18 + (value % 9),
  } as CSSProperties;
}

export function GalleryCollection({ items }: { items: GalleryItem[] }) {
  const { cue, deckFinishes } = useExperience();
  const [visitSeed, setVisitSeed] = useState(0);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      setVisitSeed(values[0] || Date.now());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const galleryItems = useMemo(
    () => (visitSeed ? shuffleItems(items, visitSeed) : items),
    [items, visitSeed],
  );

  const matchedItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return galleryItems.filter((item) => {
      if (!normalizedQuery) return true;
      return `${item.title} ${item.collection} ${item.detail}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [galleryItems, query]);

  const allBaseItems = useMemo(
    () => galleryItems.filter((item) => item.kind !== 'cutout'),
    [galleryItems],
  );
  const backdropItems = useMemo(
    () => allBaseItems.filter((item) => item.kind === 'plate'),
    [allBaseItems],
  );
  const matchedBaseItems = useMemo(
    () => matchedItems.filter((item) => item.kind !== 'cutout'),
    [matchedItems],
  );
  const matchedObjectItems = useMemo(
    () => matchedItems.filter((item) => item.kind === 'cutout'),
    [matchedItems],
  );
  const overlayItems = matchedObjectItems;
  const collectionBaseItems = useMemo(() => {
    const result = [...matchedBaseItems];
    const used = new Set(result.map((item) => item.id));
    const supportStride = Math.ceil(BASES_PER_BOARD / OBJECTS_PER_BOARD);
    const requiredSupports = matchedItems.length
      ? Math.max(BASES_PER_BOARD, overlayItems.length * supportStride)
      : 0;

    if (result.length < requiredSupports) {
      for (const item of allBaseItems) {
        if (used.has(item.id)) continue;
        result.push(item);
        used.add(item.id);
        if (result.length >= requiredSupports) break;
      }
    }

    return result;
  }, [
    allBaseItems,
    matchedBaseItems,
    matchedItems.length,
    overlayItems.length,
  ]);
  const objectAssignments = useMemo(() => {
    const assignments = new Map<string, GalleryItem[]>();
    const baseCount = collectionBaseItems.length;
    if (!baseCount) return assignments;

    collectionBaseItems.forEach((baseItem, index) => {
      const start = Math.floor((index * overlayItems.length) / baseCount);
      const end = Math.floor(((index + 1) * overlayItems.length) / baseCount);
      assignments.set(baseItem.id, overlayItems.slice(start, end));
    });
    return assignments;
  }, [collectionBaseItems, overlayItems]);
  const matchedIds = useMemo(
    () => new Set(matchedItems.map((item) => item.id)),
    [matchedItems],
  );
  const navigableItems = useMemo(() => {
    const visibleIds = new Set([
      ...matchedItems.map((item) => item.id),
      ...overlayItems.map((item) => item.id),
    ]);
    return galleryItems.filter((item) => visibleIds.has(item.id));
  }, [galleryItems, matchedItems, overlayItems]);
  const sequence = useMemo(
    () => new Map(navigableItems.map((item, index) => [item.id, index + 1])),
    [navigableItems],
  );
  const visibleBaseItems = collectionBaseItems.slice(0, visibleCount);
  const visibleOverlayItems = visibleBaseItems.flatMap(
    (item) => objectAssignments.get(item.id) ?? [],
  );
  const visibleResultCount = new Set(
    [...visibleBaseItems, ...visibleOverlayItems]
      .filter((item) => matchedIds.has(item.id))
      .map((item) => item.id),
  ).size;
  const hasMore = visibleCount < collectionBaseItems.length;
  const activeIndex = activeId
    ? navigableItems.findIndex((item) => item.id === activeId)
    : -1;
  const activeItem = activeIndex >= 0 ? navigableItems[activeIndex] : null;
  const mastheadItems = useMemo(() => {
    const field = galleryItems.find((item) => item.kind === 'plate');
    return {
      field,
      card: galleryItems.find((item) => item.kind === 'card'),
      symbol:
        READING_SYMBOLS[
          hash(`masthead-symbol-${visitSeed}`) % READING_SYMBOLS.length
        ],
      orbit: galleryItems.find(
        (item) => item.category === 'celestial' && item.id !== field?.id,
      ),
    };
  }, [galleryItems, visitSeed]);

  const imageSource = useCallback(
    (item: GalleryItem) => {
      if (
        item.systemSlug &&
        deckFinishes[item.systemSlug] === 'ink' &&
        item.inkSrc
      ) {
        return item.inkSrc;
      }
      return item.src;
    },
    [deckFinishes],
  );

  const isInk = useCallback(
    (item: GalleryItem) =>
      Boolean(item.systemSlug && deckFinishes[item.systemSlug] === 'ink'),
    [deckFinishes],
  );

  const loadMore = useCallback(() => {
    setVisibleCount((current) =>
      Math.min(current + BATCH_SIZE, collectionBaseItems.length),
    );
  }, [collectionBaseItems.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: '900px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex =
        (activeIndex + direction + navigableItems.length) %
        navigableItems.length;
      setActiveId(navigableItems[nextIndex]?.id ?? null);
      cue('tick');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, activeItem, cue, navigableItems]);

  const showAdjacent = (direction: -1 | 1) => {
    if (!navigableItems.length) return;
    const nextIndex =
      (activeIndex + direction + navigableItems.length) % navigableItems.length;
    setActiveId(navigableItems[nextIndex]?.id ?? null);
    cue('tick');
  };

  return (
    <main className="gallery-page">
      <header className="gallery-masthead" aria-labelledby="gallery-title">
        <span className="gallery-masthead-field" aria-hidden="true">
          <Image
            src={
              mastheadItems.field?.src ??
              '/library/backgrounds/library-masthead-sense-of-sight-1617.webp'
            }
            alt=""
            fill
            sizes="100vw"
            priority
          />
        </span>
        <span
          className="gallery-masthead-card"
          style={{
            top: 'clamp(14px, 3vw, 30px)',
            left: 'clamp(18px, 3vw, 52px)',
            width: 'clamp(96px, 12vw, 182px)',
            height: '44%',
          }}
          aria-hidden="true"
        >
          <Image
            src={
              mastheadItems.card
                ? imageSource(mastheadItems.card)
                : '/tarot-color/major-2.webp'
            }
            alt=""
            fill
            sizes="240px"
          />
        </span>
        <span
          className="gallery-masthead-hand"
          style={{
            top: 'clamp(8px, 1.5vw, 22px)',
            right: 'clamp(24px, 7vw, 110px)',
            width: 'clamp(220px, 28vw, 450px)',
            height: '76%',
            transform: 'rotate(6deg)',
          }}
          aria-hidden="true"
        >
          <span
            style={{
              position: 'absolute',
              display: 'block',
              inset: 'clamp(18px, 2.5vw, 40px)',
            }}
          >
            <Image
              src={mastheadItems.symbol ?? '/collage-v1/hand.webp'}
              alt=""
              fill
              sizes="300px"
              style={{ objectFit: 'contain' }}
            />
          </span>
        </span>
        <span className="gallery-masthead-orbit" aria-hidden="true">
          <Image
            src={
              mastheadItems.orbit?.src ??
              '/astrology/zodiac-circle-medieval.webp'
            }
            alt=""
            fill
            sizes="360px"
          />
        </span>

        <p className="gallery-eyebrow">The visual world of DIVINE</p>
        <h1 id="gallery-title">Gallery</h1>
        <div className="gallery-masthead-meta">
          <p>
            Cards, objects, paintings, and celestial charts in one living
            archive.
          </p>
        </div>
      </header>

      <section
        className="gallery-toolbar"
        aria-label="Browse and search the gallery"
      >
        <label
          className="gallery-search"
          data-has-query={query.length > 0}
          htmlFor="gallery-search-input"
        >
          <Search aria-hidden="true" />
          <Input
            id="gallery-search-input"
            type="search"
            value={query}
            aria-label="Search the gallery"
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setVisibleCount(BATCH_SIZE);
              setActiveId(null);
            }}
          />
        </label>
      </section>

      <section className="gallery-collection" aria-label="Gallery works">
        {Array.from(
          { length: Math.ceil(visibleBaseItems.length / BASES_PER_BOARD) },
          (_, boardIndex) => {
            const boardItems = visibleBaseItems.slice(
              boardIndex * BASES_PER_BOARD,
              (boardIndex + 1) * BASES_PER_BOARD,
            );
            const boardObjects = boardItems.flatMap(
              (item) => objectAssignments.get(item.id) ?? [],
            );
            const backdrop = backdropItems[boardIndex % backdropItems.length];

            return (
              <div
                className="gallery-collage-board"
                key={`board-${boardIndex}`}
              >
                {backdrop && (
                  <span className="gallery-collage-backdrop" aria-hidden="true">
                    <Image src={backdrop.src} alt="" fill sizes="100vw" />
                  </span>
                )}

                {boardItems.map((item, itemIndex) => {
                  const isSupportingImage = !matchedIds.has(item.id);
                  return (
                    <figure
                      className="gallery-collage-piece"
                      data-kind={item.kind}
                      data-fit={item.fit}
                      data-finish={isInk(item) ? 'ink' : 'color'}
                      style={collagePieceStyle(
                        item,
                        itemIndex,
                        boardIndex,
                        visitSeed,
                      )}
                      key={item.id}
                    >
                      {isSupportingImage ? (
                        <span
                          className="gallery-work-support"
                          aria-hidden="true"
                        >
                          <span className="gallery-work-image">
                            <Image
                              src={imageSource(item)}
                              alt=""
                              fill
                              sizes="(max-width: 720px) 48vw, 28vw"
                            />
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="gallery-work-trigger"
                          aria-label={`Open ${item.title} from ${item.collection}`}
                          onClick={() => {
                            setActiveId(item.id);
                            cue('turn');
                          }}
                        >
                          <span className="gallery-work-image">
                            <Image
                              src={imageSource(item)}
                              alt=""
                              fill
                              sizes="(max-width: 720px) 48vw, 28vw"
                            />
                          </span>
                          <figcaption>
                            <small>{item.collection}</small>
                            <strong>{item.title}</strong>
                            <i>
                              {String(sequence.get(item.id) ?? 0).padStart(
                                3,
                                '0',
                              )}
                            </i>
                          </figcaption>
                        </button>
                      )}
                    </figure>
                  );
                })}

                {boardObjects.map((object, objectIndex) => (
                  <button
                    type="button"
                    className="gallery-collage-object"
                    data-original={
                      object.collection === 'DIVINE objects' ? 'true' : 'false'
                    }
                    style={collageObjectStyle(
                      object,
                      objectIndex,
                      boardIndex,
                      visitSeed,
                    )}
                    aria-label={`Open ${object.title} from ${object.collection}`}
                    key={object.id}
                    onClick={() => {
                      setActiveId(object.id);
                      cue('turn');
                    }}
                  >
                    <span className="gallery-collage-object-image">
                      <Image
                        src={object.src}
                        alt=""
                        fill
                        sizes="(max-width: 720px) 34vw, 20vw"
                      />
                    </span>
                    <span className="gallery-collage-object-caption">
                      <small>{object.collection}</small>
                      <strong>{object.title}</strong>
                    </span>
                  </button>
                ))}
              </div>
            );
          },
        )}
      </section>

      {matchedItems.length === 0 && (
        <div className="gallery-empty">
          <span>Nothing found</span>
          <p>Try another title, deck, or collection.</p>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setQuery('');
              setVisibleCount(BATCH_SIZE);
              setActiveId(null);
            }}
          >
            Clear search
          </Button>
        </div>
      )}

      <div className="gallery-progress" ref={sentinelRef}>
        <p aria-live="polite">
          Showing {visibleResultCount.toLocaleString()} of{' '}
          {matchedItems.length.toLocaleString()} works
        </p>
        {hasMore && (
          <Button variant="outline" type="button" onClick={loadMore}>
            Continue the collection
          </Button>
        )}
      </div>

      <Dialog.Root
        open={Boolean(activeItem)}
        onOpenChange={(open) => {
          if (!open) setActiveId(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="gallery-lightbox-backdrop" />
          {activeItem && (
            <Dialog.Popup className="gallery-lightbox">
              <Dialog.Close
                type="button"
                className="gallery-lightbox-close"
                aria-label="Close image"
              >
                <X />
              </Dialog.Close>
              <div
                className="gallery-lightbox-stage"
                data-finish={isInk(activeItem) ? 'ink' : 'color'}
              >
                <Image
                  src={imageSource(activeItem)}
                  alt={`${activeItem.title} — ${activeItem.collection}`}
                  fill
                  sizes="(max-width: 720px) 100vw, 75vw"
                />
                <div className="gallery-lightbox-navigation">
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    aria-label="Previous work"
                    onClick={() => showAdjacent(-1)}
                  >
                    <ArrowLeft />
                  </Button>
                  <span>
                    {String(activeIndex + 1).padStart(3, '0')} /{' '}
                    {String(navigableItems.length).padStart(3, '0')}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    aria-label="Next work"
                    onClick={() => showAdjacent(1)}
                  >
                    <ArrowRight />
                  </Button>
                </div>
              </div>
              <div className="gallery-lightbox-copy">
                <p>{activeItem.collection}</p>
                <Dialog.Title>{activeItem.title}</Dialog.Title>
                <Dialog.Description>{activeItem.detail}</Dialog.Description>
                <div className="gallery-lightbox-links">
                  {activeItem.readingHref && (
                    <Link href={activeItem.readingHref}>
                      Enter the reading ↗
                    </Link>
                  )}
                  {activeItem.sourceUrl && (
                    <a
                      href={activeItem.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Museum source <ExternalLink />
                    </a>
                  )}
                </div>
                <small>
                  Use the arrow keys to move through the collection.
                </small>
              </div>
            </Dialog.Popup>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}

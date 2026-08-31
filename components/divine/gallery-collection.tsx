'use client';

import { Dialog } from '@base-ui/react/dialog';
import { ArrowLeft, ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useExperience } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GalleryCategory, GalleryItem } from '@/lib/divine/gallery';

const BATCH_SIZE = 40;
const BASES_PER_BOARD = 10;
const OBJECTS_PER_BOARD = 4;

type GalleryFilter = 'all' | GalleryCategory;

const FILTERS: ReadonlyArray<{ key: GalleryFilter; label: string }> = [
  { key: 'all', label: 'All works' },
  { key: 'cards', label: 'Cards' },
  { key: 'objects', label: 'Objects' },
  { key: 'celestial', label: 'Celestial' },
  { key: 'archive', label: 'Archive' },
];

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

const PIECE_SLOTS = [
  { left: -5, top: 3, width: 34, rotate: -4, z: 5 },
  { left: 20, top: -3, width: 36, rotate: 2, z: 7 },
  { left: 49, top: 6, width: 43, rotate: -1, z: 10 },
  { left: 82, top: 0, width: 29, rotate: 4, z: 6 },
  { left: 1, top: 38, width: 39, rotate: 3, z: 9 },
  { left: 31, top: 31, width: 41, rotate: -3, z: 8 },
  { left: 69, top: 37, width: 37, rotate: 3, z: 9 },
  { left: -5, top: 68, width: 36, rotate: -3, z: 6 },
  { left: 25, top: 62, width: 41, rotate: 2, z: 10 },
  { left: 65, top: 66, width: 43, rotate: -2, z: 7 },
] as const;

const OBJECT_SLOTS = [
  { left: 9, top: 16, width: 19, rotate: -10 },
  { left: 73, top: 18, width: 18, rotate: 8 },
  { left: 15, top: 58, width: 21, rotate: 7 },
  { left: 68, top: 61, width: 20, rotate: -9 },
] as const;

function collagePieceStyle(
  item: GalleryItem,
  index: number,
  boardIndex: number,
) {
  const slot = PIECE_SLOTS[(index + boardIndex * 3) % PIECE_SLOTS.length];
  const value = hash(`${item.id}-${boardIndex}`);
  const isPortrait = item.kind === 'card' || item.kind === 'portrait';
  const scale = isPortrait ? 0.86 : item.kind === 'portal' ? 0.9 : 1;
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
) {
  const value = hash(`${item.id}-${boardIndex}`);
  const slot = OBJECT_SLOTS[(index + boardIndex * 3) % OBJECT_SLOTS.length];
  const original = item.collection === 'DIVINE objects';
  return {
    '--object-left': `${slot.left + ((value >> 3) % 7) - 3}%`,
    '--object-top': `${slot.top + ((value >> 6) % 7) - 3}%`,
    '--object-width': `${slot.width * (original ? 1.1 : 0.88)}%`,
    '--object-rotate': `${slot.rotate + ((value % 9) - 4) * 0.65}deg`,
    '--object-z': 18 + (value % 9),
  } as CSSProperties;
}

export function GalleryCollection({ items }: { items: GalleryItem[] }) {
  const { cue, deckFinishes } = useExperience();
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(
    () =>
      items.reduce<Record<GalleryFilter, number>>(
        (result, item) => {
          result[item.category] += 1;
          return result;
        },
        {
          all: items.length,
          cards: 0,
          objects: 0,
          celestial: 0,
          archive: 0,
        },
      ),
    [items],
  );

  const matchedItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (filter !== 'all' && item.category !== filter) return false;
      if (!normalizedQuery) return true;
      return `${item.title} ${item.collection} ${item.detail}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [filter, items, query]);

  const allBaseItems = useMemo(
    () => items.filter((item) => item.kind !== 'cutout'),
    [items],
  );
  const backdropItems = useMemo(
    () => allBaseItems.filter((item) => item.kind === 'plate'),
    [allBaseItems],
  );
  const originalObjects = useMemo(
    () =>
      items.filter(
        (item) =>
          item.kind === 'cutout' && item.collection === 'DIVINE objects',
      ),
    [items],
  );
  const matchedBaseItems = useMemo(
    () => matchedItems.filter((item) => item.kind !== 'cutout'),
    [matchedItems],
  );
  const matchedObjectItems = useMemo(
    () => matchedItems.filter((item) => item.kind === 'cutout'),
    [matchedItems],
  );
  const overlayItems = useMemo(() => {
    if (matchedItems.length === 0) return [];
    if (filter === 'all' || filter === 'objects') return matchedObjectItems;
    return originalObjects;
  }, [filter, matchedItems.length, matchedObjectItems, originalObjects]);
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
    return items.filter((item) => visibleIds.has(item.id));
  }, [items, matchedItems, overlayItems]);
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

  const chooseFilter = (nextFilter: GalleryFilter) => {
    setFilter(nextFilter);
    setVisibleCount(BATCH_SIZE);
    setActiveId(null);
    cue('tick');
  };

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
            src="/library/backgrounds/library-masthead-sense-of-sight-1617.webp"
            alt=""
            fill
            sizes="100vw"
            priority
          />
        </span>
        <span className="gallery-masthead-card" aria-hidden="true">
          <Image
            src="/tarot-color/major-2.webp"
            alt=""
            fill
            sizes="240px"
            priority
          />
        </span>
        <span className="gallery-masthead-hand" aria-hidden="true">
          <Image
            src="/collage-v1/hand.webp"
            alt=""
            fill
            sizes="300px"
            priority
          />
        </span>
        <span className="gallery-masthead-orbit" aria-hidden="true">
          <Image
            src="/astrology/zodiac-circle-medieval.webp"
            alt=""
            fill
            sizes="360px"
            priority
          />
        </span>

        <p className="gallery-eyebrow">The visual world of DIVINE</p>
        <h1 id="gallery-title">Gallery</h1>
        <div className="gallery-masthead-meta">
          <p>
            Cards, objects, paintings, and celestial charts in one living
            archive.
          </p>
          <span>
            {items.length.toLocaleString()} works · 16 decks · one collection
          </span>
        </div>
      </header>

      <section className="gallery-toolbar" aria-label="Filter the gallery">
        <div className="gallery-filters">
          {FILTERS.map((option) => (
            <Button
              className="gallery-filter"
              variant="ghost"
              size="sm"
              type="button"
              aria-pressed={filter === option.key}
              key={option.key}
              onClick={() => chooseFilter(option.key)}
            >
              {option.label}
              <span>{counts[option.key].toLocaleString()}</span>
            </Button>
          ))}
        </div>
        <label className="gallery-search" htmlFor="gallery-search-input">
          <Search aria-hidden="true" />
          <span className="sr-only">Search the gallery</span>
          <Input
            id="gallery-search-input"
            type="search"
            value={query}
            placeholder="Search the archive"
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
                    <Image
                      src={backdrop.src}
                      alt=""
                      fill
                      sizes="100vw"
                      priority={boardIndex === 0}
                    />
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
                      style={collagePieceStyle(item, itemIndex, boardIndex)}
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
                              sizes="(max-width: 720px) 55vw, 35vw"
                              priority={boardIndex === 0 && itemIndex < 6}
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
                              sizes="(max-width: 720px) 55vw, 35vw"
                              priority={boardIndex === 0 && itemIndex < 6}
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
                    style={collageObjectStyle(object, objectIndex, boardIndex)}
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
                        sizes="(max-width: 720px) 46vw, 28vw"
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
              chooseFilter('all');
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

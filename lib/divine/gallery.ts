import archiveManifest from '@/public/collage-archive/manifest.json';
import { ASTROLOGY_CHARTS, ASTROLOGY_SIGNS } from './astrology';
import { imageForFinish, isCardSystemSlug } from './decks';
import type { CardSystemSlug } from './decks';
import {
  LIBRARY_BACKGROUNDS,
  LIBRARY_MASTHEAD_BACKGROUNDS,
  LIBRARY_NAVIGATOR_FOUNDATION,
} from './library';
import { SYSTEMS } from './systems';

export type GalleryCategory = 'cards' | 'objects' | 'celestial' | 'archive';
export type GalleryKind = 'card' | 'cutout' | 'plate' | 'portrait' | 'portal';

export interface GalleryItem {
  id: string;
  src: string;
  inkSrc?: string;
  title: string;
  collection: string;
  detail: string;
  category: GalleryCategory;
  kind: GalleryKind;
  fit: 'contain' | 'cover';
  aspectRatio: number;
  sourceUrl?: string;
  readingHref?: string;
  systemSlug?: CardSystemSlug;
}

const COLLAGE_OBJECTS = [
  'hand',
  'eye',
  'key',
  'star',
  'prism',
  'peony',
  'moth',
  'bust',
  'compass',
  'crystal',
  'domino',
  'door',
  'envelope',
  'feather',
  'glove',
  'heart',
  'hourglass',
  'mask',
  'matches',
  'pearl',
  'pen',
  'pomegranate',
  'ribbon',
  'rose',
  'scissors',
  'shell',
  'snake',
  'watch',
  'apple',
  'bell',
] as const;

function sourceKey(src: string) {
  return src.split('?')[0];
}

function titleCase(value: string) {
  return value
    .replace(/\?.*$/, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/^(library-(masthead|navigator)-|divine-)/, '')
    .replace(/-\d{2,4}(?:s)?$/i, '')
    .split('-')
    .filter(Boolean)
    .map((part) =>
      ['al', 'the', 'of'].includes(part)
        ? part
        : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join(' ');
}

function roundRobin<T>(groups: readonly (readonly T[])[]) {
  const result: T[] = [];
  const longest = Math.max(0, ...groups.map((group) => group.length));

  for (let index = 0; index < longest; index += 1) {
    for (const group of groups) {
      const item = group[index];
      if (item) result.push(item);
    }
  }

  return result;
}

function uniqueBySource(items: GalleryItem[], seen: Set<string>) {
  return items.filter((item) => {
    const key = sourceKey(item.src);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cardItems() {
  const decks = SYSTEMS.filter(
    (system) =>
      system.slug !== 'divine' &&
      system.kind === 'cards' &&
      isCardSystemSlug(system.slug),
  ).map((system) => {
    if (!isCardSystemSlug(system.slug)) return [];
    const systemSlug = system.slug;
    return system.cards.flatMap<GalleryItem>((card) => {
      if (!card.image) return [];
      const colorSrc = imageForFinish(card, 'color') ?? card.image;
      const inkSrc = imageForFinish(card, 'ink');

      return [
        {
          id: `card-${systemSlug}-${card.id}`,
          src: colorSrc,
          ...(inkSrc && sourceKey(inkSrc) !== sourceKey(colorSrc)
            ? { inkSrc }
            : {}),
          title: card.name,
          collection: system.name,
          detail: card.keywords.slice(0, 3).join(' · '),
          category: 'cards',
          kind: 'card',
          fit: 'contain',
          aspectRatio: card.aspectRatio ?? 0.625,
          readingHref: `/read/${systemSlug}`,
          systemSlug,
        },
      ];
    });
  });

  return roundRobin(decks);
}

function objectItems() {
  const originals: GalleryItem[] = COLLAGE_OBJECTS.map((name) => ({
    id: `object-${name}`,
    src: `/collage-v1/${name}.webp`,
    title: titleCase(name),
    collection: 'DIVINE objects',
    detail: 'Original collage object',
    category: 'objects',
    kind: 'cutout',
    fit: 'contain',
    aspectRatio: 1,
  }));

  const museumObjects: GalleryItem[] = archiveManifest.map((object) => ({
    id: `met-${object.objectID}`,
    src: object.src,
    title: object.title,
    collection: object.department,
    detail: [object.objectDate, object.objectName].filter(Boolean).join(' · '),
    category: 'objects',
    kind: 'cutout',
    fit: 'contain',
    aspectRatio: 1,
    sourceUrl: object.objectURL,
  }));

  const groups = museumObjects.reduce<[GalleryItem[], GalleryItem[], GalleryItem[]]>(
    (result, item, index) => {
      result[index % result.length].push(item);
      return result;
    },
    [[], [], []],
  );

  return roundRobin([originals, ...groups]);
}

function celestialItems() {
  const charts: GalleryItem[] = ASTROLOGY_CHARTS.map((chart) => ({
    id: `chart-${chart.slug}`,
    src: chart.src,
    title: chart.title,
    collection: 'Celestial atlas',
    detail: `${chart.date} · ${chart.detail}`,
    category: 'celestial',
    kind: 'plate',
    fit: 'cover',
    aspectRatio: chart.width / chart.height,
  }));

  const signs: GalleryItem[] = ASTROLOGY_SIGNS.map((sign) => ({
    id: `sign-${sign.name.toLowerCase()}`,
    src: sign.art,
    title: sign.name,
    collection: 'The twelve signs',
    detail: `${sign.dates} · ${sign.element} · ${sign.modality}`,
    category: 'celestial',
    kind: 'portrait',
    fit: 'cover',
    aspectRatio: 0.8,
  }));

  return roundRobin([charts, signs]);
}

function archivalItems() {
  const backgrounds = [
    ...LIBRARY_MASTHEAD_BACKGROUNDS,
    LIBRARY_NAVIGATOR_FOUNDATION,
    ...Object.values(LIBRARY_BACKGROUNDS).flat(),
  ];
  const plates: GalleryItem[] = backgrounds.map((background, index) => {
    const filename = background.backgroundImage.split('/').at(-1) ?? '';
    return {
      id: `library-${index}-${filename}`,
      src: background.backgroundImage,
      title: titleCase(filename),
      collection: 'Library plates',
      detail: 'Historical image from the DIVINE library',
      category: 'archive',
      kind: 'plate',
      fit: background.backgroundFit ?? 'cover',
      aspectRatio: background.backgroundFit === 'contain' ? 0.78 : 1.45,
    };
  });

  const portals: GalleryItem[] = SYSTEMS.map((system) => ({
    id: `portal-${system.slug}`,
    src: system.cover,
    title: `${system.name} portal`,
    collection: 'Reading portals',
    detail: system.eyebrow,
    category: 'archive',
    kind: 'portal',
    fit: 'contain',
    aspectRatio: 1,
    readingHref: system.slug === 'divine' ? '/#readings' : `/read/${system.slug}`,
  }));

  return roundRobin([plates, portals]);
}

export function buildGalleryItems() {
  const seen = new Set<string>();
  const groups = {
    cards: uniqueBySource(cardItems(), seen),
    objects: uniqueBySource(objectItems(), seen),
    celestial: uniqueBySource(celestialItems(), seen),
    archive: uniqueBySource(archivalItems(), seen),
  } satisfies Record<GalleryCategory, GalleryItem[]>;

  const pattern: GalleryCategory[] = [
    'archive',
    'cards',
    'objects',
    'cards',
    'celestial',
    'cards',
    'objects',
    'cards',
    'cards',
    'archive',
    'cards',
    'objects',
  ];
  const cursors: Record<GalleryCategory, number> = {
    cards: 0,
    objects: 0,
    celestial: 0,
    archive: 0,
  };
  const result: GalleryItem[] = [];

  while (
    (Object.keys(groups) as GalleryCategory[]).some(
      (category) => cursors[category] < groups[category].length,
    )
  ) {
    let added = false;
    for (const category of pattern) {
      const item = groups[category][cursors[category]];
      if (!item) continue;
      result.push(item);
      cursors[category] += 1;
      added = true;
    }
    if (!added) break;
  }

  return result;
}

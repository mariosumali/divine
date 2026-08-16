import type { CSSProperties } from 'react';
import type { CardDefinition, SystemSlug } from './types';

export type DeckFinish = 'color' | 'ink';

export const CARD_SYSTEM_SLUGS = [
  'tarot',
  'oracle',
  'lenormand',
  'spellcraft',
  'ancient-egypt',
  'zodiac',
] as const satisfies readonly SystemSlug[];

export type CardSystemSlug = (typeof CARD_SYSTEM_SLUGS)[number];
export type DeckFinishes = Record<CardSystemSlug, DeckFinish>;

export const DEFAULT_DECK_FINISHES: DeckFinishes = {
  tarot: 'color',
  oracle: 'color',
  lenormand: 'color',
  spellcraft: 'color',
  'ancient-egypt': 'color',
  zodiac: 'color',
};

export const DECK_LABELS: Record<
  CardSystemSlug,
  { color: string; ink: string }
> = {
  tarot: { color: '1909 color', ink: 'Monochrome' },
  oracle: { color: 'Chromatic', ink: 'Ink' },
  lenormand: { color: 'Heritage color', ink: 'Ink' },
  spellcraft: { color: 'Chromatic', ink: 'Ink' },
  'ancient-egypt': { color: 'Pigment', ink: 'Ink' },
  zodiac: { color: 'Celestial color', ink: 'Ink' },
};

const palettes: Record<CardSystemSlug, Array<[string, string]>> = {
  tarot: [['#eee6d4', '#17120d']],
  oracle: [
    ['#d8d5eb', '#2c285d'],
    ['#e8cdd2', '#6f2439'],
    ['#cbded7', '#164d43'],
    ['#e9d8b6', '#6c4312'],
  ],
  lenormand: [
    ['#d6e3e3', '#154d56'],
    ['#ead4bd', '#7c351f'],
    ['#e3d8a7', '#59480a'],
    ['#d9d0e5', '#493365'],
  ],
  spellcraft: [
    ['#d9c9bd', '#5b231f'],
    ['#c7d9c5', '#214b2b'],
    ['#cbd0df', '#24365a'],
    ['#e7d5a9', '#62470b'],
  ],
  'ancient-egypt': [
    ['#dec48c', '#513313'],
    ['#bad6d5', '#174750'],
    ['#d8b3a4', '#6a2d20'],
    ['#c6c09f', '#3e4420'],
  ],
  zodiac: [
    ['#c6d5ea', '#273d6a'],
    ['#d9c8e8', '#4d2f67'],
    ['#e5c8b9', '#74351f'],
    ['#c2d9ce', '#244f42'],
  ],
};

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1)
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  return result;
}

export function isCardSystemSlug(slug: SystemSlug): slug is CardSystemSlug {
  return (CARD_SYSTEM_SLUGS as readonly SystemSlug[]).includes(slug);
}

export function imageForFinish(
  card: CardDefinition,
  finish: DeckFinish,
): string | undefined {
  if (finish === 'color' && card.image?.startsWith('/tarot/'))
    return card.image.replace('/tarot/', '/tarot-color/');
  return card.image;
}

export function deckColors(
  slug: CardSystemSlug,
  cardId: string,
  finish: DeckFinish,
) {
  if (finish === 'ink') return undefined;
  const palette = palettes[slug];
  const [paper, ink] = palette[hash(cardId) % palette.length];
  return { '--deck-paper': paper, '--deck-ink': ink } as CSSProperties;
}

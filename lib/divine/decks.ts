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
  'kipper',
  'belline',
  'playing-card-cartomancy',
  'sibilla',
  'runic-cards',
  'i-ching-cards',
  'fal-e-hafez',
  'hanafuda',
  'zigeunerkarten',
  'ilm-al-raml',
] as const satisfies readonly SystemSlug[];

export type CardSystemSlug = (typeof CARD_SYSTEM_SLUGS)[number];
export type DeckFinishes = Record<CardSystemSlug, DeckFinish>;

export function deckFinishesFor(finish: DeckFinish): DeckFinishes {
  return Object.fromEntries(
    CARD_SYSTEM_SLUGS.map((slug) => [slug, finish]),
  ) as DeckFinishes;
}

export const DEFAULT_DECK_FINISHES = deckFinishesFor('color');

export const DECK_LABELS: Record<
  CardSystemSlug,
  { color: string; ink: string }
> = {
  tarot: { color: '1909 color', ink: 'Monochrome' },
  oracle: { color: 'Mantegna archive', ink: 'Archive ink' },
  lenormand: { color: 'Heritage color', ink: 'Ink' },
  spellcraft: { color: 'Iconologia', ink: 'Archive ink' },
  'ancient-egypt': { color: 'Champollion color', ink: 'Archive ink' },
  zodiac: { color: 'Urania color', ink: 'Archive ink' },
  kipper: { color: 'Museum archive', ink: 'Archive ink' },
  belline: { color: 'Edmond archive', ink: 'Archive ink' },
  'playing-card-cartomancy': {
    color: 'Archive parlor',
    ink: 'Archive ink',
  },
  sibilla: { color: 'British Museum', ink: 'Archive ink' },
  'runic-cards': { color: 'Kylver stone', ink: 'Archive ink' },
  'i-ching-cards': { color: '1701 chart', ink: 'Archive ink' },
  'fal-e-hafez': { color: 'Divān manuscripts', ink: 'Archive ink' },
  hanafuda: { color: 'Early Shōwa', ink: 'Archive ink' },
  zigeunerkarten: { color: 'Museum archive', ink: 'Archive ink' },
  'ilm-al-raml': { color: 'Arabic manuscript', ink: 'Archive ink' },
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
  kipper: [
    ['#e2d1bb', '#5b2d1f'],
    ['#cdd9d2', '#24493b'],
    ['#d8cddd', '#493251'],
  ],
  belline: [
    ['#e6cf9b', '#604214'],
    ['#c6d5e4', '#243e61'],
    ['#ddc5ca', '#6a293a'],
    ['#d3cee4', '#42345e'],
  ],
  'playing-card-cartomancy': [
    ['#eee9dd', '#8b1f25'],
    ['#eee9dd', '#151515'],
  ],
  sibilla: [
    ['#ead7c1', '#6f3020'],
    ['#d5dfcc', '#2d532c'],
    ['#d4d7e1', '#293b5d'],
    ['#ead8a9', '#66500c'],
  ],
  'runic-cards': [
    ['#d9d2c2', '#423a2d'],
    ['#d6c4b9', '#642e20'],
    ['#c7d1d0', '#294748'],
  ],
  'i-ching-cards': [
    ['#d6dfd4', '#244d3b'],
    ['#e3d5c5', '#7b2e24'],
    ['#d1d8df', '#263e56'],
  ],
  'fal-e-hafez': [
    ['#e2ccd3', '#6b2742'],
    ['#cbd1df', '#2d355a'],
    ['#dfd0b7', '#654315'],
  ],
  hanafuda: [
    ['#e5c9ca', '#792b34'],
    ['#cbdac8', '#2d552d'],
    ['#e4d5a8', '#66500e'],
    ['#ccd7e4', '#2d4664'],
  ],
  zigeunerkarten: [
    ['#dfcbb7', '#572c22'],
    ['#ced8cf', '#284738'],
    ['#d5cfdf', '#443252'],
  ],
  'ilm-al-raml': [
    ['#e0c99f', '#4f311c'],
    ['#d4c3a5', '#3f3327'],
    ['#c9d2c7', '#29473b'],
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

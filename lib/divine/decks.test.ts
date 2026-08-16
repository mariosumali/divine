import { describe, expect, it } from 'vitest';
import { DEFAULT_DECK_FINISHES, deckColors, imageForFinish } from './decks';
import type { CardDefinition } from './types';

const card: CardDefinition = {
  id: 'swords-queen',
  name: 'Queen of Swords',
  glyph: '†',
  image: '/tarot/swords-queen.webp',
  keywords: ['clarity'],
  meaning: 'See clearly.',
};

describe('deck appearance', () => {
  it('uses the complete color deck by default', () => {
    expect(
      Object.values(DEFAULT_DECK_FINISHES).every(
        (finish) => finish === 'color',
      ),
    ).toBe(true);
    expect(imageForFinish(card, 'color')).toBe(
      '/tarot-color/swords-queen.webp',
    );
  });

  it('preserves the monochrome archive path for the ink deck', () => {
    expect(imageForFinish(card, 'ink')).toBe('/tarot/swords-queen.webp');
  });

  it('assigns stable pigment colors to original decks', () => {
    expect(deckColors('zodiac', 'zodiac-11', 'color')).toEqual(
      deckColors('zodiac', 'zodiac-11', 'color'),
    );
    expect(deckColors('zodiac', 'zodiac-11', 'ink')).toBeUndefined();
  });
});

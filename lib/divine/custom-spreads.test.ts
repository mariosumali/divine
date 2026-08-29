import { describe, expect, it } from 'vitest';
import {
  createCustomSpread,
  CUSTOM_SPREADS_KEY,
  loadCustomSpreads,
  parseCustomSpreads,
  storeCustomSpreads,
  validateCustomSpread,
} from './custom-spreads';
import { drawCards } from './reading';
import { SYSTEM_MAP } from './systems';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('custom spreads', () => {
  it('normalizes and creates a device-local spread', () => {
    const spread = createCustomSpread(
      'tarot',
      {
        name: '  Turning   Point ',
        positions: [' What stays ', ' What changes '],
        layout: 'line',
      },
      '2026-09-02T12:00:00.000Z',
      'spread-one',
    );
    expect(spread).toMatchObject({
      id: 'custom:spread-one',
      name: 'Turning Point',
      positions: ['What stays', 'What changes'],
      system: 'tarot',
      layout: 'line',
    });
  });

  it('requires a name, 1–10 named positions, and a supported layout', () => {
    expect(
      validateCustomSpread({ name: '', positions: [], layout: 'grid' }),
    ).toEqual(['Name your spread.', 'Choose between 1 and 10 cards.']);
    expect(
      validateCustomSpread({
        name: 'Too many',
        positions: Array.from({ length: 11 }, () => ''),
        layout: 'line',
      }),
    ).toEqual(['Choose between 1 and 10 cards.', 'Name every position.']);
  });

  it('persists valid spreads and ignores corrupt records', () => {
    const storage = memoryStorage();
    const spread = createCustomSpread(
      'oracle',
      { name: 'Compass', positions: ['Center'], layout: 'grid' },
      '2026-09-02T12:00:00.000Z',
      'spread-two',
    );
    storeCustomSpreads([spread], storage);
    expect(storage.getItem(CUSTOM_SPREADS_KEY)).toBeTruthy();
    expect(loadCustomSpreads(storage)).toEqual([spread]);
    expect(parseCustomSpreads('{nope')).toEqual([]);
    expect(parseCustomSpreads(JSON.stringify([{ id: 'not-custom' }]))).toEqual(
      [],
    );
  });

  it('works with specialized card systems without changing native spreads', () => {
    const zodiacSpread = createCustomSpread(
      'zodiac',
      {
        name: 'Six directions',
        positions: Array.from(
          { length: 6 },
          (_, index) => `Point ${index + 1}`,
        ),
        layout: 'grid',
      },
      '2026-09-02T12:00:00.000Z',
      'zodiac-six',
    );
    const draws = drawCards(SYSTEM_MAP.zodiac, zodiacSpread, false);
    expect(draws).toHaveLength(6);
    expect(draws.map((draw) => draw.position)).toEqual(zodiacSpread.positions);
    expect(new Set(draws.map((draw) => draw.card.id))).toHaveProperty(
      'size',
      6,
    );
  });
});

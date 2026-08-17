import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OBJECT_RITUAL_STEPS,
  drawCards,
  drawFortune,
  interpretReading,
  lenormandPairText,
  nextObjectRitualStep,
  secureShuffle,
} from './reading';
import { FORTUNES, SYSTEM_MAP, SYSTEMS } from './systems';

describe('DIVINE content libraries', () => {
  it('contains every complete launch deck', () => {
    expect(SYSTEMS).toHaveLength(16);
    expect(SYSTEM_MAP.tarot.cards).toHaveLength(78);
    expect(SYSTEM_MAP.oracle.cards).toHaveLength(44);
    expect(SYSTEM_MAP.lenormand.cards).toHaveLength(36);
    expect(SYSTEM_MAP.spellcraft.cards).toHaveLength(36);
    expect(SYSTEM_MAP['ancient-egypt'].cards).toHaveLength(36);
    expect(SYSTEM_MAP.zodiac.cards).toHaveLength(34);
    expect(SYSTEM_MAP.kipper.cards).toHaveLength(36);
    expect(SYSTEM_MAP.belline.cards).toHaveLength(53);
    expect(SYSTEM_MAP['playing-card-cartomancy'].cards).toHaveLength(52);
    expect(SYSTEM_MAP.sibilla.cards).toHaveLength(52);
    expect(SYSTEM_MAP['runic-cards'].cards).toHaveLength(24);
    expect(SYSTEM_MAP['i-ching-cards'].cards).toHaveLength(64);
    expect(SYSTEM_MAP['fal-e-hafez'].cards).toHaveLength(36);
    expect(SYSTEM_MAP.hanafuda.cards).toHaveLength(48);
    expect(FORTUNES).toHaveLength(144);
  });

  it('preserves every item in an unbiased shuffle surface', () => {
    const source = Array.from({ length: 40 }, (_, index) => index);
    const shuffled = secureShuffle(source);
    expect(shuffled).toHaveLength(source.length);
    expect(new Set(shuffled)).toEqual(new Set(source));
  });

  it('ships one distinct historical image for every Lenormand card', () => {
    const images = SYSTEM_MAP.lenormand.cards.map((card) => card.image);
    expect(new Set(images).size).toBe(36);
    for (const image of images) {
      expect(image).toMatch(/^\/lenormand\/game-of-hope-\d{2}\.webp$/);
      expect(existsSync(join(process.cwd(), 'public', image!.slice(1)))).toBe(
        true,
      );
    }
  });

  it('ships a complete, uncropped archival image library for every illustrated deck', () => {
    const collections = [
      ['oracle', 'oracle', 44],
      ['spellcraft', 'ritual', 36],
      ['ancient-egypt', 'temple', 36],
      ['zodiac', 'zodiac', 34],
    ] as const;

    for (const [systemSlug, collection, count] of collections) {
      const cards = SYSTEM_MAP[systemSlug].cards;
      const images = cards.map((card) => card.image);
      expect(cards).toHaveLength(count);
      expect(new Set(images).size).toBe(count);
      expect(
        cards.every(
          (card) =>
            card.aspectRatio === 3 / 4 ||
            card.aspectRatio === 1 ||
            card.aspectRatio === 4 / 3,
        ),
      ).toBe(true);
      for (const [index, image] of images.entries()) {
        expect(image).toBe(
          `/open-decks-v1/${collection}/${collection}-${String(index + 1).padStart(2, '0')}.webp`,
        );
        const path = join(process.cwd(), 'public', image!.slice(1));
        expect(existsSync(path)).toBe(true);
        expect(statSync(path).size).toBeGreaterThan(5_000);
      }

      const manifest = JSON.parse(
        readFileSync(
          join(
            process.cwd(),
            'public',
            'open-decks-v1',
            collection,
            'manifest.json',
          ),
          'utf8',
        ),
      );
      expect(manifest.treatment).toContain('no cropping');
      expect(manifest.cards).toHaveLength(count);
      expect(
        manifest.cards.every((card: { license: string }) =>
          /CC0|public domain|no restrictions|PDM/i.test(card.license),
        ),
      ).toBe(true);
    }
  });

  it('ships both complete Tarot finishes at full-card dimensions', () => {
    for (const card of SYSTEM_MAP.tarot.cards) {
      for (const folder of ['tarot', 'tarot-color']) {
        const path = join(process.cwd(), 'public', folder, `${card.id}.webp`);
        expect(existsSync(path)).toBe(true);
        expect(statSync(path).size).toBeGreaterThan(5_000);
      }
    }
  });
});

describe('reading engine', () => {
  for (const system of SYSTEMS.filter((item) => item.kind === 'cards')) {
    for (const spread of system.spreads) {
      it(`${system.name} · ${spread.name} draws the required unique cards`, () => {
        const draws = drawCards(system, spread, system.slug === 'tarot');
        expect(draws).toHaveLength(spread.positions.length);
        expect(new Set(draws.map((draw) => draw.card.id)).size).toBe(
          draws.length,
        );
        expect(draws.map((draw) => draw.position)).toEqual(spread.positions);
        const result = interpretReading(system, spread, draws, 'growth');
        expect(result.positions).toHaveLength(draws.length);
        expect(result.headline.length).toBeGreaterThan(8);
        expect(result.synthesis.length).toBeGreaterThan(30);
      });
    }
  }

  it('draws one sign, planet, and house for the Zodiac triad', () => {
    const system = SYSTEM_MAP.zodiac;
    const spread = system.spreads.find(
      (item) => item.id === 'celestial-triad',
    )!;
    expect(
      drawCards(system, spread, false).map((draw) => draw.card.domain),
    ).toEqual(['sign', 'planet', 'house']);
  });

  it('never duplicates a Zodiac anchor in the five-card pattern', () => {
    const system = SYSTEM_MAP.zodiac;
    const spread = system.spreads.find(
      (item) => item.id === 'celestial-pattern',
    )!;
    for (let iteration = 0; iteration < 250; iteration += 1) {
      const draws = drawCards(system, spread, false);
      expect(new Set(draws.map((draw) => draw.card.id)).size).toBe(5);
      expect(draws.slice(0, 3).map((draw) => draw.card.domain)).toEqual([
        'sign',
        'planet',
        'house',
      ]);
    }
  });

  it('draws one card from each planetary Belline family', () => {
    const system = SYSTEM_MAP.belline;
    const spread = system.spreads.find((item) => item.id === 'seven-planets')!;
    expect(
      drawCards(system, spread, false).map((draw) => draw.card.domain),
    ).toEqual(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']);
  });

  it('preserves all fixed traditional structures', () => {
    expect(
      new Set(SYSTEM_MAP['i-ching-cards'].cards.map((card) => card.glyph)).size,
    ).toBe(64);
    expect(SYSTEM_MAP.sibilla.cards.every((card) => card.reversedMeaning)).toBe(
      true,
    );
    expect(
      new Set(SYSTEM_MAP.hanafuda.cards.map((card) => card.numerology)).size,
    ).toBe(12);
    expect(
      SYSTEM_MAP['runic-cards'].cards.some((card) =>
        card.name.toLowerCase().includes('blank'),
      ),
    ).toBe(false);
  });

  it('applies curated Lenormand relationships and house context', () => {
    const heart = SYSTEM_MAP.lenormand.cards.find(
      (card) => card.name === 'Heart',
    )!;
    const ring = SYSTEM_MAP.lenormand.cards.find(
      (card) => card.name === 'Ring',
    )!;
    expect(lenormandPairText(heart, ring)).toContain('explicit bond');
    const spread = SYSTEM_MAP.lenormand.spreads.find(
      (item) => item.id === 'grand-tableau',
    )!;
    const draws = drawCards(SYSTEM_MAP.lenormand, spread, false);
    const result = interpretReading(
      SYSTEM_MAP.lenormand,
      spread,
      draws,
      'general',
    );
    expect(result.positions[0].text).toContain('In the house of Rider');
    expect(result.positions[0].text).toContain('Nearest neighbors');
    expect(result.positions[0].text).toContain('Timing:');
  });

  it('produces unique lucky numbers within the expected range', () => {
    const result = drawFortune();
    expect(FORTUNES).toContain(result.fortune);
    expect(result.reflectionPrompt.length).toBeGreaterThan(20);
    expect(result.numbers).toHaveLength(6);
    expect(new Set(result.numbers).size).toBe(6);
    expect(result.numbers.every((number) => number >= 1 && number <= 49)).toBe(
      true,
    );
  });

  it('requires three deliberate object interactions and never advances beyond resolution', () => {
    expect(nextObjectRitualStep(0)).toBe(1);
    expect(nextObjectRitualStep(1)).toBe(2);
    expect(nextObjectRitualStep(2)).toBe(OBJECT_RITUAL_STEPS);
    expect(nextObjectRitualStep(OBJECT_RITUAL_STEPS)).toBe(OBJECT_RITUAL_STEPS);
  });
});

import { existsSync } from 'node:fs';
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
    expect(SYSTEMS).toHaveLength(8);
    expect(SYSTEM_MAP.tarot.cards).toHaveLength(78);
    expect(SYSTEM_MAP.oracle.cards).toHaveLength(44);
    expect(SYSTEM_MAP.lenormand.cards).toHaveLength(36);
    expect(SYSTEM_MAP.spellcraft.cards).toHaveLength(36);
    expect(SYSTEM_MAP['ancient-egypt'].cards).toHaveLength(36);
    expect(SYSTEM_MAP.zodiac.cards).toHaveLength(34);
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

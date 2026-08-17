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
import { openingHeroHeadline, openingHeroHeadlines } from './headlines';
import {
  CARD_TRADITION_COUNT,
  CATALOG_SYSTEMS,
  INDIVIDUAL_READING_COUNT,
  TOTAL_READING_EXPERIENCE_COUNT,
} from './catalog';
import { FORTUNES, SYSTEM_MAP, SYSTEMS } from './systems';

describe('DIVINE content libraries', () => {
  it('contains every complete launch deck', () => {
    expect(SYSTEMS).toHaveLength(19);
    expect(TOTAL_READING_EXPERIENCE_COUNT).toBe(19);
    expect(INDIVIDUAL_READING_COUNT).toBe(18);
    expect(CARD_TRADITION_COUNT).toBe(16);
    expect(CATALOG_SYSTEMS.map(({ slug, name }) => ({ slug, name }))).toEqual(
      SYSTEMS.map(({ slug, name }) => ({ slug, name })),
    );
    expect(SYSTEM_MAP.divine.cards).toHaveLength(681);
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
    expect(SYSTEM_MAP.zigeunerkarten.cards).toHaveLength(36);
    expect(SYSTEM_MAP['ilm-al-raml'].cards).toHaveLength(16);
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

  it('ships local, distinct artwork for every card in every system', () => {
    const cards = SYSTEMS.filter(
      (system) => system.kind === 'cards' && system.slug !== 'divine',
    ).flatMap((system) => system.cards);
    const images = cards.map((card) => card.image);

    expect(cards).toHaveLength(681);
    expect(images.every(Boolean)).toBe(true);
    expect(new Set(images).size).toBe(cards.length);

    for (const image of images) {
      expect(image).toMatch(/^\/.+\.webp$/);
      const path = join(process.cwd(), 'public', image!.slice(1));
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(150);
    }
  });

  it('records a reusable online source for every traditional deck image', () => {
    const collections = [
      ['kipper', 'kipper', 36],
      ['belline', 'belline', 53],
      ['playing-card-cartomancy', 'playing-cards', 52],
      ['sibilla', 'sibilla', 52],
      ['runic-cards', 'runes', 24],
      ['i-ching-cards', 'i-ching', 64],
      ['fal-e-hafez', 'hafez', 36],
      ['hanafuda', 'hanafuda', 48],
      ['zigeunerkarten', 'zigeunerkarten', 36],
      ['ilm-al-raml', 'ilm-al-raml', 16],
    ] as const;

    for (const [systemSlug, collection, count] of collections) {
      const manifest = JSON.parse(
        readFileSync(
          join(
            process.cwd(),
            'public',
            'traditional-decks-v1',
            collection,
            'manifest.json',
          ),
          'utf8',
        ),
      );
      expect(manifest.cards).toHaveLength(count);
      expect(manifest.sourceCollection).toMatch(/^https:\/\//);
      expect(
        manifest.cards.every(
          (card: { license: string; sourceUrl: string }) =>
            card.sourceUrl.startsWith('https://') &&
            /CC0|CC BY|public domain|PDM/i.test(card.license),
        ),
      ).toBe(true);

      expect(SYSTEM_MAP[systemSlug].cards.map((card) => card.image)).toEqual(
        Array.from(
          { length: count },
          (_, index) =>
            `/traditional-decks-v1/${collection}/${collection}-${String(index + 1).padStart(2, '0')}.webp`,
        ),
      );
    }

    const hafez = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          'public',
          'traditional-decks-v1',
          'hafez',
          'manifest.json',
        ),
        'utf8',
      ),
    );
    const kipper = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          'public',
          'traditional-decks-v1',
          'kipper',
          'manifest.json',
        ),
        'utf8',
      ),
    );
    expect(hafez.rightsNote).toContain('bibliomancy');
    expect(kipper.rightsNote).toContain('Cards 35–36');
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

  it('draws one card from every deck and connects the full DIVINE reading', () => {
    const system = SYSTEM_MAP.divine;
    const spread = system.spreads[0];
    const draws = drawCards(system, spread, true);
    const sourceDecks = draws.map((draw) => draw.card.sourceSystem);

    expect(draws).toHaveLength(16);
    expect(new Set(sourceDecks).size).toBe(16);
    expect(sourceDecks).not.toContain('divine');

    const result = interpretReading(system, spread, draws, 'general');
    expect(result.connections).toHaveLength(15);
    expect(openingHeroHeadlines(system.slug, draws[0], 'general')).toContain(
      result.headline,
    );
    for (const draw of draws) {
      expect(result.synthesis).toContain(draw.card.name);
      expect(
        result.connections?.some(
          (connection) =>
            connection.from.includes(draw.card.sourceSystemName!) ||
            connection.to.includes(draw.card.sourceSystemName!),
        ),
      ).toBe(true);
    }
  });

  it('gives every possible opening card a deep bank of advice-led hero lines', () => {
    const focuses = ['general', 'love', 'work', 'growth'] as const;

    for (const system of SYSTEMS.filter((item) => item.kind === 'cards')) {
      for (const card of system.cards) {
        for (const focus of focuses) {
          const upright = openingHeroHeadlines(
            system.slug,
            { card, position: 'Opening', reversed: false },
            focus,
          );
          expect(upright.length).toBeGreaterThanOrEqual(27);
          expect(new Set(upright).size).toBe(upright.length);
          expect(
            upright.every(
              (headline) => headline.length >= 28 && headline.length <= 180,
            ),
          ).toBe(true);

          if (card.reversedMeaning) {
            const reversed = openingHeroHeadlines(
              system.slug,
              { card, position: 'Opening', reversed: true },
              focus,
            );
            expect(reversed.length).toBeGreaterThanOrEqual(27);
            expect(reversed).not.toEqual(upright);
          }
        }
      }
    }
  });

  it('varies an opening headline while keeping each reading reproducible', () => {
    const system = SYSTEM_MAP.zodiac;
    const spread = system.spreads[0];
    const cancer = system.cards.find((card) => card.name === 'Cancer')!;
    const draws = [
      { card: cancer, position: spread.positions[0], reversed: false },
    ];
    const variants = Array.from({ length: 160 }, (_, index) =>
      openingHeroHeadline(system, spread, draws, 'general', `reading-${index}`),
    );

    expect(new Set(variants).size).toBeGreaterThan(20);
    expect(variants).toContain(
      'Care is strongest when it includes your own limits.',
    );
    expect(
      openingHeroHeadline(system, spread, draws, 'general', 'same-reading'),
    ).toBe(
      openingHeroHeadline(system, spread, draws, 'general', 'same-reading'),
    );
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
    expect(
      new Set(SYSTEM_MAP['ilm-al-raml'].cards.map((card) => card.glyph)).size,
    ).toBe(16);
    expect(SYSTEM_MAP.zigeunerkarten.cards.map((card) => card.name)).toContain(
      'Unverhoffte Freude · Unexpected Joy',
    );
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

  it('gives every card an expanded interpretation and connects multi-card positions', () => {
    const system = SYSTEM_MAP.tarot;
    const singleSpread = system.spreads.find((item) => item.id === 'insight')!;
    const singleDraws = [
      {
        card: system.cards[0],
        position: singleSpread.positions[0],
        reversed: false,
      },
    ];
    const single = interpretReading(
      system,
      singleSpread,
      singleDraws,
      'general',
    );
    expect(single.positions[0].text.length).toBeGreaterThan(220);
    expect(single.synthesis).toContain(singleDraws[0].card.name);

    const spread = system.spreads.find((item) => item.id === 'three')!;
    const draws = system.cards.slice(0, 3).map((card, index) => ({
      card,
      position: spread.positions[index],
      reversed: index === 1,
    }));
    const result = interpretReading(system, spread, draws, 'love');
    for (const [index, position] of result.positions.entries()) {
      expect(position.text.length).toBeGreaterThan(300);
      const neighbor = draws[index === 0 ? 1 : index - 1];
      expect(position.text).toContain(neighbor.card.name);
    }
    for (const draw of draws)
      expect(result.synthesis).toContain(draw.card.name);
    expect(result.synthesis).toContain('no card stands alone');
  });

  it('uses a distinct interpretive grammar for every card tradition', () => {
    const signatures = {
      tarot: 'archetype, suit, number, element',
      oracle: 'image and association',
      lenormand: 'concrete syntax',
      spellcraft: 'material instruction',
      'ancient-egypt': 'balance, continuity, and renewal',
      zodiac: 'three-part grammar',
      kipper: 'social field',
      belline: 'planetary families',
      'playing-card-cartomancy': 'suit, rank, color, court',
      sibilla: 'social conversation',
      'runic-cards': 'Elder Futhark character',
      'i-ching-cards': 'stable King Wen hexagrams',
      'fal-e-hafez': 'echo of bibliomancy',
      hanafuda: 'month, flower, motif',
      zigeunerkarten: 'one practical sentence',
      'ilm-al-raml': 'sixteen canonical figures',
    } as const;

    for (const [slug, signature] of Object.entries(signatures)) {
      const system = SYSTEM_MAP[slug as keyof typeof signatures];
      const spread =
        system.spreads.find(
          (item) => item.positions.length > 1 && item.positions.length <= 7,
        ) ?? system.spreads[0];
      const draws = drawCards(system, spread, false);
      const result = interpretReading(system, spread, draws, 'general');
      expect(result.overview).toContain(signature);
      expect(result.positions).toHaveLength(draws.length);
      for (const draw of draws)
        expect(result.synthesis).toContain(draw.card.name);
    }
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

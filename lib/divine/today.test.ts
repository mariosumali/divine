import { describe, expect, it } from 'vitest';
import { DIVINE_SYSTEM } from './systems';
import type { CardDefinition, DrawnCard, SystemSlug } from './types';
import {
  TODAY_PROMPTS,
  TODAY_RESPONSE_MAX_LENGTH,
  analyzeTodayConnections,
  createTodaySeed,
  dailyHash,
  drawToday,
  interpretTodayConstellation,
  isTodaySeed,
  localDateKey,
  todayOffset,
  todayPrompt,
  todayRecord,
} from './today';

const generatedAt = new Date(2026, 8, 2, 14, 37, 12);

function seed(response = 'I am making room for a difficult change.') {
  return createTodaySeed(response, generatedAt, '2026-09-02T14:37@360');
}

function connectedNodeCount(draws: readonly DrawnCard[]): number {
  const graph = analyzeTodayConnections(draws);
  if (!draws.length) return 0;
  const reached = new Set([0]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of graph.edges) {
      if (reached.has(edge.fromIndex) && !reached.has(edge.toIndex)) {
        reached.add(edge.toIndex);
        changed = true;
      }
      if (reached.has(edge.toIndex) && !reached.has(edge.fromIndex)) {
        reached.add(edge.fromIndex);
        changed = true;
      }
    }
  }
  return reached.size;
}

function testDraw(
  id: string,
  sourceSystem: SystemSlug,
  sourceSystemName: string,
  overrides: Partial<CardDefinition> = {},
): DrawnCard {
  return {
    card: {
      id,
      name: id,
      glyph: '✦',
      keywords: ['growth', 'clarity'],
      meaning: 'Growth becomes possible when the situation is named clearly.',
      sourceSystem,
      sourceSystemName,
      ...overrides,
    },
    position: 'Test position',
    reversed: false,
  };
}

function independentRandomBaseline(
  storedSeed: ReturnType<typeof seed>,
  count: number,
): DrawnCard[] {
  const groups = new Map<SystemSlug, CardDefinition[]>();
  for (const card of DIVINE_SYSTEM.cards) {
    if (!card.sourceSystem) continue;
    const cards = groups.get(card.sourceSystem) ?? [];
    cards.push(card);
    groups.set(card.sourceSystem, cards);
  }

  return [...groups]
    .sort(
      ([left], [right]) =>
        dailyHash(`${storedSeed.value}:baseline-source:${right}`) -
          dailyHash(`${storedSeed.value}:baseline-source:${left}`) ||
        left.localeCompare(right),
    )
    .slice(0, count)
    .map(([source, cards], index) => ({
      card: cards[
        dailyHash(`${storedSeed.value}:baseline-card:${source}`) % cards.length
      ],
      position: `Baseline position ${index + 1}`,
      reversed: false,
    }));
}

function graphCoherence(draws: readonly DrawnCard[]): {
  meanPairScore: number;
  meanBestLink: number;
  meaningfulPairShare: number;
} {
  const pairs = analyzeTodayConnections(draws).pairs;
  const bestLinks = draws.map((_, index) =>
    Math.max(
      ...pairs
        .filter((pair) => pair.fromIndex === index || pair.toIndex === index)
        .map((pair) => pair.score),
    ),
  );
  return {
    meanPairScore:
      pairs.reduce((sum, pair) => sum + pair.score, 0) / pairs.length,
    meanBestLink:
      bestLinks.reduce((sum, score) => sum + score, 0) / bestLinks.length,
    meaningfulPairShare:
      pairs.filter((pair) => pair.score >= 7).length / pairs.length,
  };
}

describe('Today prompt and seed', () => {
  it('uses the viewer’s local calendar date', () => {
    expect(localDateKey(new Date(2026, 8, 2, 23, 59))).toBe('2026-09-02');
    expect(localDateKey(new Date(2026, 0, 4))).toBe('2026-01-04');
    expect(() => localDateKey(new Date('invalid'))).toThrow('valid date');
  });

  it('chooses one reflective question deterministically from the local date', () => {
    const first = todayPrompt('2026-09-02');
    expect(todayPrompt('2026-09-02')).toEqual(first);
    expect(TODAY_PROMPTS).toContainEqual(first);
    expect(first.text).toMatch(/\?$/u);

    const month = new Set(
      Array.from(
        { length: 28 },
        (_, day) =>
          todayPrompt(`2026-09-${String(day + 1).padStart(2, '0')}`).text,
      ),
    );
    expect(month.size).toBeGreaterThan(8);
  });

  it('combines normalized response entropy with an explicit time offset', () => {
    const first = createTodaySeed(
      '  A   QUIET\nchange  ',
      generatedAt,
      'local-minute-877',
    );
    const equivalent = createTodaySeed(
      'a quiet change',
      generatedAt,
      'local-minute-877',
    );
    const anotherAnswer = createTodaySeed(
      'a loud change',
      generatedAt,
      'local-minute-877',
    );
    const anotherMinute = createTodaySeed(
      'a quiet change',
      generatedAt,
      'local-minute-878',
    );

    expect(equivalent.value).toBe(first.value);
    expect(anotherAnswer.value).not.toBe(first.value);
    expect(anotherMinute.value).not.toBe(first.value);
    expect(first.response).toBe('A QUIET change');
    expect(first.prompt).toBe(todayPrompt(first.dateKey).text);
    expect(first.value).toMatch(/^[\da-f]{16}$/u);
  });

  it('exposes an injectable, local date-and-time offset', () => {
    expect(todayOffset(generatedAt)).toMatch(/^2026-09-02T14:37@-?\d+$/u);
    expect(() => createTodaySeed('   ', generatedAt, 'offset')).toThrow(
      'reflection',
    );
    expect(() => createTodaySeed('thought', generatedAt, '   ')).toThrow(
      'offset',
    );
    expect(() =>
      createTodaySeed('x'.repeat(TODAY_RESPONSE_MAX_LENGTH + 1), generatedAt),
    ).toThrow('cannot exceed');
  });

  it('recognizes a seed after local JSON persistence', () => {
    const restored: unknown = JSON.parse(JSON.stringify(seed()));
    expect(isTodaySeed(restored)).toBe(true);
    expect(isTodaySeed({ ...seed(), value: 'not-a-seed' })).toBe(false);
    expect(isTodaySeed(null)).toBe(false);
    expect(Number.isFinite(dailyHash('stable'))).toBe(true);
  });
});

describe('Today constellation draw', () => {
  it('is stable for the same stored seed, including orientation', () => {
    const stored = seed();
    const first = drawToday(stored);
    const restored = JSON.parse(JSON.stringify(stored));
    expect(drawToday(restored)).toEqual(first);
  });

  it('draws 4–8 cards without repeating a source tradition', () => {
    for (let index = 0; index < 80; index += 1) {
      const draws = drawToday(
        createTodaySeed(
          `reflection ${index}`,
          generatedAt,
          `explicit-offset-${index}`,
        ),
      );
      const sources = draws.map((draw) => draw.card.sourceSystem);
      expect(draws.length).toBeGreaterThanOrEqual(4);
      expect(draws.length).toBeLessThanOrEqual(8);
      expect(new Set(sources).size).toBe(draws.length);
      expect(sources.every(Boolean)).toBe(true);
    }
  });

  it('can produce every count in the 4–8 range', () => {
    const counts = new Set(
      Array.from(
        { length: 120 },
        (_, index) =>
          drawToday(
            createTodaySeed(
              'same private answer',
              generatedAt,
              `count-offset-${index}`,
            ),
          ).length,
      ),
    );
    expect([...counts].sort((left, right) => left - right)).toEqual([
      4, 5, 6, 7, 8,
    ]);
  });

  it('preserves seeded variety inside the coherent candidate pool', () => {
    const draws = Array.from({ length: 160 }, (_, index) =>
      drawToday(
        createTodaySeed(
          `variety sample ${index}`,
          generatedAt,
          `variety-offset-${index}`,
        ),
      ),
    );
    const signatures = new Set(
      draws.map((items) => items.map(({ card }) => card.id).join('|')),
    );
    const secondCardsByAnchor = new Map<string, Set<string>>();
    for (const items of draws) {
      const anchor = items[0].card.id;
      const seconds = secondCardsByAnchor.get(anchor) ?? new Set<string>();
      seconds.add(items[1].card.id);
      secondCardsByAnchor.set(anchor, seconds);
    }

    expect(signatures.size).toBeGreaterThan(150);
    expect(
      [...secondCardsByAnchor.values()].filter((seconds) => seconds.size > 1)
        .length,
    ).toBeGreaterThan(8);
  });

  it('only applies reversals in traditions that define them', () => {
    const allowed = new Set<SystemSlug>(['tarot', 'sibilla']);
    const reversedSources = new Set<SystemSlug>();
    for (let index = 0; index < 200; index += 1) {
      for (const draw of drawToday(
        createTodaySeed('orientation', generatedAt, `orientation-${index}`),
      )) {
        if (draw.reversed && draw.card.sourceSystem) {
          reversedSources.add(draw.card.sourceSystem);
          expect(allowed.has(draw.card.sourceSystem)).toBe(true);
        }
      }
    }
    expect(reversedSources.size).toBeGreaterThan(0);
  });

  it('builds materially more coherent graphs than independent random cards', () => {
    const comparisons = Array.from({ length: 48 }, (_, index) => {
      const storedSeed = createTodaySeed(
        `coherence sample ${index}`,
        generatedAt,
        `coherence-offset-${index}`,
      );
      const selected = drawToday(storedSeed);
      return {
        selected: graphCoherence(selected),
        baseline: graphCoherence(
          independentRandomBaseline(storedSeed, selected.length),
        ),
      };
    });
    const average = (
      key: keyof ReturnType<typeof graphCoherence>,
      side: 'selected' | 'baseline',
    ) =>
      comparisons.reduce((sum, comparison) => sum + comparison[side][key], 0) /
      comparisons.length;

    expect(average('meanPairScore', 'selected')).toBeGreaterThan(
      average('meanPairScore', 'baseline') + 2,
    );
    expect(average('meanBestLink', 'selected')).toBeGreaterThan(
      average('meanBestLink', 'baseline') + 3,
    );
    expect(average('meaningfulPairShare', 'selected')).toBeGreaterThan(
      average('meaningfulPairShare', 'baseline') + 0.2,
    );
  });

  it('keeps every selected meaning attached to a substantive thread', () => {
    for (let index = 0; index < 80; index += 1) {
      const draws = drawToday(
        createTodaySeed(
          `connected sample ${index}`,
          generatedAt,
          `connected-offset-${index}`,
        ),
      );
      const graph = analyzeTodayConnections(draws);
      const hasEarlierSemanticLink = draws.map((_, cardIndex) =>
        cardIndex === 0
          ? true
          : graph.pairs.some(
              (pair) =>
                pair.toIndex === cardIndex &&
                pair.fromIndex < cardIndex &&
                pair.sharedThemes.length > 0,
            ),
      );
      expect(hasEarlierSemanticLink.every(Boolean)).toBe(true);
    }
  });
});

describe('Today connection engine', () => {
  it('evaluates every unordered pair and returns a connected graph', () => {
    const draws = drawToday(seed());
    const graph = analyzeTodayConnections(draws);
    expect(graph.pairs).toHaveLength((draws.length * (draws.length - 1)) / 2);
    expect(
      new Set(graph.pairs.map((pair) => `${pair.fromIndex}:${pair.toIndex}`))
        .size,
    ).toBe(graph.pairs.length);
    expect(graph.edges.length).toBeGreaterThanOrEqual(draws.length - 1);
    expect(connectedNodeCount(draws)).toBe(draws.length);
    expect(
      graph.pairs.every((pair) => pair.score > 0 && pair.text.length > 60),
    ).toBe(true);
  });

  it('scores shared themes, elements, domains, numbers, and polarity', () => {
    const draws = [
      testDraw('Ember', 'tarot', 'Tarot', {
        element: 'fire',
        domain: 'work and relationship',
        numerology: 10,
        polarity: 'challenging',
      }),
      testDraw('Breath', 'oracle', 'Oracle', {
        element: 'air',
        domain: 'relationship and purpose',
        numerology: 1,
        polarity: 'positive',
      }),
    ];
    const pair = analyzeTodayConnections(draws).pairs[0];
    expect(pair.sharedKeywords).toContain('clarity');
    expect(pair.sharedThemes).toContain('growth');
    expect(pair.reasons.join(' ')).toContain('air gives fire');
    expect(pair.reasons.join(' ')).toContain('domains overlap');
    expect(pair.reasons.join(' ')).toContain('same root');
    expect(pair.reasons.join(' ')).toContain('constructive');
  });

  it('does not mistake short words inside unrelated meanings for themes', () => {
    const enduranceAndEnding = analyzeTodayConnections([
      testDraw('Endurance', 'oracle', 'Oracle', {
        keywords: ['endurance'],
        meaning: 'Endurance sustains a patient rhythm.',
      }),
      testDraw('Ending', 'tarot', 'Tarot', {
        keywords: ['ending'],
        meaning: 'An ending closes the present cycle.',
      }),
    ]).pairs[0];
    const willowAndWill = analyzeTodayConnections([
      testDraw('Willow', 'oracle', 'Oracle', {
        keywords: ['willow'],
        meaning: 'A willow bends without breaking.',
      }),
      testDraw('Will', 'tarot', 'Tarot', {
        keywords: ['will'],
        meaning: 'Will directs effort toward a choice.',
      }),
    ]).pairs[0];

    expect(enduranceAndEnding.sharedThemes).not.toContain('change');
    expect(willowAndWill.sharedThemes).not.toContain('action');
  });

  it('uses reversed meaning when evaluating semantic coherence', () => {
    const turning = testDraw('Turning', 'oracle', 'Oracle', {
      keywords: ['stability'],
      meaning: 'A firm structure preserves what is already established.',
      reversedMeaning: 'Change is unavoidable, and release creates movement.',
    });
    const change = testDraw('Threshold', 'tarot', 'Tarot', {
      keywords: ['change'],
      meaning: 'A transition makes the next stage possible.',
    });

    const upright = analyzeTodayConnections([turning, change]).pairs[0];
    const reversed = analyzeTodayConnections([
      { ...turning, reversed: true },
      change,
    ]).pairs[0];

    expect(upright.sharedThemes).not.toContain('change');
    expect(reversed.sharedThemes).toContain('change');
  });

  it('connects meanings without surfacing card or tradition identities', () => {
    const draws = [
      testDraw('Ember Sigil 912', 'tarot', 'Hidden Tarot 912', {
        keywords: ['aurochs', 'jupiter'],
        meaning:
          'Ember Sigil 912 means aurochs. Use strength as capacity, not proof.',
        polarity: 'challenging',
      }),
      testDraw('Clear Vessel 731', 'oracle', 'Private Oracle 731', {
        keywords: ['Falschheit', 'disguise'],
        meaning: 'Falschheit depicts disguise and concealment.',
        polarity: 'positive',
      }),
      testDraw('Sheltered Root 548', 'lenormand', 'Secret Lenormand 548', {
        keywords: ['Servant', 'helper'],
        meaning: 'Servant reversed warns that help may not be dependable.',
        element: 'earth',
      }),
      testDraw('Joining Thread 364', 'spellcraft', 'Veiled Ritual 364', {
        keywords: ['connection', 'choice'],
        meaning: 'Connection reveals which choices can be shared.',
        element: 'air',
      }),
    ];
    const interpretation = interpretTodayConstellation(draws);
    const prose = [
      interpretation.headline,
      interpretation.overview,
      interpretation.synthesis,
      interpretation.closing,
      interpretation.reflectionPrompt ?? '',
      ...interpretation.positions.flatMap((position) => [
        position.label,
        position.card,
        position.text,
      ]),
      ...(interpretation.connections ?? []).flatMap((connection) => [
        connection.from,
        connection.to,
        connection.text,
      ]),
    ].join(' ');

    const sentences =
      interpretation.synthesis
        .match(/[^.!?]+[.!?]/gu)
        ?.map((sentence) => sentence.trim()) ?? [];
    expect(interpretation.positions).toEqual([]);
    expect(interpretation.connections).toBeUndefined();
    expect(sentences).toHaveLength(4);
    expect(sentences[1]).toMatch(/^That becomes difficult when\b/u);
    expect(sentences[2]).toMatch(/^What helps is\b/u);
    expect(sentences[3]).toMatch(
      /^(?:Ask|Begin|Build|Change|Choose|Clarify|Conserve|Create|Decide|Direct|Give|Honor|Keep|Let|Make|Name|Notice|Pause|Protect|Recognize|Reduce|Release|Repair|Resolve|Say|Set|Speak|State|Step|Stop|Strengthen|Take|Test|Turn|Use|Wait|Work)\b/u,
    );
    expect(interpretation.closing).toMatch(/\?$/u);
    expect(interpretTodayConstellation(draws)).toEqual(interpretation);
    const normalizedProse = prose.toLocaleLowerCase('en-US');
    for (const draw of draws) {
      expect(normalizedProse).not.toContain(
        draw.card.name.toLocaleLowerCase('en-US'),
      );
      expect(normalizedProse).not.toContain(
        draw.card.sourceSystemName?.toLocaleLowerCase('en-US'),
      );
    }
    for (const opaqueTag of [
      'aurochs',
      'jupiter',
      'Falschheit',
      'disguise',
      'Servant',
      'helper',
    ]) {
      expect(normalizedProse).not.toContain(
        opaqueTag.toLocaleLowerCase('en-US'),
      );
    }
    expect(prose).not.toMatch(/\bcards?\b/iu);
    expect(prose).not.toMatch(
      /\b(?:card|constellation|counterpoint|deck|graph|hub|interpretation|junction|meaning|pattern|reinforcement|spread|theme)\b/iu,
    );
    expect(prose).not.toMatch(
      /(?:give one another shape|asking to be acknowledged|test against lived experience|taken together)/iu,
    );
  });

  it('lets every draw materially shape an eight-part narrative', () => {
    const themes = [
      'change',
      'challenge',
      'possibility',
      'action',
      'connection',
      'truth',
      'feeling',
      'stability',
    ] as const;
    const sources: SystemSlug[] = [
      'tarot',
      'oracle',
      'lenormand',
      'spellcraft',
      'ancient-egypt',
      'zodiac',
      'kipper',
      'belline',
    ];
    const draws = themes.map((theme, index) =>
      testDraw(`Private ${index}`, sources[index], `Source ${index}`, {
        keywords: [theme],
        meaning: `${theme} has a concrete effect on the situation now.`,
        domain: theme,
        polarity:
          theme === 'challenge'
            ? 'challenging'
            : theme === 'possibility'
              ? 'positive'
              : 'neutral',
      }),
    );
    const original = interpretTodayConstellation(draws);

    for (const [index, draw] of draws.entries()) {
      const replacementTheme = themes[(index + 3) % themes.length];
      const mutated = draws.map((candidate, candidateIndex) =>
        candidateIndex === index
          ? {
              ...draw,
              card: {
                ...draw.card,
                keywords: [replacementTheme],
                meaning: `${replacementTheme} now changes this part of the situation.`,
                domain: replacementTheme,
              },
            }
          : candidate,
      );
      expect(interpretTodayConstellation(mutated).synthesis).not.toBe(
        original.synthesis,
      );
    }
  });
});

describe('Today journal record', () => {
  it('creates one journal-ready DIVINE record with prompt and response separated', () => {
    const storedSeed = seed('A private thought that should remain local.');
    const record = todayRecord(storedSeed);
    expect(record.id).toBe('today:2026-09-02:constellation');
    expect(record.system).toBe('divine');
    expect(record.spreadId).toBe('today-constellation');
    expect(record.focus).toBe('general');
    expect(record.question).toBe(storedSeed.prompt);
    expect(record.note).toBe(storedSeed.response);
    expect(record.draws.length).toBeGreaterThanOrEqual(4);
    expect(record.interpretation.positions).toEqual([]);
    expect(record.interpretation.connections).toBeUndefined();
    expect(record.interpretation.synthesis.length).toBeGreaterThan(200);
  });

  it('uses a fixed daily journal id while seed-specific output stays immutable', () => {
    const firstSeed = createTodaySeed('first response', generatedAt, 'first');
    const secondSeed = createTodaySeed(
      'second response',
      generatedAt,
      'second',
    );
    const first = todayRecord(firstSeed);
    const repeated = todayRecord(firstSeed);
    const second = todayRecord(secondSeed);
    expect(repeated).toEqual(first);
    expect(second.id).toBe(first.id);
    expect(second.draws).not.toEqual(first.draws);
  });

  it('uses the response only as local entropy and does not quote it in interpretation', () => {
    const privateWords = 'ultraviolet-cormorant-8241';
    const record = todayRecord(seed(privateWords));
    expect(JSON.stringify(record.interpretation)).not.toContain(privateWords);
    expect(record.note).toBe(privateWords);
  });

  it('lets the journal note be updated without changing the generated result', () => {
    const storedSeed = seed();
    const first = todayRecord(storedSeed);
    const updated = todayRecord(storedSeed, 'A later reflection.');
    expect(updated.note).toBe('A later reflection.');
    expect(updated.draws).toEqual(first.draws);
    expect(updated.interpretation).toEqual(first.interpretation);
  });
});

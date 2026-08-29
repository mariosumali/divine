import { describe, expect, it } from 'vitest';
import { READING_INDEX_ART } from './catalog';
import { interpretReading, objectInterpretation } from './reading';
import {
  composeShare,
  createReadingShareToken,
  createReadingShareUrl,
  decodeReadingShareToken,
} from './share';
import { SYSTEM_MAP, SYSTEMS } from './systems';
import { createTodaySeed, todayRecord } from './today';
import type { ReadingRecord } from './types';

const record: ReadingRecord = {
  id: 'private-reading',
  system: 'magic-8-ball',
  systemName: 'Magic 8 Ball',
  spreadId: 'ball',
  spreadName: 'Ask & shake',
  createdAt: '2026-09-02T10:00:00.000Z',
  focus: 'general',
  question: 'This must stay private',
  draws: [],
  interpretation: {
    headline: 'The current favors it.',
    overview: 'Overview',
    positions: [],
    synthesis: 'Synthesis',
    closing: 'Closing',
  },
  note: 'Also private',
  favorite: false,
};

describe('share composition privacy', () => {
  it('omits private questions and notes by default', () => {
    const composition = composeShare(record);
    expect(composition.question).toBeUndefined();
    expect(JSON.stringify(composition)).not.toContain(record.question);
    expect(JSON.stringify(composition)).not.toContain(record.note);
  });

  it('includes the question only after explicit opt-in', () => {
    expect(composeShare(record, true).question).toBe(record.question);
  });

  it('keeps a randomized object headline stable for the exact reading', () => {
    const original = composeShare(record).displayHeadline;
    const decoded = decodeReadingShareToken(
      createReadingShareToken(record),
      SYSTEM_MAP['magic-8-ball'],
    )?.record;

    expect(original).not.toBe('The answer has arrived.');
    expect(decoded && composeShare(decoded).displayHeadline).toBe(original);
  });

  it('varies headlines across both object-reading systems', () => {
    for (const system of [
      SYSTEM_MAP['magic-8-ball'],
      SYSTEM_MAP['fortune-cookie'],
    ]) {
      const headlines = Array.from(
        { length: 36 },
        (_, index) =>
          composeShare({
            ...record,
            system: system.slug,
            systemName: system.name,
            spreadId: system.kind,
            spreadName:
              system.kind === 'ball' ? 'Ask & shake' : 'Crack & reveal',
            createdAt: new Date(Date.UTC(2026, 8, 2, 10, index)).toISOString(),
            luckyNumbers: system.kind === 'cookie' ? [3, 8, 13] : undefined,
          }).displayHeadline,
      );

      expect(new Set(headlines).size).toBeGreaterThan(6);
    }
  });

  it('retains the complete spread in the export composition', () => {
    const draws = SYSTEMS[0].cards.slice(0, 12).map((card, index) => ({
      card,
      position: `Position ${index + 1}`,
      reversed: index % 2 === 0,
    }));
    const composition = composeShare({ ...record, draws });
    expect(composition.cards).toHaveLength(12);
    expect(composition.cards[0]).toMatchObject({
      position: 'Position 1',
      reversed: true,
      glyph: draws[0].card.glyph,
      image: draws[0].card.image,
    });
    expect(composition.methodArt).toBe(READING_INDEX_ART[record.system]);
  });

  it('round-trips an exact card reading through a share link', () => {
    const system = SYSTEM_MAP.tarot;
    const spread = system.spreads[1];
    const draws = system.cards
      .slice(0, spread.positions.length)
      .map((card, index) => ({
        card,
        position: spread.positions[index],
        reversed: index === 1,
      }));
    const tarotRecord: ReadingRecord = {
      ...record,
      system: system.slug,
      systemName: system.name,
      spreadId: spread.id,
      spreadName: spread.name,
      focus: 'growth',
      question: 'What is becoming? ✦',
      draws,
      interpretation: {
        ...interpretReading(system, spread, draws, 'growth', record.createdAt),
        headline: 'This exact headline travels with the reading.',
      },
    };
    const token = createReadingShareToken(tarotRecord, true);
    const decoded = decodeReadingShareToken(token, system)?.record;

    expect(decoded?.question).toBe(tarotRecord.question);
    expect(decoded?.draws.map((draw) => draw.card.id)).toEqual(
      draws.map((draw) => draw.card.id),
    );
    expect(decoded?.draws.map((draw) => draw.reversed)).toEqual([
      false,
      true,
      false,
    ]);
    expect(decoded?.interpretation).toEqual(tarotRecord.interpretation);
    expect(decoded?.note).toBe('');
    expect(decoded?.favorite).toBe(false);
  });

  it('round-trips a dynamic Today constellation without exposing the response', () => {
    const seed = createTodaySeed(
      'Private words used only to shape the draw.',
      new Date('2026-09-02T20:37:00.000Z'),
      '2026-09-02T14:37@360',
    );
    const dailyRecord = todayRecord(seed);
    const token = createReadingShareToken(dailyRecord);
    const decoded = decodeReadingShareToken(token, SYSTEM_MAP.divine)?.record;

    expect(decoded?.draws).toEqual(dailyRecord.draws);
    expect(decoded?.interpretation).toEqual(dailyRecord.interpretation);
    expect(decoded?.note).toBe('');
    expect(token).not.toContain(seed.response);
  });

  it('keeps private fields out of the default share link', () => {
    const token = createReadingShareToken(record);
    const decoded = decodeReadingShareToken(
      token,
      SYSTEM_MAP['magic-8-ball'],
    )?.record;
    const url = createReadingShareUrl(record, 'https://divine.example/');

    expect(decoded?.question).toBeUndefined();
    expect(decoded?.note).toBe('');
    expect(url).toMatch(
      /^https:\/\/divine\.example\/read\/magic-8-ball#reading=/,
    );
  });

  it('rejects malformed or cross-system share tokens', () => {
    const token = createReadingShareToken(record);
    expect(
      decodeReadingShareToken('not-a-reading', SYSTEM_MAP.tarot),
    ).toBeNull();
    expect(decodeReadingShareToken(token, SYSTEM_MAP.tarot)).toBeNull();
  });

  it('creates a decodable link for every reading method and spread', () => {
    for (const system of SYSTEMS) {
      if (system.kind !== 'cards') {
        const objectRecord: ReadingRecord = {
          ...record,
          system: system.slug,
          systemName: system.name,
          spreadId: system.kind,
          spreadName: system.kind === 'ball' ? 'Ask & shake' : 'Crack & reveal',
          interpretation: objectInterpretation(
            system,
            'The answer remains yours.',
            'general',
          ),
          luckyNumbers: system.kind === 'cookie' ? [3, 8, 13] : undefined,
        };
        expect(
          decodeReadingShareToken(createReadingShareToken(objectRecord), system)
            ?.record.interpretation,
        ).toEqual(objectRecord.interpretation);
        continue;
      }

      for (const spread of system.spreads) {
        const draws = system.cards
          .slice(0, spread.positions.length)
          .map((card, index) => ({
            card,
            position: spread.positions[index],
            reversed: index % 2 === 1,
          }));
        const cardRecord: ReadingRecord = {
          ...record,
          system: system.slug,
          systemName: system.name,
          spreadId: spread.id,
          spreadName: spread.name,
          draws,
          interpretation: interpretReading(
            system,
            spread,
            draws,
            'general',
            record.createdAt,
          ),
        };
        const decoded = decodeReadingShareToken(
          createReadingShareToken(cardRecord),
          system,
        )?.record;
        expect(decoded?.spreadId).toBe(spread.id);
        expect(decoded?.draws.map((draw) => draw.card.id)).toEqual(
          draws.map((draw) => draw.card.id),
        );
        expect(decoded?.interpretation).toEqual(cardRecord.interpretation);
      }
    }
  });
});

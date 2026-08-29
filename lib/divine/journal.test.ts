import { describe, expect, it } from 'vitest';
import { journalInsights, journalMonths, readingMonthKey } from './journal';
import type { ReadingRecord } from './types';

const makeReading = (
  id: string,
  createdAt: string,
  card: { name: string; glyph: string; keywords: string[] },
): ReadingRecord => ({
  id,
  system: 'oracle',
  systemName: 'Oracle',
  spreadId: 'one',
  spreadName: 'One card',
  createdAt,
  focus: 'general',
  draws: [
    {
      card: {
        id: card.name.toLowerCase(),
        meaning: 'Meaning',
        ...card,
      },
      position: 'Message',
      reversed: false,
    },
  ],
  interpretation: {
    headline: card.name,
    overview: '',
    positions: [],
    synthesis: '',
    closing: '',
  },
  note: '',
  favorite: false,
});

describe('journal chronology and insights', () => {
  const records = [
    makeReading('one', '2026-09-02T12:00:00.000Z', {
      name: 'The Star',
      glyph: '✦',
      keywords: ['hope', 'renewal'],
    }),
    makeReading('two', '2026-09-18T12:00:00.000Z', {
      name: 'The Star',
      glyph: '✦',
      keywords: ['hope', 'direction'],
    }),
    makeReading('three', '2026-08-01T12:00:00.000Z', {
      name: 'The Moon',
      glyph: '☾',
      keywords: ['intuition', 'dreams'],
    }),
  ];

  it('builds newest-first calendar months with reading counts', () => {
    expect(journalMonths(records)).toEqual([
      { key: '2026-09', label: 'September 2026', count: 2 },
      { key: '2026-08', label: 'August 2026', count: 1 },
    ]);
    expect(readingMonthKey(records[0].createdAt)).toBe('2026-09');
  });

  it('only presents recurring cards, symbols, and themes', () => {
    expect(journalInsights(records)).toEqual([
      { kind: 'card', label: 'The Star', count: 2 },
      { kind: 'symbol', label: '✦', count: 2 },
      { kind: 'theme', label: 'hope', count: 2 },
    ]);
  });
});

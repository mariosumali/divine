import { describe, expect, it } from 'vitest';
import { composeShare } from './share';
import { SYSTEMS } from './systems';
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

  it('retains the complete spread in the export composition', () => {
    const draws = SYSTEMS[0].cards
      .slice(0, 12)
      .map((card, index) => ({
        card,
        position: `Position ${index + 1}`,
        reversed: index % 2 === 0,
      }));
    const composition = composeShare({ ...record, draws });
    expect(composition.cards).toHaveLength(12);
    expect(composition.cards[0]).toMatchObject({
      position: 'Position 1',
      reversed: true,
    });
  });
});

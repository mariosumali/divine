import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearReadings,
  deleteReading,
  listReadings,
  normalizeReading,
  saveReading,
} from './storage';
import type { ReadingRecord } from './types';

const record: ReadingRecord = {
  id: 'reading-one',
  system: 'oracle',
  systemName: 'Oracle',
  spreadId: 'message',
  spreadName: 'Single message',
  createdAt: '2026-09-02T12:00:00.000Z',
  focus: 'general',
  question: 'What is opening?',
  draws: [],
  note: 'A private note.',
  favorite: true,
  interpretation: {
    headline: 'The Open Door arrives.',
    overview: 'An answer.',
    positions: [],
    synthesis: 'A pattern.',
    closing: 'Carry it.',
  },
};

describe('device-local journal', () => {
  beforeEach(async () => {
    await clearReadings().catch(() => undefined);
  });

  it('saves, updates, lists, and deletes complete immutable readings', async () => {
    await saveReading(record);
    expect(await listReadings()).toEqual([
      { ...record, tags: [], followUp: '' },
    ]);
    await saveReading({ ...record, note: 'Revised privately.' });
    expect((await listReadings())[0].note).toBe('Revised privately.');
    await deleteReading(record.id);
    expect(await listReadings()).toEqual([]);
  });

  it('normalizes records from older journal versions', () => {
    const legacy: Record<string, unknown> = { ...record };
    delete legacy.note;
    delete legacy.favorite;
    legacy.tags = [' decisions ', '', 'decisions', 7];
    legacy.followUp = null;

    expect(normalizeReading(legacy as unknown as ReadingRecord)).toMatchObject({
      note: '',
      favorite: false,
      tags: ['decisions'],
      followUp: '',
    });
  });
});

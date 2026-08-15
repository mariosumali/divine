import type { ReadingRecord } from './types';

export interface ShareComposition {
  title: string;
  subtitle: string;
  headline: string;
  synthesis: string;
  date: string;
  cards: Array<{ name: string; position: string; reversed: boolean }>;
  question?: string;
}

export function composeShare(record: ReadingRecord, includeQuestion = false): ShareComposition {
  return {
    title: 'DIVINE',
    subtitle: `${record.systemName} · ${record.spreadName}`,
    headline: record.interpretation.headline,
    synthesis: record.interpretation.synthesis,
    date: record.createdAt,
    cards: record.draws.map((draw) => ({ name: draw.card.name, position: draw.position, reversed: draw.reversed })),
    question: includeQuestion ? record.question : undefined,
  };
}

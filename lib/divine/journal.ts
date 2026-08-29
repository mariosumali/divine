import type { Focus, ReadingRecord } from './types';

export type JournalInsight = {
  kind: 'card' | 'symbol' | 'theme';
  label: string;
  count: number;
};

export type JournalMonth = {
  key: string;
  label: string;
  count: number;
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export function readingMonthKey(createdAt: string): string {
  return monthKey(new Date(createdAt));
}

export function journalMonths(records: ReadingRecord[]): JournalMonth[] {
  const counts = new Map<string, { date: Date; count: number }>();
  records.forEach((record) => {
    const date = new Date(record.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const key = monthKey(date);
    counts.set(key, { date, count: (counts.get(key)?.count ?? 0) + 1 });
  });
  return Array.from(counts, ([key, value]) => ({
    key,
    label: value.date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    }),
    count: value.count,
  })).sort((a, b) => b.key.localeCompare(a.key));
}

function repeated(
  kind: JournalInsight['kind'],
  values: string[],
): JournalInsight[] {
  const counts = new Map<string, { label: string; count: number }>();
  values.forEach((label) => {
    const clean = label.trim();
    if (!clean) return;
    const key = clean.toLocaleLowerCase();
    counts.set(key, { label: clean, count: (counts.get(key)?.count ?? 0) + 1 });
  });
  return Array.from(counts.values())
    .filter(({ count }) => count > 1)
    .map(({ label, count }) => ({ kind, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Recurrences are observations across saved readings, never predictions. */
export function journalInsights(records: ReadingRecord[]): JournalInsight[] {
  const cards = records.flatMap((record) =>
    Array.from(new Set(record.draws.map((draw) => draw.card.name))),
  );
  const symbols = records.flatMap((record) =>
    Array.from(
      new Set(record.draws.map((draw) => draw.card.glyph).filter(Boolean)),
    ),
  );
  const themes = records.flatMap((record) =>
    Array.from(
      new Set(record.draws.flatMap((draw) => draw.card.keywords.slice(0, 2))),
    ),
  );
  return [
    ...repeated('card', cards).slice(0, 3),
    ...repeated('symbol', symbols).slice(0, 3),
    ...repeated('theme', themes).slice(0, 4),
  ];
}

export const journalFocuses: Array<{ value: Focus; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'love', label: 'Love' },
  { value: 'work', label: 'Work' },
  { value: 'growth', label: 'Growth' },
];

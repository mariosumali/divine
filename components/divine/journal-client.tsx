'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronDown,
  Heart,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useExperience } from '@/app/providers';
import { CopyReadingLinkButton } from '@/components/divine/reading-share';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { READING_INDEX_ART } from '@/lib/divine/catalog';
import {
  imageForFinish,
  isCardSystemSlug,
  type DeckFinishes,
} from '@/lib/divine/decks';
import { divineHeroIcon, DIVINE_HERO_ICONS } from '@/lib/divine/hero-icons';
import {
  journalFocuses,
  journalInsights,
  journalMonths,
  readingMonthKey,
} from '@/lib/divine/journal';
import {
  clearReadings,
  deleteReading,
  listReadings,
  saveReading,
} from '@/lib/divine/storage';
import type { Focus, ReadingRecord, SystemSlug } from '@/lib/divine/types';

const parseTags = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);

export function JournalClient() {
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | SystemSlug>('all');
  const [focus, setFocus] = useState<'all' | Focus>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    void listReadings()
      .then(setRecords)
      .catch(() => setError(true));
  }, []);

  const systems = useMemo(
    () => Array.from(new Set(records.map((record) => record.system))),
    [records],
  );
  const months = useMemo(() => journalMonths(records), [records]);
  const tags = useMemo(
    () =>
      Array.from(new Set(records.flatMap((record) => record.tags ?? []))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [records],
  );
  const insights = useMemo(() => journalInsights(records), [records]);
  const visible = useMemo(
    () =>
      records.filter((record) => {
        const matchesFilter = filter === 'all' || record.system === filter;
        const matchesFocus = focus === 'all' || record.focus === focus;
        const matchesFavorite = !favoritesOnly || record.favorite;
        const matchesTag = !tag || record.tags?.includes(tag);
        const matchesMonth =
          !month || readingMonthKey(record.createdAt) === month;
        const haystack =
          `${record.systemName} ${record.spreadName} ${record.question ?? ''} ${record.note} ${record.followUp ?? ''} ${(record.tags ?? []).join(' ')} ${record.draws.flatMap((draw) => [draw.card.name, ...draw.card.keywords]).join(' ')} ${record.interpretation.headline}`.toLowerCase();
        return (
          matchesFilter &&
          matchesFocus &&
          matchesFavorite &&
          matchesTag &&
          matchesMonth &&
          haystack.includes(query.toLowerCase())
        );
      }),
    [records, query, filter, focus, favoritesOnly, tag, month],
  );

  const update = async (record: ReadingRecord) => {
    const next = records.map((item) => (item.id === record.id ? record : item));
    setRecords(next);
    try {
      await saveReading(record);
    } catch {
      setError(true);
    }
  };

  const updateLocal = (record: ReadingRecord) => {
    setRecords((items) =>
      items.map((item) => (item.id === record.id ? record : item)),
    );
  };

  const remove = async (id: string) => {
    try {
      await deleteReading(id);
      setRecords((items) => items.filter((item) => item.id !== id));
    } catch {
      setError(true);
    }
  };

  const clear = async () => {
    try {
      await clearReadings();
      setRecords([]);
    } catch {
      setError(true);
    }
  };

  return (
    <main className="journal-page">
      <header className="page-hero">
        <h1>The Journal</h1>
      </header>

      {error && (
        <output className="journal-warning">
          The journal is unavailable. Readings can still be completed and
          downloaded.
        </output>
      )}

      <div className="journal-tools">
        <label htmlFor="journal-search">
          <Search />
          <span className="sr-only">Search readings</span>
          <Input
            id="journal-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the journal"
            autoComplete="off"
          />
        </label>
        <div className="filter-row">
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {systems.map((system) => (
            <button
              type="button"
              key={system}
              className={filter === system ? 'active' : ''}
              aria-pressed={filter === system}
              onClick={() => setFilter(system)}
            >
              {records.find((record) => record.system === system)?.systemName}
            </button>
          ))}
          <button
            type="button"
            className={favoritesOnly ? 'active' : ''}
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly((value) => !value)}
          >
            <Heart fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites
          </button>
        </div>
      </div>

      {records.length > 0 && (
        <section className="journal-navigation" aria-label="Journal filters">
          <div className="journal-calendar">
            <div className="journal-section-title">
              <CalendarDays />
              <span>Calendar</span>
            </div>
            <div className="journal-calendar-months">
              <button
                type="button"
                className={month === null ? 'active' : ''}
                onClick={() => setMonth(null)}
              >
                All time <small>{records.length}</small>
              </button>
              {months.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={month === item.key ? 'active' : ''}
                  onClick={() => setMonth(item.key)}
                >
                  {item.label} <small>{item.count}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="journal-filter-groups">
            <div>
              <span>Focus</span>
              <button
                type="button"
                className={focus === 'all' ? 'active' : ''}
                onClick={() => setFocus('all')}
              >
                All
              </button>
              {journalFocuses.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={focus === item.value ? 'active' : ''}
                  onClick={() => setFocus(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {tags.length > 0 && (
              <div>
                <span>Collections</span>
                <button
                  type="button"
                  className={tag === null ? 'active' : ''}
                  onClick={() => setTag(null)}
                >
                  All
                </button>
                {tags.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={tag === item ? 'active' : ''}
                    onClick={() => setTag(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {insights.length > 0 && (
        <section className="journal-insights" aria-labelledby="insights-title">
          <div>
            <Sparkles />
            <h2 id="insights-title">Patterns in your pages</h2>
            <p>Quiet recurrences across your saved readings—not predictions.</p>
          </div>
          <div className="journal-insight-list">
            {insights.map((insight) => (
              <button
                type="button"
                key={`${insight.kind}-${insight.label}`}
                onClick={() => setQuery(insight.label)}
              >
                <small>{insight.kind}</small>
                <strong>{insight.label}</strong>
                <span>{insight.count} appearances</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {visible.length === 0 ? (
        <section className="journal-empty">
          <BookOpen />
          <h2>
            {records.length
              ? 'No readings match.'
              : 'The pages are still blank.'}
          </h2>
          <p>
            {records.length
              ? 'Try another word or method.'
              : 'Complete a reading and choose “Save to journal.”'}
          </p>
          <Link className="primary-action" href="/#readings">
            Begin a reading
          </Link>
        </section>
      ) : (
        <section className="journal-list" aria-label="Saved readings">
          {visible.map((record, index) => {
            const currentMonth = readingMonthKey(record.createdAt);
            const previousMonth =
              index > 0 ? readingMonthKey(visible[index - 1].createdAt) : null;
            return (
              <div className="journal-timeline-entry" key={record.id}>
                {currentMonth !== previousMonth && (
                  <h2 className="journal-timeline-heading">
                    {new Date(record.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h2>
                )}
                <motion.article
                  key={record.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.35) }}
                  className={record.favorite ? 'favorite' : ''}
                >
                  <button
                    type="button"
                    className="journal-summary"
                    onClick={() =>
                      setExpanded(expanded === record.id ? null : record.id)
                    }
                    aria-expanded={expanded === record.id}
                  >
                    <span>
                      {new Date(record.createdAt).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        },
                      )}
                    </span>
                    <strong>{record.interpretation.headline}</strong>
                    <small>
                      {record.systemName} · {record.spreadName}
                    </small>
                    <i>{expanded === record.id ? 'Close' : 'Reopen'} ↗</i>
                  </button>
                  {expanded === record.id && (
                    <div className="journal-detail">
                      {record.question && (
                        <blockquote>“{record.question}”</blockquote>
                      )}
                      {record.spreadId !== 'today-constellation' && (
                        <p>{record.interpretation.overview}</p>
                      )}
                      <div className="journal-draws">
                        {record.interpretation.positions.map(
                          (position, itemIndex) => (
                            <div key={`${position.card}-${itemIndex}`}>
                              <span>{position.label}</span>
                              <strong>{position.card}</strong>
                              <p>{position.text}</p>
                            </div>
                          ),
                        )}
                      </div>
                      {record.interpretation.connections && (
                        <div className="journal-connections">
                          <span>The connecting thread</span>
                          {record.interpretation.connections.map(
                            (connection) => (
                              <p key={`${connection.from}-${connection.to}`}>
                                <strong>
                                  {connection.from} → {connection.to}
                                </strong>{' '}
                                {connection.text}.
                              </p>
                            ),
                          )}
                        </div>
                      )}
                      {record.draws.length > 1 && (
                        <div className="journal-synthesis">
                          <span>How the meanings meet</span>
                          <p>{record.interpretation.synthesis}</p>
                          <p>{record.interpretation.closing}</p>
                        </div>
                      )}
                      <label htmlFor={`note-${record.id}`}>
                        Reflection
                        <Textarea
                          id={`note-${record.id}`}
                          value={record.note}
                          onChange={(event) =>
                            updateLocal({ ...record, note: event.target.value })
                          }
                          onBlur={(event) =>
                            void update({
                              ...record,
                              note: event.currentTarget.value,
                            })
                          }
                        />
                      </label>
                      <div className="journal-reflection-fields">
                        <label htmlFor={`follow-up-${record.id}`}>
                          What became clear?
                          <Textarea
                            id={`follow-up-${record.id}`}
                            value={record.followUp ?? ''}
                            placeholder="Return later. What changed, resolved, or surprised you?"
                            onChange={(event) =>
                              updateLocal({
                                ...record,
                                followUp: event.target.value,
                              })
                            }
                            onBlur={(event) =>
                              void update({
                                ...record,
                                followUp: event.currentTarget.value,
                              })
                            }
                          />
                        </label>
                        <label htmlFor={`tags-${record.id}`}>
                          <span>
                            <Tag /> Collections
                          </span>
                          <Input
                            id={`tags-${record.id}`}
                            value={
                              tagDrafts[record.id] ??
                              (record.tags ?? []).join(', ')
                            }
                            placeholder="Dreams, decisions, new moon"
                            onChange={(event) =>
                              setTagDrafts((drafts) => ({
                                ...drafts,
                                [record.id]: event.target.value,
                              }))
                            }
                            onBlur={(event) => {
                              const nextTags = parseTags(
                                event.currentTarget.value,
                              );
                              setTagDrafts((drafts) => ({
                                ...drafts,
                                [record.id]: nextTags.join(', '),
                              }));
                              void update({ ...record, tags: nextTags });
                            }}
                          />
                          <small>Separate labels with commas.</small>
                        </label>
                      </div>
                      <div className="journal-actions">
                        <Button
                          className="quiet-action"
                          onClick={() =>
                            void update({
                              ...record,
                              favorite: !record.favorite,
                            })
                          }
                        >
                          <Heart
                            fill={record.favorite ? 'currentColor' : 'none'}
                          />{' '}
                          {record.favorite ? 'Favorited' : 'Favorite'}
                        </Button>
                        <CopyReadingLinkButton record={record} />
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button className="quiet-action" />}
                          >
                            <Trash2 /> Delete
                          </AlertDialogTrigger>
                          <AlertDialogContent className="divine-dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this reading?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                The reading, its question, and your reflection
                                will be permanently removed from this browser.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Keep reading
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => void remove(record.id)}
                              >
                                Delete reading
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </motion.article>
              </div>
            );
          })}
        </section>
      )}

      {records.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button className="danger-link" />}>
            Clear all journal data
          </AlertDialogTrigger>
          <AlertDialogContent className="divine-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear the entire journal?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes every reading and note stored in this
                browser. It cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep journal</AlertDialogCancel>
              <AlertDialogAction onClick={() => void clear()}>
                Clear everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </main>
  );
}

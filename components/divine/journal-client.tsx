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

const entryDate = (createdAt: string) =>
  new Date(createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const focusLabel = (focus: Focus) =>
  journalFocuses.find((item) => item.value === focus)?.label ?? focus;

function JournalReadingVisual({
  record,
  deckFinishes,
}: {
  record: ReadingRecord;
  deckFinishes: DeckFinishes;
}) {
  const cardCount = record.draws.length;
  const columns = cardCount === 1 ? 1 : cardCount <= 3 ? cardCount : 4;

  if (cardCount === 0) {
    return (
      <figure className="journal-object-reading">
        <div>
          <Image
            src={READING_INDEX_ART[record.system]}
            alt={`${record.systemName} reading object`}
            fill
            sizes="(max-width: 980px) 70vw, 360px"
          />
        </div>
        <figcaption>
          <span>The answer</span>
          <strong>{record.interpretation.headline}</strong>
          {record.luckyNumbers && record.luckyNumbers.length > 0 && (
            <small>{record.luckyNumbers.join(' · ')}</small>
          )}
        </figcaption>
      </figure>
    );
  }

  return (
    <div
      className="journal-reading-grid"
      data-card-count={cardCount}
      style={{ '--journal-card-columns': columns } as CSSProperties}
      aria-label={`${cardCount} ${cardCount === 1 ? 'card' : 'cards'} drawn`}
    >
      {record.draws.map((draw, index) => {
        const sourceSystem = draw.card.sourceSystem ?? record.system;
        const finish = isCardSystemSlug(sourceSystem)
          ? deckFinishes[sourceSystem]
          : 'ink';
        const image = imageForFinish(draw.card, finish);

        return (
          <figure key={`${draw.card.id}-${index}`}>
            <span
              className={`journal-drawn-card deck-${finish}`}
              style={
                {
                  '--journal-card-ratio': draw.card.aspectRatio ?? 2 / 3,
                } as CSSProperties
              }
            >
              {image ? (
                <Image
                  src={image}
                  alt={`${draw.card.name} card artwork${draw.reversed ? ', reversed' : ''}`}
                  fill
                  sizes="(max-width: 720px) 42vw, (max-width: 980px) 22vw, 120px"
                  className={draw.reversed ? 'is-reversed' : undefined}
                />
              ) : (
                <strong
                  className={draw.reversed ? 'is-reversed' : undefined}
                  aria-hidden="true"
                >
                  {draw.card.glyph}
                </strong>
              )}
              <i>{`${index + 1}`.padStart(2, '0')}</i>
            </span>
            <figcaption>
              <span>{draw.position}</span>
              <strong>
                {draw.card.sourceSystemName && (
                  <small>{draw.card.sourceSystemName} · </small>
                )}
                {draw.card.name}
                {draw.reversed ? ' · reversed' : ''}
              </strong>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function JournalEntry({
  record,
  deckFinishes,
  error,
  onBack,
  onUpdate,
  onUpdateLocal,
  onRemove,
}: {
  record: ReadingRecord;
  deckFinishes: DeckFinishes;
  error: boolean;
  onBack: () => void;
  onUpdate: (record: ReadingRecord) => Promise<void>;
  onUpdateLocal: (record: ReadingRecord) => void;
  onRemove: (id: string) => Promise<void>;
}) {
  const [tagDraft, setTagDraft] = useState((record.tags ?? []).join(', '));
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const selectedJournalIcon = divineHeroIcon(record.journalIcon);
  const hasSynthesis = Boolean(
    record.interpretation.synthesis || record.interpretation.closing,
  );

  return (
    <main className="journal-page journal-entry-view">
      <header className="journal-entry-header">
        <div className="journal-entry-toolbar">
          <button type="button" className="journal-back" onClick={onBack}>
            <ArrowLeft /> Back to journal
          </button>
          <div className="journal-entry-actions">
            <Button
              type="button"
              className="quiet-action"
              aria-pressed={record.favorite}
              onClick={() =>
                void onUpdate({
                  ...record,
                  favorite: !record.favorite,
                })
              }
            >
              <Heart fill={record.favorite ? 'currentColor' : 'none'} />
              {record.favorite ? 'Favorited' : 'Favorite'}
            </Button>
            <CopyReadingLinkButton record={record} showLabel />
          </div>
        </div>
        <p className="journal-entry-kicker">
          <time dateTime={record.createdAt}>{entryDate(record.createdAt)}</time>
          <span aria-hidden="true">·</span>
          {record.systemName}
        </p>
        <h1>{record.interpretation.headline}</h1>
        {record.question && <blockquote>“{record.question}”</blockquote>}
      </header>

      {error && (
        <output className="journal-warning">
          This page could not be saved. Your latest changes may only last for
          this visit.
        </output>
      )}

      <div className="journal-entry-layout">
        <aside
          className={`journal-visual-panel${record.draws.length > 8 ? ' is-long' : ''}`}
          aria-label="Reading at a glance"
        >
          <JournalReadingVisual record={record} deckFinishes={deckFinishes} />
          <dl className="journal-entry-facts">
            <div>
              <dt>Reading</dt>
              <dd>{record.spreadName}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{focusLabel(record.focus)}</dd>
            </div>
            <div>
              <dt>Cards</dt>
              <dd>{record.draws.length || 'Object reading'}</dd>
            </div>
            <div>
              <dt>Collections</dt>
              <dd>
                {record.tags && record.tags.length > 0
                  ? record.tags.join(', ')
                  : 'Unfiled'}
              </dd>
            </div>
          </dl>
        </aside>

        <div className="journal-entry-body">
          <section
            className="journal-reading-narrative"
            aria-labelledby="journal-reading-title"
          >
            <p className="journal-eyebrow">Your reading</p>
            <h2 id="journal-reading-title">What the reading said</h2>
            {record.interpretation.overview && (
              <p className="journal-reading-overview">
                {record.interpretation.overview}
              </p>
            )}

            {record.draws.length > 0 && (
              <div className="journal-position-list">
                {record.draws.map((draw, index) => {
                  const position = record.interpretation.positions[index];
                  const text =
                    position?.text ||
                    (draw.reversed && draw.card.reversedMeaning
                      ? draw.card.reversedMeaning
                      : draw.card.meaning);

                  return (
                    <article key={`${draw.card.id}-${index}`}>
                      <p>
                        {`${index + 1}`.padStart(2, '0')} ·{' '}
                        {position?.label || draw.position}
                      </p>
                      <h3>
                        {draw.card.name}
                        {draw.reversed && <small>Reversed</small>}
                      </h3>
                      <span>{text}</span>
                    </article>
                  );
                })}
              </div>
            )}

            {record.interpretation.connections &&
              record.interpretation.connections.length > 0 && (
                <section className="journal-entry-connections">
                  <p className="journal-eyebrow">The connecting thread</p>
                  {record.interpretation.connections.map((connection) => (
                    <article key={`${connection.from}-${connection.to}`}>
                      <h3>
                        {connection.from} <span aria-hidden="true">→</span>{' '}
                        {connection.to}
                      </h3>
                      <p>{connection.text}.</p>
                    </article>
                  ))}
                </section>
              )}

            {hasSynthesis && (
              <section className="journal-entry-synthesis">
                <p className="journal-eyebrow">How the meanings meet</p>
                {record.interpretation.synthesis && (
                  <p>{record.interpretation.synthesis}</p>
                )}
                {record.interpretation.closing && (
                  <blockquote>{record.interpretation.closing}</blockquote>
                )}
              </section>
            )}
          </section>

          <section className="journal-writing" aria-labelledby="writing-title">
            <header>
              <div>
                <p className="journal-eyebrow">Journal</p>
                <h2 id="writing-title">Your thoughts</h2>
              </div>
              <small>Changes save when you leave a field.</small>
            </header>
            <div className="journal-writing-fields">
              <label htmlFor={`note-${record.id}`}>
                <span>Reflection</span>
                <Textarea
                  id={`note-${record.id}`}
                  value={record.note}
                  rows={7}
                  placeholder="What stayed with you?"
                  onChange={(event) =>
                    onUpdateLocal({ ...record, note: event.target.value })
                  }
                  onBlur={(event) =>
                    void onUpdate({
                      ...record,
                      note: event.currentTarget.value,
                    })
                  }
                />
              </label>
              <label htmlFor={`follow-up-${record.id}`}>
                <span>What became clear?</span>
                <Textarea
                  id={`follow-up-${record.id}`}
                  value={record.followUp ?? ''}
                  rows={7}
                  placeholder="Return later. What changed, resolved, or surprised you?"
                  onChange={(event) =>
                    onUpdateLocal({
                      ...record,
                      followUp: event.target.value,
                    })
                  }
                  onBlur={(event) =>
                    void onUpdate({
                      ...record,
                      followUp: event.currentTarget.value,
                    })
                  }
                />
              </label>
            </div>

            <div className="journal-entry-editors">
              <label htmlFor={`tags-${record.id}`}>
                <span>
                  <Tag /> Collections
                </span>
                <Input
                  id={`tags-${record.id}`}
                  value={tagDraft}
                  placeholder="Dreams, decisions, new moon"
                  onChange={(event) => setTagDraft(event.target.value)}
                  onBlur={(event) => {
                    const nextTags = parseTags(event.currentTarget.value);
                    setTagDraft(nextTags.join(', '));
                    void onUpdate({ ...record, tags: nextTags });
                  }}
                />
                <small>Separate collection names with commas.</small>
              </label>
              <fieldset>
                <legend>Focus</legend>
                <div className="journal-choice-row">
                  {journalFocuses.map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      className={record.focus === item.value ? 'active' : ''}
                      aria-pressed={record.focus === item.value}
                      onClick={() =>
                        void onUpdate({ ...record, focus: item.value })
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <details
                className="journal-icon-editor"
                open={iconPickerOpen}
                onToggle={(event) =>
                  setIconPickerOpen(event.currentTarget.open)
                }
              >
                <summary>
                  <span>Page icon</span>
                  <small>{selectedJournalIcon?.label ?? 'None'}</small>
                  <span
                    className={`journal-icon-current${selectedJournalIcon ? '' : ' is-empty'}`}
                    aria-hidden="true"
                  >
                    {selectedJournalIcon ? (
                      <Image
                        src={selectedJournalIcon.src}
                        alt=""
                        fill
                        sizes="42px"
                      />
                    ) : (
                      '—'
                    )}
                  </span>
                  <ChevronDown aria-hidden="true" />
                </summary>
                <fieldset>
                  <legend className="sr-only">
                    Choose an icon for this journal page
                  </legend>
                  <div className="journal-icon-grid">
                    <label
                      className={record.journalIcon ? undefined : 'active'}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name={`journal-icon-${record.id}`}
                        checked={!record.journalIcon}
                        onChange={() => {
                          setIconPickerOpen(false);
                          void onUpdate({ ...record, journalIcon: undefined });
                        }}
                      />
                      <span
                        className="journal-icon-choice-art is-empty"
                        aria-hidden="true"
                      >
                        —
                      </span>
                      <span>None</span>
                    </label>
                    {DIVINE_HERO_ICONS.map((icon) => (
                      <label
                        key={icon.id}
                        className={
                          record.journalIcon === icon.id ? 'active' : undefined
                        }
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name={`journal-icon-${record.id}`}
                          value={icon.id}
                          checked={record.journalIcon === icon.id}
                          onChange={() => {
                            setIconPickerOpen(false);
                            void onUpdate({ ...record, journalIcon: icon.id });
                          }}
                        />
                        <span
                          className="journal-icon-choice-art"
                          aria-hidden="true"
                        >
                          <Image src={icon.src} alt="" fill sizes="52px" />
                        </span>
                        <span>{icon.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </details>
            </div>
          </section>

          <details className="journal-entry-manage">
            <summary>
              <span>Manage entry</span>
              <ChevronDown />
            </summary>
            <div>
              <p>
                Permanently remove this reading, its question, and your notes.
              </p>
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button className="quiet-action" />}
                >
                  <Trash2 /> Delete entry
                </AlertDialogTrigger>
                <AlertDialogContent className="divine-dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this reading?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The reading, its question, and your reflection will be
                      permanently removed. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep reading</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void onRemove(record.id)}>
                      Delete reading
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}

export function JournalClient() {
  const { deckFinishes } = useExperience();
  const returnScroll = useRef(0);
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | SystemSlug>('all');
  const [focus, setFocus] = useState<'all' | Focus>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    void listReadings()
      .then(setRecords)
      .catch(() => setError(true))
      .finally(() => setLoaded(true));
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
  const visible = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const matchesFilter = filter === 'all' || record.system === filter;
      const matchesFocus = focus === 'all' || record.focus === focus;
      const matchesFavorite = !favoritesOnly || record.favorite;
      const matchesTag = !tag || record.tags?.includes(tag);
      const matchesMonth =
        !month || readingMonthKey(record.createdAt) === month;
      const haystack =
        `${record.systemName} ${record.spreadName} ${record.question ?? ''} ${record.note} ${record.followUp ?? ''} ${(record.tags ?? []).join(' ')} ${record.draws.flatMap((draw) => [draw.card.name, ...draw.card.keywords]).join(' ')} ${record.interpretation.headline}`.toLocaleLowerCase();

      return (
        matchesFilter &&
        matchesFocus &&
        matchesFavorite &&
        matchesTag &&
        matchesMonth &&
        haystack.includes(search)
      );
    });
  }, [records, query, filter, focus, favoritesOnly, tag, month]);

  const activeFilterCount = [
    Boolean(query.trim()),
    filter !== 'all',
    focus !== 'all',
    favoritesOnly,
    Boolean(tag),
    Boolean(month),
  ].filter(Boolean).length;

  const activeRecord = records.find((record) => record.id === expanded);

  const update = async (record: ReadingRecord) => {
    setRecords((items) =>
      items.map((item) => (item.id === record.id ? record : item)),
    );
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

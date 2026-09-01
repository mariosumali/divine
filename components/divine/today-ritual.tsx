'use client';

import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useExperience } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CARD_SYSTEM_SLUGS, imageForFinish } from '@/lib/divine/decks';
import { listReadings, saveReading } from '@/lib/divine/storage';
import {
  createTodaySeed,
  interpretTodayConstellation,
  isTodaySeed,
  localDateKey,
  TODAY_RESPONSE_MAX_LENGTH,
  todayPrompt,
  todayRecord,
} from '@/lib/divine/today';
import type { CardSystemSlug } from '@/lib/divine/decks';
import type { TodaySeed } from '@/lib/divine/today';
import type { DrawnCard, ReadingRecord } from '@/lib/divine/types';

const TODAY_SESSION_VERSION = 2;
const COLLAGE_ROTATIONS = [-5.5, 3.25, -2.5, 4.75, -4, 2.25, -3.5, 4];
const COLLAGE_OFFSETS = [18, -20, 12, -28, 26, -12, 20, -18];
const COLLAGE_LAYERS = [2, 5, 3, 7, 4, 8, 6, 9];

interface StoredTodaySession {
  version: typeof TODAY_SESSION_VERSION;
  seed: TodaySeed;
}

function sessionKey(dateKey: string) {
  return `divine-today-session:v${TODAY_SESSION_VERSION}:${dateKey}`;
}

function readSession(dateKey: string): TodaySeed | null {
  try {
    const raw = localStorage.getItem(sessionKey(dateKey));
    if (!raw) return null;

    const stored = JSON.parse(raw) as Partial<StoredTodaySession>;
    const seed = stored.seed;
    if (
      stored.version !== TODAY_SESSION_VERSION ||
      !isTodaySeed(seed) ||
      seed.dateKey !== dateKey
    ) {
      return null;
    }

    return seed;
  } catch {
    return null;
  }
}

function storeSession(seed: TodaySeed) {
  try {
    const session: StoredTodaySession = {
      version: TODAY_SESSION_VERSION,
      seed,
    };
    localStorage.setItem(sessionKey(seed.dateKey), JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

function sourceSystemFor(draw: DrawnCard): CardSystemSlug {
  const source = draw.card.sourceSystem;
  return CARD_SYSTEM_SLUGS.includes(source as CardSystemSlug)
    ? (source as CardSystemSlug)
    : 'tarot';
}

/** Keeps the UI independent from the details of the deterministic draw engine. */
function recordFromSeed(seed: TodaySeed): ReadingRecord {
  const record = todayRecord(seed, seed.response);
  return {
    ...record,
    question: seed.prompt,
    note: seed.response,
  };
}

/** Rewrites generated copy while preserving the exact saved draw and journal data. */
function refreshTodayInterpretation(record: ReadingRecord): ReadingRecord {
  return {
    ...record,
    interpretation: interpretTodayConstellation(record.draws),
  };
}

export function TodayRitual() {
  const { cue, deckFinishes } = useExperience();
  const [dateKey, setDateKey] = useState('');
  const [response, setResponse] = useState('');
  const [seed, setSeed] = useState<TodaySeed | null>(null);
  const [restoredRecord, setRestoredRecord] = useState<ReadingRecord | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const [savedRecords, setSavedRecords] = useState<ReadingRecord[]>([]);
  const [sessionStorageAvailable, setSessionStorageAvailable] = useState(true);
  const [journalAvailable, setJournalAvailable] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );

  useEffect(() => {
    const key = localDateKey();
    const storedSeed = readSession(key);
    queueMicrotask(() => {
      setDateKey(key);
      setSeed(storedSeed);
      setResponse(storedSeed?.response ?? '');
    });

    void listReadings()
      .then((items) => {
        const savedToday = items.find(
          (item) => item.id === `today:${key}:constellation`,
        );
        const refreshedToday = savedToday
          ? refreshTodayInterpretation(savedToday)
          : null;
        const interpretationChanged =
          savedToday &&
          refreshedToday &&
          JSON.stringify(savedToday.interpretation) !==
            JSON.stringify(refreshedToday.interpretation);
        const currentItems = refreshedToday
          ? items.map((item) =>
              item.id === refreshedToday.id ? refreshedToday : item,
            )
          : items;

        setSavedRecords(currentItems);

        if (interpretationChanged) {
          void saveReading(refreshedToday).catch(() =>
            setJournalAvailable(false),
          );
        }

        if (!storedSeed && refreshedToday) {
          setRestoredRecord(refreshedToday);
          setResponse(refreshedToday.note);
        }
      })
      .catch(() => setJournalAvailable(false))
      .finally(() => setReady(true));
  }, []);

  const prompt = useMemo(
    () => (dateKey ? todayPrompt(dateKey) : null),
    [dateKey],
  );
  const generatedRecord = useMemo(
    () => (seed ? recordFromSeed(seed) : null),
    [seed],
  );
  const record = generatedRecord ?? restoredRecord;
  const existing = record
    ? savedRecords.find((item) => item.id === record.id)
    : undefined;

  useEffect(() => {
    if (!record) return;
    queueMicrotask(() => setSaveState(existing ? 'saved' : 'idle'));
  }, [existing, record]);

  if (!dateKey || !prompt || !ready) {
    return (
      <main className="today-page" aria-busy="true">
        <div className="today-loading">Preparing today’s page…</div>
      </main>
    );
  }

  const dateLabel = new Date(`${dateKey}T12:00:00`).toLocaleDateString(
    undefined,
    { weekday: 'long', month: 'long', day: 'numeric' },
  );
  const dateParts = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).formatToParts(new Date(`${dateKey}T12:00:00`));
  const datePart = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((part) => part.type === type)?.value ?? '';
  const displayedPrompt = seed?.prompt ?? record?.question ?? prompt.text;
  const displayedResponse = seed?.response ?? record?.note ?? '';

  const reveal = () => {
    const answer = response.trim();
    if (!answer || record) return;

    const generatedAt = new Date();
    const currentDateKey = localDateKey(generatedAt);
    if (currentDateKey !== dateKey) {
      setDateKey(currentDateKey);
      setSeed(readSession(currentDateKey));
      setRestoredRecord(
        savedRecords.find(
          (item) => item.id === `today:${currentDateKey}:constellation`,
        ) ?? null,
      );
      return;
    }

    const nextSeed = createTodaySeed(answer, generatedAt);
    setSeed(nextSeed);
    setResponse(answer);
    if (!storeSession(nextSeed)) setSessionStorageAvailable(false);
    cue('reveal');
  };

  const save = async () => {
    if (!record) return;
    setSaveState('saving');
    try {
      const next = {
        ...record,
        favorite: existing?.favorite ?? false,
        tags: existing?.tags ?? record.tags,
        followUp: existing?.followUp ?? record.followUp,
        journalIcon: existing?.journalIcon ?? record.journalIcon,
      };
      await saveReading(next);
      setSavedRecords((items) => [
        next,
        ...items.filter((item) => item.id !== next.id),
      ]);
      setSaveState('saved');
      cue('tick');
    } catch {
      setJournalAvailable(false);
      setSaveState('idle');
    }
  };

  return (
    <main className={`today-page${record ? ' has-reading' : ''}`}>
      <div className="today-opening-art" aria-hidden="true">
        <Image
          className="today-opening-chart"
          src="/astrology/astrological-charts-1715.webp"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>

      <header className="today-hero">
        <h1 aria-label={dateLabel}>
          <span className="today-date-weekday" aria-hidden="true">
            {datePart('weekday')}
          </span>
          <span className="today-date-month" aria-hidden="true">
            {datePart('month')}
          </span>
          <span className="today-date-day" aria-hidden="true">
            {datePart('day')}
          </span>
        </h1>
      </header>

      {!record ? (
        <motion.section
          className="today-invitation"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              reveal();
            }}
          >
            <label htmlFor="today-response">{prompt.text}</label>
            <div className="today-answer-box">
              <Textarea
                id="today-response"
                className="question-input"
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                placeholder="Write whatever is true right now…"
                maxLength={TODAY_RESPONSE_MAX_LENGTH}
              />
              <Button
                type="submit"
                className="primary-action ask-submit today-reveal"
                disabled={!response.trim()}
                aria-label="Reveal today’s constellation"
              >
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </form>
        </motion.section>
      ) : (
        <motion.article
          className="today-reading"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="today-reading-header">
            <div className="today-response">
              <div className="today-response-context">
                <p className="eyebrow">Your answer</p>
                <p>{displayedPrompt}</p>
              </div>
              <blockquote>{displayedResponse}</blockquote>
            </div>
          </header>

          <section
            className={`today-constellation count-${record.draws.length}`}
            aria-label={`Today’s constellation of ${record.draws.length} cards`}
          >
            {record.draws.map((draw, index) => {
              const systemSlug = sourceSystemFor(draw);
              const finish = deckFinishes[systemSlug];
              const image = imageForFinish(draw.card, finish);
              const rotation = COLLAGE_ROTATIONS[index] ?? 0;
              const offset = COLLAGE_OFFSETS[index] ?? 0;
              return (
                <motion.figure
                  className="today-constellation-card"
                  style={{ zIndex: COLLAGE_LAYERS[index] ?? index + 1 }}
                  key={`${systemSlug}:${draw.card.id}:${index}`}
                  initial={{
                    opacity: 0,
                    y: offset + 80,
                    rotate: rotation * 1.8,
                    scale: 0.92,
                  }}
                  animate={{
                    opacity: 1,
                    y: offset,
                    rotate: rotation,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.65,
                    delay: 0.08 + index * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{
                    y: offset - 16,
                    rotate: rotation * 0.45,
                    scale: 1.025,
                    zIndex: 20,
                  }}
                >
                  <div
                    className={`today-card-art${draw.reversed ? ' is-reversed' : ''}`}
                    style={{ aspectRatio: draw.card.aspectRatio ?? 3 / 4 }}
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 42vw, (max-width: 1000px) 24vw, 16vw"
                        priority={index < 4}
                      />
                    ) : (
                      <span aria-hidden="true">{draw.card.glyph}</span>
                    )}
                  </div>
                  <figcaption className="sr-only">
                    {`${index + 1} of ${record.draws.length}. ${draw.card.sourceSystemName ?? draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}`}
                  </figcaption>
                </motion.figure>
              );
            })}
          </section>

          <section className="today-interpretation">
            <header>
              <div>
                <p className="eyebrow">The constellation</p>
                <h2>How the meanings meet</h2>
              </div>
              <p className="today-synthesis">
                {record.interpretation.synthesis}
              </p>
            </header>

            <blockquote className="today-closing">
              {record.interpretation.closing}
            </blockquote>

            <div className="today-save">
              <Button
                type="button"
                className="primary-action"
                onClick={() => void save()}
                disabled={saveState !== 'idle' || !journalAvailable}
              >
                {saveState === 'saved' ? <Check /> : <BookOpen />}
                {saveState === 'saving'
                  ? 'Saving…'
                  : saveState === 'saved'
                    ? 'Saved to journal'
                    : 'Save to journal'}
              </Button>
            </div>
            {!sessionStorageAvailable && (
              <output className="journal-warning">
                This browser could not preserve the session across reloads.
              </output>
            )}
            {!journalAvailable && (
              <output className="journal-warning">
                The journal is unavailable in this browser.
              </output>
            )}
          </section>
        </motion.article>
      )}

      {record && (
        <aside className="today-afterword">
          <span>This constellation stays with you until tomorrow.</span>
          <Link href="/journal">Revisit past reflections →</Link>
        </aside>
      )}
    </main>
  );
}

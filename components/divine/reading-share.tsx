'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Check, Copy, ImageDown, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { READING_INDEX_ART } from '@/lib/divine/catalog';
import {
  createReadingShareToken,
  createReadingShareUrl,
} from '@/lib/divine/share';
import type { ReadingRecord } from '@/lib/divine/types';

type LinkStatus =
  | 'idle'
  | 'working'
  | 'copied'
  | 'shared'
  | 'cancelled'
  | 'error';

async function copyText(value: string) {
  if (!navigator.clipboard?.writeText) throw new Error('Copy unavailable');
  await navigator.clipboard.writeText(value);
}

function linkFor(record: ReadingRecord, includeQuestion: boolean) {
  return createReadingShareUrl(record, window.location.origin, includeQuestion);
}

export function ReadingShare({
  record,
  includeQuestion,
  onIncludeQuestionChange,
  onImageExport,
  imageStatus,
  onAnnounce,
}: {
  record: ReadingRecord;
  includeQuestion: boolean;
  onIncludeQuestionChange: (include: boolean) => void;
  onImageExport: () => void;
  imageStatus:
    | 'idle'
    | 'working'
    | 'shared'
    | 'downloaded'
    | 'cancelled'
    | 'error';
  onAnnounce: (message: string) => void;
}) {
  const [status, setStatus] = useState<LinkStatus>('idle');
  const token = useMemo(
    () => createReadingShareToken(record, includeQuestion),
    [record, includeQuestion],
  );
  const finish = (next: LinkStatus, announcement: string) => {
    setStatus(next);
    onAnnounce(announcement);
  };
  const cardCount = record.draws.length;
  const columns =
    cardCount <= 1
      ? 1
      : cardCount <= 5
        ? cardCount
        : cardCount <= 10
          ? 5
          : cardCount <= 20
            ? 8
            : 12;
  const dense = cardCount > 10;

  const copy = async () => {
    if (status === 'working') return;
    setStatus('working');
    try {
      await copyText(linkFor(record, includeQuestion));
      finish('copied', 'Private reading link copied.');
    } catch {
      finish('error', 'The reading link could not be copied.');
    }
  };

  const share = async () => {
    if (status === 'working') return;
    setStatus('working');
    const url = linkFor(record, includeQuestion);
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: `${record.interpretation.headline} — DIVINE`,
        text: `${record.systemName} · ${record.spreadName}`,
        url,
      });
      finish('shared', 'Reading link shared.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        finish('cancelled', 'Sharing cancelled.');
      } else {
        finish('error', 'The reading link could not be shared.');
      }
    }
  };

  return (
    <section className="reading-share" aria-labelledby="reading-share-title">
      <p className="reading-share-kicker">Share this reading</p>
      <article
        className={`reading-share-card ${dense ? 'is-dense' : ''} ${cardCount ? 'has-cards' : 'is-object-reading'}`}
      >
        <header className="reading-share-card-top">
          <span>DIVINE</span>
          <time dateTime={record.createdAt}>
            {new Date(record.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </header>
        <div className="reading-share-card-intro">
          <div>
            <p>
              {record.systemName} · {record.spreadName}
            </p>
            <h2 id="reading-share-title">
              {cardCount
                ? record.interpretation.headline
                : 'The answer has arrived.'}
            </h2>
          </div>
          <figure className="reading-share-method-art">
            <span>
              <Image
                src={READING_INDEX_ART[record.system]}
                alt=""
                fill
                sizes="(max-width: 720px) 32vw, 190px"
                style={{ objectFit: 'contain' }}
              />
            </span>
            <figcaption>{record.systemName}</figcaption>
          </figure>
        </div>
        {includeQuestion && record.question && (
          <blockquote className="reading-share-card-question">
            “{record.question}”
          </blockquote>
        )}
        {cardCount > 0 ? (
          <div
            className="reading-share-draws"
            style={{ '--share-columns': columns } as CSSProperties}
            aria-label={`${cardCount} cards drawn`}
          >
            {record.draws.map((draw, index) => (
              <figure key={`${draw.card.id}-${index}`}>
                <span className="reading-share-drawn-card">
                  {draw.card.image ? (
                    <Image
                      src={draw.card.image}
                      alt={`${draw.card.name}${draw.reversed ? ', reversed' : ''}`}
                      width={360}
                      height={Math.round(
                        360 / (draw.card.aspectRatio ?? 2 / 3),
                      )}
                      sizes="(max-width: 720px) 24vw, 150px"
                      className={draw.reversed ? 'is-reversed' : ''}
                    />
                  ) : (
                    <strong aria-hidden="true">{draw.card.glyph}</strong>
                  )}
                  <i>{`${index + 1}`.padStart(2, '0')}</i>
                </span>
                <figcaption className={dense ? 'sr-only' : undefined}>
                  <span>{draw.position}</span>
                  <strong>
                    {draw.card.sourceSystemName
                      ? `${draw.card.sourceSystemName} · `
                      : ''}
                    {draw.card.name}
                    {draw.reversed ? ' · reversed' : ''}
                  </strong>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="reading-share-object-answer">
            <small>The answer</small>
            <p>{record.interpretation.headline}</p>
            {record.luckyNumbers && record.luckyNumbers.length > 0 && (
              <span>{record.luckyNumbers.join(' · ')}</span>
            )}
          </div>
        )}
        <footer className="reading-share-card-footer">
          <span>{record.focus} focus</span>
          <span>
            {cardCount
              ? `${cardCount} ${cardCount === 1 ? 'card' : 'cards'} drawn`
              : record.systemName}
          </span>
        </footer>
      </article>
      <div className="reading-share-controls">
        <div className="reading-share-link" aria-label="Unique reading link">
          <span>A private link to this exact reading</span>
          <code>
            divine / {record.system} / {token.slice(-8)}
          </code>
        </div>
        {record.question && (
          <label
            className="reading-share-privacy"
            aria-label="Include my question in the shared link"
          >
            <input
              type="checkbox"
              checked={includeQuestion}
              onChange={(event) =>
                onIncludeQuestionChange(event.target.checked)
              }
            />
            <span>
              <strong>Include my question</strong>
              <small>
                Your reflection and journal notes are never included.
              </small>
            </span>
          </label>
        )}
        {!record.question && (
          <p className="reading-share-private-note">
            Your reflection and journal notes are never included.
          </p>
        )}
        <div className="reading-share-actions">
          <Button
            className="primary-action"
            onClick={() => void share()}
            disabled={status === 'working'}
          >
            {status === 'shared' || status === 'copied' ? (
              <Check />
            ) : (
              <Share2 />
            )}
            {status === 'working'
              ? 'Opening…'
              : status === 'shared'
                ? 'Shared'
                : status === 'copied'
                  ? 'Link copied'
                  : 'Share reading'}
          </Button>
          <Button
            className="quiet-action"
            onClick={() => void copy()}
            disabled={status === 'working'}
          >
            {status === 'copied' ? <Check /> : <Copy />}
            {status === 'copied' ? 'Copied' : 'Copy link'}
          </Button>
          <Button
            className="quiet-action"
            onClick={onImageExport}
            disabled={imageStatus === 'working'}
          >
            <ImageDown />
            {imageStatus === 'working'
              ? 'Rendering…'
              : imageStatus === 'downloaded'
                ? 'Image saved'
                : imageStatus === 'shared'
                  ? 'Image shared'
                  : 'Image keepsake'}
          </Button>
        </div>
        {(status === 'error' || imageStatus === 'error') && (
          <output className="reading-share-error">
            {status === 'error'
              ? 'The link could not be shared. Try copying it again.'
              : 'The keepsake image could not be created. The link still works.'}
          </output>
        )}
      </div>
    </section>
  );
}

export function CopyReadingLinkButton({ record }: { record: ReadingRecord }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copy = async () => {
    try {
      await copyText(linkFor(record, false));
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  };
  return (
    <Button
      className="quiet-action"
      onClick={() => void copy()}
      aria-label={
        status === 'error' ? 'Try copying share link again' : 'Copy share link'
      }
    >
      {status === 'copied' ? <Check /> : <Share2 />}
      {status === 'copied'
        ? 'Link copied'
        : status === 'error'
          ? 'Try copy again'
          : 'Share link'}
    </Button>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Image from '@/components/divine/responsive-image';
import { Check, Copy, ImageDown, LoaderCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { READING_INDEX_ART } from '@/lib/divine/catalog';
import {
  composeShare,
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
  const composition = useMemo(
    () => composeShare(record, includeQuestion),
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
  const drawnImageSizes =
    cardCount === 1
      ? '(max-width: 720px) calc(100vw - 96px), 460px'
      : cardCount <= 3
        ? '(max-width: 720px) 44vw, 330px'
        : cardCount <= 5
          ? '(max-width: 720px) 104px, 240px'
          : '(max-width: 720px) 104px, 190px';
  const shareLabel =
    status === 'working'
      ? 'Opening share options'
      : status === 'shared'
        ? 'Reading shared'
        : status === 'copied'
          ? 'Reading link copied'
          : 'Share reading';
  const copyLabel =
    status === 'working'
      ? 'Copying reading link'
      : status === 'copied'
        ? 'Reading link copied'
        : status === 'error'
          ? 'Try copying reading link again'
          : 'Copy reading link';
  const imageLabel =
    imageStatus === 'working'
      ? 'Creating image keepsake'
      : imageStatus === 'downloaded'
        ? 'Image keepsake saved'
        : imageStatus === 'shared'
          ? 'Image keepsake shared'
          : imageStatus === 'error'
            ? 'Try creating image keepsake again'
            : 'Create image keepsake';

  const copy = async () => {
    if (status === 'working') return;
    setStatus('working');
    try {
      await copyText(linkFor(record, includeQuestion));
      finish('copied', 'Reading link copied.');
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
        data-card-count={cardCount || undefined}
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
            <h2 id="reading-share-title">{composition.displayHeadline}</h2>
          </div>
          <figure className="reading-share-method-art">
            <span>
              <Image
                src={READING_INDEX_ART[record.system]}
                alt=""
                fill
                sizes="(max-width: 720px) 32vw, 270px"
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
            aria-label={`${cardCount} ${cardCount === 1 ? 'card' : 'cards'} drawn`}
          >
            {record.draws.map((draw, index) => (
              <figure key={`${draw.card.id}-${index}`}>
                <span
                  className="reading-share-drawn-card"
                  style={
                    {
                      '--share-card-ratio': draw.card.aspectRatio ?? 2 / 3,
                    } as CSSProperties
                  }
                >
                  {draw.card.image ? (
                    <Image
                      src={draw.card.image}
                      alt={`${draw.card.name}${draw.reversed ? ', reversed' : ''}`}
                      width={360}
                      height={Math.round(
                        360 / (draw.card.aspectRatio ?? 2 / 3),
                      )}
                      sizes={drawnImageSizes}
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
          <span>
            {record.focus.charAt(0).toUpperCase() + record.focus.slice(1)} focus
          </span>
          <span>
            {cardCount
              ? `${cardCount} ${cardCount === 1 ? 'card' : 'cards'} drawn`
              : record.systemName}
          </span>
        </footer>
      </article>
      <div className="reading-share-controls">
        <div className="reading-share-link" aria-label="Unique reading link">
          <span>Anyone with this link can view this reading</span>
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
            className="primary-action icon-action"
            onClick={() => void share()}
            disabled={status === 'working'}
            aria-label={shareLabel}
            title={shareLabel}
          >
            {status === 'working' ? (
              <LoaderCircle className="action-spinner" />
            ) : status === 'shared' || status === 'copied' ? (
              <Check />
            ) : (
              <Share2 />
            )}
          </Button>
          <Button
            className="quiet-action icon-action"
            onClick={() => void copy()}
            disabled={status === 'working'}
            aria-label={copyLabel}
            title={copyLabel}
          >
            {status === 'working' ? (
              <LoaderCircle className="action-spinner" />
            ) : status === 'copied' ? (
              <Check />
            ) : (
              <Copy />
            )}
          </Button>
          <Button
            className="quiet-action icon-action"
            onClick={onImageExport}
            disabled={imageStatus === 'working'}
            aria-label={imageLabel}
            title={imageLabel}
          >
            {imageStatus === 'working' ? (
              <LoaderCircle className="action-spinner" />
            ) : imageStatus === 'downloaded' || imageStatus === 'shared' ? (
              <Check />
            ) : (
              <ImageDown />
            )}
          </Button>
        </div>
        {(status === 'error' || imageStatus === 'error') && (
          <output className="reading-share-error">
            {status === 'error'
              ? 'The link could not be shared. Try copying it again.'
              : 'The image could not be created. The link still works.'}
          </output>
        )}
      </div>
    </section>
  );
}

export function CopyReadingLinkButton({
  record,
  showLabel = false,
}: {
  record: ReadingRecord;
  showLabel?: boolean;
}) {
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
      type="button"
      className={`quiet-action${showLabel ? '' : ' icon-action'}`}
      onClick={() => void copy()}
      aria-label={
        status === 'copied'
          ? 'Reading link copied'
          : status === 'error'
            ? 'Try copying reading link again'
            : 'Copy reading link'
      }
      title={
        status === 'copied'
          ? 'Reading link copied'
          : status === 'error'
            ? 'Try copying reading link again'
            : 'Copy reading link'
      }
    >
      {status === 'copied' ? <Check /> : <Copy />}
      {showLabel && (
        <span>
          {status === 'copied'
            ? 'Copied'
            : status === 'error'
              ? 'Try again'
              : 'Copy link'}
        </span>
      )}
    </Button>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, ImageDown, Link2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createReadingShareToken,
  createReadingShareUrl,
} from '@/lib/divine/share';
import type { ReadingRecord } from '@/lib/divine/types';

type LinkStatus = 'idle' | 'working' | 'copied' | 'shared' | 'cancelled' | 'error';

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Copy unavailable');
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
  imageStatus: 'idle' | 'working' | 'shared' | 'downloaded' | 'cancelled' | 'error';
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
      <div className="reading-share-orbit" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="reading-share-heading">
        <p className="eyebrow">Pass the pattern on</p>
        <h2 id="reading-share-title">A reading made to travel.</h2>
        <p>
          Send this exact constellation to someone. No account, no journal,
          just the reading held inside the link.
        </p>
      </header>
      <div className="reading-share-seal" aria-hidden="true">
        <Share2 />
        <span>Divine</span>
      </div>
      <div className="reading-share-link" aria-label="Unique reading link">
        <span>
          <Link2 /> divine / {record.system}
        </span>
        <code>{token.slice(-12)}</code>
      </div>
      {record.question && (
        <label className="reading-share-privacy">
          <input
            type="checkbox"
            checked={includeQuestion}
            onChange={(event) => onIncludeQuestionChange(event.target.checked)}
          />
          <span>
            <strong>Include my question</strong>
            <small>Your reflection and journal notes are never included.</small>
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
          {status === 'shared' || status === 'copied' ? <Check /> : <Share2 />}
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
      {status === 'copied' ? <Check /> : <Link2 />}
      {status === 'copied'
        ? 'Link copied'
        : status === 'error'
          ? 'Try copy again'
          : 'Share link'}
    </Button>
  );
}

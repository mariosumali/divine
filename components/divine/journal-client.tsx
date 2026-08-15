'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Heart, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { clearReadings, deleteReading, listReadings, saveReading } from '@/lib/divine/storage';
import type { ReadingRecord, SystemSlug } from '@/lib/divine/types';

export function JournalClient() {
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | SystemSlug>('all');
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    void listReadings().then(setRecords).catch(() => setError(true));
  }, []);

  const systems = useMemo(() => Array.from(new Set(records.map((record) => record.system))), [records]);
  const visible = useMemo(() => records.filter((record) => {
    const matchesFilter = filter === 'all' || record.system === filter;
    const haystack = `${record.systemName} ${record.spreadName} ${record.question ?? ''} ${record.note} ${record.interpretation.headline}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [records, query, filter]);

  const update = async (record: ReadingRecord) => {
    const next = records.map((item) => item.id === record.id ? record : item);
    setRecords(next);
    try { await saveReading(record); } catch { setError(true); }
  };

  const remove = async (id: string) => {
    try { await deleteReading(id); setRecords((items) => items.filter((item) => item.id !== id)); } catch { setError(true); }
  };

  const clear = async () => {
    try { await clearReadings(); setRecords([]); } catch { setError(true); }
  };

  return (
    <main className="journal-page">
      <header className="page-hero">
        <p className="eyebrow">Private / On this device</p>
        <h1>The Journal</h1>
        <p>What you kept from the unknown. Notes and readings live only in this browser.</p>
      </header>

      {error && <output className="journal-warning">The private journal is unavailable. Readings can still be completed and downloaded.</output>}

      <div className="journal-tools">
        <label htmlFor="journal-search"><Search /><span className="sr-only">Search readings</span><Input id="journal-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the journal" /></label>
        <div className="filter-row">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          {systems.map((system) => <button type="button" key={system} className={filter === system ? 'active' : ''} onClick={() => setFilter(system)}>{records.find((record) => record.system === system)?.systemName}</button>)}
        </div>
      </div>

      {visible.length === 0 ? (
        <section className="journal-empty"><BookOpen /><h2>{records.length ? 'No readings match.' : 'The pages are still blank.'}</h2><p>{records.length ? 'Try another word or system.' : 'Complete a reading and choose “Save to journal.”'}</p><Link className="primary-action" href="/#systems">Choose a system</Link></section>
      ) : (
        <section className="journal-list" aria-label="Saved readings">
          {visible.map((record, index) => (
            <motion.article key={record.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .04, .35) }} className={record.favorite ? 'favorite' : ''}>
              <button type="button" className="journal-summary" onClick={() => setExpanded(expanded === record.id ? null : record.id)} aria-expanded={expanded === record.id}>
                <span>{new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <strong>{record.interpretation.headline}</strong>
                <small>{record.systemName} · {record.spreadName}</small>
                <i>{expanded === record.id ? 'Close' : 'Reopen'} ↗</i>
              </button>
              {expanded === record.id && <div className="journal-detail">
                {record.question && <blockquote>“{record.question}”</blockquote>}
                <p>{record.interpretation.overview}</p>
                <div className="journal-draws">{record.interpretation.positions.map((position, itemIndex) => <div key={`${position.card}-${itemIndex}`}><span>{position.label}</span><strong>{position.card}</strong><p>{position.text}</p></div>)}</div>
                <label htmlFor={`note-${record.id}`}>Reflection<Textarea id={`note-${record.id}`} value={record.note} onChange={(event) => void update({ ...record, note: event.target.value })} /></label>
                <div className="journal-actions">
                  <Button className="quiet-action" onClick={() => void update({ ...record, favorite: !record.favorite })}><Heart fill={record.favorite ? 'currentColor' : 'none'} /> {record.favorite ? 'Favorited' : 'Favorite'}</Button>
                  <Button className="quiet-action" onClick={() => void remove(record.id)}><Trash2 /> Delete</Button>
                </div>
              </div>}
            </motion.article>
          ))}
        </section>
      )}

      {records.length > 0 && <AlertDialog>
        <AlertDialogTrigger render={<Button className="danger-link" />}>Clear all journal data</AlertDialogTrigger>
        <AlertDialogContent className="divine-dialog">
          <AlertDialogHeader><AlertDialogTitle>Clear the entire journal?</AlertDialogTitle><AlertDialogDescription>This permanently removes every reading and note stored in this browser. It cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep journal</AlertDialogCancel><AlertDialogAction onClick={() => void clear()}>Clear everything</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </main>
  );
}

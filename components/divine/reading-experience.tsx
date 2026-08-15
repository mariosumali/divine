'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookMarked, Check, Heart, RotateCcw, Share2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useExperience } from '@/app/providers';
import { drawBallAnswer, drawCards, drawFortune, interpretReading, objectInterpretation } from '@/lib/divine/reading';
import { saveReading } from '@/lib/divine/storage';
import type { DrawnCard, Focus, InterpretationBlock, ReadingRecord, SpreadDefinition, SystemDefinition } from '@/lib/divine/types';

type Stage = 'intro' | 'frame' | 'method' | 'ritual' | 'reveal' | 'result';
const focuses: Array<{ value: Focus; label: string }> = [
  { value: 'general', label: 'General' }, { value: 'love', label: 'Love' }, { value: 'work', label: 'Work' }, { value: 'growth', label: 'Growth' },
];

function createId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function exportReading(record: ReadingRecord, includeQuestion: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(244,242,236,.35)';
  ctx.strokeRect(72, 72, 1056, 1356);
  ctx.fillStyle = '#f4f2ec';
  ctx.textAlign = 'center';
  ctx.font = '500 58px Georgia';
  ctx.fillText('DIVINE', 600, 160);
  ctx.font = '12px Arial';
  ctx.letterSpacing = '5px';
  ctx.fillText(`${record.systemName.toUpperCase()} · ${record.spreadName.toUpperCase()}`, 600, 225);
  ctx.letterSpacing = '0px';
  ctx.font = '500 78px Georgia';
  const words = record.interpretation.headline.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const test = `${line} ${word}`.trim();
    if (ctx.measureText(test).width > 900) { lines.push(line); line = word; } else line = test;
  });
  lines.push(line);
  lines.slice(0, 3).forEach((value, index) => ctx.fillText(value, 600, 390 + index * 92));
  ctx.font = '24px Arial';
  ctx.fillStyle = '#aaa7a0';
  const detail = record.draws.length ? record.draws.slice(0, 10).map((draw) => draw.card.name).join(' · ') : record.interpretation.positions[0]?.text;
  const detailWords = detail.split(' ');
  const detailLines: string[] = [];
  line = '';
  detailWords.forEach((word) => {
    const test = `${line} ${word}`.trim();
    if (ctx.measureText(test).width > 930) { detailLines.push(line); line = word; } else line = test;
  });
  detailLines.push(line);
  detailLines.slice(0, 5).forEach((value, index) => ctx.fillText(value, 600, 770 + index * 38));
  if (includeQuestion && record.question) {
    ctx.font = 'italic 30px Georgia';
    ctx.fillStyle = '#f4f2ec';
    ctx.fillText(`“${record.question.slice(0, 70)}”`, 600, 1090);
  }
  ctx.fillStyle = '#aaa7a0';
  ctx.font = '14px Arial';
  ctx.letterSpacing = '4px';
  ctx.fillText(new Date(record.createdAt).toLocaleDateString().toUpperCase(), 600, 1350);
  ctx.letterSpacing = '0px';

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const file = new File([blob], `divine-${record.system}-${record.id}.png`, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: `DIVINE · ${record.systemName}`, files: [file] });
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Progress({ stage }: { stage: Stage }) {
  const stages: Stage[] = ['intro', 'frame', 'method', 'ritual', 'reveal', 'result'];
  const current = stages.indexOf(stage);
  return (
    <div className="reading-progress" aria-label={`Reading step ${current + 1} of ${stages.length}`}>
      {stages.map((item, index) => <span key={item} className={index <= current ? 'active' : ''} />)}
    </div>
  );
}

function CardFace({ draw, revealed, index, compact, onReveal }: { draw: DrawnCard; revealed: boolean; index: number; compact: boolean; onReveal: () => void }) {
  return (
    <motion.button
      type="button"
      className={`reading-card ${revealed ? 'is-revealed' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={onReveal}
      aria-label={revealed ? `${draw.position}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}` : `Reveal card ${index + 1}, ${draw.position}`}
      initial={{ opacity: 0, y: 30, rotate: index % 2 ? 1.5 : -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.65), duration: 0.5 }}
      whileHover={{ y: compact ? -2 : -7 }}
    >
      <span className="card-inner">
        <span className="card-back" aria-hidden="true"><i /><b>DIVINE</b><i /></span>
        <span className={`card-front ${draw.reversed ? 'is-reversed' : ''}`}>
          <small>{draw.position}</small>
          {draw.card.image ? (
            <span className="card-art"><Image src={draw.card.image} alt="" width={520} height={820} sizes="(max-width: 720px) 25vw, 18vw" /></span>
          ) : <strong>{draw.card.glyph}</strong>}
          <span>{draw.card.name}</span>
          {draw.reversed && <em>Reversed</em>}
        </span>
      </span>
    </motion.button>
  );
}

export function ReadingExperience({ system }: { system: SystemDefinition }) {
  const { cue } = useExperience();
  const [stage, setStage] = useState<Stage>('intro');
  const [question, setQuestion] = useState('');
  const [focus, setFocus] = useState<Focus>('general');
  const [spread, setSpread] = useState<SpreadDefinition | null>(system.spreads[0] ?? null);
  const [reversals, setReversals] = useState(system.slug === 'tarot');
  const [shuffled, setShuffled] = useState(false);
  const [draws, setDraws] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [interpretation, setInterpretation] = useState<InterpretationBlock | null>(null);
  const [objectMessage, setObjectMessage] = useState('');
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [includeQuestion, setIncludeQuestion] = useState(false);
  const [recordId, setRecordId] = useState(createId);
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString());
  const [motionSupported, setMotionSupported] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const motionHandler = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const ritualLock = useRef(false);

  useEffect(() => {
    queueMicrotask(() => setMotionSupported('DeviceMotionEvent' in window));
    return () => {
      if (motionHandler.current) window.removeEventListener('devicemotion', motionHandler.current);
    };
  }, []);

  const record = useMemo<ReadingRecord | null>(() => interpretation ? {
    id: recordId, system: system.slug, systemName: system.name, spreadId: spread?.id ?? system.kind,
    spreadName: spread?.name ?? (system.kind === 'ball' ? 'Ask & shake' : 'Crack & reveal'), createdAt,
    focus, question: question.trim() || undefined, draws, interpretation, note, favorite,
  } : null, [interpretation, system, spread, focus, question, draws, note, favorite, recordId, createdAt]);

  const beginRecord = () => {
    setRecordId(createId());
    setCreatedAt(new Date().toISOString());
  };

  const move = (next: Stage) => { cue('tick'); setStage(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const continueFromFrame = () => move(system.kind === 'cards' ? 'method' : 'ritual');

  const shuffleDeck = () => {
    cue('shuffle');
    setShuffled(true);
  };

  const deal = () => {
    if (!spread) return;
    const next = drawCards(system, spread, reversals);
    setDraws(next);
    setRevealed(new Set());
    cue('deal');
    move('reveal');
  };

  const revealCard = (index: number) => {
    if (revealed.has(index)) return;
    cue('reveal');
    setRevealed((current) => new Set(current).add(index));
    setAnnouncement(`${draws[index].position}: ${draws[index].card.name}${draws[index].reversed ? ', reversed' : ''}.`);
  };

  const revealAll = () => {
    cue('reveal');
    setRevealed(new Set(draws.map((_, index) => index)));
    setAnnouncement(`All ${draws.length} cards revealed.`);
  };

  const performObjectRitual = () => {
    if (ritualLock.current) return;
    ritualLock.current = true;
    beginRecord();
    if (system.kind === 'ball') {
      cue('liquid');
      const message = drawBallAnswer();
      setObjectMessage(message);
      setInterpretation(objectInterpretation(system, message, focus));
    } else {
      cue('crack');
      const result = drawFortune();
      setObjectMessage(result.fortune);
      setLuckyNumbers(result.numbers);
      setInterpretation(objectInterpretation(system, result.fortune, focus));
    }
    window.setTimeout(() => { cue('resolve'); setStage('result'); }, 680);
  };

  const enableDeviceMotion = async () => {
    type PermissionMotionEvent = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
    const motionEvent = window.DeviceMotionEvent as PermissionMotionEvent;
    const permission = motionEvent.requestPermission ? await motionEvent.requestPermission() : 'granted';
    if (permission !== 'granted') {
      setAnnouncement('Motion access was not granted. Use the shake button instead.');
      return;
    }
    if (motionHandler.current) window.removeEventListener('devicemotion', motionHandler.current);
    const handler = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      const force = Math.abs(acceleration?.x ?? 0) + Math.abs(acceleration?.y ?? 0) + Math.abs(acceleration?.z ?? 0);
      if (force < 32) return;
      window.removeEventListener('devicemotion', handler);
      motionHandler.current = null;
      setMotionEnabled(false);
      performObjectRitual();
    };
    motionHandler.current = handler;
    window.addEventListener('devicemotion', handler, { passive: true });
    setMotionEnabled(true);
    setAnnouncement('Motion enabled. Shake your device for the answer.');
    cue('tick');
  };

  const finishCards = () => {
    if (!spread) return;
    beginRecord();
    const result = interpretReading(system, spread, draws, focus);
    setInterpretation(result);
    cue('resolve');
    move('result');
  };

  const save = async () => {
    if (!record) return;
    try {
      await saveReading(record);
      setSaved(true);
      setStorageError(false);
      cue('resolve');
    } catch {
      setStorageError(true);
    }
  };

  const restart = () => {
    ritualLock.current = false; setStage('frame'); setShuffled(false); setDraws([]); setRevealed(new Set()); setInterpretation(null); setObjectMessage(''); setLuckyNumbers([]); setNote(''); setFavorite(false); setSaved(false); setAnnouncement(''); cue('tick');
  };

  return (
    <main className="reading-shell">
      <header className="reading-titlebar">
        <Link href="/#systems" className="back-link"><ArrowLeft /> All systems</Link>
        <span>{system.index} / 08</span>
        <span>{system.countLabel}</span>
      </header>
      <Progress stage={stage} />

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.section className="reading-stage intro-stage" key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
            <div className="stage-copy">
              <p className="eyebrow">{system.eyebrow}</p>
              <h1>{system.name}</h1>
              <p className="lede">{system.introduction}</p>
              <Button className="primary-action" onClick={() => move('frame')}>Begin the reading <ArrowRight /></Button>
            </div>
            <div className="stage-art"><Image src={system.cover} alt="" width={1122} height={1402} priority /><span>{system.index}</span></div>
          </motion.section>
        )}

        {stage === 'frame' && (
          <motion.section className="reading-stage centered-stage" key="frame" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">Frame the question</p>
            <h2>What are you ready to know?</h2>
            <label className="field-label" htmlFor="question">Your question <span>Optional · kept on this device</span></label>
            <Input id="question" className="question-input" maxLength={180} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={system.kind === 'ball' ? 'Ask a yes or no question…' : 'Write the question without explaining it…'} />
            <fieldset className="focus-field">
              <legend>Choose a focus</legend>
              <div>{focuses.map((item) => <label key={item.value} className={focus === item.value ? 'selected' : ''}><input type="radio" name="focus" value={item.value} checked={focus === item.value} onChange={() => { setFocus(item.value); cue('tick'); }} /><span>{item.label}</span></label>)}</div>
            </fieldset>
            <Button className="primary-action" onClick={continueFromFrame}>Continue <ArrowRight /></Button>
          </motion.section>
        )}

        {stage === 'method' && (
          <motion.section className="reading-stage method-stage" key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <header><p className="eyebrow">Choose the depth</p><h2>How much should the pattern reveal?</h2></header>
            <div className="spread-list">
              {system.spreads.map((item, index) => (
                <button type="button" key={item.id} className={spread?.id === item.id ? 'selected' : ''} onClick={() => { setSpread(item); cue('tick'); }}>
                  <span>0{index + 1}</span><strong>{item.name}</strong><p>{item.description}</p><em>{item.positions.length} {item.positions.length === 1 ? 'card' : 'cards'}</em>
                </button>
              ))}
            </div>
            {system.slug === 'tarot' && <label className="reversal-toggle"><input type="checkbox" checked={reversals} onChange={(event) => setReversals(event.target.checked)} /><span>Include reversals</span><small>Allow the cards to arrive inverted.</small></label>}
            <Button className="primary-action" onClick={() => move('ritual')}>Prepare the deck <ArrowRight /></Button>
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'cards' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">The ritual</p><h2>{shuffled ? 'The deck is listening.' : 'Cut through the noise.'}</h2><p>{system.instruction}</p>
            <div className={`deck-object ${shuffled ? 'is-shuffled' : ''}`}>
              {[3, 2, 1].map((layer) => <span key={layer} style={{ '--layer': layer } as React.CSSProperties} />)}
              <motion.button type="button" drag dragConstraints={{ left: -80, right: 80, top: -20, bottom: 20 }} dragElastic={0.18} onDragEnd={shuffleDeck} onClick={shuffleDeck} whileTap={{ scale: 0.97 }} aria-label="Drag or tap to shuffle the deck"><b>DIVINE</b><i>{system.shortName}</i></motion.button>
            </div>
            <div className="ritual-actions">
              {!shuffled ? <Button className="quiet-action" onClick={shuffleDeck}>Shuffle the deck</Button> : <Button className="primary-action" onClick={deal}>Deal {spread?.positions.length} {spread?.positions.length === 1 ? 'card' : 'cards'} <Sparkles /></Button>}
            </div>
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'ball' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-ball" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">The ritual</p><h2>Disturb the certainty.</h2><p>{system.instruction}</p>
            <motion.button drag dragConstraints={{ left: -90, right: 90, top: -40, bottom: 40 }} dragElastic={0.25} onDragEnd={performObjectRitual} onClick={performObjectRitual} className="eight-ball" aria-label="Drag or tap to shake and reveal the answer" whileDrag={{ rotate: [0, -8, 9, -6, 0] }}><span>8</span><i>Ask<br />again</i></motion.button>
            <Button className="primary-action" onClick={performObjectRitual}>Shake for the answer</Button>
            {motionSupported && <Button className="quiet-action" onClick={() => void enableDeviceMotion()}>{motionEnabled ? 'Shake your device…' : 'Use device motion'}</Button>}
          </motion.section>
        )}

        {stage === 'ritual' && system.kind === 'cookie' && (
          <motion.section className="reading-stage ritual-stage" key="ritual-cookie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">The ritual</p><h2>Break the quiet open.</h2><p>{system.instruction}</p>
            <motion.button drag="x" dragConstraints={{ left: -45, right: 45 }} dragElastic={0.25} onDragEnd={performObjectRitual} onClick={performObjectRitual} className="cookie-object" aria-label="Drag or tap to crack the fortune cookie"><span /><span /><i /></motion.button>
            <Button className="primary-action" onClick={performObjectRitual}>Crack the cookie</Button>
          </motion.section>
        )}

        {stage === 'reveal' && spread && (
          <motion.section className="reading-stage reveal-stage" key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <header><p className="eyebrow">{spread.name}</p><h2>{revealed.size === draws.length ? 'The pattern is visible.' : 'Turn each card when you are ready.'}</h2></header>
            <div className={`cards-layout spread-${spread.layout} count-${draws.length} ${draws.length > 10 ? 'many-cards' : ''}`}>
              {draws.map((draw, index) => <CardFace key={`${draw.card.id}-${index}`} draw={draw} index={index} compact={draws.length > 10} revealed={revealed.has(index)} onReveal={() => revealCard(index)} />)}
            </div>
            <div className="reveal-actions">
              {revealed.size < draws.length && <Button className="quiet-action" onClick={revealAll}>Reveal all</Button>}
              {revealed.size === draws.length && <Button className="primary-action" onClick={finishCards}>Read the pattern <ArrowRight /></Button>}
            </div>
          </motion.section>
        )}

        {stage === 'result' && interpretation && record && (
          <motion.section className="reading-stage result-stage" key="result" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            <header className="result-hero"><p className="eyebrow">The reading</p><h1>{interpretation.headline}</h1><p>{interpretation.overview}</p></header>
            {system.kind !== 'cards' && <div className={`object-result ${system.kind}`}><span>{objectMessage}</span>{luckyNumbers.length > 0 && <small>Lucky numbers · {luckyNumbers.join(' · ')}</small>}</div>}
            {draws.length > 0 && <div className={`result-cards ${draws.length > 10 ? 'dense' : ''}`}>{draws.map((draw, index) => <div key={`${draw.card.id}-${index}`}><span>{draw.position}</span><strong>{draw.card.name}</strong><p>{interpretation.positions[index]?.text}</p></div>)}</div>}
            <blockquote>{interpretation.synthesis}</blockquote>
            <p className="closing-reading">{interpretation.closing}</p>
            <div className="journal-compose">
              <label htmlFor="note">Your reflection</label>
              <Textarea id="note" value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} placeholder="Write what you noticed…" />
              <label className="privacy-check"><input type="checkbox" checked={includeQuestion} onChange={(event) => setIncludeQuestion(event.target.checked)} /><span>Include my question in shared images</span></label>
              {storageError && <output className="error-note">The private journal is unavailable. You can still download this reading.</output>}
              <div className="result-actions">
                <Button className={`quiet-action ${favorite ? 'is-active' : ''}`} onClick={() => { setFavorite((value) => !value); setSaved(false); }}><Heart fill={favorite ? 'currentColor' : 'none'} /> Favorite</Button>
                <Button className="quiet-action" onClick={() => void exportReading({ ...record, note, favorite }, includeQuestion)}><Share2 /> Share / download</Button>
                <Button className="primary-action" onClick={() => void save()}>{saved ? <Check /> : <BookMarked />}{saved ? 'Saved' : 'Save to journal'}</Button>
              </div>
            </div>
            <div className="reading-again"><Button className="quiet-action" onClick={restart}><RotateCcw /> Begin another reading</Button><Link href="/#systems">Choose another system <ArrowRight /></Link></div>
          </motion.section>
        )}
      </AnimatePresence>
      <div className="sr-only" aria-live="polite">{stage === 'result' && interpretation ? `Reading complete. ${interpretation.headline}` : announcement}</div>
    </main>
  );
}

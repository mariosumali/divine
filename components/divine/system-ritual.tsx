'use client';

import { useRef, type CSSProperties } from 'react';
import { motion, type PanInfo } from 'motion/react';
import type { SystemSlug } from '@/lib/divine/types';
import type {
  CardRitualProfile,
  RitualGesture,
  RitualId,
} from '@/lib/divine/rituals';

interface SystemRitualProps {
  profile: CardRitualProfile;
  systemSlug: SystemSlug;
  spreadCount: number;
  step: number;
  disabled: boolean;
  dealing: boolean;
  ritualValues?: number[];
  gestureProgress: number;
  onGestureProgress: (progress: number) => void;
  onAdvance: (gestureValue?: number) => void;
}

const marks = ['•', '••', '•', '••'];
const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ'];
const flowers = ['梅', '桜', '藤', '菖', '萩', '菊'];
const planets = ['☉', '☾', '☿', '♀', '♂', '♃', '♄'];

function repeated(count: number) {
  return Array.from(
    { length: Math.min(Math.max(count, 1), 9) },
    (_, index) => index,
  );
}

function RitualArtwork({
  id,
  spreadCount,
  ritualValues = [],
}: {
  id: RitualId;
  spreadCount: number;
  ritualValues?: number[];
}) {
  const cards = repeated(spreadCount);

  if (id === 'silk-deck')
    return (
      <span className="ritual-art ritual-silk" aria-hidden="true">
        <span className="silk-cloth silk-cloth-left" />
        <span className="silk-cloth silk-cloth-right" />
        <span className="silk-pack">
          {repeated(7).map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties} />
          ))}
          <b />
        </span>
        <span className="silk-corner">✦</span>
        <span className="silk-fan">
          {repeated(9).map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties} />
          ))}
        </span>
      </span>
    );

  if (id === 'image-cabinet')
    return (
      <span className="ritual-art ritual-cabinet" aria-hidden="true">
        <span className="cabinet-cover cabinet-cover-left" />
        <span className="cabinet-cover cabinet-cover-right" />
        <span className="cabinet-plates">
          {repeated(6).map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties}>
              <b>{['○', '△', '✦', '☾', '◇', '☉'][index]}</b>
            </i>
          ))}
        </span>
        <span className="cabinet-ribbon" />
      </span>
    );

  if (id === 'message-ribbon')
    return (
      <span className="ritual-art ritual-dispatch" aria-hidden="true">
        <span className="dispatch-case">
          <i />
        </span>
        <span className="dispatch-paper">
          {cards.map((index) => (
            <i key={index}>{['✉', '⌂', '♧', '⚿', '☼'][index % 5]}</i>
          ))}
        </span>
        <span className="dispatch-tear" />
      </span>
    );

  if (id === 'working-altar')
    return (
      <span className="ritual-art ritual-altar" aria-hidden="true">
        <span className="altar-surface" />
        <span className="altar-token token-flame">△</span>
        <span className="altar-token token-water">▽</span>
        <span className="altar-token token-stone">○</span>
        <svg viewBox="0 0 300 300" className="altar-seal">
          <circle cx="150" cy="150" r="105" />
          <path d="M150 38 244 205 56 205Z" />
        </svg>
        <span className="altar-pulse" />
      </span>
    );

  if (id === 'papyrus-folio')
    return (
      <span className="ritual-art ritual-papyrus" aria-hidden="true">
        <span className="papyrus-sheet">
          {cards.map((index) => (
            <i key={index}>{['𓂀', '𓋹', '𓆣', '𓇳'][index % 4]}</i>
          ))}
        </span>
        <span className="papyrus-rod papyrus-rod-left" />
        <span className="papyrus-rod papyrus-rod-right" />
        <span className="papyrus-guide" />
      </span>
    );

  if (id === 'celestial-instrument')
    return (
      <span className="ritual-art ritual-celestial" aria-hidden="true">
        <span className="celestial-ring ring-signs">
          <i>♈︎　♋︎　♎︎　♑︎</i>
        </span>
        <span className="celestial-ring ring-planets">
          <i>☉　☾　♃　♄</i>
        </span>
        <span className="celestial-ring ring-houses">
          <i>I　IV　VII　X</i>
        </span>
        <span className="celestial-center">✦</span>
        <span className="celestial-meridian" />
      </span>
    );

  if (id === 'sealed-letter')
    return (
      <span className="ritual-art ritual-letter" aria-hidden="true">
        <span className="letter-envelope">
          <i className="letter-back" />
          <i className="letter-flap" />
          <i className="letter-seal">D</i>
          <i className="letter-strip" />
          <span className={`letter-packet packet-count-${spreadCount}`}>
            {cards.map((index) => (
              <b key={index} />
            ))}
          </span>
        </span>
      </span>
    );

  if (id === 'planetary-prism')
    return (
      <span className="ritual-art ritual-prism" aria-hidden="true">
        <span className="prism-beam prism-beam-in" />
        <span className="prism-body">
          {planets.map((planet, index) => (
            <i key={planet} style={{ '--item': index } as CSSProperties}>
              {planet}
            </i>
          ))}
        </span>
        <span className="prism-beam prism-beam-out">
          {cards.map((index) => (
            <i key={index} />
          ))}
        </span>
      </span>
    );

  if (id === 'table-riffle')
    return (
      <span className="ritual-art ritual-riffle" aria-hidden="true">
        <span className="riffle-half riffle-left">
          {repeated(7).map((index) => (
            <i key={index} />
          ))}
        </span>
        <span className="riffle-half riffle-right">
          {repeated(7).map((index) => (
            <i key={index} />
          ))}
        </span>
        <span className="riffle-bridge">
          {repeated(9).map((index) => (
            <i
              key={index}
              style={
                {
                  '--item': index,
                  '--riffle-x': `${(index - 4) * 15}px`,
                  '--riffle-y': `${Math.abs(index - 4) * -8}px`,
                  '--riffle-r': `${(index - 4) * 2}deg`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      </span>
    );

  if (id === 'conversation-theatre')
    return (
      <span className="ritual-art ritual-theatre" aria-hidden="true">
        <span className="theatre-frame" />
        <span className="theatre-curtain theatre-curtain-left" />
        <span className="theatre-curtain theatre-curtain-right" />
        <span className="theatre-scenes">
          {cards.map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties}>
              <b>{index + 1}</b>
            </i>
          ))}
        </span>
        <span className="theatre-cord" />
      </span>
    );

  if (id === 'rune-pouch')
    return (
      <span className="ritual-art ritual-pouch" aria-hidden="true">
        <span className="pouch-body">
          <i />
        </span>
        <span className="pouch-cord" />
        <span className="rune-tiles">
          {cards.map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties}>
              {runes[index % runes.length]}
            </i>
          ))}
        </span>
      </span>
    );

  if (id === 'hexagram-book')
    return (
      <span
        className="ritual-art ritual-book ritual-hexagram"
        aria-hidden="true"
      >
        <span className="book-cover book-cover-left" />
        <span className="book-cover book-cover-right" />
        <span className="book-pages">
          {repeated(8).map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties} />
          ))}
        </span>
        <span className="hexagram-lines">
          {repeated(6).map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties} />
          ))}
        </span>
      </span>
    );

  if (id === 'divan')
    return (
      <span className="ritual-art ritual-book ritual-divan" aria-hidden="true">
        <span className="book-cover book-cover-left" />
        <span className="book-cover book-cover-right" />
        <span className="book-pages">
          {repeated(8).map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties} />
          ))}
        </span>
        <span className="divan-illumination">❦</span>
        <span className="divan-lines">غزل　فال　راز</span>
        <span className="divan-thread" />
      </span>
    );

  if (id === 'flower-box')
    return (
      <span className="ritual-art ritual-flower-box" aria-hidden="true">
        <span className="flower-box-base" />
        <span className="flower-box-lid">花</span>
        <span className="flower-cards">
          {cards.map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties}>
              {flowers[index % flowers.length]}
            </i>
          ))}
        </span>
      </span>
    );

  if (id === 'picture-album')
    return (
      <span className="ritual-art ritual-album" aria-hidden="true">
        <span className="album-cover album-cover-left" />
        <span className="album-cover album-cover-right" />
        <span className="album-clasp album-clasp-left" />
        <span className="album-clasp album-clasp-right" />
        <span className="album-scenes">
          {cards.map((index) => (
            <i key={index} style={{ '--item': index } as CSSProperties}>
              <b>{['⌂', '⚓', '♙', '✉'][index % 4]}</b>
            </i>
          ))}
        </span>
      </span>
    );

  return (
    <span className="ritual-art ritual-sand" aria-hidden="true">
      <span className="sand-field">
        {Array.from({ length: 18 }, (_, index) => index).map((index) => (
          <i
            key={index}
            style={
              {
                '--item': index,
                '--sand-x': `${14 + (index % 6) * 13}%`,
                '--sand-y': `${18 + Math.floor(index / 6) * 24}%`,
              } as CSSProperties
            }
          />
        ))}
      </span>
      <span className="sand-sweep" />
      <span className="sand-result">
        {marks.map((mark, index) => (
          <i key={index}>
            {ritualValues[index] === 1
              ? '•'
              : ritualValues[index] === 2
                ? '••'
                : mark}
          </i>
        ))}
      </span>
    </span>
  );
}

function directionalProgress(
  gesture: RitualGesture,
  info: PanInfo,
  travel: number,
) {
  if (gesture === 'circle') return Math.min(1, travel / 185);
  if (gesture === 'shake') return Math.min(1, travel / 245);
  if (gesture === 'hold') return Math.min(1, travel / 90);
  const distance =
    gesture === 'right'
      ? info.offset.x
      : gesture === 'left'
        ? -info.offset.x
        : gesture === 'down'
          ? info.offset.y
          : -info.offset.y;
  return Math.max(0, Math.min(1, distance / 118));
}

export function SystemRitual({
  profile,
  systemSlug,
  spreadCount,
  step,
  disabled,
  dealing,
  ritualValues,
  gestureProgress,
  onGestureProgress,
  onAdvance,
}: SystemRitualProps) {
  const travel = useRef(0);
  const suppressClick = useRef(false);
  const action = profile.actions[Math.min(step, profile.actions.length - 1)];

  const commit = () => {
    if (disabled || dealing) return;
    onGestureProgress(1);
    let gestureValue: number | undefined;
    if (profile.id === 'sand-figure' && step > 0) {
      if (travel.current > 0)
        gestureValue = Math.round(travel.current / 9) % 2 === 0 ? 2 : 1;
      else {
        const data = new Uint8Array(1);
        crypto.getRandomValues(data);
        gestureValue = data[0] % 2 === 0 ? 2 : 1;
      }
    }
    onAdvance(gestureValue);
  };

  const onPan = (_: PointerEvent, info: PanInfo) => {
    travel.current += Math.hypot(info.delta.x, info.delta.y);
    onGestureProgress(
      directionalProgress(action.gesture, info, travel.current),
    );
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const progress = directionalProgress(action.gesture, info, travel.current);
    if (travel.current > 7) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
    if (progress >= 0.38 || Math.hypot(info.velocity.x, info.velocity.y) > 720)
      commit();
    else onGestureProgress(0);
  };

  const style = {
    '--ritual-progress': gestureProgress,
    '--ritual-shift': `${gestureProgress * 112}px`,
    '--ritual-pull': `${gestureProgress * 64}px`,
    '--ritual-turn': `${gestureProgress * 175}deg`,
    '--ritual-reveal': `${Math.max(0, 100 - gestureProgress * 100)}%`,
  } as CSSProperties;

  return (
    <div
      className={`system-ritual ritual-${profile.id} phase-${step} ${dealing ? 'is-dealing' : ''}`}
      data-system={systemSlug}
      style={style}
    >
      <motion.button
        type="button"
        className="system-ritual-control"
        onClick={() => {
          if (!suppressClick.current) commit();
        }}
        onPanStart={() => {
          travel.current = 0;
        }}
        onPan={onPan}
        onPanEnd={onPanEnd}
        disabled={disabled || dealing}
        aria-label={`${action.label}. ${action.instruction}. Press to perform automatically.`}
        initial={{ opacity: 0, y: -44, rotateZ: -2, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotateZ: 0, scale: 1 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        whileTap={{ scale: 0.985 }}
      >
        <RitualArtwork
          id={profile.id}
          spreadCount={spreadCount}
          ritualValues={ritualValues}
        />
      </motion.button>
      <div className="system-ritual-caption">
        <span>{profile.object}</span>
        <strong>{dealing ? profile.completion : action.label}</strong>
        <p>
          {dealing ? 'The reading is entering the field.' : action.instruction}
        </p>
        <div className="system-ritual-progress" aria-hidden="true">
          {profile.actions.map((item, index) => (
            <i
              key={item.label}
              className={
                index < step || dealing
                  ? 'is-complete'
                  : index === step
                    ? 'is-current'
                    : ''
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

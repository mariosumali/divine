import { interpretReading, objectInterpretation } from './reading';
import { READING_INDEX_ART } from './catalog';
import { interpretTodayConstellation, todaySpread } from './today';
import type {
  Focus,
  ReadingRecord,
  SystemDefinition,
  SystemSlug,
} from './types';

export interface ShareComposition {
  title: string;
  subtitle: string;
  methodArt: string;
  displayHeadline: string;
  headline: string;
  synthesis: string;
  date: string;
  focus: Focus;
  cards: Array<{
    name: string;
    position: string;
    reversed: boolean;
    glyph: string;
    image?: string;
  }>;
  question?: string;
}

interface SharedReadingPayload {
  v: 1;
  system: SystemSlug;
  spread: string;
  created: string;
  focus: Focus;
  cards: Array<[id: string, reversed: 0 | 1]>;
  question?: string;
  headline?: string;
  message?: string;
  prompt?: string;
  numbers?: number[];
}

export interface DecodedSharedReading {
  record: ReadingRecord;
  luckyNumbers: number[];
}

const MAX_SHARE_TOKEN_LENGTH = 12_000;
const focuses: Focus[] = ['general', 'love', 'work', 'growth'];
const OBJECT_SHARE_HEADLINES: Partial<Record<SystemSlug, readonly string[]>> = {
  'magic-8-ball': [
    'Someone shook the future. This is what surfaced.',
    'A question met the oracle. Here is what it said.',
    'The oracle spoke. Someone thought of you.',
    'Someone shook the silence. An answer rose to meet it.',
    'A question was left to chance. This is what came back.',
    'Someone asked the unknown for an answer. Here it is.',
    'A question was set in motion. See what surfaced.',
    'Someone gave uncertainty a shake—and sent you the answer.',
    'The ball was given one question. This is its reply.',
    'An answer was shaken loose and sent to you.',
    'Someone turned a question over to chance. Here is where it landed.',
    'The unknown received one question. This was the answer.',
  ],
  'fortune-cookie': [
    'A small fortune found its way to you.',
    'Someone cracked open a message—and sent it your way.',
    'A little luck, opened and passed along.',
    'A quiet fortune was opened with you in mind.',
    'Someone found a message inside and passed it on.',
    'A small paper fortune has made its way to you.',
    'This fortune traveled from one hand to yours.',
    'Someone broke the shell. The message was meant to travel.',
    'A sentence from chance found its way to you.',
    'A small piece of luck, passed from hand to hand.',
    'The message hidden inside has found its way to you.',
    'Someone opened a fortune. Now the message is yours.',
  ],
};

function stableIndex(value: string, length: number): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

function shareDisplayHeadline(record: ReadingRecord): string {
  if (record.draws.length) return record.interpretation.headline;
  const headlines = OBJECT_SHARE_HEADLINES[record.system];
  if (!headlines?.length)
    return 'A message from the oracle found its way to you.';
  // Use immutable share data so each reading gets variety without its preview,
  // decoded link, and exported image ever choosing different copy.
  const seed = [
    record.system,
    record.createdAt,
    record.focus,
    record.interpretation.headline,
    ...(record.luckyNumbers ?? []),
  ].join('|');
  return headlines[stableIndex(seed, headlines.length)];
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function decodeBase64Url(value: string): string {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function isSharedReadingPayload(value: unknown): value is SharedReadingPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<SharedReadingPayload>;
  return (
    payload.v === 1 &&
    typeof payload.system === 'string' &&
    typeof payload.spread === 'string' &&
    typeof payload.created === 'string' &&
    Number.isFinite(Date.parse(payload.created)) &&
    focuses.includes(payload.focus as Focus) &&
    Array.isArray(payload.cards) &&
    payload.cards.every(
      (card) =>
        Array.isArray(card) &&
        card.length === 2 &&
        typeof card[0] === 'string' &&
        (card[1] === 0 || card[1] === 1),
    ) &&
    (payload.question === undefined ||
      (typeof payload.question === 'string' &&
        payload.question.length <= 180)) &&
    (payload.headline === undefined ||
      (typeof payload.headline === 'string' &&
        payload.headline.length <= 500)) &&
    (payload.message === undefined ||
      (typeof payload.message === 'string' && payload.message.length <= 500)) &&
    (payload.prompt === undefined ||
      (typeof payload.prompt === 'string' && payload.prompt.length <= 500)) &&
    (payload.numbers === undefined ||
      (Array.isArray(payload.numbers) &&
        payload.numbers.length <= 6 &&
        payload.numbers.every(
          (number) => Number.isInteger(number) && number >= 1 && number <= 49,
        )))
  );
}

export function createReadingShareToken(
  record: ReadingRecord,
  includeQuestion = false,
): string {
  const payload: SharedReadingPayload = {
    v: 1,
    system: record.system,
    spread: record.spreadId,
    created: record.createdAt,
    focus: record.focus,
    cards: record.draws.map((draw) => [draw.card.id, draw.reversed ? 1 : 0]),
    question:
      includeQuestion && record.question
        ? record.question.slice(0, 180)
        : undefined,
    headline: record.draws.length
      ? record.interpretation.headline.slice(0, 500)
      : undefined,
    message: record.draws.length ? undefined : record.interpretation.headline,
    prompt: record.draws.length
      ? undefined
      : record.interpretation.reflectionPrompt,
    numbers:
      record.luckyNumbers && record.luckyNumbers.length
        ? record.luckyNumbers.slice(0, 6)
        : undefined,
  };
  return encodeBase64Url(JSON.stringify(payload));
}

export function createReadingShareUrl(
  record: ReadingRecord,
  origin: string,
  includeQuestion = false,
): string {
  const base = origin.replace(/\/$/u, '');
  const token = createReadingShareToken(record, includeQuestion);
  // Keep the reading in the query string so link-preview crawlers can see it.
  // Fragments are browser-only and are never included in HTTP requests.
  return `${base}/read/${record.system}?reading=${encodeURIComponent(token)}`;
}

export function decodeReadingShareToken(
  token: string,
  system: SystemDefinition,
): DecodedSharedReading | null {
  if (!token || token.length > MAX_SHARE_TOKEN_LENGTH) return null;
  try {
    const candidate: unknown = JSON.parse(decodeBase64Url(token));
    if (!isSharedReadingPayload(candidate) || candidate.system !== system.slug)
      return null;

    const spread =
      system.spreads.find((item) => item.id === candidate.spread) ??
      (system.slug === 'divine' &&
      candidate.spread === 'today-constellation' &&
      candidate.cards.length >= 4 &&
      candidate.cards.length <= 8
        ? todaySpread(candidate.cards.length)
        : null);
    const isCardReading = system.kind === 'cards';
    const positions = spread?.positions ?? [];
    if (isCardReading && !spread) return null;
    if (isCardReading && candidate.cards.length !== positions.length)
      return null;
    if (!isCardReading && candidate.cards.length > 0) return null;

    const cardIds = new Set<string>();
    const draws = candidate.cards.flatMap(([id, reversed], index) => {
      const card = system.cards.find((item) => item.id === id);
      if (!card || cardIds.has(id) || !positions[index]) return [];
      cardIds.add(id);
      return [
        {
          card,
          position: positions[index],
          reversed: Boolean(reversed),
        },
      ];
    });
    if (isCardReading && draws.length !== candidate.cards.length) return null;

    const interpretation =
      isCardReading && spread
        ? {
            ...(spread.id === 'today-constellation'
              ? interpretTodayConstellation(draws)
              : interpretReading(
                  system,
                  spread,
                  draws,
                  candidate.focus,
                  candidate.created,
                )),
            ...(candidate.headline ? { headline: candidate.headline } : {}),
          }
        : candidate.message
          ? objectInterpretation(
              system,
              candidate.message,
              candidate.focus,
              candidate.prompt,
            )
          : null;
    if (!interpretation) return null;

    const spreadName =
      spread?.name ??
      (system.kind === 'ball' ? 'Ask & shake' : 'Crack & reveal');
    const luckyNumbers = candidate.numbers ?? [];
    return {
      record: {
        id: `shared-${token.slice(-24)}`,
        system: system.slug,
        systemName: system.name,
        spreadId: spread?.id ?? system.kind,
        spreadName,
        createdAt: candidate.created,
        focus: candidate.focus,
        question: candidate.question?.trim() || undefined,
        draws,
        interpretation,
        luckyNumbers: luckyNumbers.length ? luckyNumbers : undefined,
        note: '',
        favorite: false,
      },
      luckyNumbers,
    };
  } catch {
    return null;
  }
}

export function composeShare(
  record: ReadingRecord,
  includeQuestion = false,
): ShareComposition {
  return {
    title: 'DIVINE',
    subtitle: `${record.systemName} · ${record.spreadName}`,
    methodArt: READING_INDEX_ART[record.system],
    displayHeadline: shareDisplayHeadline(record),
    headline: record.interpretation.headline,
    synthesis: record.interpretation.synthesis,
    date: record.createdAt,
    focus: record.focus,
    cards: record.draws.map((draw) => ({
      name: `${draw.card.sourceSystemName ? `${draw.card.sourceSystemName} · ` : ''}${draw.card.name}`,
      position: draw.position,
      reversed: draw.reversed,
      glyph: draw.card.glyph,
      image: draw.card.image,
    })),
    question: includeQuestion ? record.question : undefined,
  };
}

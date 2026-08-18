import { interpretReading, objectInterpretation } from './reading';
import type {
  Focus,
  ReadingRecord,
  SystemDefinition,
  SystemSlug,
} from './types';

export interface ShareComposition {
  title: string;
  subtitle: string;
  headline: string;
  synthesis: string;
  date: string;
  cards: Array<{ name: string; position: string; reversed: boolean }>;
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
<<<<<<< HEAD
  headline?: string;
=======
>>>>>>> refs/remotes/sites/main
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
<<<<<<< HEAD
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
=======
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
>>>>>>> refs/remotes/sites/main
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
<<<<<<< HEAD
      (typeof payload.question === 'string' &&
        payload.question.length <= 180)) &&
    (payload.headline === undefined ||
      (typeof payload.headline === 'string' &&
        payload.headline.length <= 500)) &&
=======
      (typeof payload.question === 'string' && payload.question.length <= 180)) &&
>>>>>>> refs/remotes/sites/main
    (payload.message === undefined ||
      (typeof payload.message === 'string' && payload.message.length <= 500)) &&
    (payload.prompt === undefined ||
      (typeof payload.prompt === 'string' && payload.prompt.length <= 500)) &&
    (payload.numbers === undefined ||
      (Array.isArray(payload.numbers) &&
        payload.numbers.length <= 6 &&
        payload.numbers.every(
<<<<<<< HEAD
          (number) => Number.isInteger(number) && number >= 1 && number <= 49,
=======
          (number) =>
            Number.isInteger(number) && number >= 1 && number <= 49,
>>>>>>> refs/remotes/sites/main
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
<<<<<<< HEAD
    cards: record.draws.map((draw) => [draw.card.id, draw.reversed ? 1 : 0]),
=======
    cards: record.draws.map((draw) => [
      draw.card.id,
      draw.reversed ? 1 : 0,
    ]),
>>>>>>> refs/remotes/sites/main
    question:
      includeQuestion && record.question
        ? record.question.slice(0, 180)
        : undefined,
<<<<<<< HEAD
    headline: record.draws.length
      ? record.interpretation.headline.slice(0, 500)
      : undefined,
=======
>>>>>>> refs/remotes/sites/main
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
  return `${base}/read/${record.system}#reading=${createReadingShareToken(record, includeQuestion)}`;
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
      system.spreads.find((item) => item.id === candidate.spread) ?? null;
    const isCardReading = system.kind === 'cards';
<<<<<<< HEAD
    const positions = spread?.positions ?? [];
    if (isCardReading && !spread) return null;
    if (isCardReading && candidate.cards.length !== positions.length)
=======
    if (isCardReading && !spread) return null;
    if (isCardReading && candidate.cards.length !== spread.positions.length)
>>>>>>> refs/remotes/sites/main
      return null;
    if (!isCardReading && candidate.cards.length > 0) return null;

    const cardIds = new Set<string>();
    const draws = candidate.cards.flatMap(([id, reversed], index) => {
      const card = system.cards.find((item) => item.id === id);
<<<<<<< HEAD
      if (!card || cardIds.has(id) || !positions[index]) return [];
=======
      if (!card || cardIds.has(id) || !spread) return [];
>>>>>>> refs/remotes/sites/main
      cardIds.add(id);
      return [
        {
          card,
<<<<<<< HEAD
          position: positions[index],
=======
          position: spread.positions[index],
>>>>>>> refs/remotes/sites/main
          reversed: Boolean(reversed),
        },
      ];
    });
    if (isCardReading && draws.length !== candidate.cards.length) return null;

    const interpretation =
      isCardReading && spread
<<<<<<< HEAD
        ? {
            ...interpretReading(
              system,
              spread,
              draws,
              candidate.focus,
              candidate.created,
            ),
            ...(candidate.headline ? { headline: candidate.headline } : {}),
          }
=======
        ? interpretReading(system, spread, draws, candidate.focus)
>>>>>>> refs/remotes/sites/main
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
    headline: record.interpretation.headline,
    synthesis: record.interpretation.synthesis,
    date: record.createdAt,
    cards: record.draws.map((draw) => ({
      name: `${draw.card.sourceSystemName ? `${draw.card.sourceSystemName} · ` : ''}${draw.card.name}`,
      position: draw.position,
      reversed: draw.reversed,
    })),
    question: includeQuestion ? record.question : undefined,
  };
}

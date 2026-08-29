import { DIVINE_SYSTEM, SYSTEM_MAP } from './systems';
import type {
  CardDefinition,
  DrawnCard,
  InterpretationBlock,
  ReadingRecord,
  SpreadDefinition,
  SystemSlug,
} from './types';

const TODAY_VERSION = 2 as const;
const MIN_TODAY_CARDS = 4;
const MAX_TODAY_CARDS = 8;
export const TODAY_RESPONSE_MAX_LENGTH = 1_800;

export const TODAY_POSITIONS = [
  'The center of the day',
  'What moves underneath',
  'The live tension',
  'An unexpected ally',
  'What asks to be named',
  'A pattern crossing the others',
  'Where choice remains',
  'What can be carried forward',
] as const;

export function todaySpread(cardCount: number): SpreadDefinition {
  if (
    !Number.isInteger(cardCount) ||
    cardCount < MIN_TODAY_CARDS ||
    cardCount > MAX_TODAY_CARDS
  ) {
    throw new Error('Today requires between four and eight cards');
  }
  return {
    id: 'today-constellation',
    name: 'Today’s Constellation',
    description: 'A cross-deck pattern shaped by today’s reflection.',
    positions: TODAY_POSITIONS.slice(0, cardCount),
    layout: 'grid',
  };
}

export interface TodayPrompt {
  id: string;
  text: string;
}

/** Reflective prompts chosen by date. */
export const TODAY_PROMPTS: readonly TodayPrompt[] = [
  { id: 'feeling', text: 'How do you feel today?' },
  { id: 'mind', text: 'What’s on your mind?' },
  { id: 'carrying', text: 'What are you carrying today?' },
  { id: 'enrages', text: 'What enrages you?' },
  { id: 'tender', text: 'What feels tender right now?' },
  { id: 'unspoken', text: 'What have you not said out loud?' },
  { id: 'longing', text: 'What are you longing for?' },
  { id: 'avoiding', text: 'What are you avoiding?' },
  { id: 'alive', text: 'What makes you feel most alive today?' },
  { id: 'heavy', text: 'What feels heavier than it should?' },
  { id: 'protecting', text: 'What are you trying to protect?' },
  { id: 'change', text: 'What are you ready to change?' },
  { id: 'need', text: 'What do you need, honestly?' },
  { id: 'noise', text: 'What is loud inside you today?' },
  { id: 'quiet', text: 'What becomes clear when you get quiet?' },
  { id: 'resistance', text: 'Where do you feel resistance?' },
  { id: 'hope', text: 'What are you quietly hoping for?' },
  { id: 'unfinished', text: 'What feels unfinished?' },
  { id: 'truth', text: 'What truth keeps returning?' },
  { id: 'release', text: 'What would you like to put down?' },
  { id: 'attention', text: 'What keeps asking for your attention?' },
  { id: 'belonging', text: 'Where do you feel you belong?' },
  { id: 'grief', text: 'What are you grieving, large or small?' },
  { id: 'enough', text: 'Where might you already have enough?' },
] as const;

export interface TodaySeed {
  readonly version: typeof TODAY_VERSION;
  readonly dateKey: string;
  readonly createdAt: string;
  readonly promptId: string;
  readonly prompt: string;
  readonly response: string;
  /** Local wall-clock minute and UTC offset captured when the ritual begins. */
  readonly offset: string;
  /** Opaque, deterministic fingerprint used by every random choice. */
  readonly value: string;
}

export type TodayConnectionKind =
  | 'echo'
  | 'reinforcement'
  | 'counterpoint'
  | 'transformation'
  | 'bridge';

export interface TodayPairAnalysis {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly score: number;
  readonly kind: TodayConnectionKind;
  readonly sharedKeywords: readonly string[];
  readonly sharedThemes: readonly string[];
  readonly reasons: readonly string[];
  readonly text: string;
}

export interface TodayConnectionGraph {
  /** Every unordered pair, proving the whole constellation was evaluated. */
  readonly pairs: readonly TodayPairAnalysis[];
  /** Strongest links that connect every card, plus meaningful cross-links. */
  readonly edges: readonly TodayPairAnalysis[];
  readonly hubIndexes: readonly number[];
  readonly dominantThemes: readonly string[];
}

const THEME_LEXICON = {
  change: [
    'adapt',
    'alchemy',
    'begin',
    'becoming',
    'breakthrough',
    'change',
    'closure',
    'collapse',
    'completion',
    'cycle',
    'depart',
    'disruption',
    'end',
    'ending',
    'eruption',
    'exit',
    'fluctuation',
    'irreversibility',
    'leaving',
    'movement',
    'new',
    'passage',
    'rebirth',
    'recovery',
    'regeneration',
    'release',
    'renew',
    'resolution',
    'return',
    'transform',
    'transition',
    'travel',
    'turning',
  ],
  connection: [
    'affection',
    'alliance',
    'attachment',
    'belonging',
    'bond',
    'collectivity',
    'communion',
    'community',
    'companion',
    'counterpart',
    'exchange',
    'family',
    'fellowship',
    'fidelity',
    'friend',
    'heart',
    'home',
    'hospitality',
    'intimacy',
    'love',
    'marriage',
    'meeting',
    'pairing',
    'partnership',
    'reciprocity',
    'reconciliation',
    'relationship',
    'reunion',
    'trust',
    'together',
    'union',
    'vow',
  ],
  truth: [
    'assessment',
    'certainty',
    'clarity',
    'confirmation',
    'discern',
    'honest',
    'illumination',
    'information',
    'insight',
    'judgment',
    'know',
    'record',
    'reflection',
    'reveal',
    'secret',
    'truth',
    'understanding',
    'vision',
    'wisdom',
  ],
  action: [
    'achievement',
    'action',
    'agency',
    'ambition',
    'authority',
    'build',
    'command',
    'courage',
    'craft',
    'create',
    'declaration',
    'decision',
    'discipline',
    'effort',
    'focus',
    'initiative',
    'lead',
    'mastery',
    'momentum',
    'power',
    'practice',
    'precision',
    'pursuit',
    'purpose',
    'readiness',
    'resolve',
    'strategy',
    'strength',
    'success',
    'will',
    'work',
  ],
  stability: [
    'anchor',
    'balance',
    'boundary',
    'constancy',
    'continuity',
    'duration',
    'earth',
    'enclosure',
    'endurance',
    'foundation',
    'grounding',
    'material',
    'money',
    'order',
    'perseverance',
    'practical',
    'security',
    'stability',
    'steadfast',
    'steadiness',
    'stillness',
    'structure',
  ],
  feeling: [
    'affection',
    'attraction',
    'beloved',
    'compassion',
    'delight',
    'desire',
    'disappointment',
    'ecstasy',
    'emotion',
    'feeling',
    'grief',
    'instinct',
    'intuition',
    'joy',
    'longing',
    'melancholy',
    'mercy',
    'pleasure',
    'sensitivity',
    'sigh',
    'sorrow',
    'tender',
    'water',
    'yearning',
  ],
  challenge: [
    'adversity',
    'block',
    'burden',
    'challenge',
    'collapse',
    'conflict',
    'danger',
    'deception',
    'depletion',
    'deprivation',
    'delay',
    'difficulty',
    'disappointment',
    'domination',
    'erosion',
    'false',
    'fear',
    'friction',
    'jealousy',
    'limitation',
    'loss',
    'misfortune',
    'obstacle',
    'obstruction',
    'opposition',
    'oppression',
    'pressure',
    'prison',
    'restriction',
    'sick',
    'shadow',
    'stress',
    'struggle',
    'thief',
    'uncertainty',
    'weakness',
    'worry',
    'wounded',
  ],
  growth: [
    'abundance',
    'ascent',
    'becoming',
    'bloom',
    'develop',
    'emergence',
    'expansion',
    'fertility',
    'flourish',
    'gain',
    'gestation',
    'growth',
    'heal',
    'increase',
    'learn',
    'mature',
    'momentum',
    'nourish',
    'opportunity',
    'progress',
    'pushing',
    'regeneration',
    'restoration',
    'ripening',
    'rising',
    'vitality',
  ],
  protection: [
    'armor',
    'boundary',
    'care',
    'defend',
    'defense',
    'enclosure',
    'guard',
    'guardianship',
    'home',
    'privacy',
    'protect',
    'refuge',
    'safety',
    'shelter',
    'support',
  ],
  communication: [
    'conversation',
    'declaration',
    'document',
    'exchange',
    'information',
    'language',
    'letter',
    'message',
    'messenger',
    'news',
    'record',
    'speak',
    'speech',
    'story',
    'terms',
    'voice',
    'word',
    'write',
  ],
  possibility: [
    'access',
    'arrival',
    'blessing',
    'breakthrough',
    'chance',
    'dream',
    'favor',
    'fortune',
    'freedom',
    'gift',
    'hope',
    'innovation',
    'invitation',
    'opening',
    'opportunity',
    'permission',
    'potential',
    'promise',
    'surprise',
    'wish',
  ],
} as const;

type Theme = keyof typeof THEME_LEXICON;

const THEME_LANGUAGE: Record<Theme, string> = {
  change: 'change',
  connection: 'connection',
  truth: 'clarity',
  action: 'agency',
  stability: 'stability',
  feeling: 'feeling',
  challenge: 'pressure',
  growth: 'growth',
  protection: 'protection',
  communication: 'expression',
  possibility: 'possibility',
};

const THEME_INSIGHTS: Record<Theme, string> = {
  change:
    'Something is ready to move, but its direction matters as much as the movement itself.',
  connection:
    'Relationship becomes a source of information: notice what strengthens through contact and what loses definition.',
  truth:
    'What can be named clearly becomes easier to meet without urgency or distortion.',
  action:
    'Available force needs a direction; movement alone is not yet a deliberate response.',
  stability:
    'What endures here will depend on structure, pacing, and enough practical support.',
  feeling: 'The feeling carries information that thought alone cannot settle.',
  challenge:
    'The strain is not the whole story, but it shows where the present arrangement can no longer remain unquestioned.',
  growth:
    'Growth needs conditions that can support it after the first opening.',
  protection:
    'A boundary may be less about withdrawal than about preserving what still needs care.',
  communication:
    'What remains unspoken is shaping the situation; language can give it a more workable form.',
  possibility:
    'An opening is present, though it still needs a choice before it can become real.',
};

const ELEMENT_RELATIONSHIPS: Record<string, Record<string, string>> = {
  air: {
    fire: 'air gives fire direction and reach',
    earth: 'ideas meet the limits of what can be built',
    water: 'thought and feeling ask to be heard together',
  },
  earth: {
    fire: 'impulse has to take a durable form',
    water: 'care gives steady conditions for growth',
  },
  fire: {
    water: 'desire and feeling temper one another',
  },
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'for',
  'from',
  'in',
  'of',
  'or',
  'the',
  'to',
  'with',
]);

export function localDateKey(date = new Date()): string {
  if (Number.isNaN(date.getTime()))
    throw new Error('Today requires a valid date');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** FNV-1a, followed by an avalanche, gives stable choices across browsers. */
export function dailyHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  return hash >>> 0;
}

function dateKeyFrom(value: Date | string): string {
  if (typeof value !== 'string') return localDateKey(value);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error('Today requires a local date key in YYYY-MM-DD form');
  }
  return value;
}

export function todayPrompt(date: Date | string = new Date()): TodayPrompt {
  const dateKey = dateKeyFrom(date);
  return TODAY_PROMPTS[
    dailyHash(`${dateKey}:divine-today-prompt-v2`) % TODAY_PROMPTS.length
  ];
}

function normalizedResponse(response: string): string {
  return response.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

function responseEntropy(response: string): string {
  return normalizedResponse(response).toLocaleLowerCase('en-US');
}

export function todayOffset(date = new Date()): string {
  if (Number.isNaN(date.getTime()))
    throw new Error('Today requires a valid date');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${localDateKey(date)}T${hours}:${minutes}@${date.getTimezoneOffset()}`;
}

function hex32(value: number): string {
  return value.toString(16).padStart(8, '0');
}

/**
 * Captures the response and local wall-clock minute once. Persist this object,
 * then reuse it: its card count, cards, orientations, graph, and interpretation
 * do not change on later renders. `offset` is injectable for deterministic tests.
 */
export function createTodaySeed(
  response: string,
  generatedAt = new Date(),
  offset = todayOffset(generatedAt),
): TodaySeed {
  const normalized = normalizedResponse(response);
  if (!normalized)
    throw new Error('Today requires a reflection before drawing');
  if (normalized.length > TODAY_RESPONSE_MAX_LENGTH) {
    throw new Error(
      `Today reflections cannot exceed ${TODAY_RESPONSE_MAX_LENGTH} characters`,
    );
  }
  if (Number.isNaN(generatedAt.getTime())) {
    throw new Error('Today requires a valid date');
  }
  if (!offset.trim()) throw new Error('Today requires a date and time offset');

  const dateKey = localDateKey(generatedAt);
  const prompt = todayPrompt(dateKey);
  const material = [
    'divine-today-v2',
    responseEntropy(normalized),
    prompt.id,
    offset,
  ].join('\u0000');
  const mirrored = Array.from(material).reverse().join('');

  return {
    version: TODAY_VERSION,
    dateKey,
    createdAt: generatedAt.toISOString(),
    promptId: prompt.id,
    prompt: prompt.text,
    response: normalized,
    offset,
    value: `${hex32(dailyHash(material))}${hex32(dailyHash(mirrored))}`,
  };
}

export function isTodaySeed(value: unknown): value is TodaySeed {
  if (!value || typeof value !== 'object') return false;
  const seed = value as Partial<TodaySeed>;
  return (
    seed.version === TODAY_VERSION &&
    typeof seed.dateKey === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/u.test(seed.dateKey) &&
    typeof seed.createdAt === 'string' &&
    !Number.isNaN(Date.parse(seed.createdAt)) &&
    typeof seed.promptId === 'string' &&
    typeof seed.prompt === 'string' &&
    typeof seed.response === 'string' &&
    Boolean(seed.response.trim()) &&
    seed.response.length <= TODAY_RESPONSE_MAX_LENGTH &&
    typeof seed.offset === 'string' &&
    typeof seed.value === 'string' &&
    /^[\da-f]{16}$/u.test(seed.value)
  );
}

function createRandom(seed: string): () => number {
  let state = dailyHash(seed) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

function randomIndex(random: () => number, length: number): number {
  return Math.floor(random() * length);
}

interface TodaySourceGroup {
  slug: SystemSlug;
  name: string;
  cards: CardDefinition[];
}

function sourceGroups(): TodaySourceGroup[] {
  const grouped = new Map<
    SystemSlug,
    { slug: SystemSlug; name: string; cards: CardDefinition[] }
  >();
  for (const card of DIVINE_SYSTEM.cards) {
    if (!card.sourceSystem || !card.sourceSystemName) continue;
    const group = grouped.get(card.sourceSystem) ?? {
      slug: card.sourceSystem,
      name: card.sourceSystemName,
      cards: [],
    };
    group.cards.push(card);
    grouped.set(card.sourceSystem, group);
  }
  return [...grouped.values()];
}

const POSITION_THEME_ARC: ReadonlyArray<readonly Theme[]> = [
  [],
  ['feeling', 'stability', 'connection', 'protection'],
  ['challenge', 'change'],
  ['protection', 'growth', 'possibility', 'connection', 'stability'],
  ['truth', 'communication', 'feeling'],
  ['connection', 'change', 'communication'],
  ['action', 'possibility', 'change'],
  ['stability', 'growth', 'protection'],
];

const SELECTION_TERMS_CACHE = new WeakMap<CardDefinition, Set<string>>();
const UPRIGHT_SELECTION_THEMES_CACHE = new WeakMap<
  CardDefinition,
  Set<Theme>
>();
const REVERSED_SELECTION_THEMES_CACHE = new WeakMap<
  CardDefinition,
  Set<Theme>
>();
const DOMAIN_TERMS_CACHE = new WeakMap<CardDefinition, Set<string>>();
const COMPATIBILITY_CACHE = new WeakMap<
  CardDefinition,
  WeakMap<CardDefinition, Array<number | undefined>>
>();

interface TodaySelection {
  group: TodaySourceGroup;
  card: CardDefinition;
  reversed: boolean;
}

const PRIMARY_KEYWORD_SYSTEMS = new Set<SystemSlug>([
  'oracle',
  'lenormand',
  'spellcraft',
  'ancient-egypt',
  'zodiac',
]);

function selectionTerms(card: CardDefinition): Set<string> {
  const cached = SELECTION_TERMS_CACHE.get(card);
  if (cached) return cached;
  const keywords =
    card.sourceSystem && PRIMARY_KEYWORD_SYSTEMS.has(card.sourceSystem)
      ? card.keywords.slice(0, 1)
      : card.keywords;
  const result = new Set(
    terms(
      [...keywords, card.domain, card.element, card.subject]
        .filter(Boolean)
        .join(' '),
    ),
  );
  SELECTION_TERMS_CACHE.set(card, result);
  return result;
}

function selectionThemes(card: CardDefinition, reversed = false): Set<Theme> {
  const cache = reversed
    ? REVERSED_SELECTION_THEMES_CACHE
    : UPRIGHT_SELECTION_THEMES_CACHE;
  const cached = cache.get(card);
  if (cached) return cached;
  const primary = inferredThemes(selectionTerms(card));
  const fallback = primary.size ? primary : cardThemes(card);
  const result = new Set(fallback);
  if (reversed && card.reversedMeaning) {
    for (const theme of inferredThemes(new Set(terms(card.reversedMeaning)))) {
      result.add(theme);
    }
  }
  cache.set(card, result);
  return result;
}

function domainTerms(card: CardDefinition): Set<string> {
  const cached = DOMAIN_TERMS_CACHE.get(card);
  if (cached) return cached;
  const result = new Set(terms(card.domain));
  DOMAIN_TERMS_CACHE.set(card, result);
  return result;
}

/** A prose-free version of the same evidence used by the connection graph. */
function semanticCompatibility(
  left: TodaySelection,
  right: TodaySelection,
): number {
  const orientationKey = Number(left.reversed) * 2 + Number(right.reversed);
  const cached = COMPATIBILITY_CACHE.get(left.card)?.get(right.card)?.[
    orientationKey
  ];
  if (cached !== undefined) return cached;
  const sharedThemes = intersection(
    selectionThemes(left.card, left.reversed),
    selectionThemes(right.card, right.reversed),
  );
  const sharedTerms = intersection(
    selectionTerms(left.card),
    selectionTerms(right.card),
  );
  let score = 1;

  score += Math.min(sharedThemes.length, 3) * 7;
  score += Math.min(sharedTerms.length, 3) * 3;

  const elements = elementRelationship(left.card.element, right.card.element);
  if (elements) {
    score +=
      normalizeTerm(left.card.element ?? '') ===
      normalizeTerm(right.card.element ?? '')
        ? 4
        : 2;
  }

  const sharedDomain = intersection(
    domainTerms(left.card),
    domainTerms(right.card),
  );
  score += Math.min(sharedDomain.length, 2) * 2;

  if (
    left.card.numerology !== undefined &&
    right.card.numerology !== undefined
  ) {
    if (left.card.numerology === right.card.numerology) score += 3;
    else if (
      reducedNumber(left.card.numerology) ===
      reducedNumber(right.card.numerology)
    )
      score += 2;
    else if (Math.abs(left.card.numerology - right.card.numerology) === 1)
      score += 1;
  }

  const polarity = polarityKind(
    selectionPolarity(left),
    selectionPolarity(right),
  );
  if (polarity === 'transformation') score += 4;
  else if (polarity === 'reinforcement') score += 1;

  const leftCache = COMPATIBILITY_CACHE.get(left.card) ?? new WeakMap();
  const scores = leftCache.get(right.card) ?? [];
  scores[orientationKey] = score;
  leftCache.set(right.card, scores);
  COMPATIBILITY_CACHE.set(left.card, leftCache);
  return score;
}

function selectionPolarity(
  selection: TodaySelection,
): CardDefinition['polarity'] {
  if (!selection.reversed) return selection.card.polarity;
  if (selection.card.polarity === 'positive') return 'challenging';
  if (selection.card.polarity === 'challenging') return 'neutral';
  return selection.card.polarity ?? 'challenging';
}

function narrativeRoleScore(
  candidate: TodaySelection,
  selected: readonly TodaySelection[],
  positionIndex: number,
): number {
  const themes = selectionThemes(candidate.card, candidate.reversed);
  const desiredThemes = POSITION_THEME_ARC[positionIndex] ?? [];
  const selectedThemes = new Set(
    selected.flatMap((item) => [...selectionThemes(item.card, item.reversed)]),
  );
  const sharedThemes = intersection(themes, selectedThemes);
  const extendingThemes = [...themes].filter(
    (theme) => !selectedThemes.has(theme),
  );
  let score = 0;

  // The most useful additions both belong to the existing thread and add a
  // new facet, rather than merely repeating a label or starting another topic.
  score += Math.min(sharedThemes.length, 2) * 5;
  if (sharedThemes.length && extendingThemes.length) score += 5;

  for (const [index, theme] of desiredThemes.entries()) {
    if (themes.has(theme)) score += Math.max(3, 9 - index * 2);
  }

  if (positionIndex === 2) {
    if (selectionPolarity(candidate) === 'challenging') score += 10;
    if (
      selected.some(
        (item) =>
          polarityKind(
            selectionPolarity(item),
            selectionPolarity(candidate),
          ) === 'transformation',
      )
    )
      score += 5;
  } else if (positionIndex === 3) {
    if (selectionPolarity(candidate) === 'positive') score += 10;
    if (
      selected.some(
        (item) =>
          polarityKind(
            selectionPolarity(item),
            selectionPolarity(candidate),
          ) === 'transformation',
      )
    )
      score += 5;
  }

  return score;
}

function constellationCandidateScore(
  candidate: TodaySelection,
  selected: readonly TodaySelection[],
  positionIndex: number,
): number {
  const pairScores = selected
    .map((selectedCard) => semanticCompatibility(selectedCard, candidate))
    .sort((left, right) => right - left);
  const strongest = pairScores[0] ?? 0;
  const secondStrongest = pairScores[1] ?? 0;
  const total = pairScores.reduce((sum, score) => sum + score, 0);
  const meaningfulLinks = pairScores.filter((score) => score >= 8).length;

  // Strongest keeps every addition attached to the main thread; total and a
  // second link reward a constellation whose cards also speak across it.
  return (
    strongest * 6 +
    secondStrongest * 2 +
    total * 2 +
    meaningfulLinks * 5 +
    narrativeRoleScore(candidate, selected, positionIndex)
  );
}

function selectionReversed(
  group: TodaySourceGroup,
  card: CardDefinition,
  seed: TodaySeed,
): boolean {
  return (
    Boolean(SYSTEM_MAP[group.slug].reversalStyle) &&
    Boolean(card.reversedMeaning) &&
    dailyHash(`${seed.value}:orientation:${group.slug}:${card.id}`) % 100 < 35
  );
}

interface RankedTodaySelection extends TodaySelection {
  score: number;
  thematicLinks: number;
}

function seededNearOptimalChoice(
  candidates: readonly RankedTodaySelection[],
  seedMaterial: string,
  toleranceRatio: number,
  maximumChoices: number,
): RankedTodaySelection {
  const ranked = [...candidates].sort(
    (left, right) =>
      right.score - left.score ||
      left.group.slug.localeCompare(right.group.slug) ||
      left.card.id.localeCompare(right.card.id),
  );
  const bestScore = ranked[0].score;
  const tolerance = Math.max(6, Math.floor(bestScore * toleranceRatio));
  const nearOptimal = ranked
    .filter((candidate) => candidate.score >= bestScore - tolerance)
    .slice(0, maximumChoices);
  return nearOptimal[dailyHash(seedMaterial) % nearOptimal.length];
}

function coherentCandidate(
  groups: readonly TodaySourceGroup[],
  usedSources: ReadonlySet<SystemSlug>,
  selected: readonly TodaySelection[],
  positionIndex: number,
  seed: TodaySeed,
): TodaySelection | undefined {
  const groupChoices: RankedTodaySelection[] = [];

  for (const group of groups) {
    if (usedSources.has(group.slug)) continue;
    const candidates: RankedTodaySelection[] = [];
    for (const card of group.cards) {
      const candidate: TodaySelection = {
        group,
        card,
        reversed: selectionReversed(group, card, seed),
      };
      const thematicLinks = selected.filter(
        (item) =>
          intersection(
            selectionThemes(card, candidate.reversed),
            selectionThemes(item.card, item.reversed),
          ).length > 0,
      ).length;
      candidates.push({
        ...candidate,
        score: constellationCandidateScore(candidate, selected, positionIndex),
        thematicLinks,
      });
    }

    const linkedCandidates = candidates.filter(
      (candidate) => candidate.thematicLinks > 0,
    );
    const groupPool = linkedCandidates.length ? linkedCandidates : candidates;
    groupChoices.push(
      seededNearOptimalChoice(
        groupPool,
        `${seed.value}:coherent-card:${positionIndex}:${group.slug}`,
        0.08,
        8,
      ),
    );
  }

  const linkedGroups = groupChoices.filter(
    (candidate) => candidate.thematicLinks > 0,
  );
  if (!linkedGroups.length) return undefined;
  const choice = seededNearOptimalChoice(
    linkedGroups,
    `${seed.value}:coherent-source:${positionIndex}`,
    0.12,
    6,
  );
  return {
    group: choice.group,
    card: choice.card,
    reversed: choice.reversed,
  };
}

/**
 * Draws a seeded anchor, then builds a 4–8-card semantic arc across distinct
 * traditions. Later cards are chosen for both local affinity and whole-pattern
 * coherence, while seeded tie-breaking keeps equally strong readings varied.
 */
export function drawToday(seed: TodaySeed): DrawnCard[] {
  if (!isTodaySeed(seed)) throw new Error('Today requires a valid stored seed');
  const sourceRandom = createRandom(`${seed.value}:sources`);
  const cardRandom = createRandom(`${seed.value}:cards`);
  const groups = sourceGroups();
  if (groups.length < MIN_TODAY_CARDS) {
    throw new Error('Today requires at least four card traditions');
  }
  const count =
    MIN_TODAY_CARDS +
    (dailyHash(`${seed.value}:count`) %
      (MAX_TODAY_CARDS - MIN_TODAY_CARDS + 1));

  const anchorGroup = groups[randomIndex(sourceRandom, groups.length)];
  const anchorCandidates = anchorGroup.cards.filter(
    (card) => cardThemes(card).size > 0,
  );
  const anchorCards = anchorCandidates.length
    ? anchorCandidates
    : anchorGroup.cards;
  const anchorCard = anchorCards[randomIndex(cardRandom, anchorCards.length)];
  const selected: TodaySelection[] = [
    {
      group: anchorGroup,
      card: anchorCard,
      reversed: selectionReversed(anchorGroup, anchorCard, seed),
    },
  ];
  const usedSources = new Set<SystemSlug>([anchorGroup.slug]);

  while (selected.length < Math.min(count, groups.length)) {
    const next = coherentCandidate(
      groups,
      usedSources,
      selected,
      selected.length,
      seed,
    );
    if (!next) break;
    selected.push(next);
    usedSources.add(next.group.slug);
  }

  if (selected.length < MIN_TODAY_CARDS) {
    throw new Error('Today could not form a coherent constellation');
  }

  return selected.map(({ card, reversed }, index) => ({
    card,
    position: TODAY_POSITIONS[index],
    reversed,
  }));
}

function normalizeTerm(value: string): string {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function terms(value: string | undefined): string[] {
  if (!value) return [];
  return normalizeTerm(value)
    .split(' ')
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

const CARD_TERMS_CACHE = new WeakMap<CardDefinition, Set<string>>();
const CARD_THEMES_CACHE = new WeakMap<CardDefinition, Set<Theme>>();

function cardTerms(card: CardDefinition): Set<string> {
  const cached = CARD_TERMS_CACHE.get(card);
  if (cached) return cached;
  const result = new Set(
    terms(
      [
        ...card.keywords,
        card.domain,
        card.element,
        card.subject,
        card.modifier,
        card.meaning,
      ]
        .filter(Boolean)
        .join(' '),
    ),
  );
  CARD_TERMS_CACHE.set(card, result);
  return result;
}

function inferredThemes(vocabulary: Set<string>): Set<Theme> {
  return new Set(
    (Object.entries(THEME_LEXICON) as Array<[Theme, readonly string[]]>)
      .filter(([, signals]) =>
        signals.some((signal) =>
          [...vocabulary].some(
            (word) =>
              word === signal ||
              (signal.length >= 5 && word.startsWith(signal)),
          ),
        ),
      )
      .map(([theme]) => theme),
  );
}

function cardThemes(card: CardDefinition): Set<Theme> {
  const cached = CARD_THEMES_CACHE.get(card);
  if (cached) return cached;
  const result = inferredThemes(cardTerms(card));
  CARD_THEMES_CACHE.set(card, result);
  return result;
}

function intersection<T>(left: Set<T>, right: Set<T>): T[] {
  return [...left].filter((item) => right.has(item));
}

function reducedNumber(value: number): number {
  let result = Math.abs(Math.trunc(value));
  while (result > 9) {
    result = String(result)
      .split('')
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return result;
}

function elementRelationship(
  left: string | undefined,
  right: string | undefined,
): string | undefined {
  if (!left || !right) return undefined;
  const first = normalizeTerm(left);
  const second = normalizeTerm(right);
  if (first === second) return `both work through ${first}`;
  return (
    ELEMENT_RELATIONSHIPS[first]?.[second] ??
    ELEMENT_RELATIONSHIPS[second]?.[first]
  );
}

function naturalList(values: readonly string[]): string {
  if (values.length < 2) return values[0] ?? '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function capitalize(value: string): string {
  if (!value) return value;
  return `${value[0].toLocaleUpperCase('en-US')}${value.slice(1)}`;
}

function meaningTerms(draw: DrawnCard): string[] {
  const identities = new Set(
    [draw.card.name, draw.card.sourceSystemName]
      .filter((value): value is string => Boolean(value))
      .map(normalizeTerm),
  );
  const themes = [...cardThemes(draw.card)]
    .map((theme) => THEME_LANGUAGE[theme])
    .filter((theme) => !identities.has(normalizeTerm(theme)));
  if (themes.length) return [...new Set(themes)].slice(0, 2);
  return [
    draw.card.polarity === 'challenging'
      ? 'pressure'
      : draw.card.polarity === 'positive'
        ? 'possibility'
        : 'attention',
  ];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/** Prevent source copy from quietly reintroducing an identity into the prose. */
function anonymizedMeaning(draw: DrawnCard): string {
  const identifiers = [
    { value: draw.card.sourceSystemName, replacement: 'this tradition' },
    { value: draw.card.name, replacement: 'this image' },
  ]
    .filter((entry): entry is { value: string; replacement: string } =>
      Boolean(entry.value?.trim()),
    )
    .sort((left, right) => right.value.length - left.value.length);
  return identifiers.reduce((meaning, { value, replacement }) => {
    const boundary = `(^|[^\\p{L}\\p{N}])${escapeRegExp(value)}(?=$|[^\\p{L}\\p{N}])`;
    return meaning.replace(
      new RegExp(boundary, 'giu'),
      (_match, prefix: string) => `${prefix}${replacement}`,
    );
  }, meaningFor(draw));
}

function phraseAppears(value: string, phrase: string): boolean {
  const boundary = `(^|[^\\p{L}\\p{N}])${escapeRegExp(phrase)}(?=$|[^\\p{L}\\p{N}])`;
  return new RegExp(boundary, 'iu').test(value);
}

function fallbackMeaning(draw: DrawnCard): string {
  const theme = [...cardThemes(draw.card)][0];
  if (theme) return THEME_INSIGHTS[theme];
  if (draw.card.polarity === 'challenging') {
    return 'A pressure point is becoming visible, asking to be understood before it becomes a reaction.';
  }
  if (draw.card.polarity === 'positive') {
    return 'A usable possibility is present, but it still needs attention and a deliberate response.';
  }
  return 'Something persistent is asking to be noticed.';
}

/** Prefer a complete interpretive sentence over labels, captions, and metadata. */
function meaningStatement(draw: DrawnCard): string {
  const semanticTerms = new Set(meaningTerms(draw).map(normalizeTerm));
  const opaqueTerms = draw.card.keywords.filter((keyword) => {
    const normalized = normalizeTerm(keyword);
    return normalized && !semanticTerms.has(normalized);
  });
  const candidates = anonymizedMeaning(draw)
    .match(/[^.!?]+[.!?]?/gu)
    ?.map((sentence) =>
      sentence
        .trim()
        .replace(/^.+?\breversed warns that\s+/iu, '')
        .replace(/^for a modern reflective reading:\s*/iu, ''),
    )
    .filter(Boolean);
  const useful = candidates?.find(
    (sentence) =>
      sentence.length >= 28 &&
      !/\b(?:means|depicts|represents|points to)\b/iu.test(sentence) &&
      !/\b(?:card|deck|image|symbol|archetype|tradition|interpretation|reading|meaning|theme|pattern|constellation|spread|neighboring)\b/iu.test(
        sentence,
      ) &&
      !/\b(?:start with the literal situation|treating it as a metaphor|fixed verdict)\b/iu.test(
        sentence,
      ) &&
      !opaqueTerms.some((term) => phraseAppears(sentence, term)),
  );
  return completeSentence(useful ?? fallbackMeaning(draw));
}

function polarityKind(
  left: CardDefinition['polarity'],
  right: CardDefinition['polarity'],
): TodayConnectionKind | undefined {
  if (!left || !right) return undefined;
  if (
    (left === 'challenging' && right === 'positive') ||
    (left === 'positive' && right === 'challenging')
  ) {
    return 'transformation';
  }
  if (left === right) return 'reinforcement';
  return 'counterpoint';
}

function pairAnalysis(
  draws: readonly DrawnCard[],
  fromIndex: number,
  toIndex: number,
): TodayPairAnalysis {
  const from = draws[fromIndex];
  const to = draws[toIndex];
  const fromKeywords = new Set(meaningTerms(from).map(normalizeTerm));
  const toKeywords = new Set(meaningTerms(to).map(normalizeTerm));
  const sharedKeywords = intersection(fromKeywords, toKeywords).filter(Boolean);
  const sharedThemes = intersection(
    selectionThemes(from.card, from.reversed),
    selectionThemes(to.card, to.reversed),
  );
  const reasons: string[] = [];
  let score = 1;

  if (sharedKeywords.length) {
    score += 6 + Math.min(sharedKeywords.length - 1, 2);
    reasons.push(
      `both explicitly name ${sharedKeywords.slice(0, 2).join(' and ')}`,
    );
  }
  if (sharedThemes.length) {
    score += Math.min(sharedThemes.length, 3) * 3;
    reasons.push(
      `their imagery meets in ${sharedThemes.slice(0, 3).join(', ')}`,
    );
  }

  const elements = elementRelationship(from.card.element, to.card.element);
  if (elements) {
    score +=
      normalizeTerm(from.card.element ?? '') ===
      normalizeTerm(to.card.element ?? '')
        ? 4
        : 2;
    reasons.push(elements);
  }

  const fromDomain = new Set(terms(from.card.domain));
  const toDomain = new Set(terms(to.card.domain));
  const sharedDomain = intersection(fromDomain, toDomain);
  if (sharedDomain.length) {
    score += 2 + Math.min(sharedDomain.length, 2);
    reasons.push(
      `their domains overlap around ${sharedDomain.slice(0, 2).join(' and ')}`,
    );
  }

  const fromNumber = from.card.numerology;
  const toNumber = to.card.numerology;
  if (fromNumber !== undefined && toNumber !== undefined) {
    if (fromNumber === toNumber) {
      score += 4;
      reasons.push(`both carry the number ${fromNumber}`);
    } else if (reducedNumber(fromNumber) === reducedNumber(toNumber)) {
      score += 3;
      reasons.push(
        `their numbers reduce to the same root, ${reducedNumber(fromNumber)}`,
      );
    } else if (Math.abs(fromNumber - toNumber) === 1) {
      score += 1;
      reasons.push(
        'their consecutive numbers suggest a threshold or next step',
      );
    }
  }

  const polarity = polarityKind(from.card.polarity, to.card.polarity);
  if (polarity === 'transformation') {
    score += 3;
    reasons.push('a difficult current is met by a constructive one');
  } else if (polarity === 'reinforcement') {
    score += 1;
    reasons.push(`both carry a ${from.card.polarity} charge`);
  } else if (polarity === 'counterpoint') {
    score += 1;
    reasons.push(
      'their different charges keep the message from becoming one-sided',
    );
  }

  if (from.reversed !== to.reversed && (from.reversed || to.reversed)) {
    score += 1;
    reasons.push(
      'one image turns inward while the other remains outward-facing',
    );
  }

  const kind: TodayConnectionKind =
    sharedKeywords.length > 0
      ? 'echo'
      : polarity === 'transformation'
        ? 'transformation'
        : sharedThemes.length > 0 || polarity === 'reinforcement'
          ? 'reinforcement'
          : elements
            ? 'bridge'
            : (polarity ?? 'bridge');
  const analysis: TodayPairAnalysis = {
    fromIndex,
    toIndex,
    score,
    kind,
    sharedKeywords,
    sharedThemes,
    reasons,
    text: '',
  };
  return { ...analysis, text: relationshipText(analysis, draws) };
}

function relationshipText(
  connection: TodayPairAnalysis,
  draws: readonly DrawnCard[],
): string {
  const from = draws[connection.fromIndex];
  const to = draws[connection.toIndex];
  const fromFocus = naturalList(meaningTerms(from));
  const toFocus = naturalList(meaningTerms(to));
  const sharedFocus = connection.sharedThemes.map(
    (theme) => THEME_LANGUAGE[theme as Theme],
  );
  const elements = elementRelationship(from.card.element, to.card.element);
  const detail = sharedFocus.length
    ? `Their shared emphasis on ${naturalList([...new Set(sharedFocus)])} makes that concern harder to dismiss.`
    : elements
      ? `${capitalize(elements)}, so each meaning changes the scale of the other.`
      : from.reversed !== to.reversed && (from.reversed || to.reversed)
        ? 'One turns inward while the other remains outward-facing, inviting reflection before reaction.'
        : 'Placed together, each gives the other a context it cannot create alone.';

  if (connection.kind === 'transformation') {
    const difficult =
      from.card.polarity === 'challenging' ? fromFocus : toFocus;
    const opening = from.card.polarity === 'positive' ? fromFocus : toFocus;
    const pressure =
      normalizeTerm(difficult) === 'pressure'
        ? 'Pressure'
        : `Pressure around ${difficult}`;
    return `${pressure} meets an opening through ${opening}. ${detail} The difficult feeling becomes information about what a response might need.`;
  }
  if (connection.kind === 'counterpoint') {
    return `${capitalize(fromFocus)} and ${toFocus} pull in different directions. ${detail} Their difference keeps either meaning from becoming absolute and clarifies where choice remains.`;
  }
  if (connection.kind === 'reinforcement' || connection.kind === 'echo') {
    if (normalizeTerm(fromFocus) === normalizeTerm(toFocus)) {
      return `${capitalize(fromFocus)} appears in more than one part of the pattern. ${detail} What first looked isolated begins to feel like a concern asking to be acknowledged.`;
    }
    return `${capitalize(fromFocus)} gives greater weight to ${toFocus}. ${detail} What first looked isolated begins to feel like a pattern asking to be acknowledged.`;
  }
  return `${capitalize(fromFocus)} gives ${toFocus} a wider context. ${detail} Together they suggest that one concern may be quietly shaping the other.`;
}

function edgeKey(edge: TodayPairAnalysis): string {
  return `${edge.fromIndex}:${edge.toIndex}`;
}

function strongestConnectedEdges(
  pairs: readonly TodayPairAnalysis[],
  size: number,
): TodayPairAnalysis[] {
  if (size < 2) return [];
  const sorted = [...pairs].sort(
    (left, right) =>
      right.score - left.score ||
      left.fromIndex - right.fromIndex ||
      left.toIndex - right.toIndex,
  );
  const visited = new Set([0]);
  const tree: TodayPairAnalysis[] = [];

  while (visited.size < size) {
    const edge = sorted.find(
      (candidate) =>
        visited.has(candidate.fromIndex) !== visited.has(candidate.toIndex),
    );
    if (!edge) break;
    tree.push(edge);
    visited.add(edge.fromIndex);
    visited.add(edge.toIndex);
  }

  const selected = new Set(tree.map(edgeKey));
  const secondary = sorted
    .filter(
      (edge) =>
        !selected.has(edgeKey(edge)) &&
        (edge.score >= 7 || edge.sharedThemes.length >= 2),
    )
    .slice(0, Math.min(3, size - 2));
  return [...tree, ...secondary];
}

function rankedThemes(draws: readonly DrawnCard[]): string[] {
  const counts = new Map<Theme, number>();
  for (const draw of draws) {
    for (const theme of cardThemes(draw.card)) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }
  return [...counts]
    .sort(
      ([leftTheme, leftCount], [rightTheme, rightCount]) =>
        rightCount - leftCount || leftTheme.localeCompare(rightTheme),
    )
    .map(([theme]) => theme);
}

/** Scores every pair, then builds a maximum-strength connected graph. */
export function analyzeTodayConnections(
  draws: readonly DrawnCard[],
): TodayConnectionGraph {
  const pairs: TodayPairAnalysis[] = [];
  for (let fromIndex = 0; fromIndex < draws.length; fromIndex += 1) {
    for (let toIndex = fromIndex + 1; toIndex < draws.length; toIndex += 1) {
      pairs.push(pairAnalysis(draws, fromIndex, toIndex));
    }
  }
  const edges = strongestConnectedEdges(pairs, draws.length);
  const degrees = Array.from({ length: draws.length }, (_, index) => ({
    index,
    degree: edges.filter(
      (edge) => edge.fromIndex === index || edge.toIndex === index,
    ).length,
    strength: edges
      .filter((edge) => edge.fromIndex === index || edge.toIndex === index)
      .reduce((sum, edge) => sum + edge.score, 0),
  }));
  const highestDegree = Math.max(0, ...degrees.map(({ degree }) => degree));
  const hubIndexes = degrees
    .filter(({ degree }) => degree === highestDegree && degree > 0)
    .sort(
      (left, right) =>
        right.strength - left.strength || left.index - right.index,
    )
    .slice(0, 2)
    .map(({ index }) => index);

  return {
    pairs,
    edges,
    hubIndexes,
    dominantThemes: rankedThemes(draws).slice(0, 3),
  };
}

function meaningFor(draw: DrawnCard): string {
  return draw.reversed && draw.card.reversedMeaning
    ? draw.card.reversedMeaning
    : draw.card.meaning;
}

function firstSentence(value: string): string {
  return value.match(/^[^.!?]+[.!?]?/u)?.[0].trim() ?? value;
}

function completeSentence(value: string): string {
  const sentence = capitalize(firstSentence(value));
  return /[.!?]$/u.test(sentence) ? sentence : `${sentence}.`;
}

type NarrativeRole = 'situation' | 'tension' | 'resource' | 'action';

interface NarrativeProfile {
  readonly index: number;
  readonly draw: DrawnCard;
  readonly themes: readonly Theme[];
}

interface NarrativeRoleGroup {
  readonly root: NarrativeProfile;
  readonly members: NarrativeProfile[];
}

interface TodayNarrativePlan {
  readonly situation: NarrativeRoleGroup;
  readonly tension: NarrativeRoleGroup;
  readonly resource: NarrativeRoleGroup;
  readonly action: NarrativeRoleGroup;
}

const NARRATIVE_SIGNALS: Partial<Record<Theme, readonly string[]>> = {
  change: ['becoming', 'disruption', 'rebirth', 'revolution'],
  connection: ['assembly', 'collective', 'communion', 'reciprocity', 'shared'],
  truth: ['fact', 'language', 'measured', 'understand'],
  action: ['aim', 'commit', 'direction', 'momentum', 'resolve'],
  stability: ['durable', 'ground', 'pacing', 'remain', 'sustain'],
  feeling: ['anger', 'appetite', 'desire', 'grief', 'sensitivity'],
  challenge: ['constraint', 'exhaustion', 'friction', 'unequal', 'volatile'],
  growth: ['advance', 'progress', 'refine', 'vitality'],
  protection: ['contain', 'limit', 'preserve', 'withdrawal'],
  communication: ['declaration', 'express', 'invitation', 'speech'],
  possibility: ['benefit', 'emergence', 'gain', 'welcome'],
};

const THEME_ORDER = Object.keys(THEME_LEXICON) as Theme[];

function themeSignalScore(draw: DrawnCard, theme: Theme): number {
  const signals = [
    ...THEME_LEXICON[theme],
    ...(NARRATIVE_SIGNALS[theme] ?? []),
  ];
  const scoreIn = (value: string | undefined, weight: number) => {
    const vocabulary = terms(value);
    return signals.reduce(
      (score, signal) =>
        score +
        (vocabulary.some(
          (word) =>
            word === signal || (signal.length >= 5 && word.startsWith(signal)),
        )
          ? weight
          : 0),
      0,
    );
  };
  const keywordScore = scoreIn(draw.card.keywords.join(' '), 7);
  const metadataScore = scoreIn(
    [draw.card.subject, draw.card.modifier, draw.card.domain]
      .filter(Boolean)
      .join(' '),
    3,
  );
  const proseScore = scoreIn(meaningFor(draw), 1);
  const polarityScore =
    (theme === 'challenge' && draw.card.polarity === 'challenging') ||
    (theme === 'possibility' && draw.card.polarity === 'positive')
      ? 4
      : 0;
  return keywordScore + metadataScore + proseScore + polarityScore;
}

function narrativeThemes(draw: DrawnCard): Theme[] {
  const ranked = THEME_ORDER.map((theme, order) => ({
    theme,
    order,
    score: themeSignalScore(draw, theme),
  }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .slice(0, 3)
    .map(({ theme }) => theme);
  if (ranked.length) return ranked;
  if (draw.card.polarity === 'challenging' || draw.reversed) {
    return ['challenge'];
  }
  if (draw.card.polarity === 'positive') return ['possibility'];
  return ['truth'];
}

function pairScoreBetween(
  graph: TodayConnectionGraph,
  leftIndex: number,
  rightIndex: number,
): number {
  return (
    graph.pairs.find(
      (pair) =>
        (pair.fromIndex === leftIndex && pair.toIndex === rightIndex) ||
        (pair.fromIndex === rightIndex && pair.toIndex === leftIndex),
    )?.score ?? 0
  );
}

function chooseProfile(
  profiles: readonly NarrativeProfile[],
  score: (profile: NarrativeProfile) => number,
): NarrativeProfile {
  return [...profiles].sort(
    (left, right) => score(right) - score(left) || left.index - right.index,
  )[0];
}

const DIRECTIVE_START =
  /^(?:Ask|Begin|Build|Change|Choose|Clarify|Conserve|Create|Decide|Direct|Give|Honor|Keep|Let|Make|Name|Notice|Pause|Protect|Recognize|Reduce|Release|Repair|Resolve|Say|Set|Speak|State|Step|Stop|Strengthen|Take|Test|Turn|Use|Wait|Work)\b/iu;

function specificDirective(draw: DrawnCard): string | undefined {
  const sentence = meaningStatement(draw);
  if (!DIRECTIVE_START.test(sentence)) return undefined;
  if (
    /\b(?:card|deck|image|symbol|archetype|tradition|interpretation|reading|meaning|theme|pattern|constellation|spread)\b/iu.test(
      sentence,
    )
  ) {
    return undefined;
  }
  return sentence.length <= 180 ? sentence : undefined;
}

function roleAffinity(role: NarrativeRole, profile: NarrativeProfile): number {
  const primary = profile.themes[0];
  if (role === 'tension') {
    return (
      (profile.draw.card.polarity === 'challenging' ? 16 : 0) +
      (profile.draw.reversed ? 8 : 0) +
      (primary === 'challenge' ? 8 : 0)
    );
  }
  if (role === 'resource') {
    return (
      (profile.draw.card.polarity === 'positive' ? 14 : 0) +
      ([
        'connection',
        'feeling',
        'growth',
        'possibility',
        'protection',
        'stability',
      ].includes(primary)
        ? 6
        : 0)
    );
  }
  if (role === 'action') {
    return (
      (specificDirective(profile.draw) ? 14 : 0) +
      (['action', 'change', 'communication', 'truth'].includes(primary)
        ? 7
        : 0) +
      profile.index
    );
  }
  return profile.index === 0 ? 20 : 0;
}

const NARRATIVE_ROLES: readonly NarrativeRole[] = [
  'situation',
  'tension',
  'resource',
  'action',
];

function roleAssignments(
  length: number,
  available: readonly NarrativeRole[] = NARRATIVE_ROLES,
): NarrativeRole[][] {
  if (length === 0) return [[]];
  return available.flatMap((role) =>
    roleAssignments(
      length - 1,
      available.filter((candidate) => candidate !== role),
    ).map((rest) => [role, ...rest]),
  );
}

function narrativePlan(
  draws: readonly DrawnCard[],
  graph: TodayConnectionGraph,
): TodayNarrativePlan {
  const profiles = draws.map((draw, index) => ({
    index,
    draw,
    themes: narrativeThemes(draw),
  }));
  const situation = profiles[0];
  const withoutSituation = profiles.slice(1);
  const tension = chooseProfile(
    withoutSituation,
    (profile) =>
      roleAffinity('tension', profile) +
      pairScoreBetween(graph, situation.index, profile.index),
  );
  const withoutTension = withoutSituation.filter(
    ({ index }) => index !== tension.index,
  );
  const resource = chooseProfile(
    withoutTension,
    (profile) =>
      roleAffinity('resource', profile) +
      pairScoreBetween(graph, situation.index, profile.index) +
      pairScoreBetween(graph, tension.index, profile.index),
  );
  const withoutResource = withoutTension.filter(
    ({ index }) => index !== resource.index,
  );
  const action = chooseProfile(
    withoutResource,
    (profile) =>
      roleAffinity('action', profile) +
      pairScoreBetween(graph, resource.index, profile.index),
  );
  const roots = { situation, tension, resource, action };
  const groups: Record<NarrativeRole, NarrativeProfile[]> = {
    situation: [situation],
    tension: [tension],
    resource: [resource],
    action: [action],
  };
  const rootIndexes = new Set(Object.values(roots).map(({ index }) => index));
  const extras = profiles.filter(({ index }) => !rootIndexes.has(index));

  const assignment = roleAssignments(extras.length).sort((left, right) => {
    const assignmentScore = (roles: readonly NarrativeRole[]) =>
      roles.reduce((score, role, index) => {
        const extra = extras[index];
        return (
          score +
          pairScoreBetween(graph, extra.index, roots[role].index) +
          roleAffinity(role, extra)
        );
      }, 0);
    const scoreDifference = assignmentScore(right) - assignmentScore(left);
    if (scoreDifference) return scoreDifference;
    return left
      .map((role) => NARRATIVE_ROLES.indexOf(role))
      .join('')
      .localeCompare(
        right.map((role) => NARRATIVE_ROLES.indexOf(role)).join(''),
      );
  })[0];
  assignment.forEach((role, index) => {
    groups[role].push(extras[index]);
  });

  for (const role of NARRATIVE_ROLES) {
    if (groups[role].length > 2) {
      throw new Error('Today could not assign a distinct narrative role');
    }
  }

  return {
    situation: { root: situation, members: groups.situation },
    tension: { root: tension, members: groups.tension },
    resource: { root: resource, members: groups.resource },
    action: { root: action, members: groups.action },
  };
}

const SITUATION_SENTENCE: Record<Theme, string> = {
  change: 'Something in the current arrangement is ready to change.',
  connection:
    'This cannot be settled in isolation because other people shape what is possible.',
  truth: 'Something already understood needs plain language.',
  action: 'There is enough energy to move, but it still needs a direction.',
  stability: 'The immediate question is what can actually hold under pressure.',
  feeling: 'A feeling is carrying information that thought has not settled.',
  challenge: 'The current arrangement is producing real strain.',
  growth: 'Something is beginning to develop beyond its old form.',
  protection: 'Something vulnerable needs a clear boundary.',
  communication: 'What remains unspoken is already shaping the situation.',
  possibility: 'There is more room here than the current story allows.',
};

const TENSION_CLAUSE: Record<Theme, string> = {
  change: 'urgency can make disruption feel wiser than it is',
  connection: 'keeping everyone comfortable can hide an uneven exchange',
  truth: 'the wish for certainty can close honest inquiry too early',
  action: 'movement can become reaction before the aim is clear',
  stability: 'security can become resistance after circumstances have changed',
  feeling: 'intensity can make every impulse feel like an instruction',
  challenge:
    'pressure is narrowing attention until the obstacle looks like the whole problem',
  growth: 'expansion can exhaust what is still trying to take root',
  protection: 'self-protection can quietly turn into withdrawal',
  communication: 'more words will not help if they avoid the actual point',
  possibility: 'hope can remain abstract when no choice gives it form',
};

const RESOURCE_PHRASE: Record<Theme, string> = {
  change: 'letting the next form emerge in deliberate stages',
  connection:
    'letting mutual participation reveal what each person can actually offer',
  truth: 'separating what is known from what is assumed',
  action: 'giving the available energy one deliberate direction',
  stability: 'building enough structure to carry the next move',
  feeling: 'hearing the feeling as information without treating it as an order',
  challenge:
    'using the limit to see what can no longer be carried in the same way',
  growth: 'supporting the opening at a pace it can sustain',
  protection: 'setting a boundary that preserves care without ending contact',
  communication: 'using specific language to give intention a workable form',
  possibility: 'testing the opening through a small, reversible experiment',
};

const ACTION_SENTENCE: Record<Theme, string> = {
  change:
    'Name what must end, preserve what still matters, and move only when the reason is clear.',
  connection:
    'Ask what each person can genuinely offer, then make the next agreement mutual.',
  truth:
    'State the clearest fact you know, then leave room for what you do not know yet.',
  action:
    'Choose the smallest useful step and complete it before expanding the plan.',
  stability:
    'Strengthen the part that must carry the weight before asking it to hold more.',
  feeling:
    'Name the feeling, then decide what it needs from you rather than obeying its first impulse.',
  challenge: 'Reduce the immediate pressure before making the larger decision.',
  growth: 'Give what is emerging one condition it needs in order to continue.',
  protection: 'State what you will protect and what contact remains possible.',
  communication:
    'Say what is happening, what you need, and what you are prepared to do.',
  possibility:
    'Test the opening with one reversible step before committing further.',
};

const HEADLINE: Record<Theme, string> = {
  change: 'Let change earn its shape',
  connection: 'Make the exchange genuinely mutual',
  truth: 'Choose clarity before certainty',
  action: 'Give the energy one direction',
  stability: 'Build what the next step can stand on',
  feeling: 'Let the feeling speak without steering',
  challenge: 'Pressure is showing the limit',
  growth: 'Give growth conditions that can last',
  protection: 'Let the boundary preserve care',
  communication: 'Say the part that changes the conversation',
  possibility: 'Test the opening gently',
};

const REFLECTION_QUESTION: Record<Theme, string> = {
  change: 'What must be preserved for this change to be worth making?',
  connection: 'What would make this exchange genuinely mutual?',
  truth: 'What do you know, and what are you still assuming?',
  action: 'Which step matters enough to finish before beginning another?',
  stability: 'What support would make the next step sustainable?',
  feeling: 'What is this feeling protecting or asking you to notice?',
  challenge: 'What becomes possible once the immediate pressure is reduced?',
  growth: 'What condition would help this continue without forcing it?',
  protection: 'Which boundary protects care instead of merely avoiding risk?',
  communication:
    'What needs to be said plainly enough to change the situation?',
  possibility: 'What small test could show whether this opening is real?',
};

const SITUATION_QUALIFIER: Record<Theme, string> = {
  change: '; the pressure to move is growing',
  connection: ', while the people affected remain part of the question',
  truth: ', although not everything has been said plainly',
  action: '; unused energy is looking for direction',
  stability: ', but whatever follows must be able to hold',
  feeling: '; an unsettled feeling is keeping it present',
  challenge: '; the strain has become difficult to ignore',
  growth: ', as something new is already beginning to develop',
  protection: ', without exposing what still needs care',
  communication: '; naming it will change what becomes possible',
  possibility: '; an opening has also begun to appear',
};

const TENSION_QUALIFIER: Record<Theme, string> = {
  change: 'forcing the timing would reproduce the problem in another form',
  connection: 'an answer that excludes the people affected will not hold',
  truth: 'the response needs evidence rather than greater certainty',
  action: 'acting faster would only make the aim less clear',
  stability: 'preserving the familiar could become its own kind of risk',
  feeling: 'the strongest feeling may be the least reliable guide to timing',
  challenge:
    'the first task is to reduce enough strain to see beyond the obstacle',
  growth: 'what is emerging needs room rather than acceleration',
  protection: 'a boundary must protect care without becoming avoidance',
  communication: 'the unsaid point will keep distorting every workaround',
  possibility: 'an opening is useful only when it can survive a small test',
};

const RESOURCE_ADDITION: Record<Theme, string> = {
  change: 'room to adjust as circumstances move',
  connection: 'a response the other side can genuinely answer',
  truth: 'a clear separation between fact and assumption',
  action: 'one bounded step that can be completed',
  stability: 'a structure sturdy enough to last beyond the first effort',
  feeling: 'space for emotion to inform the choice without making it',
  challenge: 'respect for the limit that has become visible',
  growth: 'conditions that can support what develops next',
  protection: 'a boundary that keeps care intact',
  communication: 'language specific enough to invite a real response',
  possibility: 'a reversible test before any larger promise',
};

const ACTION_QUALIFIER: Record<Theme, string> = {
  change: ', while leaving room to adjust once movement begins',
  connection: '; then invite an honest response from the people affected',
  truth: ', without claiming certainty you do not have',
  action: ' before opening another line of effort',
  stability: ' at a pace the available support can carry',
  feeling: ' after the first emotional surge has passed',
  challenge: ' once the immediate pressure is low enough to think',
  growth: ', while protecting the conditions needed to continue',
  protection: ', without sacrificing the care that limit is meant to preserve',
  communication: ', and put it in words clear enough for a real response',
  possibility: ', while keeping the first move reversible',
};

function assignedModifier(
  group: NarrativeRoleGroup,
): NarrativeProfile | undefined {
  return group.members.find(({ index }) => index !== group.root.index);
}

function modifierTheme(group: NarrativeRoleGroup): Theme | undefined {
  const assigned = assignedModifier(group);
  return (
    assigned?.themes.find((theme) => theme !== group.root.themes[0]) ??
    assigned?.themes[0] ??
    group.root.themes.find((theme) => theme !== group.root.themes[0])
  );
}

function repeatsRootTheme(group: NarrativeRoleGroup): boolean {
  const assigned = assignedModifier(group);
  return Boolean(assigned) && modifierTheme(group) === group.root.themes[0];
}

function situationSentence(group: NarrativeRoleGroup): string {
  const base = SITUATION_SENTENCE[group.root.themes[0]];
  const modifier = modifierTheme(group);
  if (!modifier) return base;
  if (repeatsRootTheme(group)) {
    return `${base.replace(/\.$/u, '')}, and its recurrence makes it difficult to dismiss.`;
  }
  return `${base.replace(/\.$/u, '')}${SITUATION_QUALIFIER[modifier]}.`;
}

function tensionSentence(group: NarrativeRoleGroup): string {
  const clause = TENSION_CLAUSE[group.root.themes[0]];
  const modifier = modifierTheme(group);
  if (repeatsRootTheme(group)) {
    return `That becomes difficult when ${clause}; the same pressure appears from another angle.`;
  }
  return `That becomes difficult when ${clause}${modifier ? `; ${TENSION_QUALIFIER[modifier]}` : ''}.`;
}

function resourceSentence(group: NarrativeRoleGroup): string {
  const phrase = RESOURCE_PHRASE[group.root.themes[0]];
  const modifier = modifierTheme(group);
  if (repeatsRootTheme(group)) {
    return `What helps is ${phrase}, reinforced from more than one direction.`;
  }
  return `What helps is ${phrase}${modifier ? `, with ${RESOURCE_ADDITION[modifier]}` : ''}.`;
}

function actionSentence(group: NarrativeRoleGroup): string {
  const base =
    specificDirective(group.root.draw) ?? ACTION_SENTENCE[group.root.themes[0]];
  const modifier = modifierTheme(group);
  if (!modifier) return base;
  if (repeatsRootTheme(group)) {
    return `${base.replace(/[.!?]$/u, '')}, and let that same priority govern what follows.`;
  }
  return `${base.replace(/[.!?]$/u, '')}${ACTION_QUALIFIER[modifier]}.`;
}

function constellationSynthesis(plan: TodayNarrativePlan): string {
  return [
    situationSentence(plan.situation),
    tensionSentence(plan.tension),
    resourceSentence(plan.resource),
    actionSentence(plan.action),
  ].join(' ');
}

export function interpretTodayConstellation(
  draws: readonly DrawnCard[],
): InterpretationBlock {
  todaySpread(draws.length);
  const graph = analyzeTodayConnections(draws);
  const plan = narrativePlan(draws, graph);
  const situationTheme = plan.situation.root.themes[0];
  const actionTheme = plan.action.root.themes[0];
  const closing = REFLECTION_QUESTION[actionTheme];

  return {
    headline: HEADLINE[situationTheme],
    overview: `${situationSentence(plan.situation)} ${tensionSentence(plan.tension)}`,
    positions: [],
    synthesis: constellationSynthesis(plan),
    closing,
    reflectionPrompt: closing,
  };
}

/** Builds the single journal entry for a generated Today constellation. */
export function todayRecord(
  seed: TodaySeed,
  note = seed.response,
): ReadingRecord {
  if (!isTodaySeed(seed)) throw new Error('Today requires a valid stored seed');
  const draws = drawToday(seed);
  const spread = todaySpread(draws.length);
  return {
    id: `today:${seed.dateKey}:constellation`,
    system: 'divine',
    systemName: DIVINE_SYSTEM.name,
    spreadId: spread.id,
    spreadName: spread.name,
    createdAt: seed.createdAt,
    focus: 'general',
    question: seed.prompt,
    draws,
    interpretation: interpretTodayConstellation(draws),
    note,
    favorite: false,
  };
}

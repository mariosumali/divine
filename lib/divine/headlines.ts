import { ASTROLOGY_SIGNS } from './astrology';
import type {
  DrawnCard,
  Focus,
  SpreadDefinition,
  SystemDefinition,
  SystemSlug,
} from './types';

type HeadlineTone = 'positive' | 'neutral' | 'challenging';

const UNIVERSAL_ADVICE = [
  '{Keyword} is at the heart of this reading.',
  'Pay attention to where {keyword} is already showing up.',
  'Something about {keyword} deserves a closer look.',
  'Let {keyword} guide one practical choice.',
  'Notice what changes when you take {keyword} seriously.',
  '{Keyword} may be easier to recognize than to explain.',
  'Begin with the part of {keyword} you can act on.',
  'Make room for {keyword} without forcing an answer.',
  'The next step becomes clearer when you acknowledge {keyword}.',
  'Look for the most ordinary way {keyword} appears in your life.',
  'A small response to {keyword} may be enough for now.',
  'Let {keyword} raise a question before it becomes a conclusion.',
] as const;

const FOCUS_ADVICE: Record<Focus, readonly string[]> = {
  general: [
    'Where is {keyword} already affecting an everyday decision?',
    'You do not need a perfect answer to respond to {keyword}.',
    'The larger question may become clearer when you name {keyword}.',
    'Do not minimize the part of the situation shaped by {keyword}.',
    'Let {keyword} adjust the plan without overturning everything.',
    'Choose the response that still feels sound after considering {keyword}.',
    'One area of life may need a different response to {keyword}.',
    'Start with the choice most directly connected to {keyword}.',
  ],
  love: [
    'Ask how {keyword} is affecting the way care is exchanged.',
    'A close bond should make room for an honest conversation about {keyword}.',
    'Notice whether {keyword} brings you closer or asks you to disappear.',
    'Name {keyword} without using it as an accusation.',
    'Let {keyword} clarify what this relationship can and cannot repair.',
    'Choose the conversation that makes {keyword} easier to understand.',
    'Protect the part of the connection that remains honest around {keyword}.',
    'Look for the action—not only the promise—that responds to {keyword}.',
  ],
  work: [
    'Ask what {keyword} changes about the work in front of you.',
    'Base the next work decision on {keyword}, not the need to impress.',
    'Give {keyword} one concrete response before expanding the plan.',
    'Make room for {keyword} without making work your only measure.',
    'Turn {keyword} into one task you can finish.',
    'The right method should account for {keyword} without consuming you.',
    'Let {keyword} improve the process instead of becoming a performance.',
    'Choose the next task that makes your response to {keyword} visible.',
  ],
  growth: [
    'Growth begins when you stop performing around {keyword}.',
    'Let {keyword} change a habit without turning it into a judgment of your worth.',
    'You can face {keyword} without rushing to explain it.',
    'You do not have to master {keyword}; start by recognizing it.',
    'Turn your response to {keyword} into a small practice.',
    'Whatever {keyword} teaches, it is not a verdict on who you are.',
    'Stay present if {keyword} changes the plan.',
    'Treat yourself gently while you learn how to respond to {keyword}.',
  ],
};

const TONE_ADVICE: Record<HeadlineTone, readonly string[]> = {
  positive: [
    'Something is opening around {keyword}; help it grow.',
    'Protect the conditions that allow {keyword} to continue.',
    'Receive {keyword} without making it smaller.',
    'Give {keyword} enough attention to become real.',
    'You are allowed to move toward {keyword}.',
    'Choose the conditions in which {keyword} can keep growing.',
    'Say yes to {keyword}, then take responsibility for what follows.',
    'Do not only admire {keyword}; make room for it in daily life.',
  ],
  neutral: [
    'Give {keyword} a clear boundary and a real next step.',
    'Turn {keyword} from an idea into a decision.',
    'Put {keyword} into practice in one small way.',
    'Let {keyword} change the method before it changes the goal.',
    'Pay attention to {keyword} before deciding what it means.',
    'Use restraint while you learn what {keyword} requires.',
    'Choose a pace that makes {keyword} easier to understand.',
    '{Keyword} needs participation, not only observation.',
  ],
  challenging: [
    'A difficulty around {keyword} needs your attention.',
    'Notice what you have been postponing about {keyword}.',
    'Avoiding {keyword} may now cost more than facing it.',
    'You do not have to carry {keyword} in the same way again.',
    'Face {keyword} without letting it define the whole situation.',
    'Do not organize every choice around the fear of {keyword}.',
    'Meet {keyword} directly, then decide what it is allowed to influence.',
    'The cycle around {keyword} can change once it no longer feels inevitable.',
  ],
};

const ZODIAC_SIGN_ADVICE = new Map<string, readonly string[]>(
  ASTROLOGY_SIGNS.map((sign) => [
    sign.name,
    [
      sign.headline,
      ...sentences(sign.overview),
      `${sign.gift} Let it guide one deliberate choice.`,
      `${sign.tension} Notice it before it chooses for you.`,
      `${sign.do}. Begin there.`,
      `Stop ${sign.avoid.toLocaleLowerCase()}. Choose the cleaner truth.`,
    ],
  ]),
);

function sentences(value: string): string[] {
  return value.match(/[^.!?]+(?:[.!?]+|$)/gu)?.map((part) => part.trim()) ?? [];
}

function sentenceAdvice(draw: DrawnCard): string[] {
  const meaning =
    draw.reversed && draw.card.reversedMeaning
      ? draw.card.reversedMeaning
      : draw.card.meaning;

  return sentences(meaning).flatMap((sentence) => {
    const colon = sentence.indexOf(':');
    const withoutCardPrefix =
      colon > -1 && sentence.slice(0, colon).includes(draw.card.name)
        ? sentence.slice(colon + 1).trim()
        : sentence;
    if (/\bannounces\b/iu.test(withoutCardPrefix)) return [];
    const normalized = capitalize(withoutCardPrefix);
    return normalized.length >= 28 && normalized.length <= 150
      ? [normalized]
      : [];
  });
}

function capitalize(value: string): string {
  return value
    ? `${value.charAt(0).toLocaleUpperCase()}${value.slice(1)}`
    : value;
}

function render(template: string, keyword: string): string {
  return template
    .replaceAll('{Keyword}', capitalize(keyword))
    .replaceAll('{keyword}', keyword);
}

function headlineTone(draw: DrawnCard): HeadlineTone {
  if (draw.reversed) return 'challenging';
  return draw.card.polarity ?? 'neutral';
}

function stableIndex(value: string, length: number): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

function originalSystem(systemSlug: SystemSlug, draw: DrawnCard): SystemSlug {
  return draw.card.sourceSystem ?? systemSlug;
}

/**
 * The complete editorial bank available when a card opens a reading. Every
 * card receives card-specific meaning lines plus focus, tone, and universal
 * advice, while selected decks can contribute additional curated lines.
 */
export function openingHeroHeadlines(
  systemSlug: SystemSlug,
  draw: DrawnCard,
  focus: Focus,
): string[] {
  const keyword = draw.card.keywords[0].trim().toLocaleLowerCase();
  const templates = [
    ...UNIVERSAL_ADVICE,
    ...FOCUS_ADVICE[focus],
    ...TONE_ADVICE[headlineTone(draw)],
  ];
  const deckSpecific =
    originalSystem(systemSlug, draw) === 'zodiac'
      ? (ZODIAC_SIGN_ADVICE.get(draw.card.name) ?? [])
      : [];

  return Array.from(
    new Set([
      ...deckSpecific,
      ...sentenceAdvice(draw),
      ...templates.map((template) => render(template, keyword)),
    ]),
  ).filter((headline) => headline.length >= 28 && headline.length <= 180);
}

/** Selects a reproducible line so saved and shared readings keep their voice. */
export function openingHeroHeadline(
  system: SystemDefinition,
  spread: SpreadDefinition,
  draws: DrawnCard[],
  focus: Focus,
  variantKey = '',
): string {
  const first = draws[0];
  if (!first) return 'The answer begins with the choice you make next.';
  const headlines = openingHeroHeadlines(system.slug, first, focus);
  const seed = [
    system.slug,
    spread.id,
    focus,
    variantKey,
    ...draws.map(
      (draw) =>
        `${draw.card.sourceSystem ?? system.slug}:${draw.card.id}:${draw.reversed ? 'reversed' : 'upright'}`,
    ),
  ].join('|');
  return headlines[stableIndex(seed, headlines.length)];
}

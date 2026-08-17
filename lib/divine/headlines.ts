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
  'Let {keyword} change the next decision, not merely the mood.',
  'Give {keyword} enough room to reveal the real question.',
  'The truth of {keyword} matters more than the appearance of certainty.',
  'Stay with {keyword} until the next honest action becomes clear.',
  'Do not rush past {keyword}; it is changing the terms of the question.',
  'Make the next choice in full awareness of {keyword}.',
  'What {keyword} asks of you now cannot be answered by appearances.',
  'Let {keyword} sharpen the decision instead of clouding it.',
  'Meet {keyword} honestly before deciding what it means.',
  'The next move does not need certainty; it needs respect for {keyword}.',
  '{Keyword} is not background noise. Let it alter the plan.',
  'A clear response to {keyword} is more useful than a perfect explanation.',
] as const;

const FOCUS_ADVICE: Record<Focus, readonly string[]> = {
  general: [
    'Let {keyword} change the next decision, not merely the mood.',
    'Your life does not need a perfect answer; it needs an honest response to {keyword}.',
    'Give {keyword} enough room to reveal the question beneath the question.',
    'The next step becomes clearer when {keyword} is no longer minimized.',
    'Build the next chapter around the truth of {keyword}, not the comfort of habit.',
    'Let {keyword} revise the plan without making you doubt your whole path.',
    'Choose what remains honest when {keyword} is brought into the light.',
    'The life you want will ask you to respond differently to {keyword}.',
  ],
  love: [
    'Let {keyword} make the relationship more honest, not merely more intense.',
    'Ask what {keyword} reveals about how care is being exchanged.',
    'A bond worth keeping can face {keyword} without asking you to disappear.',
    'Do not call it love if it requires you to deny {keyword}.',
    'Choose the conversation that makes room for the truth of {keyword}.',
    'Let {keyword} clarify what devotion can—and cannot—repair.',
    'Love becomes clearer when {keyword} is named without accusation.',
    'Protect the part of connection that can remain honest beside {keyword}.',
  ],
  work: [
    'Let {keyword} clarify the work; do not let the work define your worth.',
    'Build the next decision around the truth of {keyword}, not the need to impress.',
    'What {keyword} changes in the work deserves a concrete response.',
    'Make room for {keyword} without making ambition your only measure.',
    'Turn {keyword} into one finishable action before expanding the plan.',
    'The right work can hold {keyword} without consuming the rest of your life.',
    'Let {keyword} improve the method instead of becoming another performance.',
    'Choose the next task that makes your response to {keyword} visible.',
  ],
  growth: [
    'Growth begins when you stop performing around {keyword}.',
    'Let {keyword} revise the habit, not your worth.',
    'The self you are becoming can face {keyword} without rushing to explain it.',
    'You do not have to master {keyword}; you have to meet it honestly.',
    'Let your response to {keyword} become practice instead of self-judgment.',
    'The lesson inside {keyword} is not a verdict on who you are.',
    'Become someone who can stay present when {keyword} changes the plan.',
    'Your next version is being shaped by how gently you meet {keyword}.',
  ],
};

const TONE_ADVICE: Record<HeadlineTone, readonly string[]> = {
  positive: [
    'Protect what {keyword} is beginning to make possible.',
    'Let {keyword} become durable enough to outlast the moment.',
    'Receive {keyword} without shrinking what it asks you to become.',
    'Follow {keyword} with enough discipline to make it real.',
    'You are allowed to move toward {keyword} without apologizing.',
    'Choose the conditions in which {keyword} can keep growing.',
    'Say yes to {keyword}, then take responsibility for what follows.',
    'Do not admire {keyword} from a distance; build a life that can hold it.',
  ],
  neutral: [
    'Give {keyword} a clear boundary and a real next step.',
    'Turn {keyword} from an idea into a decision.',
    'Do not perform {keyword}; put it into practice.',
    'Let {keyword} change your method before it changes your aim.',
    'Meet {keyword} with attention before assigning it a meaning.',
    'The honest use of {keyword} begins with restraint.',
    'Choose a pace that lets {keyword} become intelligible.',
    '{Keyword} is asking for participation, not spectatorship.',
  ],
  challenging: [
    'Name {keyword} clearly; what is seen can finally be changed.',
    'Let {keyword} show you what can no longer be postponed.',
    'The cost of avoiding {keyword} is now greater than meeting it.',
    'You do not have to carry {keyword} in the same way again.',
    'Face {keyword} without letting it define the whole horizon.',
    'Stop arranging your life around the fear of {keyword}.',
    'Meet {keyword} directly, then choose what it is no longer allowed to control.',
    'The pattern around {keyword} breaks when you stop calling it inevitable.',
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

import { BALL_ANSWERS, FORTUNES, FORTUNE_PROMPTS } from './objects';
import { openingHeroHeadline } from './headlines';
import type {
  CardDefinition,
  DrawnCard,
  Focus,
  InterpretationBlock,
  SpreadDefinition,
  SystemDefinition,
  SystemSlug,
} from './types';

export const OBJECT_RITUAL_STEPS = 3;
export const COOKIE_RITUAL_STEPS = 2;

export function nextObjectRitualStep(
  current: number,
  maximum = OBJECT_RITUAL_STEPS,
): number {
  return Math.min(maximum, Math.max(0, Math.floor(current)) + 1);
}

export function secureIndex(max: number): number {
  if (max <= 0) return 0;
  const ceiling = Math.floor(0x1_0000_0000 / max) * max;
  const data = new Uint32Array(1);
  do crypto.getRandomValues(data);
  while (data[0] >= ceiling);
  return data[0] % max;
}

export function secureShuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = secureIndex(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function zodiacDraws(
  system: SystemDefinition,
  spread: SpreadDefinition,
): CardDefinition[] {
  if (spread.id === 'celestial-triad') {
    return ['sign', 'planet', 'house'].map((domain) => {
      const pool = system.cards.filter((card) => card.domain === domain);
      return pool[secureIndex(pool.length)];
    });
  }
  if (spread.id === 'celestial-pattern') {
    const sign = system.cards.filter((card) => card.domain === 'sign');
    const planet = system.cards.filter((card) => card.domain === 'planet');
    const house = system.cards.filter((card) => card.domain === 'house');
    const anchors = [
      sign[secureIndex(sign.length)],
      planet[secureIndex(planet.length)],
      house[secureIndex(house.length)],
    ];
    const anchorIds = new Set(anchors.map((card) => card.id));
    return [
      ...anchors,
      ...secureShuffle(
        system.cards.filter((card) => !anchorIds.has(card.id)),
      ).slice(0, 2),
    ];
  }
  if (spread.id === 'archetype')
    return [system.cards[secureIndex(system.cards.length)]];
  return secureShuffle(system.cards).slice(0, spread.positions.length);
}

function bellineDraws(
  system: SystemDefinition,
  spread: SpreadDefinition,
): CardDefinition[] {
  if (spread.id !== 'seven-planets')
    return secureShuffle(system.cards).slice(0, spread.positions.length);

  return ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].map(
    (planet) => {
      const pool = system.cards.filter((card) => card.domain === planet);
      return pool[secureIndex(pool.length)];
    },
  );
}

function divineDraws(
  system: SystemDefinition,
  spread: SpreadDefinition,
): CardDefinition[] {
  const sourceOrder = Array.from(
    new Set(
      system.cards
        .map((card) => card.sourceSystem)
        .filter((slug): slug is NonNullable<typeof slug> => Boolean(slug)),
    ),
  );

  return sourceOrder.slice(0, spread.positions.length).map((sourceSystem) => {
    const pool = system.cards.filter(
      (card) => card.sourceSystem === sourceSystem,
    );
    return pool[secureIndex(pool.length)];
  });
}

export function drawCards(
  system: SystemDefinition,
  spread: SpreadDefinition,
  allowReversals: boolean,
): DrawnCard[] {
  const picked =
    system.slug === 'divine'
      ? divineDraws(system, spread)
      : system.slug === 'zodiac'
        ? zodiacDraws(system, spread)
        : system.slug === 'belline'
          ? bellineDraws(system, spread)
          : secureShuffle(system.cards).slice(0, spread.positions.length);

  return picked.map((card, index) => ({
    card,
    position: spread.positions[index],
    reversed:
      allowReversals && Boolean(card.reversedMeaning) && secureIndex(100) < 35,
  }));
}

const focusLenses: Record<Focus, string> = {
  general: 'Looking at your life as a whole',
  love: 'In relationships',
  work: 'In work and practical matters',
  growth: 'For personal growth',
};

type CardReadingSlug = Exclude<
  SystemSlug,
  'divine' | 'magic-8-ball' | 'fortune-cookie'
>;

interface MethodVoice {
  overview: string;
  sequence: string;
  single: string;
  closing: string;
}

const METHOD_VOICES: Record<CardReadingSlug, MethodVoice> = {
  tarot: {
    overview:
      'Tarot considers each card’s traditional theme, suit, number, element, and orientation.',
    sequence:
      'Read the cards from first to last; each position shows how the situation develops.',
    single:
      'Use this card to name the main theme before deciding how to respond.',
    closing:
      'Choose one action that reflects the final card without treating it as a prediction.',
  },
  oracle: {
    overview:
      'Oracle cards are read through images, associations, and your first response to them.',
    sequence:
      'Notice which images repeat, contrast, or change the feeling of the cards around them.',
    single:
      'Return to the first detail that caught your attention before you tried to explain it.',
    closing:
      'Keep the image that remains vivid and ask what it brings to mind.',
  },
  lenormand: {
    overview:
      'Lenormand starts with each symbol’s literal subject, then uses nearby cards and timing to add context.',
    sequence:
      'Read the nearest pairs first; cards beside one another have the strongest connection.',
    single: 'Treat the symbol literally before expanding it into metaphor.',
    closing:
      'Focus on the clearest event, person, or action named by the cards.',
  },
  spellcraft: {
    overview:
      'Ritual cards turn an intention into something practical: an object, boundary, gesture, or repeated act.',
    sequence:
      'Move from what you want to the material and boundary that can support one finishable action.',
    single: 'Give the intention one physical form and one finishable act.',
    closing:
      'Complete the smallest honest action, then consider the ritual finished.',
  },
  'ancient-egypt': {
    overview:
      'Temple is a modern oracle that reflects on historical Egyptian images of balance, passage, protection, and renewal.',
    sequence:
      'Follow what the cards ask you to offer, weigh, protect, release, and carry forward.',
    single:
      'Begin with the image’s historical context before giving it a personal meaning.',
    closing:
      'Keep what restores balance without treating the historical image as a certain prediction.',
  },
  zodiac: {
    overview:
      'In this deck, signs describe how something happens, planets describe the drive behind it, and houses show the area of life involved.',
    sequence:
      'Combine the sign, planet, and house first, then use any remaining cards for challenge and advice.',
    single:
      'Ask where this quality is already visible instead of treating it as fate.',
    closing:
      'Respond to what is present while keeping the final choice in your hands.',
  },
  kipper: {
    overview:
      'Kipper uses scenes of people, places, work, travel, and money to describe an everyday situation.',
    sequence:
      'Identify the main person or situation, then see how the nearby scenes help or complicate it.',
    single:
      'Ask which real person, place, role, or circumstance the scene resembles.',
    closing:
      'Respond to the practical situation, especially where responsibility is clear.',
  },
  belline: {
    overview:
      'Belline pairs a named event with one of seven classical planetary influences.',
    sequence:
      'Notice how each planet changes the pace, mood, or likely effect of its event.',
    single: 'Read the event and its planet together.',
    closing:
      'Let the final planet suggest where to focus, not what must happen.',
  },
  'playing-card-cartomancy': {
    overview:
      'Playing-card cartomancy combines suit and rank to describe a practical situation.',
    sequence:
      'The suit names the area of life and the rank describes what is happening there. Repeated suits add emphasis.',
    single:
      'Read the rank as the event and the suit as the area of life it affects.',
    closing:
      'Choose a practical next step that fits both the rank and the suit.',
  },
  sibilla: {
    overview:
      'Sibilla uses named scenes from everyday life, with reversed cards showing a blocked or complicated version of the scene.',
    sequence:
      'Treat the center card as the turning point; earlier cards give context and later cards show the response.',
    single: 'Hear the scene as one complete statement about ordinary life.',
    closing:
      'Use the final scene to identify the most direct response available.',
  },
  'runic-cards': {
    overview:
      'Runic Cards begin with each Elder Futhark character’s reconstructed name and literal image, then offer a modern reflection.',
    sequence:
      'Read the runes as what shaped the situation, what is active now, and what may be developing.',
    single:
      'Begin with the rune’s name and literal image before applying it personally.',
    closing:
      'Treat the final lesson as a modern reflection, not recovered ancient doctrine.',
  },
  'i-ching-cards': {
    overview:
      'I Ching Cards present the King Wen hexagrams as fixed cards; they do not simulate a changing-line casting.',
    sequence:
      'Read the cards as the current condition, a useful response, and the change that may follow.',
    single:
      'Treat the hexagram as a description of the present and ask what response fits it.',
    closing:
      'Let the final figure guide your conduct, remembering that no changing lines were cast.',
  },
  'fal-e-hafez': {
    overview:
      'Fal-e Hafez Cards use original poetic motifs inspired by bibliomancy; they do not quote or translate Hafez.',
    sequence:
      'Read the first image as the omen and the next as a second image that clarifies or challenges it.',
    single:
      'Place the poetic image beside your question without treating it as a literal prediction.',
    closing:
      'Keep the image that opens a useful line of thought without claiming that it speaks for the poet.',
  },
  hanafuda: {
    overview:
      'Hanafuda combines month, flower, pictured motif, and card class in a modern seasonal reflection.',
    sequence:
      'Follow the months from beginning through fullness and release, noting which card classes carry the most emphasis.',
    single: 'Let the flower and month describe the climate around the matter.',
    closing:
      'Let the final month suggest an appropriate pace for your next step.',
  },
  zigeunerkarten: {
    overview:
      'Zigeunerkarten use concrete people, events, resources, hopes, and setbacks to describe an everyday situation.',
    sequence:
      'Read neighboring cards together, then look for repeated subjects and difficult cards that change the message.',
    single: 'Name the person, event, or condition as plainly as possible.',
    closing:
      'Follow the practical development shown by the final card rather than treating it as destiny.',
  },
  'ilm-al-raml': {
    overview:
      'ʿIlm al-Raml Cards present the sixteen traditional figures for study without calculating a full shield chart.',
    sequence:
      'Compare the four figures’ patterns and traditional qualities; no Witnesses or Judge have been calculated.',
    single:
      'Study the figure’s pattern and traditional quality before applying it to the question.',
    closing:
      'Use the final figure as a reflection while keeping this card draw distinct from a full geomantic chart.',
  },
};

function methodVoice(system: SystemDefinition): MethodVoice | null {
  if (
    system.slug === 'divine' ||
    system.slug === 'magic-8-ball' ||
    system.slug === 'fortune-cookie'
  )
    return null;
  return METHOD_VOICES[system.slug];
}

function cardText(_system: SystemDefinition, draw: DrawnCard): string {
  const base =
    draw.reversed && draw.card.reversedMeaning
      ? draw.card.reversedMeaning
      : draw.card.meaning;
  const introduction = draw.card.sourceSystemName
    ? `For ${draw.position.toLowerCase()}, ${draw.card.sourceSystemName} contributes ${draw.card.name}${draw.reversed ? ' reversed' : ''}.`
    : `In the ${draw.position.toLowerCase()} position, ${draw.card.name}${draw.reversed ? ' reversed' : ''} points to ${draw.card.keywords[0]}.`;

  return `${introduction} ${base}`;
}

function cardReference(draw: DrawnCard): string {
  return draw.card.sourceSystemName
    ? `${draw.card.sourceSystemName}’s ${draw.card.name}`
    : draw.card.name;
}

function meaningFor(draw: DrawnCard): string {
  return draw.reversed && draw.card.reversedMeaning
    ? draw.card.reversedMeaning
    : draw.card.meaning;
}

function firstSentence(value: string): string {
  return value.match(/^[^.!?]+[.!?]?/u)?.[0].trim() ?? value;
}

function drawSummary(draw: DrawnCard): string {
  return `${draw.position}: ${cardReference(draw)}${draw.reversed ? ' reversed' : ''}. ${firstSentence(meaningFor(draw))}`;
}

function connectionMeaning(from: DrawnCard, to: DrawnCard): string {
  const sharedKeyword = from.card.keywords.find((keyword) =>
    to.card.keywords.includes(keyword),
  );
  if (sharedKeyword)
    return `${cardReference(from)} and ${cardReference(to)} both point to ${sharedKeyword}`;
  if (from.card.element && from.card.element === to.card.element)
    return `${cardReference(from)} and ${cardReference(to)} share the ${from.card.element} association, linking ${from.card.keywords[0]} with ${to.card.keywords[0]}`;
  if (from.card.polarity === 'challenging' && to.card.polarity === 'positive')
    return `${cardReference(to)} offers a constructive response to the difficulty in ${cardReference(from)}, moving from ${from.card.keywords[0]} toward ${to.card.keywords[0]}`;
  if (from.card.polarity === 'positive' && to.card.polarity === 'challenging')
    return `${cardReference(to)} complicates the promise of ${cardReference(from)}, shifting the focus from ${from.card.keywords[0]} to ${to.card.keywords[0]}`;
  if (from.card.domain && from.card.domain === to.card.domain)
    return `${cardReference(from)} and ${cardReference(to)} both concern ${from.card.domain}, moving from ${from.card.keywords[0]} toward ${to.card.keywords[0]}`;
  return `${cardReference(from)} introduces ${from.card.keywords[0]}, and ${cardReference(to)} shifts the emphasis to ${to.card.keywords[0]}`;
}

function spreadSynthesis(
  system: SystemDefinition,
  draws: DrawnCard[],
  focus: Focus,
): string {
  const last = draws.at(-1)!;
  const voice = methodVoice(system);
  const summarizedDraws =
    draws.length <= 5 ? draws : [draws[0], draws[1], draws.at(-1)!];
  const omitted =
    draws.length > summarizedDraws.length
      ? `The ${draws.length - summarizedDraws.length} cards between them add detail in the full reading.`
      : '';
  const methodGuidance =
    voice?.sequence ??
    'Treat the links between decks as possible relationships, not fixed conclusions.';

  return `${summarizedDraws.map(drawSummary).join(' ')} ${omitted} ${methodGuidance} ${focusLenses[focus]}, give the final position extra weight: ${cardReference(last)} emphasizes ${last.card.keywords[0]}.`;
}

const lenormandExceptions: Record<string, string> = {
  'Clouds|Sun': 'confusion breaks and the outcome turns favorable',
  'Coffin|Scythe': 'an ending is immediate and should not be negotiated',
  'Heart|Ring': 'affection becomes an explicit bond or promise',
  'Key|Ring': 'an agreement is certain and consequential',
  'Letter|Rider': 'news arrives quickly in written form',
  'Mice|Ring': 'a commitment is being eroded by small repeated losses',
  'Ship|Stork': 'relocation or long-distance change gathers momentum',
};

export function lenormandPairText(
  left: CardDefinition,
  right: CardDefinition,
): string {
  const key = [left.name, right.name].sort().join('|');
  const exception = lenormandExceptions[key];
  if (exception) return exception;
  const pressure =
    left.polarity === 'challenging' || right.polarity === 'challenging'
      ? 'the combination points to a complication or delay'
      : left.polarity === 'positive' || right.polarity === 'positive'
        ? 'the combination is supportive'
        : 'the second symbol changes the first';
  return `${left.subject ?? left.keywords[0]} appears with ${right.subject ?? right.keywords[0]}; ${pressure}`;
}

export function interpretReading(
  system: SystemDefinition,
  spread: SpreadDefinition,
  draws: DrawnCard[],
  focus: Focus,
  headlineVariant = '',
): InterpretationBlock {
  const first = draws[0];
  const last = draws[draws.length - 1];
  const voice = methodVoice(system);
  const keywords = Array.from(
    new Set(draws.map((draw) => draw.card.keywords[0])),
  ).slice(0, 4);
  const connections =
    system.slug === 'divine'
      ? draws.slice(0, -1).map((draw, index) => {
          const next = draws[index + 1];
          return {
            from: `${draw.card.sourceSystemName} · ${draw.card.name}`,
            to: `${next.card.sourceSystemName} · ${next.card.name}`,
            text: connectionMeaning(draw, next),
          };
        })
      : undefined;
  const positions = draws.map((draw, index) => {
    let text = cardText(system, draw);
    if (system.slug === 'lenormand') {
      const neighborIndexes =
        spread.id === 'grand-tableau'
          ? [index - 8, index - 1, index + 1, index + 8].filter(
              (neighborIndex) => {
                if (neighborIndex < 0 || neighborIndex >= draws.length)
                  return false;
                if (neighborIndex === index - 1 || neighborIndex === index + 1)
                  return (
                    Math.floor(neighborIndex / 8) === Math.floor(index / 8)
                  );
                return true;
              },
            )
          : [index - 1, index + 1].filter(
              (neighborIndex) =>
                neighborIndex >= 0 && neighborIndex < draws.length,
            );
      const neighbors = neighborIndexes.map(
        (neighborIndex) => draws[neighborIndex],
      );
      const relationship = neighbors
        .map((neighbor) => lenormandPairText(draw.card, neighbor.card))
        .join('; ');
      const house =
        spread.id === 'grand-tableau'
          ? spread.positions[index].replace('House of ', '')
          : null;
      text += `${house ? ` In the house of ${house}, ${draw.card.name} places ${draw.card.subject} inside that domain.` : ''}${relationship ? ` Nearest neighbors: ${relationship}.` : ''} Timing: ${draw.card.timing}.`;
    }
    return {
      label: draw.position,
      card: `${draw.card.sourceSystemName ? `${draw.card.sourceSystemName} · ` : ''}${draw.card.name}${draw.reversed ? ' · reversed' : ''}`,
      text,
    };
  });

  let synthesis =
    draws.length > 1
      ? spreadSynthesis(system, draws, focus)
      : `${first.card.name} centers the reading on ${first.card.keywords[0]}. ${voice?.single ?? `Its second theme, ${first.card.keywords[1] ?? first.card.keywords[0]}, adds context.`} ${focusLenses[focus]}, ask where this is already visible and what small response is possible now.`;
  if (system.slug === 'lenormand' && draws.length > 1) {
    const links = draws
      .slice(0, Math.min(draws.length - 1, 8))
      .map(
        (draw, index) =>
          `${draw.card.name} with ${draws[index + 1].card.name}: ${lenormandPairText(draw.card, draws[index + 1].card)}`,
      );
    synthesis = `${links.join('. ')}. Give the nearest pairs the most weight; cards farther away add background context.`;
  }
  if (spread.id === 'grand-tableau') {
    synthesis += ` ${draws[0].card.name} in the first house sets the opening tone. The final row—${draws[32].card.name}, ${draws[33].card.name}, ${draws[34].card.name}, and ${draws[35].card.name}—shows how the situation may conclude.`;
  }

  if (
    system.slug === 'zodiac' &&
    (spread.id === 'celestial-triad' || spread.id === 'celestial-pattern')
  ) {
    const sign = draws.find((draw) => draw.card.domain === 'sign');
    const planet = draws.find((draw) => draw.card.domain === 'planet');
    const house = draws.find((draw) => draw.card.domain === 'house');
    if (sign && planet && house) {
      const additions = draws
        .filter((draw) => draw !== sign && draw !== planet && draw !== house)
        .map(
          (draw) =>
            `${cardReference(draw)} adds ${draw.card.keywords[0]} in ${draw.position}`,
        );
      synthesis = `${cardReference(sign)} describes how the situation unfolds: ${sign.card.keywords[0]}. ${cardReference(planet)} describes the drive behind it: ${planet.card.keywords[0]}. ${cardReference(house)} points to the area of life involved: ${house.card.keywords[0]}. ${additions.length ? `${additions.join('; ')}. ` : ''}${focusLenses[focus]}, treat this as a perspective on the present, not predetermined fate.`;
    }
  }

  if (system.slug === 'belline' && spread.id === 'seven-planets') {
    synthesis = `${draws
      .map(
        (draw) =>
          `${draw.card.domain}: ${cardReference(draw)} points to ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}. Repeated planetary families add emphasis, while each change of planet changes the mood or pace. ${focusLenses[focus]}, use the final Saturn position to identify what needs structure or a firm boundary.`;
  }

  if (system.slug === 'sibilla' && draws.length >= 3) {
    const hinge = draws[Math.floor(draws.length / 2)];
    synthesis = `${cardReference(first)} opens with ${first.card.keywords[0]}; ${draws
      .slice(1, -1)
      .map(
        (draw) =>
          `${cardReference(draw)}${draw === hinge ? ' is the turning point' : ' adds context'} through ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}; ${cardReference(last)} closes with ${last.card.keywords[0]}. ${focusLenses[focus]}, consider the turning-point card before responding to the final one.`;
  }

  if (system.slug === 'i-ching-cards' && draws.length > 1) {
    synthesis = `${draws
      .map(
        (draw) =>
          `${cardReference(draw)} in ${draw.position} describes ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}. Together, the cards suggest how your response may need to change from one condition to the next. They do not create changing lines. ${focusLenses[focus]}, let the last figure guide your conduct rather than promise an outcome.`;
  }

  if (system.slug === 'fal-e-hafez' && draws.length > 1) {
    synthesis = `${cardReference(first)} offers the first image: ${first.card.keywords[0]}. ${draws
      .slice(1)
      .map(
        (draw) =>
          `${cardReference(draw)} adds the image of ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}. Place these contemporary images beside the question, but do not treat them as quotations or a substitute for opening the Divān.`;
  }

  if (system.slug === 'ilm-al-raml' && draws.length > 1) {
    synthesis = `${draws
      .map(
        (draw) =>
          `${draw.position}: ${cardReference(draw)} (${draw.card.glyph}) points to ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}. Compare these four Mothers as a modern figure study. No Daughters, Nieces, Witnesses, or Judge have been calculated, so this is not a complete shield chart.`;
  }

  return {
    headline: openingHeroHeadline(
      system,
      spread,
      draws,
      focus,
      headlineVariant,
    ),
    overview:
      system.slug === 'divine'
        ? `This reading draws one card from each of the sixteen decks. It begins with ${cardReference(first)} and ends with ${cardReference(last)}. Read each card on its own, then use the cross-deck links as prompts for reflection rather than fixed conclusions.`
        : `${voice?.overview ?? `${system.name} reads symbols in relation to one another.`} ${spread.name} drew ${draws.length === 1 ? 'one card' : `${draws.length} cards`}, with themes including ${keywords.join(', ')}. ${system.instruction} Use the result for reflection, not as a fixed prediction.`,
    positions,
    synthesis,
    closing:
      system.slug === 'divine'
        ? `The final card emphasizes ${last.card.keywords[0]}. Notice which earlier card makes that message more specific, then choose one grounded next step.`
        : (voice?.closing ??
          `Let ${last.card.keywords[0]} inform one practical next step.`),
    connections,
  };
}

export function drawBallAnswer(): string {
  return BALL_ANSWERS[secureIndex(BALL_ANSWERS.length)];
}

export function drawFortune(): {
  fortune: string;
  reflectionPrompt: string;
  numbers: number[];
} {
  const fortuneIndex = secureIndex(FORTUNES.length);
  const pool = secureShuffle(
    Array.from({ length: 49 }, (_, index) => index + 1),
  );
  return {
    fortune: FORTUNES[fortuneIndex],
    reflectionPrompt:
      FORTUNE_PROMPTS[Math.floor(fortuneIndex / FORTUNE_PROMPTS.length)],
    numbers: pool.slice(0, 6).sort((a, b) => a - b),
  };
}

export function objectInterpretation(
  system: SystemDefinition,
  message: string,
  focus: Focus,
  reflectionPrompt?: string,
): InterpretationBlock {
  return {
    headline: message,
    overview: `${focusLenses[focus]}, notice your first reaction to the answer—relief, resistance, or surprise. It may reveal what you hoped to hear.`,
    positions: [
      {
        label: system.kind === 'ball' ? 'The answer' : 'The fortune',
        card: system.name,
        text: message,
      },
    ],
    synthesis:
      'Chance supplied an answer; you still decide what to do with it.',
    closing:
      'Keep it if it makes the choice clearer. Ignore it if it only adds confusion.',
    reflectionPrompt,
  };
}

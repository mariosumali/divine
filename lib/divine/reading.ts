import { BALL_ANSWERS, FORTUNES, FORTUNE_PROMPTS } from './systems';
import type {
  CardDefinition,
  DrawnCard,
  Focus,
  InterpretationBlock,
  SpreadDefinition,
  SystemDefinition,
} from './types';

export const OBJECT_RITUAL_STEPS = 3;
export const COOKIE_RITUAL_STEPS = 4;

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
  return [system.cards[secureIndex(system.cards.length)]];
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
  general: 'Across the whole field of your life',
  love: 'In love and the bonds surrounding you',
  work: 'In work, craft, and material direction',
  growth: 'In the self you are becoming',
};

function cardText(draw: DrawnCard, focus: Focus): string {
  const base =
    draw.reversed && draw.card.reversedMeaning
      ? draw.card.reversedMeaning
      : draw.card.meaning;
  const modifier = draw.card.focusModifiers?.[focus];
  const orientation = draw.reversed
    ? `Reversed, ${draw.card.name} shows ${draw.card.keywords[0]} turned inward, delayed, or expressed through its more difficult edge.`
    : `${draw.card.name} is upright, so its theme of ${draw.card.keywords[0]} is available to meet directly and use deliberately.`;
  const qualities = [
    draw.card.domain ? `its ${draw.card.domain} domain` : null,
    draw.card.element ? `${draw.card.element} element` : null,
    typeof draw.card.numerology === 'number'
      ? `number ${draw.card.numerology}`
      : null,
  ].filter((quality): quality is string => Boolean(quality));
  const texture = qualities.length
    ? `Its structure adds context through ${qualities.length === 1 ? qualities[0] : `${qualities.slice(0, -1).join(', ')} and ${qualities.at(-1)}`}.`
    : `Its supporting theme of ${draw.card.keywords[1] ?? draw.card.keywords[0]} shows how the central message may appear in lived experience.`;

  const introduction = draw.card.sourceSystemName
    ? `${draw.card.sourceSystemName} gives ${draw.card.name} to ${draw.position.toLowerCase()}.`
    : `${draw.position} is the part of the spread through which ${draw.card.name} speaks.`;

  return `${introduction} ${focusLenses[focus]}, ${base.charAt(0).toLowerCase()}${base.slice(1)} ${orientation} ${texture}${modifier ? ` ${modifier}` : ''}`;
}

function cardReference(draw: DrawnCard): string {
  return draw.card.sourceSystemName
    ? `${draw.card.sourceSystemName}’s ${draw.card.name}`
    : draw.card.name;
}

function transitionVerb(from: DrawnCard, to: DrawnCard): string {
  if (to.card.polarity === 'challenging') return 'tests';
  if (from.card.polarity === 'challenging' && to.card.polarity === 'positive')
    return 'begins to resolve';
  if (to.card.polarity === 'positive') return 'supports and opens';
  if (from.card.domain && from.card.domain === to.card.domain) return 'deepens';
  return 'redirects';
}

function connectionMeaning(from: DrawnCard, to: DrawnCard): string {
  const sharedKeyword = from.card.keywords.find((keyword) =>
    to.card.keywords.includes(keyword),
  );
  if (sharedKeyword)
    return `${cardReference(from)} echoes ${sharedKeyword} inside ${cardReference(to)}, making that repeated theme difficult to ignore`;
  if (from.card.element && from.card.element === to.card.element)
    return `${cardReference(from)} and ${cardReference(to)} share the ${from.card.element} element, so ${from.card.keywords[0]} feeds ${to.card.keywords[0]} without changing its essential language`;
  if (from.card.polarity === 'challenging' && to.card.polarity === 'positive')
    return `${cardReference(to)} answers the friction of ${cardReference(from)}, turning ${from.card.keywords[0]} toward ${to.card.keywords[0]}`;
  if (from.card.polarity === 'positive' && to.card.polarity === 'challenging')
    return `${cardReference(to)} tests the promise in ${cardReference(from)}, asking whether ${from.card.keywords[0]} can remain intact under ${to.card.keywords[0]}`;
  if (from.card.domain && from.card.domain === to.card.domain)
    return `${cardReference(to)} deepens the shared ${from.card.domain} domain, carrying ${from.card.keywords[0]} into ${to.card.keywords[0]}`;
  return `${cardReference(from)} passes ${from.card.keywords[0]} forward, and ${cardReference(to)} translates it into ${to.card.keywords[0]}`;
}

function cardConnectionText(draws: DrawnCard[], index: number): string {
  if (draws.length < 2) return '';
  const current = draws[index];
  const previous = draws[index - 1];
  const next = draws[index + 1];
  const incoming = previous
    ? `The incoming connection is clear: ${connectionMeaning(previous, current)}.`
    : `${cardReference(current)} establishes ${current.card.keywords[0]} as the starting condition for the rest of the spread.`;
  const outgoing = next
    ? `From here, ${connectionMeaning(current, next)}.`
    : `${cardReference(current)} gathers every preceding position into ${current.card.keywords[0]}, making this the direction in which the pattern settles.`;
  return `${incoming} ${outgoing}`;
}

function spreadSynthesis(draws: DrawnCard[], focus: Focus): string {
  const [first, ...rest] = draws;
  const opening = `${cardReference(first)} begins in ${first.position}, establishing ${first.card.keywords[0]} as the reading's first condition.`;
  const movement = rest.map((draw, index) => {
    const previous = draws[index];
    const isLast = index === rest.length - 1;
    return `${isLast ? 'Finally' : 'Then'}, ${cardReference(draw)} in ${draw.position} ${transitionVerb(previous, draw)} ${previous.card.keywords[0]} with ${draw.card.keywords[0]}.`;
  });
  const consequence = `${focusLenses[focus]}, the sequence asks you to carry what ${cardReference(first)} reveals through every intervening position before acting on the ${draws.at(-1)!.card.keywords[0]} of ${cardReference(draws.at(-1)!)}; no card stands alone, and no deck stands apart from that conclusion.`;
  return [opening, ...movement, consequence].join(' ');
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
      ? 'must pass through friction'
      : left.polarity === 'positive' || right.polarity === 'positive'
        ? 'receives support'
        : 'changes direction';
  return `${left.subject ?? left.keywords[0]} meets ${right.subject ?? right.keywords[0]} and ${pressure}`;
}

export function interpretReading(
  system: SystemDefinition,
  spread: SpreadDefinition,
  draws: DrawnCard[],
  focus: Focus,
): InterpretationBlock {
  const first = draws[0];
  const last = draws[draws.length - 1];
  const keywords = Array.from(
    new Set(draws.flatMap((draw) => draw.card.keywords)),
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
    let text = cardText(draw, focus);
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
    } else {
      const connection = cardConnectionText(draws, index);
      if (connection) text += ` ${connection}`;
    }
    return {
      label: draw.position,
      card: `${draw.card.sourceSystemName ? `${draw.card.sourceSystemName} · ` : ''}${draw.card.name}${draw.reversed ? ' · reversed' : ''}`,
      text,
    };
  });

  let synthesis =
    draws.length > 1
      ? spreadSynthesis(draws, focus)
      : `${first.card.name} concentrates the reading around ${first.card.keywords[0]}. Its secondary theme of ${first.card.keywords[1] ?? first.card.keywords[0]} describes how that message is likely to become visible. ${focusLenses[focus]}, the decisive act is to let ${keywords[0]} shape what happens next without using certainty as a condition.`;
  if (system.slug === 'lenormand' && draws.length > 1) {
    const links = draws
      .slice(0, Math.min(draws.length - 1, 8))
      .map(
        (draw, index) =>
          `${draw.card.name} with ${draws[index + 1].card.name}: ${lenormandPairText(draw.card, draws[index + 1].card)}`,
      );
    synthesis = `${links.join('. ')}. The nearest symbols carry the greatest force; the outer field describes what follows.`;
  }
  if (spread.id === 'grand-tableau') {
    synthesis += ` ${draws[0].card.name} in the first house sets the tone, while ${draws[32].card.name}, ${draws[33].card.name}, ${draws[34].card.name}, and ${draws[35].card.name} form the closing fate line.`;
  }

  return {
    headline:
      system.slug === 'divine'
        ? 'Sixteen voices become one pattern.'
        : `${first.card.name} opens the way.`,
    overview:
      system.slug === 'divine'
        ? `One card from every deck has entered the field around ${keywords.join(', ')}. The Whole Constellation moves from ${cardReference(first)} to ${cardReference(last)}, with each tradition translating what the previous one began. Read the individual voices, then follow the cross-deck thread that holds them together.`
        : `${system.name} has arranged ${draws.length === 1 ? 'one concentrated signal' : `${draws.length} distinct signals`} around ${keywords.join(', ')}. ${spread.name} gives each symbol a specific job, so its position matters as much as its familiar meaning. The answer is not a fixed prediction; it is a pattern asking for attention, choice, and movement.`,
    positions,
    synthesis,
    closing:
      system.slug === 'divine'
        ? `Carry ${last.card.keywords[0]} forward, but remember how every deck changed its meaning on the way. The constellation is complete; your next choice is where it becomes real.`
        : `Carry ${last.card.keywords[0]} into the next decision. The reading has ended; its consequence begins with you.`,
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
    overview: `${focusLenses[focus]}, chance has answered without qualification. Notice whether relief or resistance arrived first; that reaction is part of the message.`,
    positions: [
      {
        label: system.kind === 'ball' ? 'The answer' : 'The fortune',
        card: system.name,
        text: message,
      },
    ],
    synthesis:
      'The object has done its work. What remains is the decision you were hoping it would make for you.',
    closing:
      'Keep the sentence if it sharpens your direction. Leave it if it only deepens the fog.',
    reflectionPrompt,
  };
}

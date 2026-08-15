import { BALL_ANSWERS, FORTUNES, FORTUNE_PROMPTS } from './systems';
import type { CardDefinition, DrawnCard, Focus, InterpretationBlock, SpreadDefinition, SystemDefinition } from './types';

export const OBJECT_RITUAL_STEPS = 3;

export function nextObjectRitualStep(current: number): number {
  return Math.min(OBJECT_RITUAL_STEPS, Math.max(0, Math.floor(current)) + 1);
}

export function secureIndex(max: number): number {
  if (max <= 0) return 0;
  const ceiling = Math.floor(0x1_0000_0000 / max) * max;
  const data = new Uint32Array(1);
  do crypto.getRandomValues(data); while (data[0] >= ceiling);
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

function zodiacDraws(system: SystemDefinition, spread: SpreadDefinition): CardDefinition[] {
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
    return [...anchors, ...secureShuffle(system.cards.filter((card) => !anchorIds.has(card.id))).slice(0, 2)];
  }
  return [system.cards[secureIndex(system.cards.length)]];
}

export function drawCards(system: SystemDefinition, spread: SpreadDefinition, allowReversals: boolean): DrawnCard[] {
  const picked = system.slug === 'zodiac'
    ? zodiacDraws(system, spread)
    : secureShuffle(system.cards).slice(0, spread.positions.length);

  return picked.map((card, index) => ({
    card,
    position: spread.positions[index],
    reversed: allowReversals && Boolean(card.reversedMeaning) && secureIndex(100) < 35,
  }));
}

const focusLenses: Record<Focus, string> = {
  general: 'Across the whole field of your life',
  love: 'In love and the bonds surrounding you',
  work: 'In work, craft, and material direction',
  growth: 'In the self you are becoming',
};

function cardText(draw: DrawnCard, focus: Focus): string {
  const base = draw.reversed && draw.card.reversedMeaning ? draw.card.reversedMeaning : draw.card.meaning;
  const modifier = draw.card.focusModifiers?.[focus];
  return `${focusLenses[focus]}, ${base.charAt(0).toLowerCase()}${base.slice(1)}${modifier ? ` ${modifier}` : ''}`;
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

export function lenormandPairText(left: CardDefinition, right: CardDefinition): string {
  const key = [left.name, right.name].sort().join('|');
  const exception = lenormandExceptions[key];
  if (exception) return exception;
  const pressure = left.polarity === 'challenging' || right.polarity === 'challenging'
    ? 'must pass through friction'
    : left.polarity === 'positive' || right.polarity === 'positive' ? 'receives support' : 'changes direction';
  return `${left.subject ?? left.keywords[0]} meets ${right.subject ?? right.keywords[0]} and ${pressure}`;
}

export function interpretReading(system: SystemDefinition, spread: SpreadDefinition, draws: DrawnCard[], focus: Focus): InterpretationBlock {
  const first = draws[0];
  const last = draws[draws.length - 1];
  const keywords = Array.from(new Set(draws.flatMap((draw) => draw.card.keywords))).slice(0, 4);
  const positions = draws.map((draw, index) => {
    let text = cardText(draw, focus);
    if (system.slug === 'lenormand') {
      const neighborIndexes = spread.id === 'grand-tableau'
        ? [index - 8, index - 1, index + 1, index + 8].filter((neighborIndex) => {
            if (neighborIndex < 0 || neighborIndex >= draws.length) return false;
            if (neighborIndex === index - 1 || neighborIndex === index + 1) return Math.floor(neighborIndex / 8) === Math.floor(index / 8);
            return true;
          })
        : [index - 1, index + 1].filter((neighborIndex) => neighborIndex >= 0 && neighborIndex < draws.length);
      const neighbors = neighborIndexes.map((neighborIndex) => draws[neighborIndex]);
      const relationship = neighbors.map((neighbor) => lenormandPairText(draw.card, neighbor.card)).join('; ');
      const house = spread.id === 'grand-tableau' ? spread.positions[index].replace('House of ', '') : null;
      text += `${house ? ` In the house of ${house}, ${draw.card.name} places ${draw.card.subject} inside that domain.` : ''}${relationship ? ` Nearest neighbors: ${relationship}.` : ''} Timing: ${draw.card.timing}.`;
    }
    return {
      label: draw.position,
      card: `${draw.card.name}${draw.reversed ? ' · reversed' : ''}`,
      text,
    };
  });

  let synthesis = `The pattern moves from ${first.card.keywords[0]} toward ${last.card.keywords[0]}. ${focusLenses[focus]}, the decisive act is to let ${keywords[0]} shape what happens next without using certainty as a condition.`;
  if (system.slug === 'lenormand' && draws.length > 1) {
    const links = draws.slice(0, Math.min(draws.length - 1, 8)).map((draw, index) => `${draw.card.name} with ${draws[index + 1].card.name}: ${lenormandPairText(draw.card, draws[index + 1].card)}`);
    synthesis = `${links.join('. ')}. The nearest symbols carry the greatest force; the outer field describes what follows.`;
  }
  if (spread.id === 'grand-tableau') {
    synthesis += ` ${draws[0].card.name} in the first house sets the tone, while ${draws[32].card.name}, ${draws[33].card.name}, ${draws[34].card.name}, and ${draws[35].card.name} form the closing fate line.`;
  }

  return {
    headline: `${first.card.name} opens the way.`,
    overview: `${system.name} has arranged ${draws.length === 1 ? 'one unmistakable signal' : `${draws.length} signals`} around ${keywords.join(', ')}. The answer is not neutral: it asks for movement.`,
    positions,
    synthesis,
    closing: `Carry ${last.card.keywords[0]} into the next decision. The reading has ended; its consequence begins with you.`,
  };
}

export function drawBallAnswer(): string {
  return BALL_ANSWERS[secureIndex(BALL_ANSWERS.length)];
}

export function drawFortune(): { fortune: string; reflectionPrompt: string; numbers: number[] } {
  const fortuneIndex = secureIndex(FORTUNES.length);
  const pool = secureShuffle(Array.from({ length: 49 }, (_, index) => index + 1));
  return {
    fortune: FORTUNES[fortuneIndex],
    reflectionPrompt: FORTUNE_PROMPTS[Math.floor(fortuneIndex / FORTUNE_PROMPTS.length)],
    numbers: pool.slice(0, 6).sort((a, b) => a - b),
  };
}

export function objectInterpretation(system: SystemDefinition, message: string, focus: Focus, reflectionPrompt?: string): InterpretationBlock {
  return {
    headline: message,
    overview: `${focusLenses[focus]}, chance has answered without qualification. Notice whether relief or resistance arrived first; that reaction is part of the message.`,
    positions: [{ label: system.kind === 'ball' ? 'The answer' : 'The fortune', card: system.name, text: message }],
    synthesis: 'The object has done its work. What remains is the decision you were hoping it would make for you.',
    closing: 'Keep the sentence if it sharpens your direction. Leave it if it only deepens the fog.',
    reflectionPrompt,
  };
}

import { BALL_ANSWERS, FORTUNES } from './systems';
import type { CardDefinition, DrawnCard, Focus, InterpretationBlock, SpreadDefinition, SystemDefinition } from './types';

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
    return [
      sign[secureIndex(sign.length)],
      planet[secureIndex(planet.length)],
      house[secureIndex(house.length)],
      ...secureShuffle(system.cards).filter((card, index, all) => all.findIndex((item) => item.id === card.id) === index).slice(0, 2),
    ];
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
  return `${focusLenses[focus]}, ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
}

export function interpretReading(system: SystemDefinition, spread: SpreadDefinition, draws: DrawnCard[], focus: Focus): InterpretationBlock {
  const first = draws[0];
  const last = draws[draws.length - 1];
  const keywords = Array.from(new Set(draws.flatMap((draw) => draw.card.keywords))).slice(0, 4);
  const positions = draws.map((draw) => ({
    label: draw.position,
    card: `${draw.card.name}${draw.reversed ? ' · reversed' : ''}`,
    text: cardText(draw, focus),
  }));

  let synthesis = `The pattern moves from ${first.card.keywords[0]} toward ${last.card.keywords[0]}. ${focusLenses[focus]}, the decisive act is to let ${keywords[0]} shape what happens next without using certainty as a condition.`;
  if (system.slug === 'lenormand' && draws.length > 1) {
    const links = draws.slice(0, Math.min(draws.length - 1, 8)).map((draw, index) => `${draw.card.name} modifies ${draws[index + 1].card.name}: ${draw.card.keywords[0]} changes the course of ${draws[index + 1].card.keywords[0]}`);
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

export function drawFortune(): { fortune: string; numbers: number[] } {
  const pool = secureShuffle(Array.from({ length: 49 }, (_, index) => index + 1));
  return { fortune: FORTUNES[secureIndex(FORTUNES.length)], numbers: pool.slice(0, 6).sort((a, b) => a - b) };
}

export function objectInterpretation(system: SystemDefinition, message: string, focus: Focus): InterpretationBlock {
  return {
    headline: message,
    overview: `${focusLenses[focus]}, chance has answered without qualification. Notice whether relief or resistance arrived first; that reaction is part of the message.`,
    positions: [{ label: system.kind === 'ball' ? 'The answer' : 'The fortune', card: system.name, text: message }],
    synthesis: 'The object has done its work. What remains is the decision you were hoping it would make for you.',
    closing: 'Keep the sentence if it sharpens your direction. Leave it if it only deepens the fog.',
  };
}

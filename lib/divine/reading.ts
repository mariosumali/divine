import { BALL_ANSWERS, FORTUNES, FORTUNE_PROMPTS } from './objects';
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

type CardReadingSlug = Exclude<
  SystemSlug,
  'divine' | 'magic-8-ball' | 'fortune-cookie'
>;

interface MethodVoice {
  headline: string;
  overview: string;
  sequence: string;
  single: string;
  closing: string;
}

const METHOD_VOICES: Record<CardReadingSlug, MethodVoice> = {
  tarot: {
    headline: 'turns the arc',
    overview:
      'Tarot reads the meeting of archetype, suit, number, element, and orientation.',
    sequence:
      'Read the spread as an arc: each card changes the consequence of the one before it, and no card stands alone.',
    single:
      'Let this archetype name the governing pattern before deciding how to answer it.',
    closing:
      'Turn the final archetype into an embodied choice rather than a fixed prediction.',
  },
  oracle: {
    headline: 'leaves the first image',
    overview:
      'Oracle begins with recognition: image and association carry more weight than a fixed inherited doctrine.',
    sequence:
      'Read the images as a sequence of associations, noticing what repeats, disappears, or changes emotional temperature.',
    single:
      'Stay with the first image or phrase that caught before explanation arrived.',
    closing:
      'Keep the image that remains vivid; it is the part of the reading still working.',
  },
  lenormand: {
    headline: 'begins the sentence',
    overview:
      'Lenormand is read as concrete syntax: subject, modifier, proximity, house, and timing make the message.',
    sequence:
      'Read nearest pairs first. Distance softens force, while adjacency turns separate symbols into one practical statement.',
    single: 'Treat the symbol literally before expanding it into metaphor.',
    closing:
      'Carry the clearest concrete event or action forward; Lenormand favors the observable.',
  },
  spellcraft: {
    headline: 'names the working',
    overview:
      'Ritual reads every symbol as material instruction: intention must meet an object, boundary, gesture, or repeated act.',
    sequence:
      'Translate the spread from desire into material, from material into boundary, and from boundary into an action that can be completed.',
    single: 'Give the intention one physical form and one finishable act.',
    closing:
      'Complete the smallest honest action, then let the ritual end cleanly.',
  },
  'ancient-egypt': {
    headline: 'opens the threshold',
    overview:
      'Temple reads image, passage, balance, continuity, and renewal while keeping the modern oracle distinct from ancient practice.',
    sequence:
      'Read the images as a passage through thresholds: what is offered, weighed, protected, released, and carried onward.',
    single:
      'Receive the image in its historical dignity before making it personal.',
    closing:
      'Preserve what restores balance and leave the threshold without claiming certainty from history.',
  },
  zodiac: {
    headline: 'sets the celestial tone',
    overview:
      'Zodiac uses a three-part grammar: signs describe quality, planets supply impulse, and houses locate the arena of life.',
    sequence:
      'Combine quality, impulse, and arena first; only then read the remaining cards as tension and invitation.',
    single:
      'Ask where this celestial quality is already visible rather than treating it as fate.',
    closing:
      'Work with the timing and pressure that are present while keeping choice in your hands.',
  },
  kipper: {
    headline: 'places the central scene',
    overview:
      'Kipper reads people, institutions, rooms, journeys, work, and resources as a social field shaped by proximity.',
    sequence:
      'Read who holds agency, what circumstance surrounds them, and which nearby scene changes the practical outcome.',
    single:
      'Locate the real person, place, role, or circumstance represented by the scene.',
    closing:
      'Respond to the concrete social condition, especially where responsibility and influence are visible.',
  },
  belline: {
    headline: 'brings its planet forward',
    overview:
      'Belline combines named events with seven classical planetary families, so subject and planetary tone must be read together.',
    sequence:
      'Follow the planetary relay: each family changes the speed, mood, or consequence of the event it governs.',
    single:
      'Read the named event through its planetary atmosphere rather than separating the two.',
    closing:
      'Act where the final planet concentrates its influence, without mistaking influence for inevitability.',
  },
  'playing-card-cartomancy': {
    headline: 'deals the practical signal',
    overview:
      'Playing-card cartomancy combines suit, rank, color, court, and sequence into a compact practical language.',
    sequence:
      'Let suit locate the life area and rank describe the movement; repeated suits intensify, while a suit change redirects the matter.',
    single:
      'Read the rank as movement and the suit as the place where it becomes concrete.',
    closing:
      'Make the next move proportionate to the rank and grounded in the suit’s real-world domain.',
  },
  sibilla: {
    headline: 'opens the conversation',
    overview:
      'Sibilla reads named scenes as direct social conversation, with orientation changing how each scene speaks.',
    sequence:
      'Read the center as the hinge: the scenes before it establish context and the scenes after it answer or complicate that context.',
    single: 'Hear the scene as one complete statement about ordinary life.',
    closing:
      'Answer the final scene as though it were the last clear line in a conversation.',
  },
  'runic-cards': {
    headline: 'raises the rune',
    overview:
      'Runic Cards begin with the Elder Futhark character, its reconstructed name, and literal image before moving into contemporary reflection.',
    sequence:
      'Read the runes as forces in time—what shaped the matter, what is active, and what is becoming—without inventing a lost ancient spread.',
    single:
      'Begin with the rune’s name and literal image; let reflection follow history.',
    closing:
      'Practice the rune’s lesson as a contemporary reflection, not recovered doctrine.',
  },
  'i-ching-cards': {
    headline: 'shows the shape of change',
    overview:
      'I Ching Cards present stable King Wen hexagrams as situations in motion; they do not simulate changing-line casting.',
    sequence:
      'Read condition, response, and change as successive situations, allowing each hexagram to revise the posture suggested by the last.',
    single:
      'Receive the stable figure as the present condition and ask what conduct fits it.',
    closing:
      'Meet change with the conduct the final figure asks for, while remembering that no changing lines were cast.',
  },
  'fal-e-hafez': {
    headline: 'offers the omen',
    overview:
      'Fal-e Hafez Cards use original motif cards as a transparent contemporary echo of bibliomancy, never as invented quotation.',
    sequence:
      'Let the first motif be the omen and the next the witness: image answers image before explanation settles them.',
    single:
      'Hold the poetic motif beside the question without forcing it into literal prediction.',
    closing:
      'Keep the image that enlarges the question and release any claim that the card speaks for the poet.',
  },
  hanafuda: {
    headline: 'opens the season',
    overview:
      'Hanafuda reads month, flower, motif, and card class as a contemporary seasonal reflection, distinct from the pack’s game traditions.',
    sequence:
      'Follow the seasonal arc from emergence through fullness to release, noting month changes and the intensity carried by each class.',
    single: 'Let the flower and month describe the climate around the matter.',
    closing:
      'Move with the final season’s pace rather than demanding growth outside its proper time.',
  },
  zigeunerkarten: {
    headline: 'sets the event in motion',
    overview:
      'Zigeunerkarten read concrete people, events, resources, hopes, and setbacks as adjoining parts of one practical sentence.',
    sequence:
      'Read adjacent subjects together, then widen to clusters; repeated circumstances strengthen while difficult neighbors qualify a promise.',
    single: 'Name the person, event, or condition as plainly as possible.',
    closing:
      'Follow the practical development indicated by the final subject, not the romance of prediction.',
  },
  'ilm-al-raml': {
    headline: 'inscribes the active figure',
    overview:
      'ʿIlm al-Raml Cards study the sixteen canonical figures through their line pattern, movement, and quality without claiming to calculate a full shield chart.',
    sequence:
      'Read the figures as a modern study of the Mothers: compare their movement and quality, but do not invent witnesses or a judge that were not generated.',
    single:
      'Let the figure name the movement active now and study its pattern before its prediction.',
    closing:
      'Carry the final figure’s movement forward while keeping this card study distinct from a full geomantic chart.',
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

function cardTexture(system: SystemDefinition, draw: DrawnCard): string {
  const card = draw.card;
  const secondary = card.keywords[1] ?? card.keywords[0];
  const number =
    typeof card.numerology === 'number'
      ? `number ${card.numerology}`
      : 'its place in the sequence';

  switch (system.slug) {
    case 'tarot':
      return `As ${card.domain === 'major' ? 'Major Arcana, it describes the architecture of the moment' : `a card of ${card.domain ?? 'the Minor Arcana'}, it locates the pattern in lived experience`}; its ${card.element ?? 'symbolic'} element and ${number} show how ${secondary} develops.`;
    case 'oracle':
      return `The image moves from ${card.keywords[0]} toward ${secondary}; notice which visual association arrived before the explanation.`;
    case 'lenormand':
      return `Treat ${card.name} first as ${card.subject ?? card.keywords[0]}, then let proximity and timing modify that literal subject.`;
    case 'spellcraft':
      return `Turn ${card.keywords[0]} into material practice: choose one object, one boundary, or one repeatable gesture through which ${secondary} can become visible.`;
    case 'ancient-egypt':
      return `Hold the image as a threshold shaped by ${card.keywords[0]} and ${secondary}; receive its historical resonance before making a contemporary personal claim.`;
    case 'zodiac': {
      const role =
        card.domain === 'sign'
          ? 'quality and manner'
          : card.domain === 'planet'
            ? 'impulse and agency'
            : card.domain === 'house'
              ? 'arena of life'
              : 'celestial pressure';
      return `As a ${card.domain ?? 'celestial'} card, ${card.name} supplies ${role}; it describes where ${card.keywords[0]} meets ${secondary}.`;
    }
    case 'kipper':
      return `Treat this as a concrete social scene: identify who has agency, which role or institution is present, and how ${secondary} changes the circumstance.`;
    case 'belline':
      return `${card.name} belongs to the ${card.domain ?? 'uncategorized'} planetary family, so the named event of ${card.keywords[0]} arrives with that planet’s pace and atmosphere.`;
    case 'playing-card-cartomancy':
      return `The ${card.domain ?? 'suit'} locates the matter in ${card.element ?? 'ordinary life'}, while ${number} describes how ${card.keywords[0]} moves.`;
    case 'sibilla':
      return `Hear ${card.name} as a line of dialogue in the ${card.domain ?? 'social'} sphere; ${draw.reversed ? 'its reversed orientation complicates the speaker’s motive' : 'upright, the scene speaks directly'}.`;
    case 'runic-cards':
      return `Begin with the form ${card.glyph}, its place in ${card.domain ?? 'the Elder Futhark'}, and its literal image; only then extend ${card.keywords[0]} into reflection.`;
    case 'i-ching-cards':
      return `${card.glyph} is stable here as ${number}; it describes a condition of ${card.keywords[0]} without generating or implying changing lines.`;
    case 'fal-e-hafez':
      return `This is an original motif of ${card.keywords[0]} and ${secondary}, offered as image rather than quotation or attributed verse.`;
    case 'hanafuda':
      return `${card.domain ?? 'The flower'} locates the seasonal climate, while its ${card.element ?? 'card'} class sets the image’s intensity and ${number} its month.`;
    case 'zigeunerkarten':
      return `Read ${card.name} as a person or circumstance in immediate life; its promise or difficulty becomes precise only beside the nearest subject.`;
    case 'ilm-al-raml':
      return `The line pattern ${card.glyph} and figure name ${card.name} describe ${card.keywords[0]} through a quality of ${card.domain ?? secondary}; this is a figure study, not a calculated judge.`;
    default: {
      const qualities = [
        card.domain ? `its ${card.domain} domain` : null,
        card.element ? `${card.element} element` : null,
        typeof card.numerology === 'number' ? number : null,
      ].filter((quality): quality is string => Boolean(quality));
      return qualities.length
        ? `Its structure adds context through ${qualities.join(', ')}.`
        : `Its supporting theme of ${secondary} shows how the message may appear in lived experience.`;
    }
  }
}

function cardText(
  system: SystemDefinition,
  draw: DrawnCard,
  focus: Focus,
): string {
  const base =
    draw.reversed && draw.card.reversedMeaning
      ? draw.card.reversedMeaning
      : draw.card.meaning;
  const modifier = draw.card.focusModifiers?.[focus];
  const orientation = draw.reversed
    ? `Reversed, ${draw.card.name} shows ${draw.card.keywords[0]} turned inward, delayed, or expressed through its more difficult edge.`
    : `${draw.card.name} is upright, so its theme of ${draw.card.keywords[0]} is available to meet directly and use deliberately.`;
  const texture = cardTexture(system, draw);

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

function methodConnectionMeaning(
  system: SystemDefinition,
  from: DrawnCard,
  to: DrawnCard,
): string {
  const fromName = cardReference(from);
  const toName = cardReference(to);
  const sharedKeyword = from.card.keywords.find((keyword) =>
    to.card.keywords.includes(keyword),
  );

  switch (system.slug) {
    case 'tarot':
      return from.card.element === to.card.element
        ? `${fromName} and ${toName} share ${from.card.element}, intensifying ${from.card.keywords[0]} before it becomes ${to.card.keywords[0]}`
        : `${fromName} hands its archetypal consequence to ${toName}, moving the arc from ${from.card.keywords[0]} into ${to.card.keywords[0]}`;
    case 'oracle':
      return `${fromName} leaves the image of ${from.card.keywords[0]}; ${toName} reframes it through ${to.card.keywords[0]}${sharedKeyword ? `, preserving their shared note of ${sharedKeyword}` : ''}`;
    case 'spellcraft':
      return `${fromName} supplies ${from.card.keywords[0]} to the working, and ${toName} turns it into the material requirement of ${to.card.keywords[0]}`;
    case 'ancient-egypt':
      return `${fromName} opens a threshold of ${from.card.keywords[0]}; ${toName} carries it onward through ${to.card.keywords[0]}`;
    case 'zodiac':
      return `${fromName} contributes ${from.card.domain ?? 'celestial tone'}; ${toName} answers as ${to.card.domain ?? 'the next influence'}, joining ${from.card.keywords[0]} to ${to.card.keywords[0]}`;
    case 'kipper':
      return `${fromName} establishes the social circumstance, while adjacent ${toName} shows who or what turns ${from.card.keywords[0]} toward ${to.card.keywords[0]}`;
    case 'belline':
      return from.card.domain === to.card.domain
        ? `${fromName} and ${toName} repeat the ${from.card.domain} planetary current, strengthening its effect from ${from.card.keywords[0]} into ${to.card.keywords[0]}`
        : `${fromName} passes its event from the ${from.card.domain} family to ${toName} under ${to.card.domain}, changing the planetary tone`;
    case 'playing-card-cartomancy':
      return from.card.domain === to.card.domain
        ? `${fromName} and ${toName} repeat ${from.card.domain}, intensifying that suit while rank moves from ${from.card.keywords[0]} to ${to.card.keywords[0]}`
        : `${fromName} changes suit in ${toName}, redirecting the matter from ${from.card.domain} toward ${to.card.domain}`;
    case 'sibilla':
      return `${fromName} speaks first through ${from.card.keywords[0]}; ${toName}${to.reversed ? ' answers from a reversed or obscured position' : ' replies directly'} with ${to.card.keywords[0]}`;
    case 'runic-cards':
      return `${fromName} sets ${from.card.keywords[0]} in motion, and ${toName} changes that force into ${to.card.keywords[0]}`;
    case 'i-ching-cards':
      return `${fromName} describes the condition of ${from.card.keywords[0]}; ${toName} changes the required posture toward ${to.card.keywords[0]}`;
    case 'fal-e-hafez':
      return `${fromName} offers the image of ${from.card.keywords[0]}, and ${toName} witnesses it with ${to.card.keywords[0]}`;
    case 'hanafuda':
      return `${fromName} carries the climate of ${from.card.domain}; ${toName} moves the season toward ${to.card.domain} and changes its intensity to ${to.card.element}`;
    case 'zigeunerkarten':
      return `${fromName} names the circumstance of ${from.card.keywords[0]}; beside it, ${toName} makes the practical development ${to.card.keywords[0]}`;
    case 'ilm-al-raml':
      return `${fromName} inscribes ${from.card.keywords[0]}; ${toName} places ${to.card.keywords[0]} beside it as another Mother in the study`;
    default:
      return connectionMeaning(from, to);
  }
}

function cardConnectionText(
  system: SystemDefinition,
  draws: DrawnCard[],
  index: number,
): string {
  if (draws.length < 2) return '';
  const current = draws[index];
  const previous = draws[index - 1];
  const next = draws[index + 1];
  const incoming = previous
    ? `The incoming connection is clear: ${methodConnectionMeaning(system, previous, current)}.`
    : `${cardReference(current)} establishes ${current.card.keywords[0]} as the starting condition for the rest of the spread.`;
  const outgoing = next
    ? `From here, ${methodConnectionMeaning(system, current, next)}.`
    : `${cardReference(current)} gathers every preceding position into ${current.card.keywords[0]}, making this the direction in which the pattern settles.`;
  return `${incoming} ${outgoing}`;
}

function spreadSynthesis(
  system: SystemDefinition,
  spread: SpreadDefinition,
  draws: DrawnCard[],
  focus: Focus,
): string {
  const [first, ...rest] = draws;
  const voice = methodVoice(system);
  const opening = `${cardReference(first)} begins in ${first.position}, establishing ${first.card.keywords[0]} as the first condition.`;
  const movement = rest.map((draw, index) => {
    const previous = draws[index];
    const isLast = index === rest.length - 1;
    return `${isLast ? 'Finally' : 'Then'}, ${cardReference(draw)} in ${draw.position} ${transitionVerb(previous, draw)} ${previous.card.keywords[0]} with ${draw.card.keywords[0]}.`;
  });
  const consequence = `${voice?.sequence ?? 'Read every position as part of one connected field.'} ${focusLenses[focus]}, carry what ${cardReference(first)} reveals through ${spread.name} before acting on the ${draws.at(-1)!.card.keywords[0]} of ${cardReference(draws.at(-1)!)}.`;
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
  const voice = methodVoice(system);
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
    let text = cardText(system, draw, focus);
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
      const connection = cardConnectionText(system, draws, index);
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
      ? spreadSynthesis(system, spread, draws, focus)
      : `${first.card.name} concentrates the reading around ${first.card.keywords[0]}. ${voice?.single ?? `Its secondary theme of ${first.card.keywords[1] ?? first.card.keywords[0]} describes how that message is likely to become visible.`} ${focusLenses[focus]}, let ${keywords[0]} shape what happens next without using certainty as a condition.`;
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
      synthesis = `${cardReference(sign)} supplies the quality of ${sign.card.keywords[0]}; ${cardReference(planet)} supplies the impulse of ${planet.card.keywords[0]}; ${cardReference(house)} locates both in the arena of ${house.card.keywords[0]}. ${additions.length ? `${additions.join('; ')}. ` : ''}${focusLenses[focus]}, work with this alignment as present pressure, not predetermined fate.`;
    }
  }

  if (system.slug === 'belline' && spread.id === 'seven-planets') {
    synthesis = `${draws
      .map(
        (draw) =>
          `${draw.card.domain}: ${cardReference(draw)} brings ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}. Read the seven families as a planetary relay: repetition strengthens a current, while each change of ruler changes how the event can unfold. ${focusLenses[focus]}, the final Saturn position defines what must become durable or bounded.`;
  }

  if (system.slug === 'sibilla' && draws.length >= 3) {
    const hinge = draws[Math.floor(draws.length / 2)];
    synthesis = `${cardReference(first)} opens the conversation with ${first.card.keywords[0]}; ${draws
      .slice(1, -1)
      .map(
        (draw) =>
          `${cardReference(draw)}${draw === hinge ? ' acts as the hinge' : ' adds context'} through ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}; ${cardReference(last)} gives the reply of ${last.card.keywords[0]}. ${focusLenses[focus]}, answer the hinge before reacting to the final line.`;
  }

  if (system.slug === 'i-ching-cards' && draws.length > 1) {
    synthesis = `${draws
      .map(
        (draw) =>
          `${cardReference(draw)} in ${draw.position} describes ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}. The sequence changes the required posture from one stable figure to the next, but it does not create changing lines. ${focusLenses[focus]}, let the last figure guide conduct rather than promise an outcome.`;
  }

  if (system.slug === 'fal-e-hafez' && draws.length > 1) {
    synthesis = `${cardReference(first)} is the omen of ${first.card.keywords[0]}; ${draws
      .slice(1)
      .map(
        (draw) =>
          `${cardReference(draw)} witnesses it through ${draw.card.keywords[0]}`,
      )
      .join(
        '; ',
      )}. Hold the images beside the question as original contemporary motifs, not quotation or a substitute for opening the Divān.`;
  }

  if (system.slug === 'ilm-al-raml' && draws.length > 1) {
    synthesis = `${draws
      .map(
        (draw) =>
          `${cardReference(draw)} (${draw.card.glyph}) sets ${draw.card.keywords[0]} in ${draw.position}`,
      )
      .join(
        '; ',
      )}. Compare these four Mothers as a modern figure study. No daughters, nieces, witnesses, or judge have been calculated, so the reading stops where the generated figures stop.`;
  }

  return {
    headline:
      system.slug === 'divine'
        ? 'Sixteen voices become one pattern.'
        : `${first.card.name} ${voice?.headline ?? 'opens the way'}.`,
    overview:
      system.slug === 'divine'
        ? `One card from every deck has entered the field around ${keywords.join(', ')}. The Whole Constellation moves from ${cardReference(first)} to ${cardReference(last)}, with each tradition translating what the previous one began. Read the individual voices, then follow the cross-deck thread that holds them together.`
        : `${voice?.overview ?? `${system.name} reads symbols in relationship.`} ${spread.name} has arranged ${draws.length === 1 ? 'one concentrated signal' : `${draws.length} distinct signals`} around ${keywords.join(', ')}. ${system.instruction} The answer remains a pattern for attention and choice, not a fixed prediction.`,
    positions,
    synthesis,
    closing:
      system.slug === 'divine'
        ? `Carry ${last.card.keywords[0]} forward, but remember how every deck changed its meaning on the way. The constellation is complete; your next choice is where it becomes real.`
        : `${voice?.closing ?? `Carry ${last.card.keywords[0]} into the next decision.`} The reading has ended; its consequence begins with you.`,
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

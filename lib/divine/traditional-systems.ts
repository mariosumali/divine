import type {
  CardDefinition,
  SpreadDefinition,
  SystemDefinition,
} from './types';

type Polarity = CardDefinition['polarity'];
type Entry = readonly [
  name: string,
  keyword: string,
  message: string,
  polarity?: Polarity,
];

const spread = (
  id: string,
  name: string,
  description: string,
  positions: string[],
  layout: SpreadDefinition['layout'],
): SpreadDefinition => ({ id, name, description, positions, layout });

const traditionalImage = (collection: string, index: number) =>
  `/traditional-decks-v1/${collection}/${collection}-${String(index + 1).padStart(2, '0')}.webp`;

const makeSituationalDeck = (
  slug: string,
  entries: readonly Entry[],
  glyphs: readonly string[],
  provenance: string,
): CardDefinition[] =>
  entries.map(([name, keyword, message, polarity], index) => ({
    id: `${slug}-${index + 1}`,
    name,
    glyph: glyphs[index % glyphs.length],
    keywords: [keyword, 'circumstance'],
    meaning: message,
    domain: slug,
    numerology: index + 1,
    polarity,
    provenance,
  }));

const kipperEntries = [
  [
    'Main Person I',
    'querent',
    'A central person steps into focus. Read the surrounding cards as the conditions acting directly upon them.',
    'neutral',
  ],
  [
    'Main Person II',
    'counterpart',
    'A partner, counterpart, or second central person shapes the matter. Their role is clarified by the nearest cards.',
    'neutral',
  ],
  [
    'Marriage',
    'union',
    'Two people, interests, or obligations are joined. The bond becomes the mechanism through which events proceed.',
    'positive',
  ],
  [
    'Gathering',
    'meeting',
    'A social occasion or purposeful meeting brings separate people into one field. Participation changes the outcome.',
    'positive',
  ],
  [
    'Good Gentleman',
    'support',
    'A mature ally offers steadiness, advice, or practical help. Support is available through a person with influence.',
    'positive',
  ],
  [
    'Good Lady',
    'care',
    'A mature ally brings care, mediation, or perceptive counsel. Receive help without surrendering your judgment.',
    'positive',
  ],
  [
    'Pleasant Letter',
    'message',
    'A written message, document, or notification changes what can be decided. Read the exact terms before responding.',
    'positive',
  ],
  [
    'False Person',
    'deception',
    'Motives and appearances do not match. Verify the story through behavior, evidence, and the cards that follow.',
    'challenging',
  ],
  [
    'Change',
    'transition',
    'A move from one condition to another is already underway. The neighboring cards show what is being left and entered.',
    'neutral',
  ],
  [
    'Journey',
    'movement',
    'Distance, travel, or a longer personal passage widens the situation. Preparation matters more than speed.',
    'neutral',
  ],
  [
    'Winning Much Money',
    'abundance',
    'A substantial gain or valuable opportunity expands the available choices. Treat abundance as responsibility as well as reward.',
    'positive',
  ],
  [
    'Rich Young Woman',
    'independence',
    'A socially or materially secure younger person influences events. Confidence and access are part of the message.',
    'positive',
  ],
  [
    'Rich Gentleman',
    'resources',
    'A business-minded or well-resourced person brings leverage, ambition, or financial focus to the matter.',
    'positive',
  ],
  [
    'Sad News',
    'disappointment',
    'Unwelcome information must be acknowledged before the plan can adjust. Let fact arrive without turning it into fate.',
    'challenging',
  ],
  [
    'Good Outcome in Love',
    'resolution',
    'Affection, agreement, or reconciliation can reach a favorable resolution when conduct supports the promise.',
    'positive',
  ],
  [
    'His Thoughts',
    'planning',
    'Private thought is gathering into intention. Look beyond speculation for the action that proves what is truly planned.',
    'neutral',
  ],
  [
    'Receiving a Gift',
    'offering',
    'Something useful is freely offered: an object, favor, insight, or opening. Notice what accepting it asks in return.',
    'positive',
  ],
  [
    'A Small Child',
    'beginning',
    'A child or a young, untested beginning needs protection and room to develop before it can carry expectation.',
    'neutral',
  ],
  [
    'Ending',
    'closure',
    'One condition has reached its limit and must close. The ending clears energy that cannot be recovered by postponement.',
    'challenging',
  ],
  [
    'House',
    'security',
    'Home, property, workplace, or a stable structure contains the issue. Attend to the foundation before the decoration.',
    'positive',
  ],
  [
    'Living Room',
    'private sphere',
    'Events stay close to home or within a trusted interior circle. What happens privately is shaping the public result.',
    'neutral',
  ],
  [
    'Military Person',
    'discipline',
    'Rules, uniforms, institutions, or strict discipline set the boundary. Work precisely within—or consciously challenge—the order.',
    'neutral',
  ],
  [
    'Court',
    'judgment',
    'A formal decision, legal matter, or consequential evaluation is pending. Present the clearest version of the facts.',
    'challenging',
  ],
  [
    'Theft',
    'loss',
    'Time, trust, money, or attention is being removed from its proper place. Identify the leak before replacing what vanished.',
    'challenging',
  ],
  [
    'High Honors',
    'recognition',
    'Work becomes visible and receives respect, promotion, or public acknowledgment. Let recognition confirm the standard, not end it.',
    'positive',
  ],
  [
    'Great Fortune',
    'good fortune',
    'A powerful favorable turn improves the cards around it. Use the opening while remaining awake to practical limits.',
    'positive',
  ],
  [
    'Unexpected Money',
    'surprise gain',
    'A smaller gain, refund, or welcome improvement arrives outside the plan. Direct it toward what strengthens the future.',
    'positive',
  ],
  [
    'Expectation',
    'waiting',
    'Desire is looking toward a future result while action remains suspended. Decide what can be prepared during the wait.',
    'neutral',
  ],
  [
    'Prison',
    'restriction',
    'Duty, fear, or circumstance sharply limits movement. Name the real wall before trying to escape the imagined ones.',
    'challenging',
  ],
  [
    'Court Official',
    'process',
    'An official, mediator, or administrative process connects the parties. Procedure will matter as much as intention.',
    'neutral',
  ],
  [
    'Short Illness',
    'recovery',
    'Energy contracts and ordinary progress slows. Rest, repair, and proportion are more useful than alarm.',
    'challenging',
  ],
  [
    'Sorrow and Adversity',
    'stress',
    'A difficult interval brings friction or grief into daily life. Seek the specific burden rather than treating all life as the problem.',
    'challenging',
  ],
  [
    'Gloomy Thoughts',
    'worry',
    'The mind is rehearsing a dark outcome. Separate useful warning from repetition that only consumes strength.',
    'challenging',
  ],
  [
    'Work',
    'effort',
    'Employment, craft, or sustained labor asks for consistent effort. The result depends on what is practiced repeatedly.',
    'neutral',
  ],
  [
    'A Long Way',
    'distance',
    'The goal is real but distant in time, space, or development. Plan for endurance and measure progress honestly.',
    'neutral',
  ],
  [
    'Hope, Great Water',
    'horizon',
    'Hope extends beyond the present shore. Distant news, travel, or a long-held aim can move closer through patient direction.',
    'positive',
  ],
] as const satisfies readonly Entry[];

const kipperCards = makeSituationalDeck(
  'kipper',
  kipperEntries,
  ['⌂', '✉', '♙', '◇'],
  'Traditional 36-card Bavarian Kipper title; original DIVINE interpretation.',
).map((card, index) => ({
  ...card,
  image: traditionalImage('kipper', index),
  aspectRatio: 266 / 378,
  provenance:
    index < 34
      ? 'Traditional Kipper title paired with its card in a 1900–1920 Bavarian pack held by the Museumsstiftung Post und Telekommunikation; original DIVINE interpretation.'
      : 'Traditional Kipper title paired with a clearly identified public-domain period artwork because the museum photograph does not show this card face-up; original DIVINE interpretation.',
}));

const bellineEntries = [
  [
    'The Blue Card',
    'blessing',
    'A broad protection softens the field and restores room for a fortunate response.',
    'positive',
  ],
  [
    'Destiny',
    'necessity',
    'A fixed consequence or long pattern asks to be met with maturity rather than denial.',
    'neutral',
  ],
  [
    'Star of Man',
    'agency',
    'A significant man or outward, initiating force becomes central to the question.',
    'neutral',
  ],
  [
    'Star of Woman',
    'receptivity',
    'A significant woman or inward, receptive force becomes central to the question.',
    'neutral',
  ],
  [
    'Nativity',
    'beginning',
    'A genuine beginning arrives with its own identity and cannot be treated as a repeat of the past.',
    'positive',
  ],
  [
    'Success',
    'achievement',
    'Sustained effort reaches a visible result; accept the outcome and consolidate it.',
    'positive',
  ],
  [
    'Elevation',
    'ascent',
    'Status, perspective, or aspiration rises; choose the height that remains connected to purpose.',
    'positive',
  ],
  [
    'Honors',
    'recognition',
    'Merit is acknowledged publicly, bringing both validation and a higher standard to maintain.',
    'positive',
  ],
  [
    'Thought and Friendship',
    'understanding',
    'A meeting of minds creates trust, counsel, or an intelligent alliance.',
    'positive',
  ],
  [
    'Countryside and Health',
    'restoration',
    'Nature, rest, and a simpler rhythm restore what crowded conditions have depleted.',
    'positive',
  ],
  [
    'Gifts',
    'generosity',
    'A benefit moves between people without force; receive it clearly and pass value onward.',
    'positive',
  ],
  [
    'Betrayal',
    'broken trust',
    'A concealed motive or breach becomes visible; protect the truth without multiplying suspicion.',
    'challenging',
  ],
  [
    'Departure',
    'leaving',
    'A person, phase, or certainty moves away and the threshold must now be crossed.',
    'neutral',
  ],
  [
    'Inconstancy',
    'fluctuation',
    'Conditions change faster than promises can stabilize; wait for behavior to repeat before relying on it.',
    'challenging',
  ],
  [
    'Discovery',
    'revelation',
    'Hidden information comes within reach and changes the available interpretation.',
    'positive',
  ],
  [
    'Water',
    'feeling',
    'Emotion, intuition, and the unconscious carry the issue below its stated surface.',
    'neutral',
  ],
  [
    'Penates',
    'home',
    'Household bonds, ancestry, and the protected center of life shape the decision.',
    'positive',
  ],
  [
    'Illness',
    'depletion',
    'The body or the situation requires rest, care, and a reduction of avoidable pressure.',
    'challenging',
  ],
  [
    'Change',
    'turning',
    'A new cycle dislodges what had seemed fixed; adapt before the old arrangement hardens again.',
    'neutral',
  ],
  [
    'Money',
    'material flow',
    'Resources, earnings, or practical value come to the foreground and must be managed concretely.',
    'positive',
  ],
  [
    'Intelligence',
    'strategy',
    'Clear observation and an agile mind reveal the useful move inside a complex situation.',
    'positive',
  ],
  [
    'Theft and Loss',
    'deprivation',
    'Something is missing, surrendered, or poorly protected; take inventory before attempting replacement.',
    'challenging',
  ],
  [
    'Enterprises',
    'initiative',
    'A project gains force through decisive action; direct courage toward a defined result.',
    'positive',
  ],
  [
    'Trade',
    'exchange',
    'Negotiation, commerce, or mutual benefit depends on a fair and legible exchange.',
    'positive',
  ],
  [
    'News',
    'information',
    'A message alters timing or understanding; its practical consequence matters more than its drama.',
    'neutral',
  ],
  [
    'Pleasures',
    'enjoyment',
    'Beauty and bodily delight ask to be inhabited without apology or excess.',
    'positive',
  ],
  [
    'Peace',
    'harmony',
    'Conflict settles enough for repair, agreement, and a clearer breath.',
    'positive',
  ],
  [
    'Union',
    'alliance',
    'Two people or purposes join; the strength of the bond depends on shared terms.',
    'positive',
  ],
  [
    'Family',
    'belonging',
    'Kinship, chosen family, and inherited roles define both the support and the obligation present.',
    'neutral',
  ],
  [
    'Love',
    'affection',
    'The heart opens through genuine regard, attraction, or devotion that must become action.',
    'positive',
  ],
  [
    'Table',
    'hospitality',
    'A meal, meeting, or shared resource creates community and makes agreement possible.',
    'positive',
  ],
  [
    'Passions',
    'intensity',
    'Desire burns brightly enough to inspire or consume; give it a worthy boundary.',
    'challenging',
  ],
  [
    'Malice',
    'ill will',
    'Spite or concealed hostility distorts ordinary interactions; do not answer it in kind.',
    'challenging',
  ],
  [
    'Lawsuit',
    'formal conflict',
    'A dispute enters formal channels where evidence, patience, and procedure determine movement.',
    'challenging',
  ],
  [
    'Despotism',
    'domination',
    'Power is being exercised without proportion or consent; restore accountability where possible.',
    'challenging',
  ],
  [
    'Enemies',
    'opposition',
    'Active resistance becomes identifiable; understand the opposing interest before choosing a response.',
    'challenging',
  ],
  [
    'Negotiations',
    'terms',
    'Conditions can be revised through careful discussion, clear limits, and mutual recognition.',
    'neutral',
  ],
  [
    'Fire',
    'eruption',
    'Pressure breaks into visible crisis or fierce motivation; contain the damage and preserve the useful flame.',
    'challenging',
  ],
  [
    'Accident',
    'disruption',
    'An unexpected break interrupts the expected order; slow down and reduce preventable risk.',
    'challenging',
  ],
  [
    'Support',
    'assistance',
    'Reliable help shares the burden and makes a larger result possible.',
    'positive',
  ],
  [
    'Beauty',
    'harmony of form',
    'Attention to form, grace, and proportion reveals value that utility alone overlooked.',
    'positive',
  ],
  [
    'Inheritance',
    'legacy',
    'Material or emotional history passes forward; decide what should be kept, transformed, or ended.',
    'neutral',
  ],
  [
    'Wisdom',
    'discernment',
    'Experience becomes judgment capable of seeing beyond urgency and appearance.',
    'positive',
  ],
  [
    'Fame',
    'reputation',
    'Visibility increases and the public story gains force; keep it aligned with the private truth.',
    'positive',
  ],
  [
    'Chance',
    'opening',
    'An unplanned opportunity appears; preparation determines whether luck becomes lasting value.',
    'positive',
  ],
  [
    'Happiness',
    'flourishing',
    'Joy expands without needing to justify itself; let it restore generosity and confidence.',
    'positive',
  ],
  [
    'Misfortune',
    'adversity',
    'A difficult turn narrows the path; protect essentials and refuse unnecessary fatalism.',
    'challenging',
  ],
  [
    'Sterility',
    'fallow period',
    'Effort is not producing growth in its current form; pause, replenish, or change the conditions.',
    'challenging',
  ],
  [
    'Fatality',
    'irreversibility',
    'A consequence has passed the point of negotiation; meet what is final and choose what follows.',
    'challenging',
  ],
  [
    'Grace',
    'favor',
    'Protection or mercy arrives beyond strict merit, creating room for repair and gratitude.',
    'positive',
  ],
  [
    'Ruin',
    'collapse',
    'A structure fails because its support can no longer carry it; save what remains true.',
    'challenging',
  ],
  [
    'Delay',
    'waiting',
    'Timing resists pressure. Use the interval for preparation instead of mistaking slowness for refusal.',
    'neutral',
  ],
  [
    'Cloister',
    'withdrawal',
    'Solitude, retreat, or a closed institution separates the inner life from ordinary demands.',
    'neutral',
  ],
] as const satisfies readonly Entry[];

const bellinePlanet = (number: number) => {
  if (number === 0) return 'unruled';
  if (number === 1) return 'saturn';
  if (number === 2) return 'sun';
  if (number === 3) return 'moon';
  if (number <= 10) return 'sun';
  if (number <= 17) return 'moon';
  if (number <= 24) return 'mercury';
  if (number <= 31) return 'venus';
  if (number <= 38) return 'mars';
  if (number <= 45) return 'jupiter';
  return 'saturn';
};

const planetGlyphs: Record<string, string> = {
  unruled: '✦',
  sun: '☉',
  moon: '☾',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
};

const bellineCards: CardDefinition[] = bellineEntries.map(
  ([name, keyword, message, polarity], index) => {
    const planet = bellinePlanet(index);
    return {
      id: `belline-${index}`,
      name,
      glyph: planetGlyphs[planet],
      keywords: [keyword, planet],
      meaning: message,
      domain: planet,
      numerology: index,
      polarity,
      image: traditionalImage('belline', index),
      aspectRatio: 34 / 55,
      provenance:
        'Traditional 53-card Oracle Belline title and planetary family paired with Edmond’s historical design from an openly licensed complete-deck sheet; original DIVINE interpretation.',
    };
  },
);

const playingCardSuits = [
  {
    id: 'hearts',
    name: 'Hearts',
    glyph: '♥',
    domain: 'relationships, feeling, and home',
    element: 'water',
    tone: 'what is felt and shared',
  },
  {
    id: 'diamonds',
    name: 'Diamonds',
    glyph: '♦',
    domain: 'money, messages, and practical value',
    element: 'earth',
    tone: 'what can be exchanged or made tangible',
  },
  {
    id: 'clubs',
    name: 'Clubs',
    glyph: '♣',
    domain: 'work, effort, growth, and social action',
    element: 'fire',
    tone: 'what effort can move',
  },
  {
    id: 'spades',
    name: 'Spades',
    glyph: '♠',
    domain: 'challenge, thought, limits, and consequence',
    element: 'air',
    tone: 'what must be faced clearly',
  },
] as const;

const playingCardRanks = [
  ['ace', 'Ace', 'beginning', 'A concentrated opening appears.'],
  ['two', 'Two', 'pairing', 'Two forces meet and define one another.'],
  [
    'three',
    'Three',
    'growth',
    'A third influence turns possibility into development.',
  ],
  [
    'four',
    'Four',
    'foundation',
    'Structure steadies the matter and reveals its limits.',
  ],
  ['five', 'Five', 'disruption', 'Change unsettles the existing arrangement.'],
  [
    'six',
    'Six',
    'adjustment',
    'A workable balance returns through practical adjustment.',
  ],
  [
    'seven',
    'Seven',
    'assessment',
    'Pause long enough to read what the pattern is proving.',
  ],
  [
    'eight',
    'Eight',
    'movement',
    'Events gather speed through repetition and skill.',
  ],
  [
    'nine',
    'Nine',
    'culmination',
    'The suit approaches fullness and reveals its consequence.',
  ],
  [
    'ten',
    'Ten',
    'completion',
    'A cycle reaches its material result and transfers responsibility.',
  ],
  [
    'jack',
    'Jack',
    'messenger',
    'A younger person, message, or restless impulse enters.',
  ],
  [
    'queen',
    'Queen',
    'stewardship',
    'Perceptive authority tends the suit from within.',
  ],
  [
    'king',
    'King',
    'command',
    'Experienced authority directs the suit in the outer world.',
  ],
] as const;

const playingCards: CardDefinition[] = playingCardSuits.flatMap(
  (suit, suitIndex) =>
    playingCardRanks.map(([id, name, keyword, movement], index) => ({
      id: `playing-card-${suit.id}-${id}`,
      name: `${name} of ${suit.name}`,
      glyph: suit.glyph,
      keywords: [keyword, suit.name.toLowerCase()],
      meaning: `${movement} In ${suit.name}, attend to ${suit.domain}: ${suit.tone}.`,
      domain: suit.id,
      element: suit.element,
      numerology: index + 1,
      polarity:
        suit.id === 'spades'
          ? ('challenging' as const)
          : suit.id === 'hearts'
            ? ('positive' as const)
            : ('neutral' as const),
      image: traditionalImage(
        'playing-cards',
        suitIndex * playingCardRanks.length + index,
      ),
      aspectRatio: 5 / 7,
      provenance:
        'Standard French-suited 52-card structure paired with Austin Gabriel’s CC0 deck; original DIVINE cartomancy interpretation.',
    })),
);

type SibillaEntry = readonly [
  italian: string,
  english: string,
  keyword: string,
  shadow: string,
];

const sibillaSuits = [
  {
    id: 'cuori',
    name: 'Cuori',
    glyph: '♥',
    domain: 'emotion, relationship, pleasure, and home',
    entries: [
      [
        'Conversazione',
        'Conversation',
        'communication',
        'words divide, stall, or remain unsaid',
      ],
      [
        'Casa',
        'House',
        'home',
        'the household or foundation becomes unsettled',
      ],
      [
        'Belvedere',
        'Beautiful View',
        'expectation',
        'anticipated news is delayed or disappoints',
      ],
      [
        'Amore',
        'Love',
        'romance',
        'affection is divided, withdrawn, or unreliable',
      ],
      [
        'Allegrezza al Cuore',
        'Joy of Heart',
        'contentment',
        'promises and family harmony lose stability',
      ],
      [
        'Denari',
        'Money',
        'resources',
        'debt or uncertainty changes the material picture',
      ],
      [
        'Letterato',
        'Scholar',
        'learning',
        'intellect becomes manipulation or obsession',
      ],
      [
        'Speranza',
        'Hope',
        'confidence',
        'expectation gives way to discouragement',
      ],
      [
        'Fedeltà',
        'Fidelity',
        'loyalty',
        'trust is tested by inconsistency or betrayal',
      ],
      [
        'Costanza',
        'Constancy',
        'persistence',
        'stability hardens into anger or disorder',
      ],
      [
        'Amante',
        'Male Lover',
        'suitor',
        'the person or attraction proves immature',
      ],
      [
        'Amatrice',
        'Female Lover',
        'beloved',
        'attention scatters or affection becomes unreliable',
      ],
      [
        'Gran Signore',
        'Great Gentleman',
        'protector',
        'authority becomes controlling or self-serving',
      ],
    ],
  },
  {
    id: 'fiori',
    name: 'Fiori',
    glyph: '♣',
    domain: 'action, business, sociability, and useful effort',
    entries: [
      [
        'Imeneo',
        'Marriage',
        'partnership',
        'the bond is driven by appetite, property, or unequal terms',
      ],
      [
        'Superbia',
        'Pride',
        'dignity',
        'confidence tips into vanity or inflated importance',
      ],
      [
        'Viaggio',
        'Travel',
        'journey',
        'movement slows and progress becomes gradual',
      ],
      [
        'Amica',
        'Female Friend',
        'assistance',
        'help arrives indirectly or from an unexpected source',
      ],
      [
        'Fortuna',
        'Fortune',
        'luck',
        'good fortune develops slowly and must be cultivated',
      ],
      [
        'Consolante Sorpresa',
        'Consoling Surprise',
        'welcome surprise',
        'ambition or incompatibility spoils the opening',
      ],
      [
        'Gran Consolazione',
        'Great Consolation',
        'security',
        'progress is blocked by anxiety or humiliation',
      ],
      [
        'Riunione',
        'Reunion',
        'reconciliation',
        'uncertainty weakens motivation to reconnect',
      ],
      [
        'Allegria',
        'Cheerfulness',
        'celebration',
        'pleasure becomes a habit that obstructs growth',
      ],
      [
        'Leggerezza',
        'Levity',
        'carelessness',
        'a small lucky break appears inside an unstable situation',
      ],
      [
        'Domestico',
        'Servant',
        'helper',
        'an assistant or younger person cannot be relied upon',
      ],
      [
        'Giovine Fanciulla',
        'Young Maiden',
        'sincerity',
        'inexperience turns into passivity or neglect',
      ],
      [
        'Dottore',
        'Doctor',
        'expertise',
        'advice, diagnosis, or professional judgment is unsound',
      ],
    ],
  },
  {
    id: 'picche',
    name: 'Picche',
    glyph: '♠',
    domain: 'conflict, delay, separation, and endurance',
    entries: [
      [
        'Dispiacere',
        'Sorrow',
        'bad news',
        'the difficulty repeats and demands greater effort',
      ],
      [
        'Vecchia Signora',
        'Old Lady',
        'experience',
        'old grievances or rigid habits obstruct the present',
      ],
      [
        'Vedovo',
        'Widower',
        'solitude',
        'loss remains raw and departure becomes abrupt',
      ],
      [
        'Ammalato',
        'Sick Person',
        'stagnation',
        'the blockage deepens into isolation or crisis',
      ],
      [
        'Morte',
        'Death',
        'ending',
        'closure becomes more disruptive or difficult to accept',
      ],
      [
        'Sospiri',
        'Sighs',
        'anxious waiting',
        'fluctuation finally forces an explanation',
      ],
      [
        'Disgrazia',
        'Misfortune',
        'damage',
        'pressure intensifies and leaves less room to maneuver',
      ],
      [
        'Disperato per Gelosia',
        'Consumed by Jealousy',
        'jealousy',
        'distress turns inward and distorts perception',
      ],
      [
        'Prigione',
        'Prison',
        'confinement',
        'the strongest bars are psychological or relational',
      ],
      [
        'Militare',
        'Soldier',
        'force',
        'hidden authority or conflict acts behind the scene',
      ],
      [
        'Nemico',
        'Male Enemy',
        'rival',
        'opposition becomes open and self-sabotage is possible',
      ],
      [
        'Nemica',
        'Female Enemy',
        'adversary',
        'spite becomes explicit and requires firm distance',
      ],
      [
        'Sacerdote',
        'Priest',
        'institutional authority',
        'the institution or adviser acts without integrity',
      ],
    ],
  },
  {
    id: 'quadri',
    name: 'Quadri',
    glyph: '♦',
    domain: 'money, documents, work, travel, and material life',
    entries: [
      [
        'Stanza',
        'Room',
        'private meeting',
        'confidential matters become exposed or costly',
      ],
      [
        'Lettera',
        'Letter',
        'correspondence',
        'the message is delayed, burdensome, or unwelcome',
      ],
      [
        'Presente di Pietre Preziose',
        'Gift of Precious Stones',
        'valuable offer',
        'improvement arrives only by degrees',
      ],
      [
        'Falsità',
        'Falsehood',
        'deception',
        'the disguise fails and truth begins to surface',
      ],
      [
        'Malinconia',
        'Melancholy',
        'regret',
        'discouragement attaches itself to material worry',
      ],
      [
        'Pensiero',
        'Thought',
        'intention',
        'thought becomes hostile, obsessive, or self-defeating',
      ],
      [
        'Bambino',
        'Child',
        'new beginning',
        'growth is delayed by uncertainty or poor support',
      ],
      [
        'Donna di Servizio',
        'Maid',
        'practical help',
        'gossip or petty exchange diminishes the value offered',
      ],
      [
        'Deliranti',
        'The Madmen',
        'confusion',
        'contradiction produces regression rather than progress',
      ],
      [
        'Ladro',
        'Thief',
        'loss',
        'the loss spreads through broken agreements or neglected foundations',
      ],
      [
        'Messaggiere',
        'Messenger',
        'news',
        'important information is delayed, distorted, or poorly delivered',
      ],
      [
        'Donna Maritata',
        'Married Woman',
        'matriarch',
        'a family role carries conflict, dishonesty, or divided loyalty',
      ],
      [
        'Mercante',
        'Merchant',
        'commerce',
        'work or money is mishandled through weak judgment',
      ],
    ],
  },
] as const satisfies readonly {
  id: string;
  name: string;
  glyph: string;
  domain: string;
  entries: readonly SibillaEntry[];
}[];

const sibillaCards: CardDefinition[] = sibillaSuits.flatMap((suit, suitIndex) =>
  suit.entries.map(([italian, english, keyword, shadow], index) => ({
    id: `sibilla-${suit.id}-${index + 1}`,
    name: italian,
    glyph: suit.glyph,
    keywords: [english, keyword, suit.name],
    meaning: `${english} makes ${keyword} concrete in ordinary life. In ${suit.name}, read the scene through ${suit.domain}.`,
    reversedMeaning: `${english} is reversed: ${shadow}. Read the change literally before looking for metaphor.`,
    domain: suit.name,
    numerology: index + 1,
    polarity:
      suit.id === 'picche'
        ? ('challenging' as const)
        : suit.id === 'cuori'
          ? ('positive' as const)
          : ('neutral' as const),
    image: traditionalImage('sibilla', suitIndex * suit.entries.length + index),
    aspectRatio: 112 / 179,
    provenance:
      'Traditional Vera Sibilla Italiana title paired by suit and rank with a nineteenth-century Sibilla-family pack in the British Museum; the historical French caption is a documented variant. Original DIVINE interpretation.',
  })),
);

const runeEntries = [
  [
    'Fehu',
    'ᚠ',
    'cattle / wealth',
    'resources',
    'Move value through the life it is meant to sustain.',
  ],
  [
    'Uruz',
    'ᚢ',
    'aurochs',
    'vital force',
    'Use strength as capacity, not proof.',
  ],
  [
    'Thurisaz',
    'ᚦ',
    'giant / thorn',
    'defense',
    'Pause at the threshold and choose where force belongs.',
  ],
  [
    'Ansuz',
    'ᚨ',
    'god / breath',
    'speech',
    'Listen for the message that improves both language and judgment.',
  ],
  [
    'Raidho',
    'ᚱ',
    'ride / journey',
    'right movement',
    'Bring pace, route, and purpose into agreement.',
  ],
  [
    'Kenaz',
    'ᚲ',
    'torch / sore',
    'illumination',
    'Let focused light reveal the craft and the flaw.',
  ],
  [
    'Gebo',
    'ᚷ',
    'gift',
    'exchange',
    'Give and receive in a proportion that preserves dignity.',
  ],
  [
    'Wunjo',
    'ᚹ',
    'joy',
    'harmony',
    'Recognize the belonging created when effort and values align.',
  ],
  [
    'Hagalaz',
    'ᚺ',
    'hail',
    'disruption',
    'Protect essentials while the sudden weather changes the field.',
  ],
  [
    'Nauthiz',
    'ᚾ',
    'need',
    'necessity',
    'Constraint clarifies which desire is essential.',
  ],
  [
    'Isa',
    'ᛁ',
    'ice',
    'stillness',
    'Stop forcing movement and study what the pause preserves.',
  ],
  [
    'Jera',
    'ᛃ',
    'year / harvest',
    'cycle',
    'Allow earned results to ripen in their proper season.',
  ],
  [
    'Eihwaz',
    'ᛇ',
    'yew',
    'endurance',
    'Hold the axis steady while a deeper transition occurs.',
  ],
  [
    'Perthro',
    'ᛈ',
    'uncertain; often cup or lot-box',
    'uncertainty',
    'Leave room for chance and for what cannot yet be named.',
  ],
  [
    'Algiz',
    'ᛉ',
    'elk / protection',
    'protection',
    'Strengthen the boundary that keeps attention and life intact.',
  ],
  [
    'Sowilo',
    'ᛊ',
    'sun',
    'wholeness',
    'Act from the clearest source of vitality available.',
  ],
  [
    'Tiwaz',
    'ᛏ',
    'the god Týr',
    'justice',
    'Let courage serve an honest principle rather than victory alone.',
  ],
  [
    'Berkano',
    'ᛒ',
    'birch',
    'growth',
    'Protect the tender beginning without smothering it.',
  ],
  [
    'Ehwaz',
    'ᛖ',
    'horse',
    'partnership',
    'Progress depends on trust between forces moving together.',
  ],
  [
    'Mannaz',
    'ᛗ',
    'human being',
    'humanity',
    'See the self as participant in a larger field of relationship.',
  ],
  [
    'Laguz',
    'ᛚ',
    'water / lake',
    'flow',
    'Follow the living current while keeping contact with the shore.',
  ],
  [
    'Ingwaz',
    'ᛜ',
    'the god Ing',
    'gestation',
    'Gather energy inward until the new form is ready to emerge.',
  ],
  [
    'Dagaz',
    'ᛞ',
    'day',
    'breakthrough',
    'A change in light makes an old division newly intelligible.',
  ],
  [
    'Othala',
    'ᛟ',
    'inheritance / ancestral land',
    'legacy',
    'Choose consciously what belonging asks you to carry forward.',
  ],
] as const;

const runeCards: CardDefinition[] = runeEntries.map(
  ([name, glyph, literal, keyword, counsel], index) => ({
    id: `rune-${index + 1}`,
    name,
    glyph,
    keywords: [keyword, literal],
    meaning: `${name} names ${literal}. In a contemporary reflective reading, ${counsel.charAt(0).toLowerCase()}${counsel.slice(1)}`,
    domain: `ætt ${Math.floor(index / 8) + 1}`,
    numerology: index + 1,
    image: traditionalImage('runes', index),
    aspectRatio: 2 / 3,
    provenance:
      'Historical Elder Futhark character and reconstructed name paired with its public-domain standardized letterform; modern DIVINE reflection. No ancient divinatory card tradition is claimed.',
  }),
);

const iChingEntries = [
  [
    '乾',
    'Qián',
    'The Creative',
    'creative force',
    'Initiate with strength, then keep that strength aligned with principle.',
  ],
  [
    '坤',
    'Kūn',
    'The Receptive',
    'devoted response',
    'Support what is emerging through patience, openness, and steady work.',
  ],
  [
    '屯',
    'Zhūn',
    'Difficulty at the Beginning',
    'early disorder',
    'Build helpers and structure before demanding smooth progress.',
  ],
  [
    '蒙',
    'Méng',
    'Youthful Folly',
    'inexperience',
    'Ask sincerely, learn from correction, and do not pretend to know.',
  ],
  [
    '需',
    'Xū',
    'Waiting',
    'nourished patience',
    'Prepare fully while timing completes what force cannot.',
  ],
  [
    '訟',
    'Sòng',
    'Conflict',
    'contention',
    'Clarify the dispute and seek a fair limit before pushing farther.',
  ],
  [
    '師',
    'Shī',
    'The Army',
    'organized discipline',
    'Give collective force a just purpose and accountable leadership.',
  ],
  [
    '比',
    'Bǐ',
    'Holding Together',
    'alliance',
    'Join where trust is mutual and commitment can be renewed.',
  ],
  [
    '小畜',
    'Xiǎo Chù',
    'Small Taming',
    'gentle restraint',
    'Use small disciplines to gather power without forcing the larger result.',
  ],
  [
    '履',
    'Lǚ',
    'Treading',
    'careful conduct',
    'Move through risk with courtesy, alertness, and correct proportion.',
  ],
  [
    '泰',
    'Tài',
    'Peace',
    'harmony',
    'Use favorable conditions to connect what had been divided.',
  ],
  [
    '否',
    'Pǐ',
    'Standstill',
    'stagnation',
    'Preserve integrity when exchange is blocked and wait for the cycle to turn.',
  ],
  [
    '同人',
    'Tóng Rén',
    'Fellowship',
    'shared purpose',
    'Gather people around an aim clear enough to exceed private interest.',
  ],
  [
    '大有',
    'Dà Yǒu',
    'Great Possession',
    'abundance',
    'Hold much without allowing possession to replace responsibility.',
  ],
  [
    '謙',
    'Qiān',
    'Modesty',
    'humility',
    'Reduce excess and let quiet competence make the path level.',
  ],
  [
    '豫',
    'Yù',
    'Enthusiasm',
    'readiness',
    'Turn inspiration into preparation before momentum scatters.',
  ],
  [
    '隨',
    'Suí',
    'Following',
    'adaptation',
    'Follow what is worthy without abandoning inner consent.',
  ],
  [
    '蠱',
    'Gǔ',
    'Repairing Decay',
    'restoration',
    'Address what neglect or inheritance has allowed to spoil.',
  ],
  [
    '臨',
    'Lín',
    'Approach',
    'drawing near',
    'Meet the coming responsibility with generosity and foresight.',
  ],
  [
    '觀',
    'Guān',
    'Contemplation',
    'observation',
    'See the whole pattern before asking others to follow your example.',
  ],
  [
    '噬嗑',
    'Shì Kè',
    'Biting Through',
    'decisive correction',
    'Remove the obstruction through clear rules and proportionate action.',
  ],
  [
    '賁',
    'Bì',
    'Grace',
    'adornment',
    'Let form reveal substance without allowing beauty to disguise emptiness.',
  ],
  [
    '剝',
    'Bō',
    'Splitting Apart',
    'erosion',
    'Do not prop up what is falling; protect the remaining foundation.',
  ],
  [
    '復',
    'Fù',
    'Return',
    'renewal',
    'Notice the first quiet return of life and give it room.',
  ],
  [
    '無妄',
    'Wú Wàng',
    'Innocence',
    'uncontrived action',
    'Act without manipulation and let consequences reveal the true path.',
  ],
  [
    '大畜',
    'Dà Chù',
    'Great Taming',
    'stored power',
    'Accumulate skill and strength until service, not appetite, directs them.',
  ],
  [
    '頤',
    'Yí',
    'Nourishment',
    'sustenance',
    'Examine what enters the body, mind, and conversation.',
  ],
  [
    '大過',
    'Dà Guò',
    'Great Exceeding',
    'critical load',
    'Support the structure immediately and accept an exceptional response.',
  ],
  [
    '坎',
    'Kǎn',
    'The Abysmal Water',
    'repeated danger',
    'Keep the heart steady and learn the shape of the passage.',
  ],
  [
    '離',
    'Lí',
    'Clinging Fire',
    'clarity',
    'Attach attention to what is true enough to sustain illumination.',
  ],
  [
    '咸',
    'Xián',
    'Influence',
    'mutual attraction',
    'Let influence remain reciprocal rather than coercive.',
  ],
  [
    '恆',
    'Héng',
    'Duration',
    'continuity',
    'Choose a rhythm that can remain faithful through changing conditions.',
  ],
  [
    '遯',
    'Dùn',
    'Retreat',
    'strategic withdrawal',
    'Step back before opposition dictates the terms of engagement.',
  ],
  [
    '大壯',
    'Dà Zhuàng',
    'Great Power',
    'strength',
    'Use power correctly; force without justice weakens its own position.',
  ],
  [
    '晉',
    'Jìn',
    'Progress',
    'advancement',
    'Move into visibility while supporting the source of the progress.',
  ],
  [
    '明夷',
    'Míng Yí',
    'Darkening of the Light',
    'concealed clarity',
    'Protect inner light when the surrounding conditions punish openness.',
  ],
  [
    '家人',
    'Jiā Rén',
    'The Family',
    'ordered relationships',
    'Make roles, speech, and responsibility coherent within the household.',
  ],
  [
    '睽',
    'Kuí',
    'Opposition',
    'difference',
    'Work with small agreements while preserving essential distinction.',
  ],
  [
    '蹇',
    'Jiǎn',
    'Obstruction',
    'impediment',
    'Turn inward, seek help, and stop treating delay as a personal verdict.',
  ],
  [
    '解',
    'Xiè',
    'Deliverance',
    'release',
    'Resolve what can be resolved and return quickly to ordinary ground.',
  ],
  [
    '損',
    'Sǔn',
    'Decrease',
    'simplification',
    'Reduce what is lower or excessive so the essential can strengthen.',
  ],
  [
    '益',
    'Yì',
    'Increase',
    'benefit',
    'Direct advantage toward shared growth and timely action.',
  ],
  [
    '夬',
    'Guài',
    'Breakthrough',
    'resolution',
    'State the truth openly, then remove the danger without imitation of it.',
  ],
  [
    '姤',
    'Gòu',
    'Coming to Meet',
    'sudden encounter',
    'Recognize the influence entering now before it gains quiet control.',
  ],
  [
    '萃',
    'Cuì',
    'Gathering Together',
    'assembly',
    'Create a center strong enough to hold collective purpose.',
  ],
  [
    '升',
    'Shēng',
    'Pushing Upward',
    'gradual ascent',
    'Advance through steady effort and help from a trustworthy guide.',
  ],
  [
    '困',
    'Kùn',
    'Oppression',
    'exhaustion',
    'Conserve speech and remain faithful when external options contract.',
  ],
  [
    '井',
    'Jǐng',
    'The Well',
    'shared source',
    'Repair access to the resource that serves everyone.',
  ],
  [
    '革',
    'Gé',
    'Revolution',
    'transformation',
    'Change the order only when timing, necessity, and trust converge.',
  ],
  [
    '鼎',
    'Dǐng',
    'The Cauldron',
    'transformation through culture',
    'Refine raw material into nourishment, meaning, and shared order.',
  ],
  [
    '震',
    'Zhèn',
    'Arousing Thunder',
    'shock',
    'Let the jolt restore attention without abandoning the ritual center.',
  ],
  [
    '艮',
    'Gèn',
    'Keeping Still',
    'rest',
    'Stop when it is time to stop and move only when movement is appropriate.',
  ],
  [
    '漸',
    'Jiàn',
    'Development',
    'gradual progress',
    'Honor sequence; durable growth advances by fitting stages.',
  ],
  [
    '歸妹',
    'Guī Mèi',
    'The Marrying Maiden',
    'unequal position',
    'Understand the limits of a role entered without full authority.',
  ],
  [
    '豐',
    'Fēng',
    'Abundance',
    'fullness',
    'Act at the height of clarity while remembering that fullness passes.',
  ],
  [
    '旅',
    'Lǚ',
    'The Traveler',
    'temporary belonging',
    'Keep conduct clear and possessions light while away from home.',
  ],
  [
    '巽',
    'Xùn',
    'The Gentle Wind',
    'penetration',
    'Use repeated, subtle influence to reach what force cannot.',
  ],
  [
    '兌',
    'Duì',
    'The Joyous Lake',
    'exchange',
    'Create joy through sincere speech and mutual encouragement.',
  ],
  [
    '渙',
    'Huàn',
    'Dispersion',
    'dissolution',
    'Break up rigidity and reconnect what fear has scattered.',
  ],
  [
    '節',
    'Jié',
    'Limitation',
    'measure',
    'Choose humane limits that make freedom sustainable.',
  ],
  [
    '中孚',
    'Zhōng Fú',
    'Inner Truth',
    'sincerity',
    'Let inner and outer action agree closely enough to create trust.',
  ],
  [
    '小過',
    'Xiǎo Guò',
    'Small Exceeding',
    'attention to the small',
    'Correct modest matters carefully and avoid grand gestures.',
  ],
  [
    '既濟',
    'Jì Jì',
    'After Completion',
    'ordered completion',
    'Protect the achieved balance by noticing the first signs of disorder.',
  ],
  [
    '未濟',
    'Wèi Jì',
    'Before Completion',
    'unfinished crossing',
    'Remain attentive at the threshold; almost complete is not complete.',
  ],
] as const;

const iChingCards: CardDefinition[] = iChingEntries.map(
  ([han, pinyin, title, keyword, counsel], index) => ({
    id: `i-ching-${index + 1}`,
    name: `${String(index + 1).padStart(2, '0')} · ${han} ${pinyin}`,
    glyph: String.fromCodePoint(0x4dc0 + index),
    keywords: [title, keyword],
    meaning: `${title} describes ${keyword}. ${counsel}`,
    domain: 'King Wen sequence',
    numerology: index + 1,
    image: traditionalImage('i-ching', index),
    aspectRatio: 2 / 3,
    provenance:
      'Traditional King Wen number, Chinese title, and public-domain hexagram form; original DIVINE reflection in a modern card presentation, not a translation of the received text.',
  }),
);

const hafezEntries = [
  [
    'The Beloved',
    'devotion',
    'The heart recognizes a truth that argument cannot manufacture. Let devotion clarify rather than erase you.',
  ],
  [
    'The Wine',
    'ecstasy',
    'Ordinary control loosens and a larger feeling enters. Keep what awakens you; refuse what merely numbs.',
  ],
  [
    'The Cupbearer',
    'invitation',
    'A messenger offers the means of transformation. Receive the invitation with discernment.',
  ],
  [
    'The Tavern',
    'unofficial wisdom',
    'Insight waits outside respectable appearances. Enter the conversation without surrendering judgment.',
  ],
  [
    'The Garden',
    'delight',
    'Beauty becomes a place of meeting and renewal. Make time for what teaches through pleasure.',
  ],
  [
    'The Rose',
    'beauty and thorn',
    'What attracts also carries a boundary. Love the whole truth, not only the fragrance.',
  ],
  [
    'The Nightingale',
    'longing voiced',
    'Longing asks to become song, speech, or honest declaration. Silence no longer protects it.',
  ],
  [
    'The Dawn',
    'revelation',
    'Night begins to release its hold. Act on the first trustworthy light.',
  ],
  [
    'The Candle',
    'inner light',
    'A small flame spends itself to illuminate the room. Protect your energy while offering clarity.',
  ],
  [
    'The Moth',
    'consuming desire',
    'Attraction is powerful enough to transform or destroy. Know which distance preserves devotion.',
  ],
  [
    'The Mirror',
    'recognition',
    'The sought answer reflects the seeker. Notice which judgment belongs to your own image.',
  ],
  [
    'The Veil',
    'mystery',
    'Not everything hidden is false or ready to be exposed. Let mystery mature before naming it.',
  ],
  [
    'The Path',
    'practice',
    'The way is revealed by walking, not by possessing a complete map. Take the next honest step.',
  ],
  [
    'The Caravan',
    'companionship',
    'The long passage becomes possible through shared provisions and direction. Travel with trustworthy company.',
  ],
  [
    'The Sea',
    'vast feeling',
    'The question opens beyond personal control. Navigate by depth, rhythm, and a remembered shore.',
  ],
  [
    'The Desert',
    'emptiness',
    'What seems barren removes distraction and tests the need beneath desire. Carry only what sustains.',
  ],
  [
    'The Moon',
    'reflected truth',
    'Partial light reveals mood, cycle, and indirect knowledge. Do not demand noon from the night.',
  ],
  [
    'The Sun',
    'unconcealed truth',
    'Clarity makes concealment costly. Stand where action and understanding can meet.',
  ],
  [
    'The Cypress',
    'steadfastness',
    'Grace remains upright through changing weather. Hold dignity without becoming rigid.',
  ],
  [
    'The Tulip',
    'wounded beauty',
    'Beauty carries the mark of cost and impermanence. Let tenderness include what has been endured.',
  ],
  [
    'The Breeze',
    'subtle news',
    'A slight change in the air announces movement before events become visible. Listen without grasping.',
  ],
  [
    'The Rain',
    'mercy',
    'Release arrives as cleansing, grief, or nourishment. Let what falls reach the ground.',
  ],
  [
    'The Dust',
    'humility',
    'Pride returns to common earth. Begin again from what is simple and shared.',
  ],
  [
    'The Door',
    'access',
    'An opening appears, but crossing remains a choice. Ask what kind of guest you intend to be.',
  ],
  [
    'The Threshold',
    'between worlds',
    'The former state has loosened while the next is not secure. Stay awake in the crossing.',
  ],
  [
    'The Letter',
    'message',
    'Words travel across absence and alter the relationship. Read what is written—and what the distance required.',
  ],
  [
    'The Secret',
    'hidden knowledge',
    'A truth is protected by silence, fear, or timing. Decide whether care or avoidance keeps it hidden.',
  ],
  [
    'The Promise',
    'vow',
    'A spoken intention asks to be proven through continuity. Give only the promise you can inhabit.',
  ],
  [
    'Patience',
    'ripening',
    'Delay is not empty when the heart and the work continue to mature. Do not harvest the green fruit.',
  ],
  [
    'Separation',
    'distance',
    'Absence sharpens what presence allowed to blur. Learn what the distance is actually saying.',
  ],
  [
    'Reunion',
    'return',
    'What was divided can meet again, but not as if nothing changed. Bring the lesson back with you.',
  ],
  [
    'Fortune',
    'turning',
    'Circumstance turns beyond calculation. Meet favorable change with gratitude and difficult change with proportion.',
  ],
  [
    'The Witness',
    'confirmation',
    'A second sign clarifies the first. Let evidence refine intuition rather than compete with it.',
  ],
  [
    'The Friend',
    'faithful company',
    'Truth becomes bearable in the presence of a trustworthy companion. Offer the friendship you seek.',
  ],
  [
    'Prayer',
    'sincere appeal',
    'Desire is addressed beyond the limits of personal force. Let the asking change the one who asks.',
  ],
  [
    'Silence',
    'listening',
    'The answer withdraws from noise and explanation. Wait until quiet becomes receptive rather than defensive.',
  ],
] as const;

const hafezCards: CardDefinition[] = hafezEntries.map(
  ([name, keyword, message], index) => ({
    id: `hafez-${index + 1}`,
    name,
    glyph: ['❦', '☾', '◇', '✧'][index % 4],
    keywords: [keyword, 'poetic motif'],
    meaning: message,
    domain: 'contemporary motif card',
    numerology: index + 1,
    image: traditionalImage('hafez', index),
    aspectRatio: 71 / 120,
    provenance:
      'Contemporary DIVINE motif paired with a public-domain page from a historical Divān of Hafez manuscript in the Walters Art Museum; original English reflection, not a translated verse or historical deck card.',
  }),
);

type HanafudaCard = readonly [
  motif: string,
  category: 'Light' | 'Seed' | 'Ribbon' | 'Plain',
  keyword: string,
];

const hanafudaMonths = [
  {
    month: 'January',
    flower: 'Pine',
    cards: [
      ['Crane and Sun', 'Light', 'long life and clear beginnings'],
      ['Poetry Ribbon', 'Ribbon', 'a formal intention'],
      ['Pine Plain I', 'Plain', 'steadfast foundations'],
      ['Pine Plain II', 'Plain', 'patient endurance'],
    ],
  },
  {
    month: 'February',
    flower: 'Plum Blossom',
    cards: [
      ['Bush Warbler', 'Seed', 'the first living announcement'],
      ['Poetry Ribbon', 'Ribbon', 'news carried with feeling'],
      ['Plum Plain I', 'Plain', 'resilience in cold conditions'],
      ['Plum Plain II', 'Plain', 'beauty before comfort'],
    ],
  },
  {
    month: 'March',
    flower: 'Cherry Blossom',
    cards: [
      ['Curtain', 'Light', 'public beauty and celebration'],
      ['Poetry Ribbon', 'Ribbon', 'beauty named before it passes'],
      ['Cherry Plain I', 'Plain', 'fleeting abundance'],
      ['Cherry Plain II', 'Plain', 'presence within impermanence'],
    ],
  },
  {
    month: 'April',
    flower: 'Wisteria',
    cards: [
      ['Cuckoo', 'Seed', 'a call across distance'],
      ['Red Ribbon', 'Ribbon', 'a message of movement'],
      ['Wisteria Plain I', 'Plain', 'grace through flexibility'],
      ['Wisteria Plain II', 'Plain', 'support for what hangs and grows'],
    ],
  },
  {
    month: 'May',
    flower: 'Iris',
    cards: [
      ['Eight-plank Bridge', 'Seed', 'a careful crossing'],
      ['Red Ribbon', 'Ribbon', 'direction made visible'],
      ['Iris Plain I', 'Plain', 'clarity at the waterline'],
      ['Iris Plain II', 'Plain', 'protection during transition'],
    ],
  },
  {
    month: 'June',
    flower: 'Peony',
    cards: [
      ['Butterflies', 'Seed', 'transformation through attraction'],
      ['Blue Ribbon', 'Ribbon', 'refined desire'],
      ['Peony Plain I', 'Plain', 'full-bodied prosperity'],
      ['Peony Plain II', 'Plain', 'generosity in bloom'],
    ],
  },
  {
    month: 'July',
    flower: 'Bush Clover',
    cards: [
      ['Boar', 'Seed', 'courage moving through cover'],
      ['Red Ribbon', 'Ribbon', 'resolve declared plainly'],
      ['Bush Clover Plain I', 'Plain', 'humble persistence'],
      ['Bush Clover Plain II', 'Plain', 'strength close to the earth'],
    ],
  },
  {
    month: 'August',
    flower: 'Pampas Grass',
    cards: [
      ['Full Moon', 'Light', 'completion and reflected clarity'],
      ['Geese', 'Seed', 'seasonal passage and companionship'],
      ['Pampas Plain I', 'Plain', 'openness to changing weather'],
      ['Pampas Plain II', 'Plain', 'the field after effort'],
    ],
  },
  {
    month: 'September',
    flower: 'Chrysanthemum',
    cards: [
      ['Sake Cup', 'Seed', 'hospitality and measured pleasure'],
      ['Blue Ribbon', 'Ribbon', 'an elegant invitation'],
      ['Chrysanthemum Plain I', 'Plain', 'mature vitality'],
      ['Chrysanthemum Plain II', 'Plain', 'dignity late in the season'],
    ],
  },
  {
    month: 'October',
    flower: 'Maple',
    cards: [
      ['Deer', 'Seed', 'sensitivity within change'],
      ['Blue Ribbon', 'Ribbon', 'a message carried by color'],
      ['Maple Plain I', 'Plain', 'change made beautiful'],
      ['Maple Plain II', 'Plain', 'release without waste'],
    ],
  },
  {
    month: 'November',
    flower: 'Willow',
    cards: [
      [
        'Ono no Michikaze and Frog',
        'Light',
        'perseverance learned from nature',
      ],
      ['Swallow', 'Seed', 'swift adaptation'],
      ['Red Ribbon', 'Ribbon', 'a warning made legible'],
      ['Lightning', 'Plain', 'sudden change in the atmosphere'],
    ],
  },
  {
    month: 'December',
    flower: 'Paulownia',
    cards: [
      ['Phoenix', 'Light', 'renewal and worthy culmination'],
      ['Paulownia Plain I', 'Plain', 'completion returning to simplicity'],
      ['Paulownia Plain II', 'Plain', 'rest after culmination'],
      ['Paulownia Plain III', 'Plain', 'space for the next cycle'],
    ],
  },
] as const satisfies readonly {
  month: string;
  flower: string;
  cards: readonly HanafudaCard[];
}[];

const hanafudaCategoryMeaning: Record<HanafudaCard[1], string> = {
  Light:
    'A Light card makes the influence prominent and difficult to overlook.',
  Seed: 'A Seed card introduces an active creature, object, or event.',
  Ribbon: 'A Ribbon card carries intention, language, or social meaning.',
  Plain: 'A Plain card describes the supporting conditions and quiet work.',
};

const hanafudaCards: CardDefinition[] = hanafudaMonths.flatMap(
  ({ month, flower, cards }, monthIndex) =>
    cards.map(([motif, category, keyword], cardIndex) => ({
      id: `hanafuda-${monthIndex + 1}-${cardIndex + 1}`,
      name: `${flower} · ${motif}`,
      glyph:
        category === 'Light'
          ? '◉'
          : category === 'Seed'
            ? '✦'
            : category === 'Ribbon'
              ? '〰'
              : '❀',
      keywords: [keyword, category.toLowerCase(), month],
      meaning: `${month}'s ${flower} carries ${keyword}. ${hanafudaCategoryMeaning[category]}`,
      domain: `${month} · ${flower}`,
      element: category,
      numerology: monthIndex + 1,
      image: traditionalImage('hanafuda', monthIndex * 4 + cardIndex),
      aspectRatio: 263 / 431,
      provenance:
        'Traditional 48-card hanafuda month, motif, and category paired with the corresponding card from a public-domain early-Shōwa Hachihachi deck; original contemporary DIVINE reflection. Hanafuda is historically a playing-card family, not a fixed divination canon.',
    })),
);

export const TRADITIONAL_CARD_SYSTEMS: SystemDefinition[] = [
  {
    slug: 'kipper',
    index: '09',
    name: 'Kipper',
    shortName: 'Kipper',
    kind: 'cards',
    countLabel: '36 cards',
    eyebrow: 'People / Circumstance',
    introduction:
      'Thirty-six scenes of people, places, institutions, gains, and obstacles read as a direct map of everyday events.',
    instruction:
      'Choose the person or matter at the center, then read the surrounding scenes as one connected situation.',
    cards: kipperCards,
    spreads: [
      spread(
        'single',
        'Single situation',
        'One concrete circumstance.',
        ['Situation'],
        'single',
      ),
      spread(
        'line-three',
        'Kipper Line',
        'Cause, central event, and development.',
        ['Cause', 'Situation', 'Development'],
        'line',
      ),
      spread(
        'portrait-nine',
        'Nine-card Portrait',
        'A directional field around the central matter.',
        Array.from({ length: 9 }, (_, index) =>
          index === 4 ? 'Center' : `Field ${index + 1}`,
        ),
        'grid',
      ),
    ],
    cover: '/collage-v1/envelope.webp',
  },
  {
    slug: 'belline',
    index: '10',
    name: 'Belline',
    shortName: 'Belline',
    kind: 'cards',
    countLabel: '53 cards',
    eyebrow: 'Planet / Event',
    introduction:
      'A French oracle of fifty-three named events organized by the seven classical planetary influences.',
    instruction:
      'Read the event first and its planetary family second; repetition shows which influence dominates the field.',
    cards: bellineCards,
    spreads: [
      spread(
        'single',
        'Daily influence',
        'One event under one planetary tone.',
        ['Influence'],
        'single',
      ),
      spread(
        'three',
        'Origin / Movement / Result',
        'A three-card development.',
        ['Origin', 'Movement', 'Result'],
        'line',
      ),
      spread(
        'seven-planets',
        'Seven Planets',
        'One card from each classical planetary family.',
        ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'],
        'line',
      ),
    ],
    cover: '/collage-v1/prism.webp',
  },
  {
    slug: 'playing-card-cartomancy',
    index: '11',
    name: 'Playing Card Cartomancy',
    shortName: 'Playing Cards',
    kind: 'cards',
    countLabel: '52 cards',
    eyebrow: 'Suit / Number',
    introduction:
      'The familiar fifty-two-card pack becomes a practical language of suit, number, court, color, and sequence.',
    instruction:
      'Read the rank as movement and the suit as the part of life where that movement becomes concrete.',
    cards: playingCards,
    spreads: [
      spread(
        'single',
        'Single card',
        'One direct signal.',
        ['Signal'],
        'single',
      ),
      spread(
        'three',
        'Past / Present / Future',
        'A compact line through the question.',
        ['Past', 'Present', 'Future'],
        'line',
      ),
      spread(
        'horseshoe-seven',
        'Seven-card Horseshoe',
        'A wider arc of influence, advice, and outcome.',
        [
          'Past',
          'Present',
          'Hidden influence',
          'Obstacle',
          'Environment',
          'Advice',
          'Outcome',
        ],
        'line',
      ),
    ],
    cover: '/collage-v1/domino.webp',
  },
  {
    slug: 'sibilla',
    index: '12',
    name: 'Sibilla Italiana',
    shortName: 'Sibilla',
    kind: 'cards',
    countLabel: '52 cards',
    eyebrow: 'Scene / Conversation',
    introduction:
      'Fifty-two named Italian scenes speak directly about relationships, work, news, help, conflict, and daily life.',
    instruction:
      'Read an odd-numbered line as a conversation. The center is the hinge; the outer cards frame its meaning.',
    reversalStyle: 'required',
    cards: sibillaCards,
    spreads: [
      spread(
        'single',
        'Single scene',
        'One complete everyday message.',
        ['Scene'],
        'single',
      ),
      spread(
        'three',
        'Three-card Conversation',
        'Three scenes form one sentence.',
        ['Opening', 'Hinge', 'Reply'],
        'line',
      ),
      spread(
        'hinge-five',
        'Five-card Hinge',
        'The center pivots between context and two outer pillars.',
        ['Left pillar', 'Context', 'Hinge', 'Context', 'Right pillar'],
        'line',
      ),
    ],
    cover: '/collage-v1/rose.webp',
  },
  {
    slug: 'runic-cards',
    index: '13',
    name: 'Runic Cards',
    shortName: 'Runes',
    kind: 'cards',
    countLabel: '24 cards',
    eyebrow: 'Rune / Reflection',
    introduction:
      'The twenty-four Elder Futhark characters are presented as a modern reflective card deck grounded in their historical names.',
    instruction:
      'Begin with the rune’s name and literal image. Treat the reflection as contemporary practice, not recovered ancient doctrine.',
    cards: runeCards,
    spreads: [
      spread(
        'single',
        'One rune',
        'One sign for the present matter.',
        ['Rune'],
        'single',
      ),
      spread(
        'norns-three',
        'Three-rune Time',
        'What shaped this, what acts now, and what is becoming.',
        ['Past', 'Present', 'Becoming'],
        'line',
      ),
      spread(
        'cross-five',
        'Five-rune Cross',
        'A centered pattern of need, support, and direction.',
        ['Root', 'Challenge', 'Center', 'Support', 'Direction'],
        'cross',
      ),
    ],
    cover: '/collage-v1/crystal.webp',
  },
  {
    slug: 'i-ching-cards',
    index: '14',
    name: 'I Ching Cards',
    shortName: 'I Ching',
    kind: 'cards',
    countLabel: '64 cards',
    eyebrow: 'Hexagram / Change',
    introduction:
      'All sixty-four hexagrams appear in King Wen order as a card-based encounter with the patterns of change.',
    instruction:
      'Receive the figure as a situation in motion. These cards do not generate changing lines like coin or yarrow-stalk casting.',
    cards: iChingCards,
    spreads: [
      spread(
        'single',
        'One hexagram',
        'The primary shape of the situation.',
        ['Primary hexagram'],
        'single',
      ),
      spread(
        'three-moments',
        'Three Moments',
        'A contemporary card spread through condition, response, and change.',
        ['Condition', 'Response', 'Change'],
        'line',
      ),
    ],
    cover: '/collage-v1/compass.webp',
  },
  {
    slug: 'fal-e-hafez',
    index: '15',
    name: 'Fal-e Hafez Cards',
    shortName: 'Fal-e Hafez',
    kind: 'cards',
    countLabel: '36 motif cards',
    eyebrow: 'Poem / Omen',
    introduction:
      'A transparent contemporary card adaptation of Persian bibliomancy, built from recurring poetic motifs rather than invented quotations.',
    instruction:
      'Hold one sincere question. Read the omen first and the witness second, allowing image and reaction to meet.',
    cards: hafezCards,
    spreads: [
      spread(
        'omen',
        'Single omen',
        'One poetic image for the question.',
        ['The omen'],
        'single',
      ),
      spread(
        'omen-witness',
        'Omen and Witness',
        'A primary image followed by a clarifying witness.',
        ['The omen', 'The witness'],
        'line',
      ),
    ],
    cover: '/collage-v1/pen.webp',
  },
  {
    slug: 'hanafuda',
    index: '16',
    name: 'Hanafuda',
    shortName: 'Hanafuda',
    kind: 'cards',
    countLabel: '48 cards',
    eyebrow: 'Flower / Season',
    introduction:
      'The complete forty-eight-card Japanese flower-card structure becomes a contemporary seasonal reflection organized by month and card class.',
    instruction:
      'Read the month as atmosphere, the flower and motif as image, and the card class as intensity—not as a historical divination claim.',
    cards: hanafudaCards,
    spreads: [
      spread(
        'single',
        'One flower',
        'A single seasonal image.',
        ['Flower'],
        'single',
      ),
      spread(
        'seasonal-three',
        'Seasonal Arc',
        'Emergence, fullness, and release.',
        ['Emergence', 'Fullness', 'Release'],
        'line',
      ),
      spread(
        'garden-five',
        'Five-card Garden',
        'A field of climate, growth, visitor, message, and harvest.',
        ['Climate', 'Growth', 'Visitor', 'Message', 'Harvest'],
        'cross',
      ),
    ],
    cover: '/collage-v1/peony.webp',
  },
];

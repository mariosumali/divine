import type {
  CardDefinition,
  SpreadDefinition,
  SystemDefinition,
  SystemSlug,
} from './types';
import { TRADITIONAL_CARD_SYSTEMS } from './traditional-systems';

export { BALL_ANSWERS, FORTUNES, FORTUNE_PROMPTS } from './objects';

const spread = (
  id: string,
  name: string,
  description: string,
  positions: string[],
  layout: SpreadDefinition['layout'],
): SpreadDefinition => ({ id, name, description, positions, layout });

const majorArcana: Array<[string, string, string, string, string]> = [
  [
    'The Fool',
    '0',
    'beginning',
    'You are at the start of something new. Take the first reasonable step before you know the whole path.',
    'You may be rushing ahead without a plan—or waiting for certainty that will never come. Pause and tell courage from impulse.',
  ],
  [
    'The Magician',
    'I',
    'will',
    'You already have enough skill and support to begin. Choose one aim and use what you have deliberately.',
    'Your effort is scattered, or confidence is becoming performance. Simplify the goal and follow through.',
  ],
  [
    'The High Priestess',
    'II',
    'knowing',
    'Some of the answer is still beneath the surface. Be quiet long enough to notice what you already sense.',
    'Silence may be protecting something you need to admit. Name what you know before asking for another sign.',
  ],
  [
    'The Empress',
    'III',
    'abundance',
    'What you care for now can grow. Give it steady attention, and let yourself receive support too.',
    'Care has become draining or controlling. Restore your own energy before giving more.',
  ],
  [
    'The Emperor',
    'IV',
    'structure',
    'A clear plan and firm boundaries can make the idea workable. Decide what must hold steady.',
    'A rule or structure has become too rigid. Ask whether it protects the future or only an old fear.',
  ],
  [
    'The Hierophant',
    'V',
    'tradition',
    'A trusted teacher, tradition, or practice may offer useful guidance. Learn the form before deciding how to use it.',
    'An inherited rule no longer fits automatically. Examine it before you obey or reject it.',
  ],
  [
    'The Lovers',
    'VI',
    'choice',
    'A meaningful choice asks your actions and values to agree. Choose with your whole self, not from pressure alone.',
    'What you want and what you value may be pulling apart. Decide which one should lead.',
  ],
  [
    'The Chariot',
    'VII',
    'direction',
    'Your energy can move in one direction once you choose where you are going. Take the reins and keep a steady pace.',
    'You may be forcing movement without real agreement inside yourself. Reconsider the direction before pushing harder.',
  ],
  [
    'Strength',
    'VIII',
    'courage',
    'Patience and self-control will do more than pressure. Meet the situation firmly without becoming harsh.',
    'Self-doubt may be louder than the actual danger. Respond to it with patience, not punishment.',
  ],
  [
    'The Hermit',
    'IX',
    'solitude',
    'Step away from other people’s opinions long enough to hear your own. Solitude can clarify the next step.',
    'Time alone has stopped being helpful. Bring what you learned back into conversation or community.',
  ],
  [
    'Wheel of Fortune',
    'X',
    'change',
    'Circumstances are changing. Use the opening while it is available, knowing that no phase lasts forever.',
    'The same pattern may be repeating. You may not control the cycle, but you can change how you take part in it.',
  ],
  [
    'Justice',
    'XI',
    'truth',
    'Look at the facts, accept the consequences, and make the fairest choice you can. Tell the whole truth.',
    'A bias, omission, or avoided consequence is keeping the situation out of balance. Review the evidence honestly.',
  ],
  [
    'The Hanged Man',
    'XII',
    'surrender',
    'Pushing harder will not help right now. Pause, release control, and look at the problem from another angle.',
    'A useful pause has turned into avoidance. Stop making a sacrifice that serves no clear purpose.',
  ],
  [
    'Death',
    'XIII',
    'ending',
    'Something has reached its natural end. Let it close so a different form of life can begin.',
    'Holding on is stretching out an ending without saving what mattered. Grieve it, then make room for change.',
  ],
  [
    'Temperance',
    'XIV',
    'alchemy',
    'Two different needs can work together with patience and adjustment. Make small changes until the balance feels sustainable.',
    'Too much, too fast, has thrown the situation off balance. Simplify and return to a steadier pace.',
  ],
  [
    'The Devil',
    'XV',
    'attachment',
    'An attachment, fear, or habit has more influence than you want to admit. Seeing the pattern gives you a chance to loosen it.',
    'The problem is harder to change while it remains unnamed. Be honest about what keeps pulling you back.',
  ],
  [
    'The Tower',
    'XVI',
    'revelation',
    'A weak structure is breaking open. Protect what is true and useful instead of trying to preserve appearances.',
    'A necessary change is being delayed, making the situation less stable. Address the crack before it widens.',
  ],
  [
    'The Star',
    'XVII',
    'renewal',
    'Hope is returning after a difficult stretch. Let honesty, rest, and a modest plan turn it into renewal.',
    'Discouragement is making a real source of help hard to see. Rest, then look again with fewer demands.',
  ],
  [
    'The Moon',
    'XVIII',
    'mystery',
    'Not everything is clear yet. Move slowly, check your assumptions, and notice what dreams or instincts bring up.',
    'Fear and intuition may be tangled together. Separate what you know from what you imagine before deciding.',
  ],
  [
    'The Sun',
    'XIX',
    'vitality',
    'The situation is becoming clearer, warmer, and easier to enjoy. Let success be visible and shared.',
    'Something good is present, but you may be minimizing it or running low on energy. Receive what is real without forcing cheerfulness.',
  ],
  [
    'Judgement',
    'XX',
    'awakening',
    'A past choice is ready to be understood differently. Answer the call from who you are now, not who you were then.',
    'An old judgment is keeping you from moving forward. Review it with honesty and compassion.',
  ],
  [
    'The World',
    'XXI',
    'completion',
    'A long cycle is complete. Recognize what you learned and carry it into the next chapter.',
    'One final step is still open, perhaps because finishing would change how you see yourself. Complete what is actually yours to finish.',
  ],
];

const focusModifiers = (keyword: string): CardDefinition['focusModifiers'] => ({
  love: `In relationships, ask how ${keyword} affects what each person needs or can offer.`,
  work: `At work, turn ${keyword} into one specific decision or action.`,
  growth: `For personal growth, notice how you respond when ${keyword} feels difficult.`,
});

const tarotCardAspectRatio = 52 / 90;

const tarotMajors: CardDefinition[] = majorArcana.map(
  ([name, glyph, keyword, meaning, reversedMeaning], index) => ({
    id: `major-${index}`,
    name,
    glyph,
    image: `/tarot/major-${index}.webp`,
    aspectRatio: tarotCardAspectRatio,
    keywords: [keyword, 'major arcana'],
    meaning,
    reversedMeaning,
    domain: 'major',
    element: 'spirit',
    numerology: index,
    focusModifiers: focusModifiers(keyword),
    provenance: 'Rider–Waite–Smith tradition; original DIVINE interpretation.',
  }),
);

const suits = [
  {
    id: 'wands',
    name: 'Wands',
    glyph: '✦',
    domain: 'will and creation',
    element: 'fire',
    gift: 'direct your energy toward work that matters.',
    shadow: 'your energy may be scattered or spent on the wrong task.',
  },
  {
    id: 'cups',
    name: 'Cups',
    glyph: '▽',
    domain: 'feeling and relationship',
    element: 'water',
    gift: 'let feelings inform the choice without making it for you.',
    shadow: 'strong feelings may be making the situation harder to read.',
  },
  {
    id: 'swords',
    name: 'Swords',
    glyph: '†',
    domain: 'thought and truth',
    element: 'air',
    gift: 'name the issue clearly and separate fact from assumption.',
    shadow: 'your thoughts may be sharpening into worry or self-criticism.',
  },
  {
    id: 'pentacles',
    name: 'Pentacles',
    glyph: '○',
    domain: 'body and material life',
    element: 'earth',
    gift: 'build slowly and pay attention to what can be sustained.',
    shadow: 'the need for security may be keeping you stuck.',
  },
];

const ranks = [
  {
    id: 'ace',
    name: 'Ace',
    theme: 'pure potential',
    light:
      'A clear opportunity is available. Begin before every detail is settled.',
    dark: 'The opportunity is present, but pressure or hesitation is keeping it closed.',
  },
  {
    id: 'two',
    name: 'Two',
    theme: 'choice and balance',
    light: 'Two needs can be balanced if you let them inform each other.',
    dark: 'Indecision is using the energy you need to make the choice.',
  },
  {
    id: 'three',
    name: 'Three',
    theme: 'growth and expression',
    light: 'Early results show that growth or collaboration is beginning to work.',
    dark: 'You may be judging progress too soon or dividing your attention too widely.',
  },
  {
    id: 'four',
    name: 'Four',
    theme: 'stability and rest',
    light: 'Stability creates room to rest, recover, and take stock.',
    dark: 'What began as protection may now be resistance to change.',
  },
  {
    id: 'five',
    name: 'Five',
    theme: 'friction and change',
    light: 'Tension reveals what needs to change or be renegotiated.',
    dark: 'The same conflict is repeating after its lesson is already clear.',
  },
  {
    id: 'six',
    name: 'Six',
    theme: 'harmony and passage',
    light: 'The situation is moving toward greater balance and cooperation.',
    dark: 'An old agreement or memory may be distorting the present.',
  },
  {
    id: 'seven',
    name: 'Seven',
    theme: 'assessment and resolve',
    light: 'Pause, review your position, and protect what matters most.',
    dark: 'Suspicion or fatigue may be making every option look worse than it is.',
  },
  {
    id: 'eight',
    name: 'Eight',
    theme: 'momentum and mastery',
    light: 'Repeated, focused action is building skill and momentum.',
    dark: 'Speed is replacing good judgment. Slow down enough to check the work.',
  },
  {
    id: 'nine',
    name: 'Nine',
    theme: 'attainment and threshold',
    light: 'The work is nearly complete. Hold steady for the final stretch.',
    dark: 'Exhaustion may be hiding how close you are—or showing that you need help.',
  },
  {
    id: 'ten',
    name: 'Ten',
    theme: 'completion and consequence',
    light: 'A cycle has reached its full result. Decide what should continue from here.',
    dark: 'The completed cycle has become a burden because nothing is being released.',
  },
  {
    id: 'page',
    name: 'Page',
    theme: 'message and discovery',
    light: 'Curiosity or a new message opens an unfamiliar direction.',
    dark: 'A message may be delayed, incomplete, or heard only in part.',
  },
  {
    id: 'knight',
    name: 'Knight',
    theme: 'pursuit and motion',
    light: 'Commitment is gathering speed around one clear aim.',
    dark: 'Momentum has moved ahead of good judgment.',
  },
  {
    id: 'queen',
    name: 'Queen',
    theme: 'embodied wisdom',
    light: 'Quiet confidence and experience can guide the situation.',
    dark: 'Care or control may be covering a fear of being vulnerable.',
  },
  {
    id: 'king',
    name: 'King',
    theme: 'stewardship and command',
    light: 'Experience can direct the situation with steadiness and responsibility.',
    dark: 'Authority is protecting itself instead of helping the people or work involved.',
  },
];

const tarotMinors: CardDefinition[] = suits.flatMap((suit) =>
  ranks.map((rank) => ({
    id: `${suit.id}-${rank.id}`,
    name: `${rank.name} of ${suit.name}`,
    glyph: suit.glyph,
    image: `/tarot/${suit.id}-${rank.id}.webp`,
    aspectRatio: tarotCardAspectRatio,
    keywords: [rank.theme, suit.domain, suit.element],
    meaning: `${rank.light} In matters of ${suit.domain}, ${suit.gift}`,
    reversedMeaning: `${rank.dark} In matters of ${suit.domain}, ${suit.shadow}`,
    domain: suit.id,
    element: suit.element,
    numerology: ranks.indexOf(rank) + 1,
    focusModifiers: focusModifiers(rank.theme),
    provenance: 'Rider–Waite–Smith structure; original DIVINE interpretation.',
  })),
);

const makeNamedDeck = (
  system: string,
  entries: Array<[string, string]>,
  glyphs: string[],
  guidance: string,
  caution: string,
): CardDefinition[] =>
  entries.map(([name, keyword], index) => ({
    id: `${system}-${index + 1}`,
    name,
    glyph: glyphs[index % glyphs.length],
    keywords: [keyword, entries[(index + 7) % entries.length][1]],
    meaning: `${name} points to ${keyword}. ${guidance}`,
    reversedMeaning: `${name} reversed suggests that ${keyword} is blocked or difficult to recognize. ${caution}`,
    domain: system,
    provenance: 'Original DIVINE card and interpretation.',
  }));

const archivalImage = (collection: string, index: number) =>
  `/open-decks-v1/${collection}/${collection}-${String(index + 1).padStart(2, '0')}.webp`;

const archivalOrientations = {
  oracle: 'pppppppppppppppppppppppppppppppppppppppppppp',
  ritual: 'ssssslsssssssssslsplssssssssssssslss',
  temple: 'ppllplpppppplppllppppplpllpppppppplp',
  zodiac: 'lllppllpllllplllppppplllllplllllpp',
} as const;

const archivalAspectRatio = (
  collection: keyof typeof archivalOrientations,
  index: number,
) => {
  const orientation = archivalOrientations[collection][index];
  return orientation === 'l' ? 4 / 3 : orientation === 's' ? 1 : 3 / 4;
};

const oracleEntries: Array<[string, string]> = [
  ['The Open Door', 'permission'],
  ['Black Water', 'depth'],
  ['The Witness', 'clarity'],
  ['Silver Thread', 'connection'],
  ['The Vessel', 'receptivity'],
  ['Afterlight', 'memory'],
  ['The Unnamed', 'mystery'],
  ['First Breath', 'renewal'],
  ['The Crossing', 'transition'],
  ['Deep Listening', 'attention'],
  ['The Offering', 'exchange'],
  ['The Hollow', 'space'],
  ['North Star', 'direction'],
  ['The Veil', 'discernment'],
  ['Soft Armor', 'boundaries'],
  ['The Echo', 'pattern'],
  ['Wild Mercy', 'release'],
  ['The Archive', 'ancestry'],
  ['The Current', 'movement'],
  ['Quiet Fire', 'devotion'],
  ['The Mirror', 'recognition'],
  ['The Threshold', 'initiation'],
  ['Night Bloom', 'timing'],
  ['The Bell', 'awakening'],
  ['White Feather', 'trust'],
  ['The Orchard', 'abundance'],
  ['The Key', 'access'],
  ['The Empty Chair', 'absence'],
  ['The Bridge', 'reconciliation'],
  ['The Stone', 'endurance'],
  ['The Tide', 'rhythm'],
  ['The Lantern', 'guidance'],
  ['The Compass', 'choice'],
  ['The Storm Eye', 'stillness'],
  ['The Return', 'integration'],
  ['The Seed', 'potential'],
  ['The Unbinding', 'freedom'],
  ['The Hearth', 'belonging'],
  ['The Signal', 'recognition'],
  ['The Well', 'resource'],
  ['The Wing', 'perspective'],
  ['The Hour', 'readiness'],
  ['The Name', 'identity'],
  ['The Crown', 'sovereignty'],
];

const lenormandEntries: Array<[string, string]> = [
  ['Rider', 'news'],
  ['Clover', 'opportunity'],
  ['Ship', 'distance'],
  ['House', 'home'],
  ['Tree', 'health'],
  ['Clouds', 'uncertainty'],
  ['Snake', 'complexity'],
  ['Coffin', 'ending'],
  ['Bouquet', 'gift'],
  ['Scythe', 'sudden cut'],
  ['Whip', 'repetition'],
  ['Birds', 'conversation'],
  ['Child', 'beginning'],
  ['Fox', 'strategy'],
  ['Bear', 'power'],
  ['Stars', 'guidance'],
  ['Stork', 'change'],
  ['Dog', 'loyalty'],
  ['Tower', 'institution'],
  ['Garden', 'public life'],
  ['Mountain', 'obstacle'],
  ['Crossroads', 'choice'],
  ['Mice', 'erosion'],
  ['Heart', 'love'],
  ['Ring', 'commitment'],
  ['Book', 'secrets'],
  ['Letter', 'message'],
  ['Man', 'significator'],
  ['Woman', 'significator'],
  ['Lilies', 'peace'],
  ['Sun', 'success'],
  ['Moon', 'recognition'],
  ['Key', 'certainty'],
  ['Fish', 'resources'],
  ['Anchor', 'stability'],
  ['Cross', 'burden'],
];

const spellEntries: Array<[string, string]> = [
  ['Candle', 'focus'],
  ['Salt', 'protection'],
  ['Thread', 'connection'],
  ['Bell', 'clearing'],
  ['Bowl', 'receiving'],
  ['Ash', 'release'],
  ['Wax', 'impression'],
  ['Flame', 'will'],
  ['Water', 'adaptation'],
  ['Stone', 'grounding'],
  ['Feather', 'message'],
  ['Key', 'opening'],
  ['Mirror', 'truth'],
  ['Veil', 'privacy'],
  ['Herb', 'restoration'],
  ['Smoke', 'transition'],
  ['Knot', 'commitment'],
  ['Circle', 'boundary'],
  ['Moon Milk', 'nourishment'],
  ['Iron', 'resolve'],
  ['Honey', 'attraction'],
  ['Ink', 'declaration'],
  ['Needle', 'precision'],
  ['Ribbon', 'grace'],
  ['Door', 'invitation'],
  ['Window', 'perspective'],
  ['Broom', 'clearing'],
  ['Mortar', 'transformation'],
  ['Chalice', 'communion'],
  ['Coin', 'value'],
  ['Clock', 'timing'],
  ['Match', 'initiation'],
  ['Shell', 'listening'],
  ['Root', 'ancestry'],
  ['Star', 'wish'],
  ['Seal', 'completion'],
];

const egyptEntries: Array<[string, string]> = [
  ['Ankh', 'life'],
  ['Djed Pillar', 'stability'],
  ['Was Scepter', 'authority'],
  ['Scarab', 'renewal'],
  ['Eye of Horus', 'restoration'],
  ['Feather of Ma’at', 'truth'],
  ['Lotus', 'emergence'],
  ['Solar Disk', 'illumination'],
  ['Papyrus', 'record'],
  ['Sistrum', 'celebration'],
  ['Shen Ring', 'protection'],
  ['Ka', 'vital essence'],
  ['Ba', 'individual spirit'],
  ['Akh', 'transformation'],
  ['Isis', 'restoration'],
  ['Osiris', 'regeneration'],
  ['Horus', 'vision'],
  ['Hathor', 'joy'],
  ['Thoth', 'knowledge'],
  ['Sekhmet', 'power'],
  ['Anubis', 'passage'],
  ['Bastet', 'guardianship'],
  ['Nut', 'cosmos'],
  ['Geb', 'earth'],
  ['Ra', 'radiance'],
  ['Nephthys', 'thresholds'],
  ['Ptah', 'craft'],
  ['Khnum', 'formation'],
  ['Sobek', 'instinct'],
  ['Ma’at', 'balance'],
  ['The Nile', 'continuity'],
  ['The Horizon', 'becoming'],
  ['The Barque', 'journey'],
  ['The Temple Gate', 'initiation'],
  ['The Offering Table', 'reciprocity'],
  ['The Field of Reeds', 'peace'],
];

const signs: Array<[string, string]> = [
  ['Aries', 'initiation'],
  ['Taurus', 'embodiment'],
  ['Gemini', 'exchange'],
  ['Cancer', 'belonging'],
  ['Leo', 'radiance'],
  ['Virgo', 'refinement'],
  ['Libra', 'relationship'],
  ['Scorpio', 'transformation'],
  ['Sagittarius', 'expansion'],
  ['Capricorn', 'mastery'],
  ['Aquarius', 'innovation'],
  ['Pisces', 'surrender'],
];
const planets: Array<[string, string]> = [
  ['Sun', 'identity'],
  ['Moon', 'instinct'],
  ['Mercury', 'language'],
  ['Venus', 'attraction'],
  ['Mars', 'action'],
  ['Jupiter', 'growth'],
  ['Saturn', 'structure'],
  ['Uranus', 'disruption'],
  ['Neptune', 'imagination'],
  ['Pluto', 'rebirth'],
];
const houses: Array<[string, string]> = Array.from(
  { length: 12 },
  (_, i) =>
    [
      `House ${i + 1}`,
      [
        'self',
        'resources',
        'communication',
        'home',
        'creativity',
        'practice',
        'partnership',
        'intimacy',
        'belief',
        'vocation',
        'community',
        'spirit',
      ][i],
    ] as [string, string],
);

const tarotSpreads = [
  spread(
    'insight',
    'One-card insight',
    'A single clear signal for the present moment.',
    ['The message'],
    'single',
  ),
  spread(
    'three',
    'Past / Present / Future',
    'See the movement around your question.',
    ['Past', 'Present', 'Future'],
    'line',
  ),
  spread(
    'celtic-cross',
    'Celtic Cross',
    'A ten-card map of influence, tension, and outcome.',
    [
      'Present',
      'Challenge',
      'Foundation',
      'Recent past',
      'Possibility',
      'Near future',
      'Your position',
      'Environment',
      'Hopes and fears',
      'Outcome',
    ],
    'cross',
  ),
];

const oracleSpreads = [
  spread(
    'message',
    'Single message',
    'Receive the clearest note.',
    ['Message'],
    'single',
  ),
  spread(
    'shadow-action',
    'Message / Shadow / Action',
    'Hold the invitation and its demand together.',
    ['Message', 'Shadow', 'Action'],
    'line',
  ),
  spread(
    'inner-compass',
    'Inner Compass',
    'Five directions around your inner axis.',
    [
      'North · Guidance',
      'East · Beginning',
      'Center · Truth',
      'South · Release',
      'West · Integration',
    ],
    'cross',
  ),
];

const simpleSpreads = (
  singleName: string,
  threeName: string,
  fiveName: string,
  positions3: string[],
  positions5: string[],
) => [
  spread(
    'single',
    singleName,
    'One symbol for the heart of the question.',
    ['The symbol'],
    'single',
  ),
  spread(
    'three',
    threeName,
    'Three cards show how the situation develops.',
    positions3,
    'line',
  ),
  spread('five', fiveName, 'Five cards add context, tension, and advice.', positions5, 'cross'),
];

const tarot = [...tarotMajors, ...tarotMinors];
const oracle = makeNamedDeck(
  'oracle',
  oracleEntries,
  ['◌', '◇', '☾', '∴'],
  'Notice what the image brings to mind before searching for an explanation.',
  'Return to the image itself; too many interpretations may be hiding your first clear response.',
).map((card, index) => ({
  ...card,
  image: archivalImage('oracle', index),
  aspectRatio: archivalAspectRatio('oracle', index),
  provenance:
    'Master of the E-Series Mantegna Tarocchi (c. 1465), open-access scan via Wikimedia Commons; original DIVINE interpretation.',
}));
const positiveLenormand = new Set([
  'Rider',
  'Clover',
  'Bouquet',
  'Child',
  'Stars',
  'Stork',
  'Dog',
  'Heart',
  'Ring',
  'Lilies',
  'Sun',
  'Moon',
  'Key',
  'Fish',
  'Anchor',
]);
const challengingLenormand = new Set([
  'Clouds',
  'Snake',
  'Coffin',
  'Scythe',
  'Whip',
  'Mountain',
  'Mice',
  'Cross',
]);
const lenormandTiming = [
  'very soon',
  'within days',
  'over distance',
  'within a month',
  'slow and seasonal',
  'briefly delayed',
  'through a winding delay',
  'at a final ending',
  'within a week',
  'suddenly',
  'repeatedly',
  'within days',
  'immediately',
  'through careful timing',
  'over months',
  'at night or in winter',
  'during a change of season',
  'steadily',
  'after a long interval',
  'at a public occasion',
  'after a delay',
  'at the decision point',
  'gradually',
  'in the near present',
  'through an agreement',
  'when information is revealed',
  'with the next message',
  'by the querent’s timing',
  'by the querent’s timing',
  'in maturity',
  'quickly and clearly',
  'within a lunar month',
  'at the destined opening',
  'in cycles',
  'for the long term',
  'through a necessary trial',
];
const lenormand = makeNamedDeck(
  'lenormand',
  lenormandEntries,
  ['♢', '✣', '○', '⌁'],
  'Read the symbol literally, then use neighboring cards to make it more specific.',
  'Look to the nearest cards for the missing context.',
).map((card, index) => ({
  ...card,
  image: `/lenormand/game-of-hope-${String(index + 1).padStart(2, '0')}.webp`,
  subject: lenormandEntries[index][1],
  modifier: positiveLenormand.has(card.name)
    ? 'opens or strengthens nearby cards'
    : challengingLenormand.has(card.name)
      ? 'delays, tests, or diminishes nearby cards'
      : 'redirects the subject named by nearby cards',
  polarity: positiveLenormand.has(card.name)
    ? ('positive' as const)
    : challengingLenormand.has(card.name)
      ? ('challenging' as const)
      : ('neutral' as const),
  timing: lenormandTiming[index],
  domain: lenormandEntries[index][1],
  provenance:
    'Das Spiel der Hofnung (Johann Kaspar Hechtel, 1799), public-domain scan via Wikimedia Commons; original DIVINE interpretation.',
}));
const spellcraft = makeNamedDeck(
  'spellcraft',
  spellEntries,
  ['✦', '△', '○', '╳'],
  'Turn the intention into one physical action you can complete.',
  'The form of the ritual may be distracting from what you actually intend to change.',
).map((card, index) => ({
  ...card,
  image: archivalImage('ritual', index),
  aspectRatio: archivalAspectRatio('ritual', index),
  provenance:
    'Cesare Ripa’s Iconologia (1613), open-access scan via Wikimedia Commons; original DIVINE interpretation.',
}));
const egypt = makeNamedDeck(
  'egypt',
  egyptEntries,
  ['☉', '☥', '◇', 'Ⅱ'],
  'Begin with the image’s historical meaning, then consider what it reflects in the present.',
  'Slow down and return to the symbol’s context before making it personal.',
).map((card, index) => ({
  ...card,
  image: archivalImage('temple', index),
  aspectRatio: archivalAspectRatio('temple', index),
  provenance:
    'Jean-François Champollion’s Panthéon égyptien (1823–1825), public-domain plates via Wikimedia Commons; original DIVINE interpretation.',
}));
const zodiac = makeNamedDeck(
  'zodiac',
  [...signs, ...planets, ...houses],
  ['☉', '☾', '○', '✦'],
  'Use this archetype to notice a quality, motive, or area of life that is active now.',
  'You may be acting out the archetype without understanding what it asks of you.',
).map((card, index) => ({
  ...card,
  image: archivalImage('zodiac', index),
  aspectRatio: archivalAspectRatio('zodiac', index),
  domain: index < 12 ? 'sign' : index < 22 ? 'planet' : 'house',
  provenance:
    'Sidney Hall’s Urania’s Mirror (1825), public-domain constellation cards via Wikimedia Commons; original DIVINE interpretation.',
}));

const STANDARD_SYSTEMS: SystemDefinition[] = [
  {
    slug: 'tarot',
    index: '01',
    name: 'Tarot',
    shortName: 'Tarot',
    kind: 'cards',
    countLabel: '78 cards',
    eyebrow: 'Arcana / Pattern',
    introduction:
      'Tarot uses familiar archetypes, suits, and numbers to show the forces shaping a question and the choices still available.',
    instruction:
      'Keep one question in mind. Read each position in order, then look at how the cards affect one another.',
    reversalStyle: 'optional',
    cards: tarot,
    spreads: tarotSpreads,
    cover: '/art/tarot.webp',
  },
  {
    slug: 'oracle',
    index: '02',
    name: 'Oracle',
    shortName: 'Oracle',
    kind: 'cards',
    countLabel: '44 cards',
    eyebrow: 'Image / Reflection',
    introduction:
      'Forty-four images invite personal associations rather than one fixed system of meaning.',
    instruction:
      'Notice the first detail that catches your attention, then ask what it brings to mind.',
    cards: oracle,
    spreads: oracleSpreads,
    cover: '/art/oracle.webp',
  },
  {
    slug: 'lenormand',
    index: '03',
    name: 'Lenormand',
    shortName: 'Lenormand',
    kind: 'cards',
    countLabel: '36 cards',
    eyebrow: 'Symbol / Proximity',
    introduction:
      'Lenormand uses direct symbols for people, events, choices, and delays. Nearby cards combine into practical statements.',
    instruction:
      'Ask about a concrete situation. Read the closest pairs first, then use distance and timing for context.',
    cards: lenormand,
    spreads: [
      spread(
        'single',
        'Single card',
        'One concrete signal.',
        ['Signal'],
        'single',
      ),
      spread(
        'line-three',
        'Line of Three',
        'Subject, modifier, and direction.',
        ['Subject', 'Influence', 'Direction'],
        'line',
      ),
      spread(
        'portrait-nine',
        'Nine-card Portrait',
        'A compact field of past, present, and emerging events.',
        Array.from({ length: 9 }, (_, i) => `Field ${i + 1}`),
        'grid',
      ),
      spread(
        'grand-tableau',
        'Grand Tableau',
        'All thirty-six cards mapped across the houses.',
        lenormandEntries.map(([name]) => `House of ${name}`),
        'tableau',
      ),
    ],
    cover: '/art/lenormand.webp',
  },
  {
    slug: 'spellcraft',
    index: '04',
    name: 'Ritual',
    shortName: 'Ritual',
    kind: 'cards',
    countLabel: '36 cards',
    eyebrow: 'Ritual / Intention',
    introduction:
      'A contemporary ritual deck that turns an intention into an object, boundary, gesture, or finishable action.',
    instruction:
      'Name what you are willing to do or change, not only what you hope to receive.',
    cards: spellcraft,
    spreads: simpleSpreads(
      'Daily intention',
      'Intention / Block / Action',
      'Ritual Path',
      ['Intention', 'Block', 'Action'],
      ['Desire', 'Material', 'Boundary', 'Action', 'Seal'],
    ),
    cover: '/art/spellcraft.webp',
  },
  {
    slug: 'ancient-egypt',
    index: '05',
    name: 'Temple',
    shortName: 'Temple',
    kind: 'cards',
    countLabel: '36 cards',
    eyebrow: 'Image / Continuity',
    introduction:
      'A contemporary oracle reflecting on historical Egyptian images of balance, passage, protection, and renewal.',
    instruction:
      'Begin with the image and its historical context before giving it a personal meaning.',
    cards: egypt,
    spreads: simpleSpreads(
      'Single symbol',
      'Threshold / Trial / Gift',
      'Temple Path',
      ['Threshold', 'Trial', 'Gift'],
      ['Gate', 'Offering', 'Measure', 'Passage', 'Horizon'],
    ),
    cover: '/art/ancient-egypt.webp',
  },
  {
    slug: 'zodiac',
    index: '06',
    name: 'Zodiac',
    shortName: 'Zodiac',
    kind: 'cards',
    countLabel: '34 cards',
    eyebrow: 'Sky / Timing',
    introduction:
      'Signs describe how something happens, planets describe the drive behind it, and houses show the area of life involved.',
    instruction:
      'Choose the part of life that feels most active, then combine the sign, planet, and house into one statement.',
    cards: zodiac,
    spreads: [
      spread(
        'archetype',
        'Single archetype',
        'One celestial influence.',
        ['Archetype'],
        'single',
      ),
      spread(
        'celestial-triad',
        'Sign / Planet / House',
        'Quality, impulse, and arena.',
        ['Sign', 'Planet', 'House'],
        'line',
      ),
      spread(
        'celestial-pattern',
        'Celestial Pattern',
        'A five-point reading of pressure and possibility.',
        ['Quality', 'Impulse', 'Arena', 'Tension', 'Invitation'],
        'cross',
      ),
    ],
    cover: '/art/zodiac.webp',
  },
  {
    slug: 'magic-8-ball',
    index: '07',
    name: 'Magic 8 Ball',
    shortName: 'Magic 8 Ball',
    kind: 'ball',
    countLabel: '24 answers',
    eyebrow: 'Chance / Decision',
    introduction:
      'A familiar chance oracle for questions that can be answered yes, no, or not yet.',
    instruction:
      'Ask one clear yes-or-no question, then shake the ball for an answer.',
    cards: [],
    spreads: [],
    cover: '/art/magic-8-ball.webp',
  },
  {
    slug: 'fortune-cookie',
    index: '08',
    name: 'Fortune Cookie',
    shortName: 'Fortune Cookie',
    kind: 'cookie',
    countLabel: '144 fortunes',
    eyebrow: 'Chance / Message',
    introduction:
      'Break open a short, unexpected message and use it as a prompt for reflection.',
    instruction:
      'Choose a cookie without overthinking it, then read the message against your question.',
    cards: [],
    spreads: [],
    cover: '/art/fortune-cookie.webp',
  },
  ...TRADITIONAL_CARD_SYSTEMS,
];

const divinePositions = [
  'Underlying pattern',
  'Image and intuition',
  'Immediate situation',
  'Practical action',
  'History and inheritance',
  'Timing and direction',
  'People and circumstances',
  'Active influence',
  'Everyday reality',
  'Conversation and response',
  'Strength at work',
  'How change may unfold',
  'Poetic counsel',
  'Season and pace',
  'What may be approaching',
  'Final perspective',
];

const divineDecks = STANDARD_SYSTEMS.filter(
  (system) => system.kind === 'cards',
);

export const DIVINE_SYSTEM: SystemDefinition = {
  slug: 'divine',
  index: '00',
  name: 'DIVINE Reading',
  shortName: 'DIVINE',
  kind: 'cards',
  countLabel: `${divineDecks.length} decks · ${divineDecks.reduce((count, deck) => count + deck.cards.length, 0)} cards`,
  eyebrow: 'All decks / One pattern',
  introduction:
    'Draw one card from each of sixteen decks. Read every card in its own tradition, then compare the themes they share or challenge.',
  instruction:
    'Keep one question in mind. Read each card first, then use the links between decks as possibilities rather than fixed conclusions.',
  reversalStyle: 'optional',
  cards: divineDecks.flatMap((deck) =>
    deck.cards.map((card) => ({
      ...card,
      id: `${deck.slug}:${card.id}`,
      sourceSystem: deck.slug,
      sourceSystemName: deck.name,
    })),
  ),
  spreads: [
    spread(
      'whole-constellation',
      'The Whole Constellation',
      'One card from every deck, read as one connected sequence.',
      divinePositions,
      'grid',
    ),
  ],
  cover: '/hero/divine-crystal.webp',
};

export const SYSTEMS: SystemDefinition[] = [DIVINE_SYSTEM, ...STANDARD_SYSTEMS];

export const SYSTEM_MAP = Object.fromEntries(
  SYSTEMS.map((system) => [system.slug, system]),
) as Record<SystemSlug, SystemDefinition>;

export function isSystemSlug(value: string): value is SystemSlug {
  return value in SYSTEM_MAP;
}

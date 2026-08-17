import type { CardSystemSlug } from './decks';

export type RitualId =
  | 'silk-deck'
  | 'image-cabinet'
  | 'message-ribbon'
  | 'working-altar'
  | 'papyrus-folio'
  | 'celestial-instrument'
  | 'sealed-letter'
  | 'planetary-prism'
  | 'table-riffle'
  | 'conversation-theatre'
  | 'rune-pouch'
  | 'hexagram-book'
  | 'divan'
  | 'flower-box'
  | 'picture-album'
  | 'sand-figure';

export type RitualGesture =
  | 'right'
  | 'left'
  | 'up'
  | 'down'
  | 'circle'
  | 'shake'
  | 'hold';

export type RitualSound =
  | 'tick'
  | 'turn'
  | 'shuffle'
  | 'deal'
  | 'peel'
  | 'reveal'
  | 'liquid'
  | 'crack'
  | 'resolve';

export interface RitualAction {
  label: string;
  instruction: string;
  announcement: string;
  gesture: RitualGesture;
  cue: RitualSound;
  duration: number;
}

export interface CardRitualProfile {
  id: RitualId;
  object: string;
  completion: string;
  actions: RitualAction[];
}

const action = (
  label: string,
  instruction: string,
  announcement: string,
  gesture: RitualGesture,
  cue: RitualSound,
  duration = 560,
): RitualAction => ({
  label,
  instruction,
  announcement,
  gesture,
  cue,
  duration,
});

export const CARD_RITUALS: Record<CardSystemSlug, CardRitualProfile> = {
  tarot: {
    id: 'silk-deck',
    object: 'A silk-wrapped deck',
    completion: 'The cloth is open. The cards enter the field.',
    actions: [
      action(
        'Unwrap',
        'Draw the marked corner to uncover the deck',
        'The silk loosens and the deck is uncovered.',
        'right',
        'peel',
        720,
      ),
      action(
        'Shuffle',
        'Sweep upward to pass the cards between the hands',
        'The fixed order loosens in an overhand shuffle.',
        'up',
        'shuffle',
        820,
      ),
      action(
        'Cut',
        'Draw the upper packet to the left',
        'The deck is cut and rejoined.',
        'left',
        'turn',
        620,
      ),
      action(
        'Open',
        'Lift through the deck to open the fan',
        'The arc opens and the cards leave the fan.',
        'up',
        'deal',
        760,
      ),
    ],
  },
  oracle: {
    id: 'image-cabinet',
    object: 'A cabinet of image plates',
    completion: 'The chosen image develops into the reading.',
    actions: [
      action(
        'Open',
        'Draw the portfolio covers apart',
        'The image portfolio opens.',
        'right',
        'turn',
        680,
      ),
      action(
        'Browse',
        'Move across the layered prints',
        'The images pass beneath your hand.',
        'left',
        'shuffle',
        720,
      ),
      action(
        'Choose',
        'Lift one plate from the cabinet',
        'One image leaves the cabinet and develops.',
        'up',
        'reveal',
        820,
      ),
    ],
  },
  lenormand: {
    id: 'message-ribbon',
    object: 'A message ribbon in a dispatch case',
    completion: 'The symbolic sentence lies open from near to far.',
    actions: [
      action(
        'Unlatch',
        'Slide the brass catch aside',
        'The dispatch case opens.',
        'right',
        'tick',
        360,
      ),
      action(
        'Draw',
        'Pull the linked symbols from the case',
        'The message lengthens as neighboring symbols meet.',
        'right',
        'shuffle',
        760,
      ),
      action(
        'Tear',
        'Pull down across the perforation',
        'The message separates and straightens into its reading.',
        'down',
        'peel',
        720,
      ),
    ],
  },
  spellcraft: {
    id: 'working-altar',
    object: 'A small working altar',
    completion: 'The intention is sealed. The symbols remain.',
    actions: [
      action(
        'Place',
        'Move the materials into the marked field',
        'The materials take their places.',
        'up',
        'turn',
        620,
      ),
      action(
        'Trace',
        'Draw one continuous circle around the work',
        'The traced line closes around the intention.',
        'circle',
        'peel',
        760,
      ),
      action(
        'Seal',
        'Press through the center to seal the work',
        'A single pulse seals the field.',
        'down',
        'resolve',
        720,
      ),
    ],
  },
  'ancient-egypt': {
    id: 'papyrus-folio',
    object: 'An archival papyrus folio',
    completion: 'The selected panels leave the folio intact.',
    actions: [
      action(
        'Unroll',
        'Draw the right rod outward',
        'The conservation folio opens.',
        'right',
        'turn',
        760,
      ),
      action(
        'Register',
        'Move across the illustrated panels',
        'The guide settles over the reading field.',
        'left',
        'tick',
        480,
      ),
      action(
        'Lift',
        'Lift the registered images from the sheet',
        'The selected images rise from the folio.',
        'up',
        'reveal',
        760,
      ),
    ],
  },
  zodiac: {
    id: 'celestial-instrument',
    object: 'A three-ring celestial instrument',
    completion: 'Quality, impulse, and arena align on one meridian.',
    actions: [
      action(
        'Quality',
        'Turn the outer ring of signs',
        'The sign ring finds its position.',
        'circle',
        'turn',
        700,
      ),
      action(
        'Impulse',
        'Turn the planetary ring against it',
        'The planetary impulse moves into alignment.',
        'circle',
        'liquid',
        700,
      ),
      action(
        'Arena',
        'Turn the inner ring of houses',
        'The houses align and the center opens.',
        'circle',
        'resolve',
        820,
      ),
    ],
  },
  kipper: {
    id: 'sealed-letter',
    object: 'A sealed household letter',
    completion: 'The correspondence unfolds into a field of scenes.',
    actions: [
      action(
        'Tear',
        'Draw the paper tab across the top edge',
        'The edge tears open and the strip falls away.',
        'right',
        'peel',
        760,
      ),
      action(
        'Open',
        'Lift the envelope flap',
        'The flap opens and the inner packet appears.',
        'up',
        'turn',
        560,
      ),
      action(
        'Extract',
        'Pull the packet free of the envelope',
        'The packet slips free and unfolds.',
        'up',
        'deal',
        860,
      ),
    ],
  },
  belline: {
    id: 'planetary-prism',
    object: 'A seven-facet planetary prism',
    completion: 'The planetary light condenses into events.',
    actions: [
      action(
        'Aim',
        'Turn the prism through its seven influences',
        'The planetary facets pass through the beam.',
        'circle',
        'liquid',
        700,
      ),
      action(
        'Catch',
        'Hold the bright facet in the beam',
        'One planetary family holds the light.',
        'hold',
        'tick',
        520,
      ),
      action(
        'Split',
        'Draw the light outward into the field',
        'The beam separates into the reading positions.',
        'right',
        'reveal',
        820,
      ),
    ],
  },
  'playing-card-cartomancy': {
    id: 'table-riffle',
    object: 'A familiar table pack',
    completion: 'The squared pack deals across the table.',
    actions: [
      action(
        'Split',
        'Draw the pack into two equal halves',
        'The pack separates cleanly.',
        'right',
        'turn',
        480,
      ),
      action(
        'Riffle',
        'Pull down to interleave the corners',
        'The two halves interleave.',
        'down',
        'shuffle',
        720,
      ),
      action(
        'Bridge',
        'Lift and release the joined pack',
        'The bridge cascades flat and squares itself.',
        'up',
        'deal',
        760,
      ),
    ],
  },
  sibilla: {
    id: 'conversation-theatre',
    object: 'A miniature conversation theatre',
    completion: 'The scenes face one another and the reply begins.',
    actions: [
      action(
        'Open',
        'Draw the curtain cord to the side',
        'The conversation theatre opens.',
        'right',
        'turn',
        640,
      ),
      action(
        'Enter',
        'Bring the outer scenes onto the stage',
        'The scenes enter from opposite sides.',
        'left',
        'deal',
        720,
      ),
      action(
        'Converse',
        'Sweep across the line toward its hinge',
        'The scenes turn toward the center and become one reply.',
        'right',
        'reveal',
        760,
      ),
    ],
  },
  'runic-cards': {
    id: 'rune-pouch',
    object: 'A cloth pouch of carved tiles',
    completion: 'The cast settles and the runes turn toward you.',
    actions: [
      action(
        'Loosen',
        'Draw the cord away from the knot',
        'The mouth of the pouch opens.',
        'right',
        'peel',
        540,
      ),
      action(
        'Shake',
        'Move the pouch until the tiles answer',
        'The carved pieces shift inside the cloth.',
        'shake',
        'shuffle',
        700,
      ),
      action(
        'Cast',
        'Flick upward to cast the needed runes',
        'The runes leave the pouch and settle in reading order.',
        'up',
        'deal',
        900,
      ),
    ],
  },
  'i-ching-cards': {
    id: 'hexagram-book',
    object: 'A bound book of hexagram leaves',
    completion: 'Six lines form the figure from the ground upward.',
    actions: [
      action(
        'Riffle',
        'Move along the visible fore-edge',
        'The hexagram leaves pass beneath the thumb.',
        'down',
        'shuffle',
        720,
      ),
      action(
        'Release',
        'Let the remaining pages coast to rest',
        'The book settles on one opening.',
        'left',
        'turn',
        540,
      ),
      action(
        'Inscribe',
        'Lift through the six lines from bottom to top',
        'The chosen figure is inscribed from bottom to top.',
        'up',
        'reveal',
        760,
      ),
    ],
  },
  'fal-e-hafez': {
    id: 'divan',
    object: 'A manuscript Divān',
    completion:
      'The opening offers an image and an omen, never an invented verse.',
    actions: [
      action(
        'Attend',
        'Rest on the cover until the surrounding motion quiets',
        'The question rests on the closed volume.',
        'hold',
        'tick',
        620,
      ),
      action(
        'Riffle',
        'Move a thumb along the page edges',
        'The manuscript pages pass beneath your hand.',
        'down',
        'shuffle',
        760,
      ),
      action(
        'Open',
        'Release the volume onto one opening',
        'The Divān opens and the poetic motif rises.',
        'left',
        'reveal',
        860,
      ),
    ],
  },
  hanafuda: {
    id: 'flower-box',
    object: 'A paulownia card box',
    completion: 'The gathered flowers settle into a seasonal field.',
    actions: [
      action(
        'Open',
        'Slide the wooden lid upward',
        'The paulownia box opens.',
        'up',
        'turn',
        620,
      ),
      action(
        'Scatter',
        'Draw the flower cards into a seasonal arc',
        'The months spread across the field.',
        'right',
        'deal',
        760,
      ),
      action(
        'Gather',
        'Brush through the flowers to gather the reading',
        'The selected flowers rise from the season.',
        'left',
        'reveal',
        760,
      ),
    ],
  },
  zigeunerkarten: {
    id: 'picture-album',
    object: 'An album of historical picture cards',
    completion: 'The selected scenes form one practical sequence.',
    actions: [
      action(
        'Unclasp',
        'Draw the two metal clasps outward',
        'The picture album opens.',
        'right',
        'tick',
        480,
      ),
      action(
        'Browse',
        'Turn the mounted scenes through the album',
        'The historical scenes rotate into view.',
        'circle',
        'shuffle',
        720,
      ),
      action(
        'Pull',
        'Lift the foremost scene from its mount',
        'The chosen scenes leave the album and arrange themselves.',
        'up',
        'deal',
        820,
      ),
    ],
  },
  'ilm-al-raml': {
    id: 'sand-figure',
    object: 'A field of leveled sand',
    completion: 'The four rows resolve visibly into one geomantic figure.',
    actions: [
      action(
        'Prepare',
        'Sweep across the field to level the sand',
        'The previous marks disappear and the field is level.',
        'right',
        'turn',
        620,
      ),
      action(
        'First row',
        'Make the first quick row of uncounted marks',
        'The first row groups itself into pairs.',
        'right',
        'peel',
        520,
      ),
      action(
        'Second row',
        'Make the second row without counting',
        'The second row resolves to one or two points.',
        'right',
        'peel',
        520,
      ),
      action(
        'Third row',
        'Make the third row without counting',
        'The third row resolves beneath the first two.',
        'right',
        'peel',
        520,
      ),
      action(
        'Fourth row',
        'Make the final row and release the figure',
        'The four resolved rows align into the figure.',
        'right',
        'reveal',
        820,
      ),
    ],
  },
};

export const DIVINE_RITUAL: CardRitualProfile = {
  id: 'image-cabinet',
  object: 'The complete cabinet of decks',
  completion: 'Sixteen cards leave sixteen decks and form one constellation.',
  actions: [
    action(
      'Gather',
      'Draw the cabinet open to gather every deck',
      'The sixteen decks enter one field.',
      'right',
      'turn',
      680,
    ),
    action(
      'Listen',
      'Move across the layered decks without choosing a favorite',
      'Every tradition is given an equal voice.',
      'left',
      'shuffle',
      760,
    ),
    action(
      'Connect',
      'Lift the constellation from the cabinet',
      'One card rises from every deck and the connections appear.',
      'up',
      'reveal',
      920,
    ),
  ],
};

export function ritualForSystem(slug: CardSystemSlug): CardRitualProfile {
  return CARD_RITUALS[slug];
}

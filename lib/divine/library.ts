import type { SystemSlug } from './types';

export type LibraryBackgroundTone =
  | 'ink'
  | 'sepia'
  | 'color'
  | 'nocturne'
  | 'silver';

export interface LibraryBackground {
  backgroundImage: string;
  backgroundLayer: 'field' | 'left' | 'right' | 'top' | 'bottom';
  backgroundFit?: 'cover' | 'contain';
  backgroundPosition: string;
  backgroundPositionMobile: string;
  backgroundScale: number;
  backgroundScaleMobile: number;
  backgroundTone: LibraryBackgroundTone;
  backgroundOpacity: number;
}

type LibraryBackgroundSet = readonly [
  LibraryBackground,
  LibraryBackground,
  ...LibraryBackground[],
];

export interface LibraryMastheadBackground {
  backgroundImage: string;
  backgroundLayer: 'field' | 'left' | 'right' | 'band';
  backgroundFit: 'cover' | 'contain';
  backgroundPosition: string;
  backgroundPositionMobile: string;
  backgroundScale: number;
  backgroundTone: LibraryBackgroundTone;
  backgroundOpacity: number;
  hideOnMobile?: boolean;
}

/** A permanent archival identity for the Library, independent of method. */
export const LIBRARY_MASTHEAD_BACKGROUNDS: readonly LibraryMastheadBackground[] =
  [
    {
      backgroundImage:
        '/library/backgrounds/library-masthead-sense-of-sight-1617.webp',
      backgroundLayer: 'field',
      backgroundFit: 'cover',
      backgroundPosition: '58% 52%',
      backgroundPositionMobile: '67% 50%',
      backgroundScale: 1.04,
      backgroundTone: 'color',
      backgroundOpacity: 0.46,
    },
    {
      backgroundImage:
        '/library/backgrounds/library-masthead-marot-library-1703.webp',
      backgroundLayer: 'left',
      backgroundFit: 'cover',
      backgroundPosition: '62% 48%',
      backgroundPositionMobile: '50% 50%',
      backgroundScale: 1.08,
      backgroundTone: 'ink',
      backgroundOpacity: 0.58,
      hideOnMobile: true,
    },
    {
      backgroundImage:
        '/library/backgrounds/library-masthead-arcimboldo-librarian-1562.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '100% 35%',
      backgroundPositionMobile: '108% 34%',
      backgroundScale: 1.02,
      backgroundTone: 'nocturne',
      backgroundOpacity: 0.7,
    },
    {
      backgroundImage:
        '/library/backgrounds/library-masthead-sainte-genevieve-1688.webp',
      backgroundLayer: 'band',
      backgroundFit: 'cover',
      backgroundPosition: '50% 61%',
      backgroundPositionMobile: '50% 50%',
      backgroundScale: 1,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.34,
      hideOnMobile: true,
    },
  ];

/** Quiet fixed texture below the method-specific navigator artwork. */
export const LIBRARY_NAVIGATOR_FOUNDATION: LibraryMastheadBackground = {
  backgroundImage:
    '/library/backgrounds/library-navigator-francken-cabinet-1619.webp',
  backgroundLayer: 'field',
  backgroundFit: 'cover',
  backgroundPosition: '50% 56%',
  backgroundPositionMobile: '58% 52%',
  backgroundScale: 1.03,
  backgroundTone: 'color',
  backgroundOpacity: 0.2,
};

/**
 * Decorative archival plates for each Library entry. Keeping this exhaustive
 * makes a new reading method fail type-checking until its imagery is assigned.
 */
export const LIBRARY_BACKGROUNDS: Record<SystemSlug, LibraryBackgroundSet> = {
  divine: [
    {
      backgroundImage:
        '/library/backgrounds/divine-fortune-teller-de-la-tour.webp',
      backgroundLayer: 'field',
      backgroundPosition: '52% 43%',
      backgroundPositionMobile: '54% 28%',
      backgroundScale: 1.04,
      backgroundScaleMobile: 1.12,
      backgroundTone: 'nocturne',
      backgroundOpacity: 0.42,
    },
    {
      backgroundImage: '/library/backgrounds/divine-museum-wormianum-1655.webp',
      backgroundLayer: 'bottom',
      backgroundPosition: '42% 50%',
      backgroundPositionMobile: '50% 42%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.04,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.48,
    },
  ],
  tarot: [
    {
      backgroundImage: '/library/backgrounds/tarot-tarocchi-cards-ca-1500.webp',
      backgroundLayer: 'field',
      backgroundPosition: '72% 47%',
      backgroundPositionMobile: '52% 22%',
      backgroundScale: 1.07,
      backgroundScaleMobile: 1.08,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.44,
    },
    {
      backgroundImage:
        '/library/backgrounds/tarot-high-priestess-smith-1909.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '50% 36%',
      backgroundPositionMobile: '50% 28%',
      backgroundScale: 1.06,
      backgroundScaleMobile: 1.02,
      backgroundTone: 'ink',
      backgroundOpacity: 0.52,
    },
  ],
  oracle: [
    {
      backgroundImage:
        '/library/backgrounds/oracle-petit-oracle-amour-1807.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '76% 48%',
      backgroundPositionMobile: '62% 24%',
      backgroundScale: 1.12,
      backgroundScaleMobile: 1.12,
      backgroundTone: 'color',
      backgroundOpacity: 0.4,
    },
    {
      backgroundImage:
        '/library/backgrounds/oracle-symbolique-milkmaid-1890.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '50% 38%',
      backgroundPositionMobile: '50% 26%',
      backgroundScale: 1.05,
      backgroundScaleMobile: 1.06,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.5,
    },
  ],
  lenormand: [
    {
      backgroundImage: '/library/backgrounds/lenormand-game-of-hope-1799.webp',
      backgroundLayer: 'field',
      backgroundPosition: '76% 50%',
      backgroundPositionMobile: '55% 23%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.16,
      backgroundTone: 'color',
      backgroundOpacity: 0.41,
    },
    {
      backgroundImage: '/library/backgrounds/lenormand-portrait-ledoux.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '50% 30%',
      backgroundPositionMobile: '50% 24%',
      backgroundScale: 1.03,
      backgroundScaleMobile: 1.05,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.51,
    },
  ],
  spellcraft: [
    {
      backgroundImage:
        '/library/backgrounds/spellcraft-baldung-witches-1510.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '72% 48%',
      backgroundPositionMobile: '58% 23%',
      backgroundScale: 1.03,
      backgroundScaleMobile: 1.14,
      backgroundTone: 'ink',
      backgroundOpacity: 0.43,
    },
    {
      backgroundImage:
        '/library/backgrounds/spellcraft-magic-circle-waterhouse-1886.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '52% 42%',
      backgroundPositionMobile: '50% 30%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.08,
      backgroundTone: 'nocturne',
      backgroundOpacity: 0.5,
    },
  ],
  'ancient-egypt': [
    {
      backgroundImage:
        '/library/backgrounds/ancient-egypt-weighing-heart-ani.webp',
      backgroundLayer: 'top',
      backgroundPosition: '70% 48%',
      backgroundPositionMobile: '56% 22%',
      backgroundScale: 1.05,
      backgroundScaleMobile: 1.2,
      backgroundTone: 'color',
      backgroundOpacity: 0.45,
    },
    {
      backgroundImage:
        '/library/backgrounds/ancient-egypt-nebamun-marsh-hunt.webp',
      backgroundLayer: 'bottom',
      backgroundPosition: '42% 46%',
      backgroundPositionMobile: '44% 28%',
      backgroundScale: 1.13,
      backgroundScaleMobile: 1.1,
      backgroundTone: 'color',
      backgroundOpacity: 0.49,
    },
  ],
  zodiac: [
    {
      backgroundImage:
        '/library/backgrounds/zodiac-trouvelot-zodiacal-light-1882.webp',
      backgroundLayer: 'field',
      backgroundPosition: '74% 46%',
      backgroundPositionMobile: '58% 22%',
      backgroundScale: 1.04,
      backgroundScaleMobile: 1.15,
      backgroundTone: 'nocturne',
      backgroundOpacity: 0.48,
    },
    {
      backgroundImage: '/library/backgrounds/zodiac-jamieson-virgo-1822.webp',
      backgroundLayer: 'bottom',
      backgroundPosition: '50% 42%',
      backgroundPositionMobile: '50% 28%',
      backgroundScale: 1.06,
      backgroundScaleMobile: 1.04,
      backgroundTone: 'ink',
      backgroundOpacity: 0.48,
    },
  ],
  'magic-8-ball': [
    {
      backgroundImage:
        '/library/backgrounds/magic-8-ball-billiard-room-rowlandson-1801.webp',
      backgroundLayer: 'field',
      backgroundPosition: '68% 50%',
      backgroundPositionMobile: '66% 26%',
      backgroundScale: 1.06,
      backgroundScaleMobile: 1.18,
      backgroundTone: 'color',
      backgroundOpacity: 0.42,
    },
    {
      backgroundImage:
        '/library/backgrounds/magic-8-ball-crystal-ball-waterhouse-1902.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '48% 30%',
      backgroundPositionMobile: '50% 26%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.08,
      backgroundTone: 'nocturne',
      backgroundOpacity: 0.52,
    },
  ],
  'fortune-cookie': [
    {
      backgroundImage:
        '/library/backgrounds/fortune-cookie-tsujiura-senbei-1878.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '74% 50%',
      backgroundPositionMobile: '60% 22%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.2,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.43,
    },
    {
      backgroundImage:
        '/library/backgrounds/fortune-cookie-sweetshop-takehara-1787.webp',
      backgroundLayer: 'bottom',
      backgroundPosition: '52% 45%',
      backgroundPositionMobile: '50% 28%',
      backgroundScale: 1.05,
      backgroundScaleMobile: 1.08,
      backgroundTone: 'ink',
      backgroundOpacity: 0.48,
    },
  ],
  kipper: [
    {
      backgroundImage:
        '/library/backgrounds/kipper-letter-carrier-spitzweg-1858.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '72% 72%',
      backgroundPositionMobile: '58% 30%',
      backgroundScale: 1.05,
      backgroundScaleMobile: 1.13,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.42,
    },
    {
      backgroundImage:
        '/library/backgrounds/kipper-munich-street-cleaner-1908.webp',
      backgroundLayer: 'field',
      backgroundPosition: '52% 68%',
      backgroundPositionMobile: '50% 55%',
      backgroundScale: 1.14,
      backgroundScaleMobile: 1.16,
      backgroundTone: 'ink',
      backgroundOpacity: 0.54,
    },
  ],
  belline: [
    {
      backgroundImage:
        '/library/backgrounds/belline-mage-edmond-diagram-1870.webp',
      backgroundLayer: 'field',
      backgroundPosition: '76% 48%',
      backgroundPositionMobile: '62% 24%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.2,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.44,
    },
    {
      backgroundImage: '/library/backgrounds/belline-card-reader-wattier.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '50% 34%',
      backgroundPositionMobile: '50% 26%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.08,
      backgroundTone: 'color',
      backgroundOpacity: 0.51,
    },
  ],
  'playing-card-cartomancy': [
    {
      backgroundImage:
        '/library/backgrounds/playing-card-cartomancy-cezanne-1890.webp',
      backgroundLayer: 'left',
      backgroundPosition: '71% 50%',
      backgroundPositionMobile: '58% 24%',
      backgroundScale: 1.05,
      backgroundScaleMobile: 1.17,
      backgroundTone: 'color',
      backgroundOpacity: 0.4,
    },
    {
      backgroundImage:
        '/library/backgrounds/playing-card-cartomancy-boilly-1822.webp',
      backgroundLayer: 'right',
      backgroundPosition: '50% 42%',
      backgroundPositionMobile: '50% 28%',
      backgroundScale: 1.1,
      backgroundScaleMobile: 1.08,
      backgroundTone: 'ink',
      backgroundOpacity: 0.5,
    },
  ],
  sibilla: [
    {
      backgroundImage:
        '/library/backgrounds/sibilla-cumaean-sibyl-veneziano-1516.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '74% 43%',
      backgroundPositionMobile: '60% 22%',
      backgroundScale: 1.04,
      backgroundScaleMobile: 1.14,
      backgroundTone: 'ink',
      backgroundOpacity: 0.43,
    },
    {
      backgroundImage:
        '/library/backgrounds/sibilla-cumaean-sibyl-domenichino-1617.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '54% 30%',
      backgroundPositionMobile: '52% 24%',
      backgroundScale: 1.1,
      backgroundScaleMobile: 1.08,
      backgroundTone: 'color',
      backgroundOpacity: 0.49,
    },
  ],
  'runic-cards': [
    {
      backgroundImage: '/library/backgrounds/runic-cards-kylver-stone.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '72% 30%',
      backgroundPositionMobile: '60% 20%',
      backgroundScale: 1.06,
      backgroundScaleMobile: 1.18,
      backgroundTone: 'silver',
      backgroundOpacity: 0.45,
    },
    {
      backgroundImage: '/library/backgrounds/runic-cards-ro-stone.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '50% 46%',
      backgroundPositionMobile: '50% 30%',
      backgroundScale: 1.04,
      backgroundScaleMobile: 1.03,
      backgroundTone: 'ink',
      backgroundOpacity: 0.53,
    },
  ],
  'i-ching-cards': [
    {
      backgroundImage:
        '/library/backgrounds/i-ching-leibniz-hexagrams-1701.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '74% 50%',
      backgroundPositionMobile: '58% 23%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.17,
      backgroundTone: 'ink',
      backgroundOpacity: 0.42,
    },
    {
      backgroundImage: '/library/backgrounds/i-ching-fuxi-eight-trigrams.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '50% 34%',
      backgroundPositionMobile: '50% 26%',
      backgroundScale: 1.04,
      backgroundScaleMobile: 1.04,
      backgroundTone: 'sepia',
      backgroundOpacity: 0.5,
    },
  ],
  'fal-e-hafez': [
    {
      backgroundImage:
        '/library/backgrounds/fal-e-hafez-dancing-dervishes.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '73% 65%',
      backgroundPositionMobile: '58% 48%',
      backgroundScale: 1.06,
      backgroundScaleMobile: 1.17,
      backgroundTone: 'color',
      backgroundOpacity: 0.43,
    },
    {
      backgroundImage: '/library/backgrounds/fal-e-hafez-prince-and-poet.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '52% 42%',
      backgroundPositionMobile: '52% 28%',
      backgroundScale: 1.05,
      backgroundScaleMobile: 1.05,
      backgroundTone: 'color',
      backgroundOpacity: 0.52,
    },
  ],
  hanafuda: [
    {
      backgroundImage:
        '/library/backgrounds/hanafuda-cranes-snow-pine-hokusai.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '76% 37%',
      backgroundPositionMobile: '64% 20%',
      backgroundScale: 1.04,
      backgroundScaleMobile: 1.13,
      backgroundTone: 'color',
      backgroundOpacity: 0.44,
    },
    {
      backgroundImage:
        '/library/backgrounds/hanafuda-grasshopper-iris-hokusai.webp',
      backgroundLayer: 'field',
      backgroundPosition: '48% 50%',
      backgroundPositionMobile: '48% 30%',
      backgroundScale: 1.06,
      backgroundScaleMobile: 1.06,
      backgroundTone: 'color',
      backgroundOpacity: 0.52,
    },
  ],
  zigeunerkarten: [
    {
      backgroundImage:
        '/library/backgrounds/zigeunerkarten-kartenlegerin-kurzbauer.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '70% 48%',
      backgroundPositionMobile: '58% 24%',
      backgroundScale: 1.05,
      backgroundScaleMobile: 1.17,
      backgroundTone: 'silver',
      backgroundOpacity: 0.52,
    },
    {
      backgroundImage:
        '/library/backgrounds/zigeunerkarten-letter-reader-bertuch.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '50% 34%',
      backgroundPositionMobile: '50% 25%',
      backgroundScale: 1.04,
      backgroundScaleMobile: 1.04,
      backgroundTone: 'color',
      backgroundOpacity: 0.5,
    },
  ],
  'ilm-al-raml': [
    {
      backgroundImage: '/library/backgrounds/ilm-al-raml-figures-folio-32.webp',
      backgroundLayer: 'left',
      backgroundFit: 'contain',
      backgroundPosition: '72% 48%',
      backgroundPositionMobile: '58% 22%',
      backgroundScale: 1.04,
      backgroundScaleMobile: 1.15,
      backgroundTone: 'ink',
      backgroundOpacity: 0.52,
    },
    {
      backgroundImage: '/library/backgrounds/ilm-al-raml-figures-folio-44.webp',
      backgroundLayer: 'right',
      backgroundFit: 'contain',
      backgroundPosition: '50% 48%',
      backgroundPositionMobile: '50% 28%',
      backgroundScale: 1.08,
      backgroundScaleMobile: 1.06,
      backgroundTone: 'ink',
      backgroundOpacity: 0.5,
    },
  ],
};

export interface LibraryNavigatorBackgrounds {
  field: LibraryBackground;
  card: LibraryBackground;
  fieldFit?: 'cover' | 'contain';
  fieldPosition?: string;
  fieldPositionMobile?: string;
  fieldScale?: number;
  cardFit?: 'cover' | 'contain';
  cardPosition?: string;
  cardPositionMobile?: string;
  cardScale?: number;
}

/**
 * Explicit surface assignments for the method navigator. New systems must
 * choose their field and card artwork rather than inheriting array order.
 */
export const LIBRARY_NAVIGATOR_BACKGROUNDS: Record<
  SystemSlug,
  LibraryNavigatorBackgrounds
> = {
  divine: {
    field: LIBRARY_BACKGROUNDS.divine[0],
    card: LIBRARY_BACKGROUNDS.divine[1],
  },
  tarot: {
    field: LIBRARY_BACKGROUNDS.tarot[0],
    card: LIBRARY_BACKGROUNDS.tarot[1],
  },
  oracle: {
    field: LIBRARY_BACKGROUNDS.oracle[1],
    card: LIBRARY_BACKGROUNDS.oracle[0],
  },
  lenormand: {
    field: LIBRARY_BACKGROUNDS.lenormand[0],
    card: LIBRARY_BACKGROUNDS.lenormand[1],
  },
  spellcraft: {
    field: LIBRARY_BACKGROUNDS.spellcraft[1],
    card: LIBRARY_BACKGROUNDS.spellcraft[0],
  },
  'ancient-egypt': {
    field: LIBRARY_BACKGROUNDS['ancient-egypt'][0],
    card: LIBRARY_BACKGROUNDS['ancient-egypt'][1],
  },
  zodiac: {
    field: LIBRARY_BACKGROUNDS.zodiac[0],
    card: LIBRARY_BACKGROUNDS.zodiac[1],
  },
  'magic-8-ball': {
    field: LIBRARY_BACKGROUNDS['magic-8-ball'][0],
    card: LIBRARY_BACKGROUNDS['magic-8-ball'][1],
  },
  'fortune-cookie': {
    field: LIBRARY_BACKGROUNDS['fortune-cookie'][1],
    card: LIBRARY_BACKGROUNDS['fortune-cookie'][0],
  },
  kipper: {
    field: LIBRARY_BACKGROUNDS.kipper[1],
    card: LIBRARY_BACKGROUNDS.kipper[0],
  },
  belline: {
    field: LIBRARY_BACKGROUNDS.belline[0],
    card: LIBRARY_BACKGROUNDS.belline[1],
  },
  'playing-card-cartomancy': {
    field: LIBRARY_BACKGROUNDS['playing-card-cartomancy'][0],
    card: LIBRARY_BACKGROUNDS['playing-card-cartomancy'][1],
  },
  sibilla: {
    field: LIBRARY_BACKGROUNDS.sibilla[1],
    card: LIBRARY_BACKGROUNDS.sibilla[0],
  },
  'runic-cards': {
    field: LIBRARY_BACKGROUNDS['runic-cards'][0],
    card: LIBRARY_BACKGROUNDS['runic-cards'][1],
  },
  'i-ching-cards': {
    field: LIBRARY_BACKGROUNDS['i-ching-cards'][0],
    card: LIBRARY_BACKGROUNDS['i-ching-cards'][1],
  },
  'fal-e-hafez': {
    field: LIBRARY_BACKGROUNDS['fal-e-hafez'][0],
    card: LIBRARY_BACKGROUNDS['fal-e-hafez'][1],
  },
  hanafuda: {
    field: LIBRARY_BACKGROUNDS.hanafuda[0],
    card: LIBRARY_BACKGROUNDS.hanafuda[1],
  },
  zigeunerkarten: {
    field: LIBRARY_BACKGROUNDS.zigeunerkarten[0],
    card: LIBRARY_BACKGROUNDS.zigeunerkarten[1],
  },
  'ilm-al-raml': {
    field: LIBRARY_BACKGROUNDS['ilm-al-raml'][0],
    card: LIBRARY_BACKGROUNDS['ilm-al-raml'][1],
  },
};

export interface MethodHistory {
  slug: SystemSlug;
  period: string;
  origin: string;
  title: string;
  history: string[];
  variant?: string;
  source?: { label: string; url: string };
}

export const METHOD_HISTORIES: Record<SystemSlug, MethodHistory> = {
  divine: {
    slug: 'divine',
    period: 'DIVINE synthesis / present',
    origin: 'Sixteen card traditions in conversation',
    title: 'No single deck gets the last word.',
    history: [
      'The DIVINE Reading is a contemporary synthesis rather than a historical divination system. It draws one card from every card deck in the collection, preserving each tradition’s own imagery and vocabulary.',
      'The cards are read in a fixed arc from underlying pattern to final judgment. Each voice modifies the one before it, so the reading’s meaning lives in the connections between decks as much as in the individual cards.',
    ],
    variant:
      'For a reading rooted in one historical method, choose that deck directly. This mode is intentionally cross-traditional.',
  },
  tarot: {
    slug: 'tarot',
    period: '15th century → present',
    origin: 'Northern Italy / Europe',
    title: 'First a game. Later, an oracle.',
    history: [
      'Tarot emerged in fifteenth-century northern Italy as a trick-taking card game: four familiar suits joined by a Fool and twenty-one trumps. Its occult and divinatory life developed much later, gathering force in France and Britain from the late eighteenth century onward.',
      'DIVINE follows the seventy-eight-card Rider–Waite–Smith structure published in 1909, with original interpretations and public-domain imagery.',
    ],
    variant:
      'Tarot de Marseille is a separate historical family with older continental designs, pip-based minor cards, and a distinct reading tradition.',
    source: {
      label: 'The Metropolitan Museum of Art',
      url: 'https://www.metmuseum.org/perspectives/tarot-2',
    },
  },
  oracle: {
    slug: 'oracle',
    period: '19th century → present',
    origin: 'European cartomancy / contemporary practice',
    title: 'A category without one canon.',
    history: [
      'Oracle cards are not one fixed lineage or deck structure. The name now covers independent symbolic decks whose makers establish their own images, sequence, and interpretive rules.',
      'DIVINE’s forty-four-card oracle is contemporary and original. It reads through association: image first, doctrine second.',
    ],
  },
  lenormand: {
    slug: 'lenormand',
    period: 'Early–mid 19th century',
    origin: 'France / Germany',
    title: 'Her name outlived her deck.',
    history: [
      'Marie Anne Adélaïde Lenormand was a celebrated card reader in Napoleonic France. The compact thirty-six-card oracle now called Petit Lenormand was published after her death and attached to her reputation.',
      'Its vocabulary is concrete—Rider, House, Key, Ring—and meaning changes through proximity. DIVINE uses the complete public-domain artwork from Johann Kaspar Hechtel’s 1799 Game of Hope, the deck whose sequence became the Petit Lenormand.',
    ],
    variant:
      'The Grand Jeu de Mlle Lenormand is a different, larger deck. DIVINE uses the familiar thirty-six-card Petit Lenormand, including a Grand Tableau spread.',
    source: {
      label: 'Wikimedia Commons · The Game of Hope',
      url: 'https://commons.wikimedia.org/wiki/File:Das_Spiel_der_Hofnung_(The_Game_of_Hope).png',
    },
  },
  spellcraft: {
    slug: 'spellcraft',
    period: 'Folk material practice → present',
    origin: 'Contemporary DIVINE system',
    title: 'The symbol asks for an act.',
    history: [
      'Ritual traditions across cultures have long used ordinary matter—salt, thread, flame, water, iron—as carriers of intention. There is no single historical ritual-card canon.',
      'This thirty-six-card system is an original contemporary deck. It does not reconstruct or claim ownership of a closed tradition; it turns familiar materials into prompts for deliberate action.',
    ],
  },
  'ancient-egypt': {
    slug: 'ancient-egypt',
    period: 'Ancient omen practice → contemporary deck',
    origin: 'Egypt / contemporary DIVINE system',
    title: 'Ancient images. A modern oracle.',
    history: [
      'Ancient Egyptian life included dreams, omens, protective objects, temple ritual, and the close relationship of medicine and magic. A surviving dream book from about 1220 BCE classifies visions as favorable or unfavorable signs.',
      'DIVINE’s thirty-six cards are a modern, Egyptian-inspired oracle—not an ancient recovered deck. Names and symbols are kept in historical context while the interpretations remain contemporary.',
    ],
    source: {
      label: 'The British Museum',
      url: 'https://www.britishmuseum.org/sites/default/files/2022-10/Hieroglyphs_unlocking_ancient_Egypt_large_print_guide_The_British_Museum.pdf',
    },
  },
  zodiac: {
    slug: 'zodiac',
    period: 'Babylonia → Hellenistic world → present',
    origin: 'Mesopotamia / Mediterranean',
    title: 'The sky became a system of coordinates.',
    history: [
      'Babylonian scholars divided the ecliptic into twelve zodiacal units and read celestial phenomena as signs. Horoscopic astrology later developed through exchange across the Hellenistic world.',
      'DIVINE separates the grammar into thirty-four cards: signs describe quality, planetary bodies describe impulse, and houses describe the field of life where that impulse appears.',
    ],
    source: {
      label: 'The Metropolitan Museum of Art',
      url: 'https://resources.metmuseum.org/resources/metpublications/pdf/The_World_between_Empires_Art_and_Identity_in_the_Ancient_Middle_East.pdf',
    },
  },
  kipper: {
    slug: 'kipper',
    period: 'Late 19th century → present',
    origin: 'Bavaria / Germany',
    title: 'Everyday life became a directional field.',
    history: [
      'Kipper is a thirty-six-card German fortune-telling system populated by people, rooms, institutions, journeys, work, money, fortune, and adversity. Unlike decks built mainly from emblematic objects, its scenes emphasize social roles and concrete circumstances.',
      'DIVINE includes all thirty-six traditional card subjects with original interpretations. Its line and portrait spreads preserve Kipper’s practical, relational character without tying a reader’s significator to gender.',
    ],
    source: {
      label: 'World Divination Association · Kipper Cards',
      url: 'https://www.worlddivinationassociation.com/kippercards',
    },
  },
  belline: {
    slug: 'belline',
    period: '19th–20th century → present',
    origin: 'France',
    title: 'Named events orbit seven planets.',
    history: [
      'The Oracle Belline is a fifty-three-card French system attributed to the nineteenth-century designs of Edmond Billaudot, known as Mage Edmond, and later popularized under the name of the reader Belline. Its cards combine direct event titles with the seven classical planetary rulers.',
      'DIVINE preserves the complete named sequence, including the Blue Card, Destiny, and the two Star cards. Every interpretation is original, and the Seven Planets spread deliberately draws one card from each planetary family.',
    ],
    source: {
      label: 'OracleNova · Belline reference',
      url: 'https://www.oraclenova.app/en/oracles/belline',
    },
  },
  'playing-card-cartomancy': {
    slug: 'playing-card-cartomancy',
    period: '18th century → present',
    origin: 'Europe / many regional traditions',
    title: 'The common pack acquired a second language.',
    history: [
      'Cartomancy with ordinary playing cards developed through multiple regional and family traditions rather than one universally fixed dictionary. A standard French-suited pack offers fifty-two combinations of rank and suit, sometimes supplemented by jokers.',
      'DIVINE uses the closed fifty-two-card pack without jokers. Rank supplies the movement, court, or stage; suit locates it in relationship, resources, action, or challenge. The resulting meanings are an original, consistent synthesis rather than a claim of one authoritative folk method.',
    ],
    source: {
      label: 'Victoria and Albert Museum · A history of tarot cards',
      url: 'https://www.vam.ac.uk/articles/tarot-cards',
    },
  },
  sibilla: {
    slug: 'sibilla',
    period: '19th century → present',
    origin: 'Italy',
    title: 'Fifty-two scenes speak like conversation.',
    history: [
      'The Vera Sibilla Italiana is a fifty-two-card oracle aligned to the four suits and thirteen ranks of a playing-card pack. Named scenes such as Conversation, House, Journey, Hope, Sorrow, and Letter make its vocabulary concrete and social.',
      'DIVINE keeps the Italian titles, their suit positions, and a full upright and reversed meaning for every card. The odd-numbered line spreads emphasize the center card as a hinge between surrounding scenes.',
    ],
    source: {
      label: 'World Divination Association · La Vera Sibilla',
      url: 'https://www.worlddivinationassociation.com/la-vera-sibilla',
    },
  },
  'runic-cards': {
    slug: 'runic-cards',
    period: '2nd–8th centuries CE → modern divination',
    origin: 'Germanic Europe / Scandinavia',
    title: 'An alphabet became a modern oracle.',
    history: [
      'The Elder Futhark is an early runic writing system of twenty-four characters arranged in three groups of eight. The characters and many reconstructed names are historical; a standardized card-divination system and the so-called blank rune are modern additions.',
      'DIVINE includes the twenty-four attested characters and omits a blank rune. Literal names are separated from original contemporary reflections so that modern practice is not presented as recovered ancient doctrine.',
    ],
    source: {
      label: 'Swedish History Museum · The Kylver Stone',
      url: 'https://historiska.se/historien-om-sverige-kylverstenen/?exhibition=true',
    },
  },
  'i-ching-cards': {
    slug: 'i-ching-cards',
    period: 'Late 2nd millennium BCE → present',
    origin: 'China',
    title: 'Sixty-four figures describe change.',
    history: [
      'The Yijing, or I Ching, organizes sixty-four hexagrams formed from six broken or unbroken lines. Its received King Wen sequence is a textual and divinatory tradition far older and more complex than modern card decks.',
      'DIVINE presents every hexagram in King Wen order with its Chinese title, common English name, and an original reflection. Drawing a card selects a stable figure; it does not imitate the changing-line mathematics of yarrow-stalk or three-coin casting.',
    ],
    source: {
      label: 'Leibniz Archive · 1701 hexagram diagram',
      url: 'https://commons.wikimedia.org/wiki/File:Diagram_of_I_Ching_hexagrams_owned_by_Gottfried_Wilhelm_Leibniz,_1701.jpg',
    },
  },
  'fal-e-hafez': {
    slug: 'fal-e-hafez',
    period: 'After the 14th century → present',
    origin: 'Iran / Persian literary culture',
    title: 'A poem is opened; a life answers.',
    history: [
      'Fāl-e Hāfez is traditionally bibliomancy: a question is held, the Divān of Hafez is opened at random, and the encountered ghazal is read as the omen. A verse from the following poem may serve as the šāhed, or witness. There is no historical canonical Hafez card deck.',
      'DIVINE therefore labels its version as a contemporary thirty-six-card adaptation. It uses recurring poetic motifs and original English reflections—never invented quotations or unattributed translations—and offers an Omen and Witness spread in memory of the book practice.',
    ],
    source: {
      label: 'Encyclopaedia Iranica · Divination',
      url: 'https://www.iranicaonline.org/articles/divination/',
    },
  },
  hanafuda: {
    slug: 'hanafuda',
    period: 'Early 19th century → present',
    origin: 'Japan',
    title: 'Twelve months bloom across forty-eight cards.',
    history: [
      'Hanafuda are Japanese playing cards organized into twelve monthly flower suits of four cards each. Light, Seed, Ribbon, and Plain categories support games such as koi-koi; the pack is not historically a single standardized divination system.',
      'DIVINE includes the complete forty-eight-card month, motif, and class structure. Its seasonal meanings are explicitly contemporary reflections and do not replace the cards’ living game traditions.',
    ],
    source: {
      label: 'Nintendo · Hanafuda manual',
      url: 'https://www.nintendo.com/eu/media/downloads/other_1/my_nintendo_store_3/MyNintendoStore_Manual_Hanafuda_MarioCards_UKV.pdf',
    },
  },
  zigeunerkarten: {
    slug: 'zigeunerkarten',
    period: 'Late 19th century → present',
    origin: 'Central Europe / Austro-Hungarian publishing',
    title: 'Thirty-six everyday subjects, without fixed numbers.',
    history: [
      'Zigeunerkarten are a thirty-six-card Central European fortune-telling family with multilingual titles and concrete scenes such as Visit, Letter, Money, Hope, Journey, Fidelity, and Unexpected Joy. They are related in reading style to other European situation decks but remain a distinct system from Kipper.',
      'The historical product name is an outdated exonym and does not establish Roma authorship or a recovered ethnic tradition. DIVINE retains the searchable deck name while preserving the traditional German subject list, pairing every subject with a different public-domain museum work, and labeling the result as a modern historical-art edition.',
    ],
    variant:
      'Publishers have changed artwork, caption languages, and ordering; unlike many numbered oracle decks, the traditional subjects are commonly identified by title.',
    source: {
      label: 'German-language overview · Zigeunerkarten',
      url: 'https://de.wikipedia.org/wiki/Zigeunerkarten',
    },
  },
  'ilm-al-raml': {
    slug: 'ilm-al-raml',
    period: 'Medieval Arabic tradition → present',
    origin: 'Arabic-speaking world / wider geomantic transmission',
    title: 'The science of sand generates sixteen figures.',
    history: [
      'ʿIlm al-raml, literally the “science of sand,” works with sixteen possible figures. Each figure has four lines containing either one or two points; figures are generated and combined into a structured tableau whose positions include the Mothers, Daughters, Nieces, Witnesses, and Judge.',
      'A fixed deck of sixteen cards is not the historical casting method. DIVINE presents the complete figure set as a study and reflection interface, places each figure over a different public-domain image from Wellcome Collection MS Arabic 664, and explicitly does not claim that a random card draw calculates a traditional shield chart.',
    ],
    variant:
      'Names and correspondences vary across Arabic manuscripts and later European geomantic traditions. The interface uses the stable Latin figure names and notes one Arabic-name family without treating it as universal.',
    source: {
      label: 'Wellcome Collection · Treatise on ʿilm al-raml',
      url: 'https://wellcomecollection.org/works/agpcdkbz',
    },
  },
  'magic-8-ball': {
    slug: 'magic-8-ball',
    period: '20th century → present',
    origin: 'United States',
    title: 'Certainty, reduced to a shake.',
    history: [
      'The answer ball belongs to the twentieth-century lineage of novelty fortune devices: ask a closed question, disturb the object, receive a brief verdict through a window.',
      'DIVINE preserves that ritual but uses original monochrome artwork and an original set of twenty-four answers rather than reproducing the commercial object or its classic phrase set.',
    ],
  },
  'fortune-cookie': {
    slug: 'fortune-cookie',
    period: 'Early 20th century → present',
    origin: 'Japanese American California',
    title: 'A message folded into migration.',
    history: [
      'The modern fortune cookie is an American form with Japanese roots. In early twentieth-century San Francisco, Japanese confectioner Benkyodo supplied folded tea cakes to the Japanese Tea Garden; their later association with Chinese American restaurants grew during and after World War II.',
      'DIVINE treats the cookie as a small chance ritual: choose, fracture, unfold. Its 144 fortunes and number sets are original.',
    ],
    source: {
      label: 'Smithsonian National Museum of American History',
      url: 'https://americanhistory.si.edu/explore/stories/origins-fortune-cookie',
    },
  },
};

import type { SystemSlug } from './types';

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

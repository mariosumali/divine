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
      label: 'The British Museum · Eight Trigrams',
      url: 'https://www.britishmuseum.org/collection/object/A_PDF-C-619',
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

import { CARD_SYSTEM_SLUGS } from './decks';
import type { SystemSlug } from './types';

export interface CatalogSystem {
  slug: SystemSlug;
  name: string;
  description: string;
}

export const CATALOG_SYSTEMS = [
  {
    slug: 'divine',
    name: 'DIVINE Reading',
    description: 'One card from every deck · one connected reading',
  },
  { slug: 'tarot', name: 'Tarot', description: 'Archetypes · choice · change' },
  {
    slug: 'oracle',
    name: 'Oracle',
    description: 'Images · intuition · reflection',
  },
  {
    slug: 'lenormand',
    name: 'Lenormand',
    description: 'Practical symbols · events · timing',
  },
  {
    slug: 'spellcraft',
    name: 'Ritual',
    description: 'Intention · objects · action',
  },
  {
    slug: 'ancient-egypt',
    name: 'Temple',
    description: 'Historical images · balance · renewal',
  },
  {
    slug: 'zodiac',
    name: 'Zodiac',
    description: 'Signs · planets · houses',
  },
  {
    slug: 'magic-8-ball',
    name: 'Magic 8 Ball',
    description: 'A clear answer by chance',
  },
  {
    slug: 'fortune-cookie',
    name: 'Fortune Cookie',
    description: 'A short message to reflect on',
  },
  {
    slug: 'kipper',
    name: 'Kipper',
    description: 'People · places · circumstances',
  },
  {
    slug: 'belline',
    name: 'Belline',
    description: 'Events under planetary influence',
  },
  {
    slug: 'playing-card-cartomancy',
    name: 'Playing Card Cartomancy',
    description: 'Suit and rank in everyday life',
  },
  {
    slug: 'sibilla',
    name: 'Sibilla Italiana',
    description: 'Everyday scenes in conversation',
  },
  {
    slug: 'runic-cards',
    name: 'Runic Cards',
    description: 'Historical runes · modern reflection',
  },
  {
    slug: 'i-ching-cards',
    name: 'I Ching Cards',
    description: 'Hexagrams · conditions · change',
  },
  {
    slug: 'fal-e-hafez',
    name: 'Fal-e Hafez Cards',
    description: 'Original poetic images and counsel',
  },
  {
    slug: 'hanafuda',
    name: 'Hanafuda',
    description: 'Flowers · seasons · changing pace',
  },
  {
    slug: 'zigeunerkarten',
    name: 'Zigeunerkarten',
    description: 'People · events · fortunes',
  },
  {
    slug: 'ilm-al-raml',
    name: 'ʿIlm al-Raml Cards',
    description: 'Geomantic figures for reflection',
  },
] as const satisfies readonly CatalogSystem[];

export const CATALOG_NAME_MAP = Object.fromEntries(
  CATALOG_SYSTEMS.map((system) => [system.slug, system.name]),
) as Record<SystemSlug, string>;

/** The exact object artwork used to identify each reading on the landing page. */
export const READING_INDEX_ART: Record<SystemSlug, string> = {
  divine: '/hero/divine-crystal.webp',
  tarot: '/collage-v1/hand.webp',
  oracle: '/collage-v1/eye.webp',
  lenormand: '/collage-v1/key.webp',
  spellcraft: '/collage-v1/matches.webp',
  'ancient-egypt': '/collage-v1/bust.webp',
  zodiac: '/collage-v1/star.webp',
  kipper: '/collage-v1/envelope.webp',
  belline: '/collage-v1/prism.webp',
  'playing-card-cartomancy': '/collage-v1/domino.webp',
  sibilla: '/collage-v1/rose.webp',
  'runic-cards': '/collage-v1/crystal.webp',
  'i-ching-cards': '/collage-v1/compass.webp',
  'fal-e-hafez': '/collage-v1/pen.webp',
  hanafuda: '/collage-v1/peony.webp',
  zigeunerkarten: '/traditional-decks-v1/zigeunerkarten/zigeunerkarten-17.webp',
  'ilm-al-raml': '/traditional-decks-v1/ilm-al-raml/ilm-al-raml-16.webp',
  'magic-8-ball': '/index-art-v2/magic-8-ball.webp',
  'fortune-cookie': '/index-art/fortune-cookie.webp',
};

export const CARD_TRADITION_COUNT = CARD_SYSTEM_SLUGS.length;
export const INDIVIDUAL_READING_COUNT = CATALOG_SYSTEMS.length - 1;
export const TOTAL_READING_EXPERIENCE_COUNT = CATALOG_SYSTEMS.length;

export const EXPERIENCE_DESCRIPTION = `${TOTAL_READING_EXPERIENCE_COUNT} interactive reading experiences: one unified reading, ${CARD_TRADITION_COUNT} card traditions, and two chance oracles.`;

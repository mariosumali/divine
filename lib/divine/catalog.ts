import { CARD_SYSTEM_SLUGS } from './decks';
import type { SystemSlug } from './types';

export interface CatalogSystem {
  slug: SystemSlug;
  name: string;
}

export const CATALOG_SYSTEMS = [
  { slug: 'divine', name: 'DIVINE Reading' },
  { slug: 'tarot', name: 'Tarot' },
  { slug: 'oracle', name: 'Oracle' },
  { slug: 'lenormand', name: 'Lenormand' },
  { slug: 'spellcraft', name: 'Ritual' },
  { slug: 'ancient-egypt', name: 'Temple' },
  { slug: 'zodiac', name: 'Zodiac' },
  { slug: 'magic-8-ball', name: 'Magic 8 Ball' },
  { slug: 'fortune-cookie', name: 'Fortune Cookie' },
  { slug: 'kipper', name: 'Kipper' },
  { slug: 'belline', name: 'Belline' },
  { slug: 'playing-card-cartomancy', name: 'Playing Card Cartomancy' },
  { slug: 'sibilla', name: 'Sibilla Italiana' },
  { slug: 'runic-cards', name: 'Runic Cards' },
  { slug: 'i-ching-cards', name: 'I Ching Cards' },
  { slug: 'fal-e-hafez', name: 'Fal-e Hafez Cards' },
  { slug: 'hanafuda', name: 'Hanafuda' },
  { slug: 'zigeunerkarten', name: 'Zigeunerkarten' },
  { slug: 'ilm-al-raml', name: 'ʿIlm al-Raml Cards' },
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

export const EXPERIENCE_DESCRIPTION = `${TOTAL_READING_EXPERIENCE_COUNT} interactive reading experiences: one unified constellation, ${CARD_TRADITION_COUNT} card traditions, and two chance oracles.`;

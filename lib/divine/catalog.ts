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

export const CARD_TRADITION_COUNT = CARD_SYSTEM_SLUGS.length;
export const INDIVIDUAL_READING_COUNT = CATALOG_SYSTEMS.length - 1;
export const TOTAL_READING_EXPERIENCE_COUNT = CATALOG_SYSTEMS.length;

export const EXPERIENCE_DESCRIPTION = `${TOTAL_READING_EXPERIENCE_COUNT} interactive reading experiences: one unified constellation, ${CARD_TRADITION_COUNT} card traditions, and two chance oracles.`;

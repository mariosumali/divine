import { describe, expect, it } from 'vitest';
import {
  divineHeroIcon,
  DIVINE_HERO_ICONS,
  isDivineHeroIconId,
} from './hero-icons';

describe('DIVINE hero icon catalog', () => {
  it('keeps a unique selectable entry for every curated hero object', () => {
    expect(DIVINE_HERO_ICONS).toHaveLength(30);
    expect(new Set(DIVINE_HERO_ICONS.map((icon) => icon.id))).toHaveLength(30);
    expect(
      DIVINE_HERO_ICONS.every(
        (icon) => icon.src === `/collage-v1/${icon.id}.webp`,
      ),
    ).toBe(true);
  });

  it('only resolves allowlisted icon ids', () => {
    expect(isDivineHeroIconId('star')).toBe(true);
    expect(divineHeroIcon('star')).toMatchObject({
      id: 'star',
      label: 'Star',
      src: '/collage-v1/star.webp',
    });
    expect(isDivineHeroIconId('../other-image')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  LIBRARY_BACKGROUNDS,
  LIBRARY_MASTHEAD_BACKGROUNDS,
  LIBRARY_NAVIGATOR_BACKGROUNDS,
  LIBRARY_NAVIGATOR_FOUNDATION,
  METHOD_HISTORIES,
} from './library';
import { SYSTEMS } from './systems';

describe('DIVINE library', () => {
  it('documents every reading system', () => {
    for (const system of SYSTEMS) {
      const history = METHOD_HISTORIES[system.slug];
      expect(history.slug).toBe(system.slug);
      expect(history.title.length).toBeGreaterThan(8);
      expect(history.history.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('assigns multiple distinct archival backgrounds to every system', () => {
    const layerKinds = new Set<string>();
    const imagePaths = SYSTEMS.flatMap((system) => {
      const backgrounds = LIBRARY_BACKGROUNDS[system.slug];

      expect(backgrounds.length).toBeGreaterThanOrEqual(2);
      for (const background of backgrounds) {
        layerKinds.add(background.backgroundLayer);
        expect(background.backgroundImage).toMatch(
          /^\/library\/backgrounds\/[a-z0-9-]+\.webp$/,
        );
        expect(['field', 'left', 'right', 'top', 'bottom']).toContain(
          background.backgroundLayer,
        );
        if (background.backgroundFit) {
          expect(['cover', 'contain']).toContain(background.backgroundFit);
        }
        expect(background.backgroundPosition).toMatch(/% /);
        expect(background.backgroundPositionMobile).toMatch(/% /);
        expect(background.backgroundScale).toBeGreaterThanOrEqual(1);
        expect(background.backgroundScaleMobile).toBeGreaterThanOrEqual(1);
        expect(background.backgroundOpacity).toBeGreaterThan(0.3);
      }

      return backgrounds.map((background) => background.backgroundImage);
    });

    expect(imagePaths).toHaveLength(38);
    expect(new Set(imagePaths).size).toBe(imagePaths.length);
    expect(layerKinds).toEqual(
      new Set(['field', 'left', 'right', 'top', 'bottom']),
    );
  });

  it('assigns explicit, distinct navigator surfaces to every system', () => {
    for (const system of SYSTEMS) {
      const entryBackgrounds = LIBRARY_BACKGROUNDS[system.slug];
      const navigatorBackgrounds = LIBRARY_NAVIGATOR_BACKGROUNDS[system.slug];

      expect(navigatorBackgrounds.field.backgroundImage).not.toBe(
        navigatorBackgrounds.card.backgroundImage,
      );
      expect(entryBackgrounds).toContain(navigatorBackgrounds.field);
      expect(entryBackgrounds).toContain(navigatorBackgrounds.card);
    }
  });

  it('keeps the permanent Library montage local and visually varied', () => {
    const featureImages = [
      ...LIBRARY_MASTHEAD_BACKGROUNDS.map(
        (background) => background.backgroundImage,
      ),
      LIBRARY_NAVIGATOR_FOUNDATION.backgroundImage,
    ];

    expect(featureImages).toHaveLength(5);
    expect(new Set(featureImages).size).toBe(featureImages.length);
    expect(
      featureImages.every((image) =>
        /^\/library\/backgrounds\/[a-z0-9-]+\.webp$/.test(image),
      ),
    ).toBe(true);
  });

  it('indexes every authored card with a standalone meaning', () => {
    const cards = SYSTEMS.filter((system) => system.slug !== 'divine').flatMap(
      (system) => system.cards,
    );
    expect(cards).toHaveLength(681);
    expect(
      cards.every(
        (card) => card.name && card.meaning && card.keywords.length > 0,
      ),
    ).toBe(true);
  });

  it('keeps the named historical variants explicit', () => {
    expect(METHOD_HISTORIES.tarot.variant).toContain('Tarot de Marseille');
    expect(METHOD_HISTORIES.lenormand.variant).toContain(
      'Grand Jeu de Mlle Lenormand',
    );
  });

  it('labels modern adaptations without inventing historical canons', () => {
    expect(METHOD_HISTORIES['fal-e-hafez'].history.join(' ')).toContain(
      'There is no historical canonical Hafez card deck',
    );
    expect(METHOD_HISTORIES.hanafuda.history.join(' ')).toContain(
      'not historically a single standardized divination system',
    );
    expect(METHOD_HISTORIES['runic-cards'].history.join(' ')).toContain(
      'modern additions',
    );
    expect(METHOD_HISTORIES['ilm-al-raml'].history.join(' ')).toContain(
      'not the historical casting method',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { METHOD_HISTORIES } from './library';
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

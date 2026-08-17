import { describe, expect, it } from 'vitest';
import { CARD_SYSTEM_SLUGS } from './decks';
import { CARD_RITUALS, DIVINE_RITUAL, ritualForSystem } from './rituals';

describe('card rituals', () => {
  it('defines a distinct ritual for every card system', () => {
    expect(Object.keys(CARD_RITUALS).sort()).toEqual(
      [...CARD_SYSTEM_SLUGS].sort(),
    );
    expect(
      new Set(Object.values(CARD_RITUALS).map((ritual) => ritual.id)).size,
    ).toBe(CARD_SYSTEM_SLUGS.length);
  });

  it.each(CARD_SYSTEM_SLUGS)('%s has a complete gesture sequence', (slug) => {
    const ritual = ritualForSystem(slug);
    expect(ritual.object.length).toBeGreaterThan(3);
    expect(ritual.completion.length).toBeGreaterThan(3);
    expect(ritual.actions.length).toBeGreaterThanOrEqual(3);
    ritual.actions.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(step.instruction).toBeTruthy();
      expect(step.announcement).toBeTruthy();
      expect(step.duration).toBeGreaterThanOrEqual(300);
    });
  });

  it('gathers and connects every deck for a DIVINE reading', () => {
    expect(DIVINE_RITUAL.actions.map((step) => step.label)).toEqual([
      'Gather',
      'Listen',
      'Connect',
    ]);
    expect(DIVINE_RITUAL.completion).toContain('Sixteen cards');
  });
});

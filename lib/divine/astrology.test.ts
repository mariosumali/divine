import { describe, expect, it } from 'vitest';
import { alignmentProfileFor } from './astrology';

describe('alignmentProfileFor', () => {
  it('maps opposite signs to a 180 degree opposition', () => {
    const profile = alignmentProfileFor(0, 6);

    expect(profile.angle).toBe(180);
    expect(profile.aspect.name).toBe('Opposition');
  });

  it('uses the shortest distance across the end of the zodiac', () => {
    const profile = alignmentProfileFor(11, 0);

    expect(profile.angle).toBe(30);
    expect(profile.aspect.name).toBe('Semi-sextile');
  });

  it('identifies same-element trines', () => {
    const profile = alignmentProfileFor(0, 8);

    expect(profile.angle).toBe(120);
    expect(profile.aspect.name).toBe('Trine');
    expect(profile.element.label).toBe('Shared element');
  });
});

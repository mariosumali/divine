import { describe, expect, it } from 'vitest';
import {
  imageWidthsForPath,
  isResponsiveLocalImage,
  normalizeLocalImagePath,
  responsiveImagePath,
} from './image-variants';

describe('responsive image variants', () => {
  it('uses role-appropriate widths', () => {
    expect(imageWidthsForPath('/tarot/major-0.webp')).toEqual([
      128, 192, 384, 768,
    ]);
    expect(imageWidthsForPath('/collage-archive/hand.webp')).toEqual([
      96, 192, 384, 640,
    ]);
    expect(
      imageWidthsForPath('/library/backgrounds/library-masthead.webp'),
    ).toEqual([640, 960, 1280, 1920]);
    expect(imageWidthsForPath('/card-backs/deck.jpg')).toEqual([384, 768]);
  });

  it('constructs deterministic encoded derivative URLs', () => {
    expect(
      responsiveImagePath('/art/my image.PNG?version=2', 384, 'abc123'),
    ).toBe('/_i/abc123/384/art/my%20image.webp');
    expect(normalizeLocalImagePath('art/card.webp#detail')).toBe(
      '/art/card.webp',
    );
  });

  it('only accepts safe root-relative raster paths', () => {
    expect(isResponsiveLocalImage('/tarot/major-0.webp')).toBe(true);
    expect(isResponsiveLocalImage('https://example.com/card.webp')).toBe(false);
    expect(isResponsiveLocalImage('//example.com/card.webp')).toBe(false);
    expect(isResponsiveLocalImage('/tarot/../secret.webp')).toBe(false);
    expect(isResponsiveLocalImage('/tarot/card.svg')).toBe(false);
  });
});

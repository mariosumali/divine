export const IMAGE_PIPELINE_REVISION = '2026-09-03-1';

const CARD_PREFIXES = [
  '/lenormand/',
  '/open-decks-v1/',
  '/tarot/',
  '/tarot-color/',
  '/traditional-decks-v1/',
] as const;

const SMALL_ART_PREFIXES = [
  '/art/',
  '/astrology/signs/',
  '/collage-archive/',
  '/collage-v1/',
  '/index-art/',
  '/index-art-v2/',
] as const;

const LARGE_ART_PREFIXES = [
  '/astrology/backgrounds/',
  '/hero/',
  '/library/backgrounds/',
  '/share/',
] as const;

export const RESPONSIVE_IMAGE_EXTENSIONS = /\.(?:avif|jpe?g|png|webp)$/iu;

export interface GeneratedImageInfo {
  width: number;
  variants: readonly number[];
}

export type GeneratedImageManifest = Record<string, GeneratedImageInfo>;

export function normalizeLocalImagePath(source: string) {
  const pathname = source.split(/[?#]/u, 1)[0] ?? source;
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export function imageWidthsForPath(source: string): readonly number[] {
  const pathname = normalizeLocalImagePath(source);
  if (pathname.startsWith('/card-backs/')) return [384, 768];
  if (CARD_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return [128, 192, 384, 768];
  }
  if (SMALL_ART_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return [96, 192, 384, 640];
  }
  if (LARGE_ART_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return [640, 960, 1280, 1920];
  }
  return [128, 256, 512, 1024, 1600];
}

function encodeAssetPath(pathname: string) {
  return pathname
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function responsiveImagePath(
  source: string,
  width: number,
  version: string,
) {
  const pathname = normalizeLocalImagePath(source).replace(
    RESPONSIVE_IMAGE_EXTENSIONS,
    '.webp',
  );
  return `/_i/${version}/${width}${encodeAssetPath(pathname)}`;
}

export function isResponsiveLocalImage(source: string) {
  const pathname = normalizeLocalImagePath(source);
  const segments = pathname.split('/');
  return (
    source.startsWith('/') &&
    !source.startsWith('//') &&
    !source.includes('\\') &&
    !segments.includes('..') &&
    RESPONSIVE_IMAGE_EXTENSIONS.test(pathname)
  );
}

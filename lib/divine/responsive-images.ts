import {
  isResponsiveLocalImage,
  type GeneratedImageInfo,
  normalizeLocalImagePath,
  responsiveImagePath,
} from './image-variants';

declare const __DIVINE_IMAGE_VERSION__: string;
declare const __DIVINE_IMAGE_MANIFEST__: Record<string, GeneratedImageInfo>;

export function generatedImageInfo(source: string) {
  if (!isResponsiveLocalImage(source)) return undefined;
  return __DIVINE_IMAGE_MANIFEST__[normalizeLocalImagePath(source)];
}

export function optimizedImageSource(source: string, requestedWidth = 768) {
  const info = generatedImageInfo(source);
  if (!info) return source;
  const width = info.variants.find((candidate) => candidate >= requestedWidth);
  if (!width) return source;
  return responsiveImagePath(source, width, __DIVINE_IMAGE_VERSION__);
}

export function responsiveImageSrcSet(
  source: string,
  info: GeneratedImageInfo,
) {
  return [
    ...info.variants.map(
      (candidateWidth) =>
        `${responsiveImagePath(source, candidateWidth, __DIVINE_IMAGE_VERSION__)} ${candidateWidth}w`,
    ),
    ...(info.width > (info.variants.at(-1) ?? 0)
      ? [`${source} ${info.width}w`]
      : []),
  ].join(', ');
}

export function prewarmResponsiveImages(
  sources: readonly (string | undefined)[],
  requestedWidth = 384,
  concurrency = 4,
) {
  if (typeof window === 'undefined') return;
  const queue = [
    ...new Set(sources.filter((source): source is string => !!source)),
  ];
  let cursor = 0;
  const loadNext = () => {
    const source = queue[cursor];
    cursor += 1;
    if (!source) return;
    const image = new window.Image();
    image.decoding = 'async';
    image.fetchPriority = cursor === 1 ? 'high' : 'low';
    image.onload = loadNext;
    image.onerror = loadNext;
    image.src = optimizedImageSource(source, requestedWidth);
  };
  for (let index = 0; index < Math.min(concurrency, queue.length); index += 1) {
    loadNext();
  }
}

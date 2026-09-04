import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharpModule from 'sharp';
import type { Plugin } from 'vite';
import {
  IMAGE_PIPELINE_REVISION,
  RESPONSIVE_IMAGE_EXTENSIONS,
  type GeneratedImageManifest,
  imageWidthsForPath,
  normalizeLocalImagePath,
  responsiveImagePath,
} from '../lib/divine/image-variants';

const PUBLIC_DIRECTORY = path.resolve(process.cwd(), 'public');
const OUTPUT_DIRECTORY = path.join(PUBLIC_DIRECTORY, '_i');
const COMPLETE_MARKER = '.complete';
const MANIFEST_FILE = 'manifest.json';

interface SharpPipeline {
  metadata: () => Promise<{
    width?: number;
    height?: number;
    orientation?: number;
  }>;
  rotate: () => SharpPipeline;
  resize: (options: {
    width: number;
    fit: 'inside';
    withoutEnlargement: boolean;
  }) => SharpPipeline;
  webp: (options: {
    quality: number;
    effort: number;
    smartSubsample: boolean;
  }) => SharpPipeline;
  toFile: (filename: string) => Promise<unknown>;
}

type SharpFactory = {
  (filename: string, options: { failOn: 'none' }): SharpPipeline;
  concurrency: (value: number) => number;
};

const sharp = sharpModule as unknown as SharpFactory;

async function collectSourceImages(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === '_i') return [];
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceImages(absolutePath);
      if (!entry.isFile() || !RESPONSIVE_IMAGE_EXTENSIONS.test(entry.name)) {
        return [];
      }
      return [absolutePath];
    }),
  );
  return files.flat();
}

function publicPathForFile(absolutePath: string) {
  return `/${path.relative(PUBLIC_DIRECTORY, absolutePath).split(path.sep).join('/')}`;
}

async function sourceVersion(files: readonly string[]) {
  const hash = createHash('sha256');
  hash.update(IMAGE_PIPELINE_REVISION);
  for (const filename of files) {
    hash.update(publicPathForFile(filename));
    hash.update(await readFile(filename));
  }
  return hash.digest('hex').slice(0, 12);
}

function outputFileFor(source: string, width: number, version: string) {
  const publicUrl = responsiveImagePath(source, width, version);
  return path.join(PUBLIC_DIRECTORY, decodeURIComponent(publicUrl.slice(1)));
}

async function completedManifest(version: string) {
  try {
    const directory = path.join(OUTPUT_DIRECTORY, version);
    const [marker, manifest] = await Promise.all([
      readFile(path.join(directory, COMPLETE_MARKER), 'utf8'),
      readFile(path.join(directory, MANIFEST_FILE), 'utf8'),
    ]);
    if (marker.trim() !== IMAGE_PIPELINE_REVISION) return null;
    return JSON.parse(manifest) as GeneratedImageManifest;
  } catch {
    return null;
  }
}

async function sourceInfo(filename: string) {
  const metadata = await sharp(filename, { failOn: 'none' }).metadata();
  const rotated = metadata.orientation && metadata.orientation >= 5;
  const naturalWidth = rotated ? metadata.height : metadata.width;
  if (!naturalWidth) {
    throw new Error(
      `Could not read the width of ${publicPathForFile(filename)}`,
    );
  }
  const source = publicPathForFile(filename);
  return {
    source,
    naturalWidth,
    variants: imageWidthsForPath(source).filter(
      (width) => width <= naturalWidth,
    ),
  };
}

async function encodeSource(
  filename: string,
  version: string,
  variants: readonly number[],
) {
  const source = publicPathForFile(filename);
  await Promise.all(
    variants.map(async (width) => {
      const output = outputFileFor(source, width, version);
      await mkdir(path.dirname(output), { recursive: true });
      await sharp(filename, { failOn: 'none' })
        .rotate()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78, effort: 4, smartSubsample: true })
        .toFile(output);
    }),
  );
}

async function mapWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  task: (item: T) => Promise<void>,
) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const item = items[cursor];
        cursor += 1;
        if (item !== undefined) await task(item);
      }
    },
  );
  await Promise.all(workers);
}

export async function generateImageDerivatives() {
  const files = (await collectSourceImages(PUBLIC_DIRECTORY)).sort();
  const version = await sourceVersion(files);
  const completed = await completedManifest(version);
  if (completed) return { version, count: files.length, manifest: completed };

  await rm(OUTPUT_DIRECTORY, { recursive: true, force: true });
  await mkdir(path.join(OUTPUT_DIRECTORY, version), { recursive: true });
  sharp.concurrency(2);
  const manifest: GeneratedImageManifest = {};
  await mapWithConcurrency(files, 6, async (filename) => {
    const info = await sourceInfo(filename);
    manifest[info.source] = {
      width: info.naturalWidth,
      variants: info.variants,
    };
    await encodeSource(filename, version, info.variants);
  });
  const sortedManifest = Object.fromEntries(
    Object.entries(manifest).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  ) as GeneratedImageManifest;
  const directory = path.join(OUTPUT_DIRECTORY, version);
  await writeFile(
    path.join(directory, MANIFEST_FILE),
    `${JSON.stringify(sortedManifest)}\n`,
  );
  await writeFile(
    path.join(directory, COMPLETE_MARKER),
    `${IMAGE_PIPELINE_REVISION}\n`,
  );
  return { version, count: files.length, manifest: sortedManifest };
}

export function responsiveImageAssets(): Plugin {
  let version = '';
  let manifest: GeneratedImageManifest = {};
  return {
    name: 'divine-responsive-image-assets',
    enforce: 'pre',
    async config() {
      const generated = await generateImageDerivatives();
      version = generated.version;
      manifest = generated.manifest;
      return {
        define: {
          __DIVINE_IMAGE_VERSION__: JSON.stringify(version),
          __DIVINE_IMAGE_MANIFEST__: JSON.stringify(manifest),
        },
      };
    },
    transform(code, id) {
      if (!id.split('?', 1)[0]?.endsWith('.css') || !version) return null;
      const rewritten = code.replace(
        /url\((['"])(\/[^'"\n)]+\.(?:avif|jpe?g|png|webp))\1\)/giu,
        (_match, quote: string, source: string) => {
          const width =
            manifest[normalizeLocalImagePath(source)]?.variants.at(-1);
          if (!width) return _match;
          return `url(${quote}${responsiveImagePath(source, width, version)}${quote})`;
        },
      );
      return rewritten === code ? null : { code: rewritten, map: null };
    },
  };
}

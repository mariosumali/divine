import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const API_ROOT = 'https://collectionapi.metmuseum.org/public/collection/v1';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'collage-archive');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const LIMIT = Number(
  process.argv
    .find((argument) => argument.startsWith('--limit='))
    ?.split('=')[1] ?? 80,
);

const SEARCH_TERMS = [
  'astrolabe',
  'amulet',
  'scarab',
  'ushabti',
  'figurine',
  'statuette',
  'ritual mask',
  'mirror',
  'hand mirror',
  'comb',
  'hairpin',
  'brooch',
  'pendant',
  'locket',
  'ring',
  'bracelet',
  'necklace',
  'diadem',
  'fibula',
  'belt buckle',
  'key',
  'lock',
  'door knocker',
  'bell',
  'candlestick',
  'lamp',
  'lantern',
  'incense burner',
  'censer',
  'perfume bottle',
  'flask',
  'chalice',
  'goblet',
  'ewer',
  'pitcher',
  'vase',
  'urn',
  'bowl',
  'reliquary',
  'casket',
  'snuffbox',
  'fan',
  'slipper',
  'helmet',
  'shield',
  'sword',
  'dagger',
  'axe',
  'mace',
  'bow',
  'quiver',
  'spearhead',
  'arrowhead',
  'coin',
  'medal',
  'seal',
  'watch',
  'clock',
  'hourglass',
  'compass',
  'sundial',
  'telescope',
  'microscope',
  'scissors',
  'needle case',
  'spindle',
  'spoon',
  'fork',
  'knife',
  'lyre',
  'harp',
  'lute',
  'horn',
  'flute',
  'drum',
  'rattle',
  'inkwell',
  'playing cards',
  'dice',
  'domino',
  'chess piece',
  'globe',
  'celestial globe',
  'zodiac',
  'moon',
  'sun',
  'angel',
  'dragon',
  'griffin',
  'sphinx',
  'lion',
  'owl',
  'raven',
  'butterfly',
  'moth',
  'beetle',
  'snake',
  'lizard',
  'frog',
  'fish',
  'crab',
  'lobster',
  'shell',
  'coral',
  'flower',
  'lotus',
  'pomegranate',
  'grapes',
  'acorn',
  'leaf',
  'feather',
  'hand',
  'eye',
  'heart',
  'skull',
  'skeleton',
  'wing',
];

const preferredDepartments = new Set([
  'Arms and Armor',
  'Asian Art',
  'Egyptian Art',
  'European Sculpture and Decorative Arts',
  'Greek and Roman Art',
  'Islamic Art',
  'Medieval Art',
  'Musical Instruments',
  'The American Wing',
]);

const flatObjectNames =
  /drawing|folio|manuscript|painting|photograph|print|textile/i;
const undesirableTitles =
  /fragment|section|sheet|study|view of|portrait of|scene/i;
const objectCache = new Map();

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 46);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchJson(url, attempt = 0) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'DIVINE collage asset curator (Open Access)' },
  });
  if (response.ok) return response.json();
  if ([403, 429, 500, 502, 503].includes(response.status) && attempt < 5) {
    await wait(900 * 2 ** attempt);
    return fetchJson(url, attempt + 1);
  }
  throw new Error(`${response.status} ${response.statusText}: ${url}`);
}

async function fetchObject(objectID) {
  if (!objectCache.has(objectID)) {
    objectCache.set(objectID, fetchJson(`${API_ROOT}/objects/${objectID}`));
  }
  return objectCache.get(objectID);
}

function scoreObject(object, term) {
  if (!object?.isPublicDomain || !object.primaryImageSmall) return -Infinity;

  const haystack = `${object.title} ${object.objectName} ${object.tags
    ?.map((tag) => tag.term)
    .join(' ')}`.toLowerCase();
  const exactMatch = haystack.includes(term.toLowerCase());
  let score = exactMatch ? 36 : 0;
  if (preferredDepartments.has(object.department)) score += 24;
  if (!flatObjectNames.test(object.objectName)) score += 28;
  if (flatObjectNames.test(object.objectName)) score -= 30;
  if (undesirableTitles.test(object.title)) score -= 14;
  if (/paper|canvas|silk|album/i.test(object.medium)) score -= 16;
  if (
    /metal|bronze|silver|gold|wood|stone|glass|ceramic|ivory|iron|steel/i.test(
      object.medium,
    )
  ) {
    score += 12;
  }
  return score;
}

async function findObject(term, usedIDs) {
  const query = new URLSearchParams({ hasImages: 'true', q: term });
  const search = await fetchJson(`${API_ROOT}/search?${query}`);
  const candidateIDs = (search.objectIDs ?? []).slice(0, 4);
  const candidates = [];
  for (let index = 0; index < candidateIDs.length; index += 4) {
    candidates.push(
      ...(await Promise.all(
        candidateIDs.slice(index, index + 4).map(async (objectID) => {
          try {
            return await fetchObject(objectID);
          } catch (error) {
            console.warn(
              `Skipping unavailable Met object ${objectID}: ${error.message}`,
            );
            return null;
          }
        }),
      )),
    );
    await wait(80);
  }

  return candidates
    .filter(Boolean)
    .filter((object) => !usedIDs.has(object.objectID))
    .map((object) => ({ object, score: scoreObject(object, term) }))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((a, b) => b.score - a.score)[0]?.object;
}

function median(values) {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)] ?? 0;
}

function colorDistance(r, g, b, background) {
  const red = r - background[0];
  const green = g - background[1];
  const blue = b - background[2];
  return Math.sqrt(red * red * 0.3 + green * green * 0.59 + blue * blue * 0.11);
}

function buildCutout(pixels, width, height, channels) {
  const edgeWidth = Math.max(3, Math.floor(width * 0.075));
  const rowBackgrounds = Array.from({ length: height }, (_, y) => {
    const left = [[], [], []];
    const right = [[], [], []];
    for (let x = 0; x < edgeWidth; x += 1) {
      const leftIndex = (y * width + x) * channels;
      const rightIndex = (y * width + (width - 1 - x)) * channels;
      for (let channel = 0; channel < 3; channel += 1) {
        left[channel].push(pixels[leftIndex + channel]);
        right[channel].push(pixels[rightIndex + channel]);
      }
    }
    return [left.map(median), right.map(median)];
  });

  const pixelCount = width * height;
  const backgroundCandidate = new Uint8Array(pixelCount);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const sourceIndex = pixelIndex * channels;
      const position = width === 1 ? 0 : x / (width - 1);
      const background = rowBackgrounds[y][0].map(
        (value, channel) =>
          value * (1 - position) + rowBackgrounds[y][1][channel] * position,
      );
      const distance = colorDistance(
        pixels[sourceIndex],
        pixels[sourceIndex + 1],
        pixels[sourceIndex + 2],
        background,
      );
      backgroundCandidate[pixelIndex] = distance < 43 ? 1 : 0;
    }
  }

  const isBackground = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (!backgroundCandidate[index] || isBackground[index]) return;
    isBackground[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y < height - 1) enqueue(index + width);
  }

  const alpha = new Uint8Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    alpha[index] = isBackground[index] ? 0 : 255;
  }

  for (let pass = 0; pass < 2; pass += 1) {
    const next = alpha.slice();
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (!alpha[index]) continue;
        const minimumNeighbor = Math.min(
          alpha[index - 1],
          alpha[index + 1],
          alpha[index - width],
          alpha[index + width],
        );
        if (minimumNeighbor === 0)
          next[index] = pass === 0 ? 96 : Math.min(next[index], 184);
      }
    }
    alpha.set(next);
  }

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  const foregroundLuminance = [];
  for (let index = 0; index < pixelCount; index += 1) {
    if (alpha[index] < 48) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    const sourceIndex = index * channels;
    foregroundLuminance.push(
      pixels[sourceIndex] * 0.299 +
        pixels[sourceIndex + 1] * 0.587 +
        pixels[sourceIndex + 2] * 0.114,
    );
  }

  foregroundLuminance.sort((a, b) => a - b);
  const low =
    foregroundLuminance[Math.floor(foregroundLuminance.length * 0.02)] ?? 0;
  const high =
    foregroundLuminance[Math.floor(foregroundLuminance.length * 0.98)] ?? 255;
  const output = Buffer.alloc(pixelCount * 4);
  for (let index = 0; index < pixelCount; index += 1) {
    const sourceIndex = index * channels;
    const luminance =
      pixels[sourceIndex] * 0.299 +
      pixels[sourceIndex + 1] * 0.587 +
      pixels[sourceIndex + 2] * 0.114;
    const normalized = Math.max(
      0,
      Math.min(1, (luminance - low) / Math.max(1, high - low)),
    );
    const toned = Math.round(26 + normalized * 214);
    output[index * 4] = toned;
    output[index * 4 + 1] = toned;
    output[index * 4 + 2] = toned;
    output[index * 4 + 3] = alpha[index];
  }

  if (minX > maxX || minY > maxY) {
    return { output, crop: { left: 0, top: 0, width, height } };
  }

  const padding = Math.max(
    10,
    Math.floor(Math.max(maxX - minX, maxY - minY) * 0.07),
  );
  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const right = Math.min(width - 1, maxX + padding);
  const bottom = Math.min(height - 1, maxY + padding);
  return {
    output,
    crop: { left, top, width: right - left + 1, height: bottom - top + 1 },
  };
}

async function processImage(imageUrl, outputPath) {
  const response = await fetch(imageUrl);
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText}: ${imageUrl}`);
  const source = Buffer.from(await response.arrayBuffer());
  const { data, info } = await sharp(source)
    .rotate()
    .resize({
      width: 760,
      height: 760,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { output, crop } = buildCutout(
    data,
    info.width,
    info.height,
    info.channels,
  );
  await sharp(output, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(crop)
    .resize({
      width: 900,
      height: 900,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 84, alphaQuality: 94, effort: 5 })
    .toFile(outputPath);
}

function buildProvenance(items) {
  const rows = items.map(
    (item) =>
      `| ${item.searchTerm} | [${item.title.replaceAll('|', '\\|')}](${item.objectURL}) | ${item.objectID} | ${item.objectDate || 'Date unknown'} |`,
  );
  return `# DIVINE Archive Collage\n\n${items.length} real collection objects sourced from The Metropolitan Museum of Art's Open Access collection on ${new Date().toISOString().slice(0, 10)}. Every source record is marked public domain by The Met and is available under CC0. Images were locally cropped, background-masked, converted to monochrome, and exported as transparent WebP files to match DIVINE's editorial collage treatment.\n\nSource policy: https://www.metmuseum.org/policies/image-resources\n\n| Search | Object | Met ID | Date |\n| --- | --- | ---: | --- |\n${rows.join('\n')}\n`;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  let previous = [];
  try {
    previous = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  } catch {}

  const usedIDs = new Set(previous.map((item) => item.objectID));
  const items = [...previous];

  for (const term of SEARCH_TERMS) {
    if (items.length >= LIMIT) break;
    if (items.some((item) => item.searchTerm === term)) continue;

    const object = await findObject(term, usedIDs);
    if (!object) {
      console.warn(`No suitable object found for ${term}`);
      continue;
    }

    const slug = `${slugify(term)}-${object.objectID}`;
    const filename = `${slug}.webp`;
    await processImage(
      object.primaryImageSmall,
      path.join(OUTPUT_DIR, filename),
    );
    const item = {
      objectID: object.objectID,
      searchTerm: term,
      title: object.title,
      objectName: object.objectName,
      objectDate: object.objectDate,
      department: object.department,
      src: `/collage-archive/${filename}`,
      imageURL: object.primaryImageSmall,
      objectURL: object.objectURL,
      license: 'CC0',
    };
    items.push(item);
    usedIDs.add(object.objectID);
    await writeFile(MANIFEST_PATH, `${JSON.stringify(items, null, 2)}\n`);
    console.log(`${items.length}/${LIMIT} ${term}: ${object.title}`);
  }

  await writeFile(
    path.join(OUTPUT_DIR, 'PROVENANCE.md'),
    buildProvenance(items),
  );
  console.log(`Wrote ${items.length} archive collage objects.`);
}

await main();

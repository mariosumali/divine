import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const userAgent = 'DIVINE/1.0 (private historical card-art provenance audit)';
const commonsApi = 'https://commons.wikimedia.org/w/api.php';
const outputRoot = join(process.cwd(), 'public', 'traditional-decks-v1');
const scratch = await mkdtemp(join(tmpdir(), 'divine-zigeuner-raml-'));

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function download(url, target) {
  try {
    await access(target);
    return;
  } catch {
    // The source is downloaded below.
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
    if (response.ok) {
      await writeFile(target, Buffer.from(await response.arrayBuffer()));
      await sleep(700);
      return;
    }
    const retryAfter = Number(response.headers.get('retry-after') ?? 0);
    await sleep(Math.max(retryAfter * 1000 + 500, 2500 * (attempt + 1)));
  }
  throw new Error(`Image download failed: ${url}`);
}

async function bytes(path) {
  return (await readFile(path)).byteLength;
}

async function isComplete(slug, count, treatment) {
  try {
    const manifest = JSON.parse(
      await readFile(join(outputRoot, slug, 'manifest.json'), 'utf8'),
    );
    if (manifest.cards?.length !== count) return false;
    if (
      treatment &&
      manifest.cards.some((card) => card.treatment !== treatment)
    )
      return false;
    await Promise.all(
      manifest.cards.map(({ file }) => access(join(outputRoot, slug, file))),
    );
    process.stdout.write(`${slug}: existing ${count} sourced images\n`);
    return true;
  } catch {
    return false;
  }
}

async function writeManifest(slug, data) {
  await writeFile(
    join(outputRoot, slug, 'manifest.json'),
    `${JSON.stringify({ generatedAt: '2026-09-02', ...data }, null, 2)}\n`,
  );
}

function metadataValue(info, key) {
  return info.extmetadata?.[key]?.value?.replace(/<[^>]+>/g, '').trim() ?? '';
}

async function commonsImageInfo(titles) {
  const result = new Map();
  for (let index = 0; index < titles.length; index += 8) {
    const url = new URL(commonsApi);
    url.search = new URLSearchParams({
      action: 'query',
      titles: titles.slice(index, index + 8).join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size|extmetadata',
      iiurlwidth: '300',
      format: 'json',
      maxlag: '5',
    }).toString();
    let response;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = await fetch(url, {
        headers: { 'User-Agent': userAgent },
      });
      const text = await candidate.text();
      if (candidate.ok && text.trimStart().startsWith('{')) {
        response = JSON.parse(text);
        break;
      }
      await sleep(2500 * (attempt + 1));
    }
    if (!response)
      throw new Error('Wikimedia Commons metadata request failed.');
    for (const page of Object.values(response.query.pages))
      result.set(page.title, page.imageinfo?.[0]);
    process.stdout.write(
      `commons metadata: ${Math.min(index + 8, titles.length)}/${titles.length}\n`,
    );
    await sleep(1200);
  }
  return result;
}

const zigeunerSources = [
  ['Beständigkeit', 'File:Museo del Prado-12-La Constancia.jpg'],
  ['Besuch', 'File:A Painter and Visitors in a Studio F-000545.jpg'],
  [
    'Botschaft',
    'File:Man hands a letter to a woman in a hall, by Pieter de Hooch.jpg',
  ],
  ['Brief', 'File:Kovács Italian Woman Reading a Letter 1846.jpg'],
  ['Dieb', 'File:Karl Witkowski - The Pickpocket and the Newsie (c. 1885).jpg'],
  ['Eifersucht', 'File:Edvard Munch - Jealousy - Google Art Project.jpg'],
  ['Etwas Geld', 'File:Coin Purse LACMA 37.15.25.jpg'],
  [
    'Falschheit',
    'File:Masked Ball at the Opera (1873) Edouard Manet (National Gallery of Art, Washington D.C.).jpg',
  ],
  ['Feind', 'File:Étienne Prosper Berne-Bellecour - On the dueling ground.jpg'],
  [
    'Fröhlichkeit',
    'File:Adriaen van Ostade - Merrymakers in an Inn - WGA16746.jpg',
  ],
  ['Gedanken', 'File:Stevens Alfred Reverie c1878 Oil On Canvas.jpg'],
  [
    'Geistlicher',
    'File:Hoechle, Johann Nepomuk - Rudolf von Habsburg und der Priester - 19th century.jpg',
  ],
  [
    'Geld',
    'File:Rembrandt Christ Driving the Money Changers from the Temple.jpg',
  ],
  [
    'Geliebte',
    'File:Friedrich Amerling - Portrait of a young woman - M.Ob.1908 - National Museum in Warsaw.jpg',
  ],
  ['Geliebter', 'File:19th century portrait of a young Russian man.jpg'],
  ['Geschenk', 'File:Marguerite Gerard - Gift.jpg'],
  ['Glück', 'File:An Allegory of Fortune by Salvator Rosa, Getty Center.JPG'],
  ['Haus', 'File:Cottage Fireside. Frederick Daniel Hardy, 1850.jpg'],
  ['Heirat', 'File:Jewish wedding by A. Trankowsky.png'],
  [
    'Hoffnung',
    'File:Assistants and George Frederic Watts - Hope - Google Art Project.jpg',
  ],
  ['Kind', 'File:Portrait of a Child MET DP222181.jpg'],
  [
    'Krankheit',
    'File:John William Waterhouse A Sick Child Brought Into The Temple Of Aesculapius.jpg',
  ],
  ['Liebe', "File:Frédéric Soulacroix - The lovers' tryst.jpg"],
  ['Offizier', 'File:Portrait of a Cavalry Officer.jpg'],
  ['Reise', 'File:Wilhelm von Diez Postkutschenreise.jpg'],
  [
    'Richter',
    'File:Parable of the Unjust Judge (Granovitaya palata, 1881-2).jpg',
  ],
  ['Sehnsucht', 'File:Mary Cassatt, Waiting, c. 1879, NGA 55829.jpg'],
  [
    'Tod',
    'File:Rodolphe Bresdin - Death and the Young Mother - 1945.343 - Cleveland Museum of Art.jpg',
  ],
  [
    'Traurigkeit',
    'File:Brooklyn Museum - The Sorrow of Saint Peter (La douleur de Saint Pierre) - James Tissot.jpg',
  ],
  ['Treue', 'File:Chrispijn van den Broeck - An Allegory of Fidelity.jpg'],
  ['Unglück', 'File:Shipwreck of the Minotaur William Turner.jpg'],
  [
    'Unverhoffte Freude',
    'File:4th-of-July-1819-Philadelphia-John-Lewis-Krimmel.JPG',
  ],
  [
    'Verdruss',
    'File:Hieronymus Bosch- The Seven Deadly Sins and the Four Last Things - Anger.JPG',
  ],
  ['Verlust', 'File:William Powell Frith - Poverty and Wealth.JPG'],
  ['Witwe', 'File:Pavel Fedotov- Young Widow (First version).JPG'],
  [
    'Witwer',
    'File:Edwin Austin Abbey - The Widower - 1937.2691 - Yale University Art Gallery.jpg',
  ],
];

const zigeunerTreatment =
  'Fit in full within the DIVINE card ratio over a soft edge-fill backdrop for a modern historical-art edition; this is not original Zigeunerkarten pack artwork.';

async function renderZigeunerkarten() {
  const slug = 'zigeunerkarten';
  if (await isComplete(slug, zigeunerSources.length, zigeunerTreatment)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const cards = [];
  const infoByTitle = await commonsImageInfo(
    zigeunerSources.map(([, title]) => title),
  );
  const originalOnly = zigeunerSources.filter(([, title]) =>
    infoByTitle.get(title)?.thumburl?.includes('upload.wikimedia.org'),
  );
  if (originalOnly.length)
    throw new Error(
      `Sources too small for a cached thumbnail: ${originalOnly.map(([, title]) => title).join(', ')}`,
    );

  for (const [index, [subject, title]] of zigeunerSources.entries()) {
    const info = infoByTitle.get(title);
    if (!info) throw new Error(`Missing Wikimedia metadata for ${title}`);
    const license = metadataValue(info, 'LicenseShortName');
    if (!/CC0|CC BY|public domain|PDM/i.test(license))
      throw new Error(
        `Unknown or non-reusable license for ${title}: ${license}`,
      );

    const imageUrl = info.thumburl || info.url;
    const source = join(scratch, `zigeuner-${index + 1}.source`);
    const filename = `zigeunerkarten-${String(index + 1).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    await download(imageUrl, source);
    await execFileAsync('magick', [
      source,
      '-auto-orient',
      '-colorspace',
      'sRGB',
      '-write',
      'mpr:source',
      '+delete',
      '(',
      'mpr:source',
      '-resize',
      '720x1080^',
      '-gravity',
      'center',
      '-extent',
      '720x1080',
      '-blur',
      '0x28',
      ')',
      '(',
      'mpr:source',
      '-resize',
      '680x1040',
      ')',
      '-gravity',
      'center',
      '-compose',
      'over',
      '-composite',
      '-strip',
      '-quality',
      '84',
      output,
    ]);
    cards.push({
      cardIndex: index + 1,
      subject,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: title.replace(/^File:/, ''),
      sourceUrl: info.descriptionurl,
      imageUrl,
      license,
      artist: metadataValue(info, 'Artist') || 'Artist unknown',
      treatment: zigeunerTreatment,
    });
    process.stdout.write(`${slug}: ${index + 1}/${zigeunerSources.length}\n`);
  }

  await writeManifest(slug, {
    sourceCollection: 'https://commons.wikimedia.org/',
    rightsNote:
      'Each traditional 36-card subject is paired with a distinct reusable historical work. Licenses and source pages are recorded per card. The result is a transparent modern historical-art edition, not a facsimile of a historic commercial pack.',
    cards,
  });
}

const ramlFigures = [
  ['Populus', '2222'],
  ['Tristitia', '2221'],
  ['Albus', '2212'],
  ['Fortuna Major', '2211'],
  ['Rubeus', '2122'],
  ['Acquisitio', '2121'],
  ['Coniunctio', '2112'],
  ['Caput Draconis', '2111'],
  ['Laetitia', '1222'],
  ['Carcer', '1221'],
  ['Amissio', '1212'],
  ['Puella', '1211'],
  ['Fortuna Minor', '1122'],
  ['Puer', '1121'],
  ['Cauda Draconis', '1112'],
  ['Via', '1111'],
];

const ramlPages = [
  25, 26, 27, 28, 29, 30, 31, 32, 41, 42, 43, 44, 45, 46, 47, 48,
];

function figureDrawing(pattern) {
  const parts = [];
  for (const [row, count] of [...pattern].entries()) {
    const y = 410 + row * 135;
    const centers = count === '1' ? [360] : [315, 405];
    for (const x of centers) parts.push(`circle ${x},${y} ${x + 20},${y}`);
  }
  return parts.join(' ');
}

async function renderRaml() {
  const slug = 'ilm-al-raml';
  if (await isComplete(slug, ramlFigures.length)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const cards = [];

  for (const [index, [figure, pattern]] of ramlFigures.entries()) {
    const page = ramlPages[index];
    const paddedPage = String(page).padStart(4, '0');
    const imageUrl = `https://iiif.wellcomecollection.org/image/b20298286_WMS_Arabic_664_${paddedPage}.jp2/full/1338,975/0/default.jpg`;
    const source = join(scratch, `raml-${paddedPage}.jpg`);
    await download(imageUrl, source);
    const filename = `ilm-al-raml-${String(index + 1).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    await execFileAsync('magick', [
      source,
      '-auto-orient',
      '-colorspace',
      'sRGB',
      '-resize',
      '720x1080^',
      '-gravity',
      'center',
      '-extent',
      '720x1080',
      '-modulate',
      '97,72,100',
      '-contrast-stretch',
      '0.4%x0.4%',
      '-fill',
      '#2f1c12',
      '-colorize',
      '7%',
      '-fill',
      '#ecd9adcc',
      '-stroke',
      '#4b2b1c',
      '-strokewidth',
      '4',
      '-draw',
      'roundrectangle 218,210 502,894 28,28',
      '-fill',
      'none',
      '-stroke',
      '#a77a35',
      '-strokewidth',
      '2',
      '-draw',
      'rectangle 232,224 488,880',
      '-fill',
      '#7f2f24',
      '-stroke',
      '#d8b66b',
      '-strokewidth',
      '4',
      '-draw',
      figureDrawing(pattern),
      '-fill',
      '#a77a35',
      '-stroke',
      'none',
      '-draw',
      'polygon 360,236 373,249 360,262 347,249 polygon 360,842 373,855 360,868 347,855',
      '-fill',
      'none',
      '-stroke',
      '#c4a86c',
      '-strokewidth',
      '3',
      '-draw',
      'rectangle 22,22 697,1057',
      '-stroke',
      '#3d271d',
      '-strokewidth',
      '2',
      '-draw',
      'rectangle 30,30 689,1049',
      '-strip',
      '-quality',
      '84',
      output,
    ]);
    cards.push({
      cardIndex: index + 1,
      figure,
      pattern,
      manuscriptImage: page,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: `Treatise on ʿilm al-raml, MS Arabic 664, image ${page}`,
      sourceUrl: 'https://wellcomecollection.org/works/agpcdkbz',
      imageUrl,
      license: 'Public Domain Mark 1.0',
      artist: 'Anonymous; Wellcome Collection',
      treatment:
        'A canonical four-line geomantic figure is rendered as solid mineral-ink points inside a manuscript-style ruled panel over one distinct public-domain manuscript image. This is a modern card treatment, not an original historical deck.',
    });
    process.stdout.write(`${slug}: ${index + 1}/${ramlFigures.length}\n`);
  }

  await writeManifest(slug, {
    sourceCollection: 'https://wellcomecollection.org/works/agpcdkbz',
    iiifManifest:
      'https://iiif.wellcomecollection.org/presentation/v2/b20298286',
    rightsNote:
      'The backgrounds are distinct public-domain images from an Arabic treatise on ʿilm al-raml. The figures are the sixteen canonical one-or-two-point forms, rendered as solid mineral-ink points in manuscript-style ruled panels; the fixed card format is a transparent modern interface adaptation of a generated geomantic practice.',
    cards,
  });
}

await renderZigeunerkarten();
await renderRaml();
process.stdout.write(`source cache: ${scratch}\n`);

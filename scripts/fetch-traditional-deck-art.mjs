import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const commonsApi = 'https://commons.wikimedia.org/w/api.php';
const userAgent = 'DIVINE/1.0 (private historical card-art provenance audit)';
const outputRoot = join(process.cwd(), 'public', 'traditional-decks-v1');
const scratch = await mkdtemp(join(tmpdir(), 'divine-traditional-art-'));

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function api(params, usePost = false) {
  const url = new URL(commonsApi);
  const search = new URLSearchParams({
    ...params,
    format: 'json',
    maxlag: '5',
  });
  if (!usePost) url.search = search.toString();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await fetch(url, {
      method: usePost ? 'POST' : 'GET',
      headers: {
        'User-Agent': userAgent,
        ...(usePost
          ? { 'Content-Type': 'application/x-www-form-urlencoded' }
          : {}),
      },
      body: usePost ? search : undefined,
    });
    const body = await response.text();
    if (response.ok && body.trimStart().startsWith('{'))
      return JSON.parse(body);
    const retryAfter = Number(response.headers.get('retry-after') ?? 0);
    await sleep(Math.max(retryAfter * 1000 + 1000, 2500 * (attempt + 1)));
  }
  throw new Error(`Commons API request failed: ${url}`);
}

async function categoryMembers(category) {
  const members = [];
  let cmcontinue;
  do {
    const response = await api({
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmnamespace: '6',
      cmtype: 'file',
      cmlimit: '500',
      ...(cmcontinue ? { cmcontinue } : {}),
    });
    members.push(...response.query.categorymembers);
    cmcontinue = response.continue?.cmcontinue;
    if (cmcontinue) await sleep(900);
  } while (cmcontinue);
  return members;
}

async function imageInfo(titles, thumbnailWidth = 1200) {
  const result = new Map();
  for (let index = 0; index < titles.length; index += 24) {
    const response = await api(
      {
        action: 'query',
        titles: titles.slice(index, index + 24).join('|'),
        prop: 'imageinfo',
        iiprop: 'url|size|extmetadata',
        iiurlwidth: String(thumbnailWidth),
      },
      true,
    );
    for (const page of Object.values(response.query.pages))
      result.set(page.title, page.imageinfo?.[0]);
    await sleep(1200);
  }
  return result;
}

function metadataValue(info, key) {
  return info.extmetadata?.[key]?.value?.replace(/<[^>]+>/g, '').trim() ?? '';
}

function assertReusable(info, title) {
  const license = metadataValue(info, 'LicenseShortName');
  if (!/CC0|CC BY|public domain|no restrictions|PDM/i.test(license))
    throw new Error(`Unknown or non-reusable license for ${title}: ${license}`);
  return license;
}

function knownCommonsInfo(titles, license, artist, thumbnailWidth = 1920) {
  return new Map(
    titles.map((title) => {
      const filename = title.replace(/^File:/, '');
      const encoded = encodeURIComponent(filename.replaceAll(' ', '_'));
      return [
        title,
        {
          url: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}?width=${thumbnailWidth}`,
          descriptionurl: `https://commons.wikimedia.org/wiki/File:${encoded}`,
          extmetadata: {
            LicenseShortName: { value: license },
            Artist: { value: artist },
          },
          thumbnailWidth,
        },
      ];
    }),
  );
}

async function download(url, target) {
  try {
    await access(target);
    return;
  } catch {
    // The source is downloaded below.
  }
  let normalized = new URL(url);
  if (normalized.pathname.includes('/wiki/Special:Redirect/file/')) {
    const redirect = await fetch(normalized, {
      redirect: 'manual',
      headers: { 'User-Agent': userAgent },
    });
    const location = redirect.headers.get('location');
    if (location) {
      const original = new URL(location, normalized);
      if (original.hostname.startsWith('thumb.')) {
        normalized = original;
      } else {
        const filename = original.pathname.split('/').at(-1);
        const isSvg = /\.svg$/i.test(original.pathname);
        const width = isSvg
          ? 960
          : Number(normalized.searchParams.get('width') ?? 1920);
        normalized = new URL(
          `${original.origin.replace('upload.', 'thumb.')}${original.pathname.replace('/wikipedia/commons/', '/wikipedia/commons/thumb/')}/${width}px-${filename}${isSvg ? '.png' : ''}`,
        );
      }
    }
  }
  normalized.searchParams.delete('utm_source');
  normalized.searchParams.delete('utm_campaign');
  normalized.searchParams.delete('utm_content');
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(normalized, {
      headers: { 'User-Agent': userAgent },
    });
    if (response.ok) {
      await writeFile(target, Buffer.from(await response.arrayBuffer()));
      await sleep(650);
      return;
    }
    const retryAfter = Number(response.headers.get('retry-after') ?? 0);
    await sleep(Math.max(retryAfter * 1000 + 1000, 1800 * (attempt + 1)));
  }
  throw new Error(`Download failed: ${normalized}`);
}

async function magick(input, output, operations) {
  await execFileAsync('magick', [input, ...operations, output]);
}

async function bytes(path) {
  return (await readFile(path)).byteLength;
}

async function writeManifest(slug, data) {
  await writeFile(
    join(outputRoot, slug, 'manifest.json'),
    `${JSON.stringify(
      {
        generatedAt: '2026-09-02',
        ...data,
      },
      null,
      2,
    )}\n`,
  );
}

async function isComplete(slug, count, renderRevision) {
  try {
    const manifest = JSON.parse(
      await readFile(join(outputRoot, slug, 'manifest.json'), 'utf8'),
    );
    if (manifest.cards?.length !== count) return false;
    if (renderRevision && manifest.renderRevision !== renderRevision)
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

async function renderKipper() {
  const slug = 'kipper';
  const renderRevision = 2;
  if (await isComplete(slug, 36, renderRevision)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });

  const museumSource =
    'https://onlinesammlung.museumsstiftung.de/iiif/iiif/2/46fc2b70-48cb-4621-9e72-5ee94fb592d4/full/max/0/default.jpg';
  const museumPage =
    'https://onlinesammlung.museumsstiftung.de/detail/collection/30221e8f-182a-4e3b-9e22-883f6894bff7';
  const source = join(scratch, 'kipper-museum.jpg');
  await download(museumSource, source);

  // The rows recede and skew independently in the museum photograph, so a
  // fixed origin and step captures parts of adjacent rows. These cells end in
  // the white gaps between cards and leave trim enough surround to find each
  // physical edge. Cards 30–32 overlap in image-space; their four corners are
  // rectified separately below.
  const crops = [
    '281x444+350+225',
    '293x439+631+225',
    '277x437+924+225',
    '284x421+1201+225',
    '287x426+1485+225',
    '293x433+1772+225',
    '293x434+2065+225',
    '307x441+2358+225',
    '314x437+305+669',
    '297x427+619+664',
    '290x414+916+662',
    '300x427+1206+646',
    '304x419+1506+651',
    '287x418+1810+658',
    '294x419+2097+659',
    '314x408+2391+666',
    '326x444+260+1106',
    '309x452+586+1091',
    '311x464+895+1076',
    '304x460+1206+1073',
    '339x463+1510+1070',
    '278x451+1849+1076',
    '303x445+2127+1078',
    '315x441+2430+1074',
    '338x473+215+1550',
    '331x483+553+1543',
    '323x480+884+1540',
    '317x485+1207+1533',
    '330x485+1524+1533',
    {
      crop: '500x600+1750+1450',
      perspective: '108,94 0,0 390,88 300,0 420,529 300,460 133,531 0,460',
    },
    {
      crop: '600x600+2050+1400',
      perspective: '97,139 0,0 367,133 300,0 421,567 300,460 146,581 0,460',
    },
    {
      crop: '550x600+2350+1400',
      perspective: '114,130 0,0 397,127 300,0 445,571 300,460 162,582 0,460',
    },
    '345x507+180+2023',
    '330x504+525+2026',
  ];
  const cards = [];
  let cardIndex = 0;
  for (const crop of crops) {
    cardIndex += 1;
    const filename = `kipper-${String(cardIndex).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    const cropGeometry = typeof crop === 'string' ? crop : crop.crop;
    const extraction =
      typeof crop === 'string'
        ? ['-fuzz', '8%', '-trim', '+repage']
        : [
            '-define',
            'distort:viewport=300x460+0+0',
            '-virtual-pixel',
            'white',
            '-distort',
            'Perspective',
            crop.perspective,
            '+repage',
          ];
    await magick(source, output, [
      '-crop',
      cropGeometry,
      '+repage',
      ...extraction,
      '-auto-orient',
      '-colorspace',
      'sRGB',
      '-resize',
      '900x1200>',
      '-strip',
      '-quality',
      '84',
    ]);
    cards.push({
      cardIndex,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: 'Karten der berühmten Wahrsagerin Frau Kipper, cards 1–34',
      sourceUrl: museumPage,
      license: 'CC BY-SA 4.0',
      artist:
        'Matthias Seidlein (publisher); photograph by Peter Boesang / Museumsstiftung Post und Telekommunikation',
      treatment: 'Cropped from the museum’s complete-object photograph.',
    });
  }

  const substitutes = [
    {
      title:
        'File:Mountain Landscape with the Road to Naples by Jean-Charles-Joseph Rémond, c. 1820.JPG',
      note: 'Historically adjacent public-domain landscape substitute; the museum photograph does not show card 35 face-up.',
    },
    {
      title:
        'File:Caspar David Friedrich - Der Mönch am Meer - Google Art Project.jpg',
      note: 'German Romantic public-domain sea image substitute; the museum photograph does not show card 36 face-up.',
    },
  ];
  const substituteInfo = await imageInfo(
    substitutes.map(({ title }) => title),
    1400,
  );
  for (const [offset, substitute] of substitutes.entries()) {
    cardIndex += 1;
    const info = substituteInfo.get(substitute.title);
    if (!info) throw new Error(`Missing metadata for ${substitute.title}`);
    const license = assertReusable(info, substitute.title);
    const input = join(scratch, `kipper-substitute-${offset}.source`);
    await download(info.thumburl || info.url, input);
    const filename = `kipper-${String(cardIndex).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    await magick(input, output, [
      '-auto-orient',
      '-colorspace',
      'sRGB',
      '-resize',
      '900x1200^',
      '-gravity',
      'center',
      '-extent',
      '900x1200',
      '-strip',
      '-quality',
      '84',
    ]);
    cards.push({
      cardIndex,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: substitute.title.replace(/^File:/, ''),
      sourceUrl: info.descriptionurl,
      license,
      artist: metadataValue(info, 'Artist'),
      treatment: substitute.note,
    });
  }

  await writeManifest(slug, {
    renderRevision,
    sourceCollection: museumPage,
    rightsNote:
      'Cards 1–34 are crops of a CC BY-SA 4.0 museum photograph. Cards 35–36 use explicitly identified period substitutes because those faces are not visible in that photograph.',
    cards,
  });
  process.stdout.write(`${slug}: ${cards.length} sourced images\n`);
}

async function renderBelline() {
  const slug = 'belline';
  if (await isComplete(slug, 53)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const title = 'File:Oracle-belline-cartes.jpg';
  const info = (await imageInfo([title], 1400)).get(title);
  if (!info) throw new Error(`Missing metadata for ${title}`);
  const license = assertReusable(info, title);
  const source = join(scratch, 'belline.jpg');
  await download(info.url, source);
  const cards = [];

  for (let index = 0; index < 53; index += 1) {
    const row = index < 4 ? 0 : 1 + Math.floor((index - 4) / 7);
    const column = index < 4 ? index : (index - 4) % 7;
    const filename = `belline-${String(index + 1).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    await magick(source, output, [
      '-crop',
      `357x566+${column * 357}+${row * 566}`,
      '-fuzz',
      '8%',
      '-trim',
      '+repage',
      '-colorspace',
      'sRGB',
      '-resize',
      '900x1200>',
      '-strip',
      '-quality',
      '84',
    ]);
    cards.push({
      cardIndex: index + 1,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: title.replace(/^File:/, ''),
      sourceUrl: info.descriptionurl,
      license,
      artist: metadataValue(info, 'Artist'),
      treatment: 'Cropped from the openly licensed complete-deck sheet.',
    });
  }
  await writeManifest(slug, {
    sourceCollection: info.descriptionurl,
    rightsNote:
      'The complete deck sheet is offered by its rightsholder under CC BY 4.0 on Wikimedia Commons.',
    cards,
  });
  process.stdout.write(`${slug}: ${cards.length} sourced images\n`);
}

async function renderPlayingCards() {
  const slug = 'playing-cards';
  if (await isComplete(slug, 52)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const ranks = [
    'Ace',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'Jack',
    'Queen',
    'King',
  ];
  const titles = suits.flatMap((suit) =>
    ranks.map((rank) => `File:${rank} of ${suit}.svg`),
  );
  const infoByTitle = knownCommonsInfo(titles, 'CC0', 'Austin Gabriel');
  const cards = [];
  const paper = join(scratch, 'playing-card-paper.png');
  await execFileAsync('magick', [
    '-size',
    '720x1008',
    'xc:#e8ddc5',
    '-attenuate',
    '0.025',
    '+noise',
    'Gaussian',
    '-colorspace',
    'sRGB',
    paper,
  ]);
  for (const [index, title] of titles.entries()) {
    const info = infoByTitle.get(title);
    if (!info) throw new Error(`Missing metadata for ${title}`);
    const license = assertReusable(info, title);
    const filename = `playing-cards-${String(index + 1).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    const input = join(scratch, `playing-${index + 1}.svg`);
    const core = join(scratch, `playing-${index + 1}-core.png`);
    await download(info.url, input);
    await magick(input, core, [
      '-background',
      '#eadfc9',
      '-alpha',
      'remove',
      '-alpha',
      'off',
      '-colorspace',
      'sRGB',
      '-fuzz',
      '18%',
      '-fill',
      '#eadfc9',
      '-opaque',
      '#ffffff',
      '-fill',
      '#9a2f2a',
      '-opaque',
      '#d40000',
      '-modulate',
      '100,72,100',
      '-resize',
      '650x910',
    ]);
    await execFileAsync('magick', [
      paper,
      core,
      '-gravity',
      'center',
      '-compose',
      'over',
      '-composite',
      '-fill',
      'none',
      '-stroke',
      '#2a211b',
      '-strokewidth',
      '3',
      '-draw',
      'rectangle 20,20 699,987 rectangle 30,30 689,977',
      '-stroke',
      '#a77735',
      '-strokewidth',
      '2',
      '-draw',
      'rectangle 25,25 694,982',
      '-strip',
      '-quality',
      '88',
      output,
    ]);
    cards.push({
      cardIndex: index + 1,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: title.replace(/^File:/, ''),
      sourceUrl: info.descriptionurl,
      license,
      artist: metadataValue(info, 'Artist'),
      treatment:
        'The exact CC0 card face is recolored in oxblood and charcoal, printed onto a lightly mottled warm paper field, and enclosed in a restrained nineteenth-century-style rule.',
    });
  }
  await writeManifest(slug, {
    sourceCollection:
      'https://commons.wikimedia.org/wiki/Category:Public_domain_playing_cards',
    rightsNote:
      'Austin Gabriel’s complete French-suited deck is CC0. DIVINE applies an original archival print treatment without changing rank, suit, or court identity.',
    cards,
  });
  process.stdout.write(`${slug}: ${cards.length} sourced images\n`);
}

const sibillaTitles = {
  mixedCourts: 'File:Print, playing-card (BM 1896,0501.729.1-52 1).jpg',
  spades: 'File:Print, playing-card (BM 1896,0501.729.1-52 2).jpg',
  clubs: 'File:Print, playing-card (BM 1896,0501.729.1-52 3).jpg',
  redCourts: 'File:Print, playing-card (BM 1896,0501.729.1-52 4).jpg',
  hearts: 'File:Print, playing-card (BM 1896,0501.729.1-52 5).jpg',
  diamonds: 'File:Print, playing-card (BM 1896,0501.729.1-52).jpg',
};

async function renderSibilla() {
  const slug = 'sibilla';
  if (await isComplete(slug, 52)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const infoByTitle = knownCommonsInfo(
    Object.values(sibillaTitles),
    'Public domain',
    'British Museum',
  );
  const sources = {};
  for (const [key, title] of Object.entries(sibillaTitles)) {
    const info = infoByTitle.get(title);
    if (!info) throw new Error(`Missing metadata for ${title}`);
    assertReusable(info, title);
    sources[key] = join(scratch, `sibilla-${key}.jpg`);
    await download(info.url, sources[key]);
  }

  const suitDefinitions = [
    {
      name: 'hearts',
      numericSource: 'hearts',
      courtSource: 'redCourts',
      courtRow: 1,
      courtColumns: [0, 1, 2],
      courtCols: 3,
    },
    {
      name: 'clubs',
      numericSource: 'clubs',
      courtSource: 'redCourts',
      courtRow: 0,
      courtColumns: [0, 1, 2],
      courtCols: 3,
    },
    {
      name: 'spades',
      numericSource: 'spades',
      courtSource: 'mixedCourts',
      courtRow: 1,
      courtColumns: [3, 2, 1],
      courtCols: 4,
    },
    {
      name: 'diamonds',
      numericSource: 'diamonds',
      courtSource: 'mixedCourts',
      courtRow: 0,
      courtColumns: [1, 2, 3],
      courtCols: 4,
    },
  ];
  const cards = [];
  let cardIndex = 0;

  async function extract(sourceKey, columns, rows, column, row, label) {
    cardIndex += 1;
    const dimensions = (
      await execFileAsync('magick', [
        'identify',
        '-format',
        '%w %h',
        sources[sourceKey],
      ])
    ).stdout
      .trim()
      .split(/\s+/)
      .map(Number);
    const cellWidth = Math.floor(dimensions[0] / columns);
    const cellHeight = Math.floor(dimensions[1] / rows);
    const filename = `sibilla-${String(cardIndex).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    await magick(sources[sourceKey], output, [
      '-crop',
      `${cellWidth}x${cellHeight}+${column * cellWidth}+${row * cellHeight}`,
      '-fuzz',
      '7%',
      '-trim',
      '+repage',
      '-colorspace',
      'sRGB',
      '-resize',
      '900x1200>',
      '-strip',
      '-quality',
      '84',
    ]);
    const title = sibillaTitles[sourceKey];
    const info = infoByTitle.get(title);
    cards.push({
      cardIndex,
      cardIdentity: label,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: title.replace(/^File:/, ''),
      sourceUrl: info.descriptionurl,
      license: metadataValue(info, 'LicenseShortName'),
      artist: metadataValue(info, 'Artist'),
      treatment:
        'Cropped from the British Museum’s public-domain complete-deck photographs and ordered by inset suit and rank.',
    });
  }

  for (const suit of suitDefinitions) {
    for (let rank = 0; rank < 10; rank += 1)
      await extract(
        suit.numericSource,
        5,
        2,
        rank % 5,
        Math.floor(rank / 5),
        `${suit.name} ${rank + 1}`,
      );
    for (const [courtIndex, column] of suit.courtColumns.entries())
      await extract(
        suit.courtSource,
        suit.courtCols,
        2,
        column,
        suit.courtRow,
        `${suit.name} ${['jack', 'queen', 'king'][courtIndex]}`,
      );
  }

  await writeManifest(slug, {
    sourceCollection:
      'https://commons.wikimedia.org/wiki/Category:Sibilla_cards',
    rightsNote:
      'These are corresponding suit-and-rank images from a nineteenth-century Sibilla-family pack in the British Museum; the historical French captions are a variant, while DIVINE separately renders Vera Sibilla Italiana titles.',
    cards,
  });
  process.stdout.write(`${slug}: ${cards.length} sourced images\n`);
}

async function renderRunes() {
  const slug = 'runes';
  if (await isComplete(slug, 24)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const names = [
    'fehu',
    'uruz',
    'thurisaz',
    'ansuz',
    'raido',
    'kauna',
    'gebo',
    'wunjo',
    'haglaz',
    'naudiz',
    'isaz',
    'jeran',
    'iwaz',
    'pertho',
    'algiz',
    'sowilo',
    'tiwaz',
    'berkanan',
    'ehwaz',
    'mannaz',
    'laukaz',
    'ingwaz',
    'dagaz',
    'othalan',
  ];
  const titles = names.map((name) => `File:Runic letter ${name}.svg`);
  const infoByTitle = knownCommonsInfo(titles, 'Public domain', 'ClaesWallin');
  const kylverTitle = 'File:G88 Kylver - KMB - 16000300013409.jpg';
  const kylverInfo = knownCommonsInfo(
    [kylverTitle],
    'CC BY 2.5',
    'Bengt A Lundberg / Riksantikvarieämbetet',
  ).get(kylverTitle);
  if (!kylverInfo) throw new Error('Missing Kylver Stone metadata');
  const kylverSource = join(scratch, 'kylver-stone.jpg');
  await download(kylverInfo.url, kylverSource);
  const cards = [];
  for (const [index, title] of titles.entries()) {
    const info = infoByTitle.get(title);
    if (!info) throw new Error(`Missing metadata for ${title}`);
    const license = assertReusable(info, title);
    const filename = `runes-${String(index + 1).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    const input = join(scratch, `rune-${index + 1}.svg`);
    const background = join(scratch, `rune-${index + 1}-background.png`);
    const mask = join(scratch, `rune-${index + 1}-mask.png`);
    const highlight = join(scratch, `rune-${index + 1}-highlight.png`);
    const shadow = join(scratch, `rune-${index + 1}-shadow.png`);
    const ochre = join(scratch, `rune-${index + 1}-ochre.png`);
    const cropOffset = (index * 137) % 876;
    await download(info.url, input);
    await magick(kylverSource, background, [
      '-resize',
      '1575x1050^',
      '-gravity',
      'northwest',
      '-crop',
      `700x1050+${cropOffset}+0`,
      '+repage',
      '-colorspace',
      'gray',
      '-sepia-tone',
      '72%',
      '-modulate',
      '80,82,100',
      '-fill',
      '#2b1b14',
      '-colorize',
      '18%',
      '-background',
      'white',
      '-vignette',
      '0x26',
    ]);
    await magick(input, mask, [
      '-background',
      'white',
      '-alpha',
      'remove',
      '-colorspace',
      'gray',
      '-threshold',
      '28%',
      '-negate',
      '-trim',
      '+repage',
      '-resize',
      '370x590',
    ]);
    for (const [target, color] of [
      [highlight, '#dac49a'],
      [shadow, '#241711'],
      [ochre, '#8e3526'],
    ]) {
      await execFileAsync('magick', [
        mask,
        '-alpha',
        'copy',
        '-channel',
        'RGB',
        '-fill',
        color,
        '-colorize',
        '100',
        '+channel',
        target,
      ]);
    }
    await execFileAsync('magick', [
      background,
      highlight,
      '-gravity',
      'center',
      '-geometry',
      '-3-3',
      '-compose',
      'over',
      '-composite',
      shadow,
      '-gravity',
      'center',
      '-geometry',
      '+4+5',
      '-compose',
      'over',
      '-composite',
      ochre,
      '-gravity',
      'center',
      '-compose',
      'over',
      '-composite',
      '-fill',
      'none',
      '-stroke',
      '#c5a76d',
      '-strokewidth',
      '3',
      '-draw',
      'rectangle 22,22 677,1027',
      '-stroke',
      '#3b261b',
      '-strokewidth',
      '2',
      '-draw',
      'rectangle 30,30 669,1019',
      '-strip',
      '-quality',
      '88',
      output,
    ]);
    cards.push({
      cardIndex: index + 1,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: title.replace(/^File:/, ''),
      sourceUrl: info.descriptionurl,
      backgroundSourceTitle: 'The Kylver Stone, G 88',
      backgroundSourceUrl: kylverInfo.descriptionurl,
      license: `${license} rune form; CC BY 2.5 background photograph`,
      artist: `${metadataValue(info, 'Artist')}; Bengt A Lundberg / Riksantikvarieämbetet`,
      treatment:
        'The exact public-domain rune form is layered in mineral ochre over a monochrome crop of the Kylver Stone, the fifth-century inscription that preserves the Elder Futhark sequence.',
    });
  }
  await writeManifest(slug, {
    sourceCollection:
      'https://commons.wikimedia.org/wiki/Category:Elder_Futhark',
    backgroundSourceCollection: kylverInfo.descriptionurl,
    rightsNote:
      'The 24 standardized Elder Futhark letterforms are public domain. The Kylver Stone photograph is CC BY 2.5, credited to Bengt A Lundberg / Riksantikvarieämbetet. Runic cards themselves remain a modern reflective format.',
    cards,
  });
  process.stdout.write(`${slug}: ${cards.length} sourced images\n`);
}

async function renderIChing() {
  const slug = 'i-ching';
  if (await isComplete(slug, 64)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const titles = Array.from(
    { length: 64 },
    (_, index) =>
      `File:Iching-hexagram-${String(index + 1).padStart(2, '0')}.svg`,
  );
  const infoByTitle = knownCommonsInfo(
    titles,
    'Public domain',
    'Ben Finney and Wikimedia contributors',
  );
  const chartTitle =
    'File:Diagram of I Ching hexagrams owned by Gottfried Wilhelm Leibniz, 1701.jpg';
  const chartInfo = knownCommonsInfo(
    [chartTitle],
    'Public domain',
    'Unknown author; Leibniz Archive',
  ).get(chartTitle);
  if (!chartInfo) throw new Error('Missing 1701 I Ching chart metadata');
  const chartSource = join(scratch, 'i-ching-chart-1701.jpg');
  await download(chartInfo.url, chartSource);
  const cards = [];
  for (const [index, title] of titles.entries()) {
    const info = infoByTitle.get(title);
    if (!info) throw new Error(`Missing metadata for ${title}`);
    const license = assertReusable(info, title);
    const filename = `i-ching-${String(index + 1).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    const input = join(scratch, `i-ching-${index + 1}.svg`);
    const background = join(scratch, `i-ching-${index + 1}-background.png`);
    const panel = join(scratch, `i-ching-${index + 1}-panel.png`);
    const mask = join(scratch, `i-ching-${index + 1}-mask.png`);
    const ink = join(scratch, `i-ching-${index + 1}-ink.png`);
    const cropOffset = (index * 67) % 394;
    await download(info.url, input);
    await magick(chartSource, background, [
      '-resize',
      '1093x1050^',
      '-gravity',
      'northwest',
      '-crop',
      `700x1050+${cropOffset}+0`,
      '+repage',
      '-colorspace',
      'gray',
      '-auto-level',
      '-sepia-tone',
      '42%',
      '-modulate',
      '104,72,100',
      '-fill',
      '#c9ad79',
      '-colorize',
      '9%',
      '-background',
      'white',
      '-vignette',
      '0x18',
    ]);
    await execFileAsync('magick', [
      background,
      '-fill',
      '#eee3c9dd',
      '-stroke',
      '#7b2d24',
      '-strokewidth',
      '4',
      '-draw',
      'roundrectangle 104,204 596,846 18,18',
      '-fill',
      'none',
      '-stroke',
      '#3d3528',
      '-strokewidth',
      '2',
      '-draw',
      'rectangle 122,222 578,828',
      panel,
    ]);
    await magick(input, mask, [
      '-background',
      'white',
      '-alpha',
      'remove',
      '-colorspace',
      'gray',
      '-threshold',
      '28%',
      '-negate',
      '-trim',
      '+repage',
      '-resize',
      '400x390',
    ]);
    await execFileAsync('magick', [
      mask,
      '-alpha',
      'copy',
      '-channel',
      'RGB',
      '-fill',
      '#29251f',
      '-colorize',
      '100',
      '+channel',
      ink,
    ]);
    await execFileAsync('magick', [
      panel,
      ink,
      '-gravity',
      'center',
      '-geometry',
      '+0-5',
      '-compose',
      'multiply',
      '-composite',
      '-fill',
      '#8d2e24',
      '-stroke',
      'none',
      '-draw',
      'rectangle 318,742 382,806',
      '-fill',
      '#ead8b5',
      '-draw',
      'rectangle 329,753 371,795',
      '-fill',
      '#8d2e24',
      '-draw',
      'circle 350,774 359,774',
      '-fill',
      'none',
      '-stroke',
      '#c4a86c',
      '-strokewidth',
      '3',
      '-draw',
      'rectangle 22,22 677,1027',
      '-stroke',
      '#3d3528',
      '-strokewidth',
      '2',
      '-draw',
      'rectangle 30,30 669,1019',
      '-strip',
      '-quality',
      '88',
      output,
    ]);
    cards.push({
      cardIndex: index + 1,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: title.replace(/^File:/, ''),
      sourceUrl: info.descriptionurl,
      backgroundSourceTitle:
        'Diagram of hexagrams sent by Joachim Bouvet to Leibniz, 1701',
      backgroundSourceUrl: chartInfo.descriptionurl,
      license,
      artist: `${metadataValue(info, 'Artist')}; unknown author, Leibniz Archive`,
      treatment:
        'The exact six-line hexagram is printed in a warm archival panel over a cropped public-domain 1701 diagram of the sixty-four figures; a non-textual vermilion seal balances the composition.',
    });
  }
  await writeManifest(slug, {
    sourceCollection:
      'https://commons.wikimedia.org/wiki/Category:I_Ching_hexagrams',
    backgroundSourceCollection: chartInfo.descriptionurl,
    rightsNote:
      'The hexagram forms and the 1701 Bouvet–Leibniz chart are public domain. The card presentation is modern and does not replace a changing-line consultation.',
    cards,
  });
  process.stdout.write(`${slug}: ${cards.length} sourced images\n`);
}

const hafezCategories = [
  'Category:Divan by Hafez, Safavid (Walters MS 628)',
  'Category:Divan by Hafez, Safavid (Walters MS 629)',
  'Category:Divan by Hafez, Safavid (Walters MS 630)',
  'Category:Divan by Hafez, Safavid (Walters MS 631)',
  'Category:Divan by Hafez, Safavid (Walters MS 632)',
  'Category:Divan by Hafez, Safavid (Walters MS 633)',
  'Category:Divan by Hafez, Safavid (Walters MS 634)',
  'Category:Divan by Hafez, Safavid (Walters MS 638)',
];

async function renderHafez() {
  const slug = 'hafez';
  if (await isComplete(slug, 36)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const members = [];
  for (const category of hafezCategories) {
    members.push(...(await categoryMembers(category)));
    await sleep(900);
  }
  const preferred = [...new Set(members.map(({ title }) => title))]
    .filter((title) => /\.(jpe?g|png)$/i.test(title))
    .filter((title) =>
      /Full Page|Incipit|Frontispiece|Illustration|Text Page|Colophon|Party|Scene|Reception/i.test(
        title,
      ),
    )
    .sort((a, b) => a.localeCompare(b));
  if (preferred.length < 36)
    throw new Error(`Only ${preferred.length} suitable Hafez manuscript pages`);
  const candidates = preferred.slice(0, 48);
  const infoByTitle = await imageInfo(candidates, 1100);
  const selected = candidates
    .filter((title) => {
      const info = infoByTitle.get(title);
      if (!info) return false;
      return /CC0|public domain|no restrictions|PDM/i.test(
        metadataValue(info, 'LicenseShortName'),
      );
    })
    .slice(0, 36);
  if (selected.length !== 36)
    throw new Error(`Only ${selected.length} openly licensed Hafez pages`);
  const cards = [];
  for (const [index, title] of selected.entries()) {
    const info = infoByTitle.get(title);
    const license = assertReusable(info, title);
    const filename = `hafez-${String(index + 1).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    try {
      await access(output);
    } catch {
      const input = join(scratch, `hafez-${index + 1}.source`);
      const cacheFriendly = knownCommonsInfo(
        [title],
        license,
        metadataValue(info, 'Artist'),
        1280,
      ).get(title);
      await download(cacheFriendly.url, input);
      await magick(input, output, [
        '-auto-orient',
        '-colorspace',
        'sRGB',
        '-resize',
        '900x1200>',
        '-strip',
        '-quality',
        '84',
      ]);
    }
    cards.push({
      cardIndex: index + 1,
      file: filename,
      bytes: await bytes(output),
      sourceTitle: title.replace(/^File:/, ''),
      sourceUrl: info.descriptionurl,
      license,
      artist: metadataValue(info, 'Artist'),
      treatment:
        'Aspect ratio preserved; resized only; no cropping of the manuscript page.',
    });
  }
  await writeManifest(slug, {
    sourceCollection:
      'https://commons.wikimedia.org/wiki/Category:Divan_of_Hafez',
    rightsNote:
      'All images are public-domain/CC0 pages from historical Divān of Hafez manuscripts in the Walters Art Museum. Fāl-e Hāfez is bibliomancy, so the app’s 36 motif cards remain explicitly labeled as a contemporary adaptation.',
    cards,
  });
  process.stdout.write(`${slug}: ${cards.length} sourced images\n`);
}

async function renderHanafuda() {
  const slug = 'hanafuda';
  if (await isComplete(slug, 48)) return;
  const directory = join(outputRoot, slug);
  await mkdir(directory, { recursive: true });
  const title = 'File:白美人印の八八花札（昭和前期）.jpg';
  const info = knownCommonsInfo([title], 'Public domain', '白美人印', 3840).get(
    title,
  );
  if (!info) throw new Error(`Missing metadata for ${title}`);
  const license = assertReusable(info, title);
  const source = join(scratch, 'hanafuda.jpg');
  await download(info.url, source);
  const dimensions = (
    await execFileAsync('magick', ['identify', '-format', '%w %h', source])
  ).stdout
    .trim()
    .split(/\s+/)
    .map(Number);
  const cellWidth = Math.floor(dimensions[0] / 13);
  const cellHeight = Math.floor(dimensions[1] / 4);
  const cards = [];
  let cardIndex = 0;
  for (let month = 0; month < 12; month += 1) {
    for (let row = 0; row < 4; row += 1) {
      cardIndex += 1;
      const filename = `hanafuda-${String(cardIndex).padStart(2, '0')}.webp`;
      const output = join(directory, filename);
      await magick(source, output, [
        '-crop',
        `${cellWidth}x${cellHeight}+${month * cellWidth}+${row * cellHeight}`,
        '-fuzz',
        '7%',
        '-trim',
        '+repage',
        '-colorspace',
        'sRGB',
        '-resize',
        '900x1200>',
        '-strip',
        '-quality',
        '86',
      ]);
      cards.push({
        cardIndex,
        month: month + 1,
        cardWithinMonth: row + 1,
        file: filename,
        bytes: await bytes(output),
        sourceTitle: title.replace(/^File:/, ''),
        sourceUrl: info.descriptionurl,
        license,
        artist: metadataValue(info, 'Artist'),
        treatment:
          'Cropped by month and card position from the public-domain complete-deck scan.',
      });
    }
  }
  await writeManifest(slug, {
    sourceCollection: info.descriptionurl,
    rightsNote:
      'This is a public-domain early-Shōwa Hachihachi hanafuda deck (1926–1945), arranged by month from January through December.',
    cards,
  });
  process.stdout.write(`${slug}: ${cards.length} sourced images\n`);
}

await mkdir(outputRoot, { recursive: true });
await renderKipper();
await sleep(900);
await renderBelline();
await sleep(900);
await renderPlayingCards();
await sleep(900);
await renderSibilla();
await sleep(900);
await renderRunes();
await sleep(900);
await renderIChing();
await sleep(900);
await renderHafez();
await sleep(900);
await renderHanafuda();

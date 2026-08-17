import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const commonsApi = 'https://commons.wikimedia.org/w/api.php';
const userAgent = 'DIVINE/1.0 (private divination art provenance audit)';
const outputRoot = join(process.cwd(), 'public', 'open-decks-v1');

const collections = {
  oracle: {
    category: 'Category:Mantegna Tarocchi (set of whole pages; TIFs)',
    source:
      'https://commons.wikimedia.org/wiki/Category:Mantegna_Tarocchi_(set_of_whole_pages;_TIFs)',
    count: 44,
    choose(members) {
      return members.filter(
        ({ title }) =>
          /Master of the E-Series Tarocchi/i.test(title) &&
          !/ - Tarocchi - 1924\.432 -/i.test(title),
      );
    },
  },
  ritual: {
    category: 'Category:Iconologia, 1613',
    source: 'https://commons.wikimedia.org/wiki/Category:Iconologia,_1613',
    count: 36,
    choose(members) {
      const plates = members.filter(({ title }) => /\.jpg$/i.test(title));
      const start = 12;
      const end = plates.length - 13;
      return Array.from(
        { length: 36 },
        (_, index) => plates[Math.round(start + (index * (end - start)) / 35)],
      );
    },
  },
  temple: {
    category: 'Category:Panthéon égyptien by Jean-François Champollion',
    source:
      'https://commons.wikimedia.org/wiki/Category:Panthéon_égyptien_by_Jean-François_Champollion',
    count: 36,
    choose(members) {
      const plates = members
        .filter(
          ({ title }) =>
            /page \d+ crop\)\.jpg$/i.test(title) &&
            !/DO NOT ROTATE/i.test(title),
        )
        .sort(
          (a, b) =>
            Number(a.title.match(/page (\d+)/i)?.[1] ?? 0) -
            Number(b.title.match(/page (\d+)/i)?.[1] ?? 0),
        );
      return Array.from(
        { length: 36 },
        (_, index) => plates[Math.round((index * (plates.length - 1)) / 35)],
      );
    },
  },
  zodiac: {
    category: "Category:Urania's Mirror",
    source: "https://commons.wikimedia.org/wiki/Category:Urania's_Mirror",
    count: 34,
    choose(members) {
      const titles = members.map(({ title }) => title);
      const canonical = titles.filter(
        (title) =>
          /^File:Sidney Hall - Urania's Mirror/.test(title) &&
          /\.jpg$/i.test(title) &&
          !/- original/i.test(title) &&
          !/Canis Major\.jpg$/i.test(title) &&
          !/text right side up/i.test(title) &&
          !(/Noctua/.test(title) && !/whole card/i.test(title)),
      );
      const sagittarius = titles.find(
        (title) =>
          /Sidney Hall - Urania's Mirror - Sagittarius/.test(title) &&
          /\.png$/i.test(title) &&
          !/original/i.test(title),
      );
      if (sagittarius) canonical.push(sagittarius);

      const signMatchers = [
        / - Aries and /,
        / - Taurus\.jpg$/,
        / - Gemini\.jpg$/,
        / - Cancer\.jpg$/,
        / - Leo Major /,
        / - Virgo\.jpg$/,
        / - Libra\.jpg$/,
        / - Scorpio\.jpg$/,
        / - Sagittarius /,
        / - Capricornus\.jpg$/,
        / - Aquarius, /,
        / - Pisces\.jpg$/,
      ];
      const signs = signMatchers.map((matcher) => {
        const title = canonical.find((candidate) => matcher.test(candidate));
        if (!title) throw new Error(`Missing Urania plate for ${matcher}`);
        return title;
      });
      const used = new Set(signs);
      const remaining = canonical.filter((title) => !used.has(title));
      const extras = [
        titles.find((title) =>
          /Urania's Mirror \(lid of box\)\.jpg$/i.test(title),
        ),
        titles.find((title) =>
          /Urania's Mirror Box \(Front\)\.jpg$/i.test(title),
        ),
      ];
      return [...signs, ...remaining, ...extras]
        .filter(Boolean)
        .slice(0, 34)
        .map((title) => ({ title }));
    },
  },
};

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
  for (let attempt = 0; attempt < 8; attempt += 1) {
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
    const text = await response.text();
    if (response.ok && text.trimStart().startsWith('{'))
      return JSON.parse(text);
    const retryAfter = Number(response.headers.get('retry-after') ?? 0);
    await sleep(Math.max(retryAfter * 1000 + 1000, 1500 * (attempt + 1)));
  }
  throw new Error(`Commons API request failed: ${url}`);
}

async function categoryMembers(category) {
  const response = await api({
    action: 'query',
    list: 'categorymembers',
    cmtitle: category,
    cmnamespace: '6',
    cmtype: 'file',
    cmlimit: '500',
  });
  return response.query.categorymembers;
}

async function imageInfo(titles) {
  const result = new Map();
  // Some archival filenames are exceptionally long. Small batches keep the
  // request comfortably below proxy and server URL limits.
  for (let index = 0; index < titles.length; index += 25) {
    const response = await api(
      {
        action: 'query',
        titles: titles.slice(index, index + 25).join('|'),
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: '1200',
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
  return info.extmetadata?.[key]?.value?.replace(/<[^>]+>/g, '') ?? '';
}

function assertOpenLicense(info, title) {
  const license = metadataValue(info, 'LicenseShortName');
  if (
    !/CC0|public domain|public domain mark|no restrictions|PDM/i.test(license)
  )
    throw new Error(`Non-open or unknown license for ${title}: ${license}`);
  return license;
}

async function downloadImage(primaryUrl, fallbackUrl) {
  const candidates = [...new Set([primaryUrl, fallbackUrl].filter(Boolean))];
  for (const candidate of candidates) {
    const url = new URL(candidate);
    url.searchParams.delete('utm_source');
    url.searchParams.delete('utm_campaign');
    url.searchParams.delete('utm_content');
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(url, {
        headers: { 'User-Agent': userAgent },
      });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
      const retryAfter = Number(response.headers.get('retry-after') ?? 0);
      await sleep(Math.max(retryAfter * 1000 + 1000, 1300 * (attempt + 1)));
    }
  }
  throw new Error(`Image download failed: ${primaryUrl}`);
}

async function renderDeck(slug, definition) {
  const directory = join(outputRoot, slug);
  try {
    const existing = JSON.parse(
      await readFile(join(directory, 'manifest.json'), 'utf8'),
    );
    if (existing.cards?.length === definition.count) {
      await Promise.all(
        existing.cards.map(({ file }) => access(join(directory, file))),
      );
      process.stdout.write(
        `${slug}: existing ${definition.count} open images\n`,
      );
      return;
    }
  } catch {
    // Missing or incomplete output is regenerated below.
  }

  const members = await categoryMembers(definition.category);
  const selected = definition.choose(members);
  if (selected.length !== definition.count)
    throw new Error(
      `${slug}: expected ${definition.count} images, selected ${selected.length}`,
    );

  await sleep(650);
  const infoByTitle = await imageInfo(selected.map(({ title }) => title));
  const scratch = await mkdtemp(join(tmpdir(), `divine-${slug}-`));
  await mkdir(directory, { recursive: true });
  const manifest = [];

  for (let index = 0; index < selected.length; index += 1) {
    const title = selected[index].title;
    const info = infoByTitle.get(title);
    if (!info) throw new Error(`Missing image metadata for ${title}`);
    const license = assertOpenLicense(info, title);
    const sourceUrl = info.descriptionurl;
    const imageUrl = info.thumburl || info.url;
    const input = join(scratch, `${String(index + 1).padStart(2, '0')}.source`);
    const filename = `${slug}-${String(index + 1).padStart(2, '0')}.webp`;
    const output = join(directory, filename);
    try {
      await access(output);
    } catch {
      await writeFile(input, await downloadImage(imageUrl, info.url));
      await execFileAsync('magick', [
        input,
        '-auto-orient',
        '-colorspace',
        'sRGB',
        '-resize',
        '900x900>',
        '-strip',
        '-quality',
        '82',
        output,
      ]);
    }
    const stats = await readFile(output);
    manifest.push({
      cardIndex: index + 1,
      file: filename,
      bytes: stats.byteLength,
      sourceTitle: title.replace(/^File:/, ''),
      sourceUrl,
      license,
      artist: metadataValue(info, 'Artist'),
      collection: definition.category.replace(/^Category:/, ''),
    });
    process.stdout.write(`${slug} ${index + 1}/${selected.length}\r`);
  }

  await writeFile(
    join(directory, 'manifest.json'),
    `${JSON.stringify(
      {
        generatedAt: '2026-09-02',
        sourceCollection: definition.source,
        treatment: 'Aspect ratio preserved; resized only; no cropping.',
        cards: manifest,
      },
      null,
      2,
    )}\n`,
  );
  process.stdout.write(`${slug}: ${selected.length} open images\n`);
}

await mkdir(outputRoot, { recursive: true });
for (const [slug, definition] of Object.entries(collections)) {
  await renderDeck(slug, definition);
  await sleep(750);
}

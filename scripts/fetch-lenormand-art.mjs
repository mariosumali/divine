import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const sourceUrl =
  'https://upload.wikimedia.org/wikipedia/commons/a/a6/Das_Spiel_der_Hofnung_%28The_Game_of_Hope%29.png';
const outputRoot = join(process.cwd(), 'public', 'lenormand');
const userAgent = 'DIVINE/1.0 (private historical card-art crop)';

// Bounds of the physical cards in the 3900 x 4900 Commons scan. Each crop is
// normalized after extraction so all cards render at a stable deck ratio while
// retaining the complete printed border.
const cardCrops = [
  '568x736+134+113',
  '558x732+741+109',
  '559x727+1365+116',
  '559x734+1981+110',
  '559x734+2578+120',
  '555x718+3221+133',
  '556x738+125+910',
  '560x729+734+908',
  '554x723+1357+922',
  '552x729+1967+912',
  '565x724+2568+926',
  '559x728+3206+912',
  '550x724+130+1713',
  '560x729+722+1700',
  '553x728+1347+1707',
  '551x719+1964+1712',
  '557x724+2566+1699',
  '559x707+3202+1706',
  '559x723+121+2494',
  '548x723+721+2486',
  '549x722+1341+2493',
  '553x724+1954+2493',
  '558x714+2572+2502',
  '552x714+3198+2502',
  '542x717+135+3265',
  '554x714+720+3269',
  '558x717+1340+3273',
  '558x719+1960+3275',
  '558x716+2580+3274',
  '556x722+3203+3277',
  '547x696+132+4070',
  '550x702+725+4065',
  '563x712+1343+4057',
  '574x698+1961+4064',
  '552x705+2586+4069',
  '563x701+3202+4074',
];

const response = await fetch(sourceUrl, {
  headers: { 'User-Agent': userAgent },
});
if (!response.ok)
  throw new Error(`Game of Hope download failed: ${response.status}`);

const scratch = await mkdtemp(join(tmpdir(), 'divine-lenormand-'));
const source = join(scratch, 'game-of-hope.png');
await writeFile(source, Buffer.from(await response.arrayBuffer()));
await mkdir(outputRoot, { recursive: true });

for (const [index, crop] of cardCrops.entries()) {
  const filename = `game-of-hope-${String(index + 1).padStart(2, '0')}.webp`;
  await execFileAsync('magick', [
    source,
    '-crop',
    crop,
    '+repage',
    '-colorspace',
    'sRGB',
    '-resize',
    '570x740!',
    '-strip',
    '-define',
    'webp:method=6',
    '-quality',
    '90',
    join(outputRoot, filename),
  ]);
}

process.stdout.write(`Lenormand: ${cardCrops.length} corrected crops\n`);

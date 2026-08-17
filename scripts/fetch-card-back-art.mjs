import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const source =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Owen_Jones_-_Grammar_of_Ornament_-_1868_-_plate_060_-_300ppi.jpg/1280px-Owen_Jones_-_Grammar_of_Ornament_-_1868_-_plate_060_-_300ppi.jpg';
const expectedSha256 =
  'a79d7f65ebca796de95d0fd296fa76ed7378630e8096205844815edda041daea';
const destination = join(
  process.cwd(),
  'public',
  'card-backs',
  'owen-jones-ornament-60.jpg',
);

const response = await fetch(source, {
  headers: { 'User-Agent': 'DIVINE card-back asset fetcher/1.0' },
});

if (!response.ok) {
  throw new Error(`Card-back download failed: ${response.status}`);
}

const bytes = Buffer.from(await response.arrayBuffer());
const actualSha256 = createHash('sha256').update(bytes).digest('hex');

if (actualSha256 !== expectedSha256) {
  throw new Error(
    `Card-back checksum changed. Expected ${expectedSha256}, received ${actualSha256}.`,
  );
}

await mkdir(join(process.cwd(), 'public', 'card-backs'), { recursive: true });
await writeFile(destination, bytes);

console.log(`Saved ${destination}`);

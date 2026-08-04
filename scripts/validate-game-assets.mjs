import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const expectedAssetCount = 34;
const maximumAssetBytes = 100 * 1024;
const maximumTotalBytes = 1.5 * 1024 * 1024;
const sourcePath = resolve('src/app/features/games/data/demo-content-packages.ts');
const assetDirectory = resolve('public/assets/games/catalog');
const errors = [];

const source = await readFile(sourcePath, 'utf8');
const references = [...source.matchAll(/catalogImage\(\s*'([a-z0-9-]+)'/g)].map(
  (match) => `${match[1]}.webp`,
);
const uniqueReferences = new Set(references);
const assetFiles = (await readdir(assetDirectory))
  .filter((filename) => filename.endsWith('.webp'))
  .sort();
const assetFileSet = new Set(assetFiles);

if (references.length !== expectedAssetCount) {
  errors.push(`Expected ${expectedAssetCount} catalog references, found ${references.length}.`);
}

if (uniqueReferences.size !== references.length) {
  errors.push('Every game must reference a different catalog image path.');
}

if (assetFiles.length !== expectedAssetCount) {
  errors.push(`Expected ${expectedAssetCount} catalog files, found ${assetFiles.length}.`);
}

for (const reference of uniqueReferences) {
  if (!assetFileSet.has(reference)) {
    errors.push(`Missing referenced catalog image: ${reference}`);
  }
}

for (const filename of assetFiles) {
  if (!uniqueReferences.has(filename)) {
    errors.push(`Catalog image is not referenced by a game: ${filename}`);
  }
}

const hashes = new Map();
let totalBytes = 0;

for (const filename of assetFiles) {
  const path = resolve(assetDirectory, filename);
  const contents = await readFile(path);
  const details = await stat(path);
  totalBytes += details.size;

  if (
    contents.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    contents.subarray(8, 12).toString('ascii') !== 'WEBP'
  ) {
    errors.push(`${filename} is not a valid WebP container.`);
  }

  if (details.size > maximumAssetBytes) {
    errors.push(
      `${filename} is ${(details.size / 1024).toFixed(1)} KB; maximum is ${
        maximumAssetBytes / 1024
      } KB.`,
    );
  }

  const hash = createHash('sha256').update(contents).digest('hex');
  const duplicate = hashes.get(hash);
  if (duplicate) {
    errors.push(`${filename} duplicates the bytes of ${duplicate}.`);
  }
  hashes.set(hash, filename);
}

if (totalBytes > maximumTotalBytes) {
  errors.push(
    `Catalog assets total ${(totalBytes / 1024).toFixed(1)} KB; maximum is ${(
      maximumTotalBytes / 1024
    ).toFixed(0)} KB.`,
  );
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${assetFiles.length} unique WebP catalog assets (${(totalBytes / 1024).toFixed(
      1,
    )} KB total).`,
  );
}

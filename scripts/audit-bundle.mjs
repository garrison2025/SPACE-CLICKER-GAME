import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const assetsDir = path.resolve('dist/assets');

if (!fs.existsSync(assetsDir)) {
  throw new Error('dist/assets not found. Run the production build before the bundle audit.');
}

const files = fs.readdirSync(assetsDir)
  .filter((name) => name.endsWith('.js') || name.endsWith('.css'))
  .map((name) => {
    const fullPath = path.join(assetsDir, name);
    const source = fs.readFileSync(fullPath);
    return {
      name,
      rawBytes: source.length,
      gzipBytes: gzipSync(source, { level: 9 }).length
    };
  });

const kib = (bytes) => bytes / 1024;
const format = (bytes) => `${kib(bytes).toFixed(1)} KiB`;

const mainJs = files.find((file) => /^index-.*\.js$/.test(file.name));
const mainCss = files.find((file) => /^index-.*\.css$/.test(file.name));

if (!mainJs) throw new Error('Main index JS asset was not found.');
if (!mainCss) throw new Error('Main index CSS asset was not found.');

const MAIN_JS_GZIP_LIMIT = 100 * 1024;
const MAIN_CSS_GZIP_LIMIT = 25 * 1024;
const LAZY_CHUNK_GZIP_LIMIT = 30 * 1024;
const TOTAL_JS_GZIP_LIMIT = 220 * 1024;

if (mainJs.gzipBytes > MAIN_JS_GZIP_LIMIT) {
  throw new Error(`Main JS gzip budget exceeded: ${format(mainJs.gzipBytes)} > ${format(MAIN_JS_GZIP_LIMIT)}`);
}

if (mainCss.gzipBytes > MAIN_CSS_GZIP_LIMIT) {
  throw new Error(`Main CSS gzip budget exceeded: ${format(mainCss.gzipBytes)} > ${format(MAIN_CSS_GZIP_LIMIT)}`);
}

const lazyJs = files.filter((file) => file.name.endsWith('.js') && file.name !== mainJs.name);
const MIN_LAZY_JS_CHUNKS = 12;

if (lazyJs.length < MIN_LAZY_JS_CHUNKS) {
  throw new Error(`Expected at least ${MIN_LAZY_JS_CHUNKS} lazy JS chunks, found ${lazyJs.length}. Check whether route/game code was accidentally pulled into the main bundle.`);
}

const mainJsSource = fs.readFileSync(path.join(assetsDir, mainJs.name), 'utf8');
for (const forbidden of [
  'Before there were complex simulations',
  'CHARGE OVERDRIVE',
  'Recent Spacebar Test Results'
]) {
  if (mainJsSource.includes(forbidden)) {
    throw new Error(`Main JS contains lazy-only content marker "${forbidden}". Code splitting has regressed.`);
  }
}

for (const file of lazyJs) {
  if (file.gzipBytes > LAZY_CHUNK_GZIP_LIMIT) {
    throw new Error(`Lazy chunk gzip budget exceeded for ${file.name}: ${format(file.gzipBytes)} > ${format(LAZY_CHUNK_GZIP_LIMIT)}`);
  }
}

const totalJsGzip = files
  .filter((file) => file.name.endsWith('.js'))
  .reduce((sum, file) => sum + file.gzipBytes, 0);

if (totalJsGzip > TOTAL_JS_GZIP_LIMIT) {
  throw new Error(`Total JS gzip budget exceeded: ${format(totalJsGzip)} > ${format(TOTAL_JS_GZIP_LIMIT)}`);
}

console.log(
  [
    'Bundle budget passed',
    `main JS ${format(mainJs.gzipBytes)} / ${format(MAIN_JS_GZIP_LIMIT)}`,
    `main CSS ${format(mainCss.gzipBytes)} / ${format(MAIN_CSS_GZIP_LIMIT)}`,
    `lazy chunks ${lazyJs.length} (min ${MIN_LAZY_JS_CHUNKS})`,
    `largest lazy JS ${format(Math.max(0, ...lazyJs.map((file) => file.gzipBytes)))} / ${format(LAZY_CHUNK_GZIP_LIMIT)}`,
    `total JS ${format(totalJsGzip)} / ${format(TOTAL_JS_GZIP_LIMIT)}`
  ].join(' • ')
);

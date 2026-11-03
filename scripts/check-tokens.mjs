// Fails when a colour is written as a value outside the design tokens. Deterministic, runs in `npm run lint:arch`.
// Agents (and people) reach for a hex code when a screen "needs a bit more green"; the token is the contract instead.
// Checked: .scss files and the inline `styles:` of components. Allowed: apps/atlas/src/styles/tokens (the palette lives there)
// and libs/legacy, which keeps its 2017 look on purpose until it is deleted.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const roots = ['apps', 'libs'];
const skip = new Set(['node_modules', 'dist', '.nx', '.angular']);
const allowed = [
  join('apps', 'atlas', 'src', 'styles', 'tokens') + sep,
  join('libs', 'legacy') + sep,
];
const colour = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|lab|lch)\(/i;

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (
      /\.scss$/.test(name) ||
      (/\.ts$/.test(name) && !/\.spec\.ts$/.test(name))
    )
      files.push(full);
  }
};
roots.forEach(walk);

// Only the CSS of a .ts file: the text of its `styles: \`...\`` block, with the line it starts on.
const cssOf = (file, text) => {
  if (file.endsWith('.scss')) return [{ css: text, firstLine: 1 }];
  return [...text.matchAll(/styles:\s*`([\s\S]*?)`/g)].map((m) => ({
    css: m[1],
    firstLine: text.slice(0, m.index).split('\n').length,
  }));
};

const hits = [];
let checked = 0;
for (const file of files) {
  if (allowed.some((dir) => file.startsWith(dir))) continue;
  for (const { css, firstLine } of cssOf(file, readFileSync(file, 'utf8'))) {
    checked++;
    css.split('\n').forEach((line, i) => {
      if (colour.test(line.replace(/\/\/.*$/, '')))
        hits.push(`${file}:${firstLine + i}  ${line.trim()}`);
    });
  }
}

if (hits.length) {
  console.error(
    'Raw colours outside the design tokens (use a --color-* token from apps/atlas/src/styles/tokens):\n' +
      hits.map((h) => '  ' + h).join('\n'),
  );
  process.exit(1);
}
console.log(`check-tokens: ${checked} stylesheets, no raw colours`);

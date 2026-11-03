// Fails when something that looks like a credential sits in client code. Deterministic, runs in `npm run lint:arch`.
// It is the cheap layer; the model-based scan (`/claude-security` on the diff) is the thorough one. Both run before a human reads the diff.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps', 'libs'];
const skip = new Set(['node_modules', 'dist', '.nx', '.angular']);
const patterns = [
  { name: 'assigned secret', re: /\b(api[_-]?key|secret|token|password|access[_-]?key)\b\s*[:=]\s*['"`][A-Za-z0-9_\-]{16,}['"`]/i },
  { name: 'vendor key format', re: /\b[a-z]{2,5}_(live|test|prod)_[A-Za-z0-9]{16,}\b/ },
  { name: 'bearer literal', re: /Bearer\s+[A-Za-z0-9\-_.]{20,}/ },
];

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|mts|js|mjs|html|json)$/.test(name) && !/\.spec\.ts$/.test(name)) files.push(full);
  }
};
roots.forEach(walk);

const hits = [];
for (const file of files) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const { name, re } of patterns) if (re.test(line)) hits.push(`${file}:${i + 1}  ${name}`);
  });
}

if (hits.length) {
  console.error('Possible secrets in client code:\n' + hits.map((h) => '  ' + h).join('\n'));
  process.exit(1);
}
console.log(`scan-secrets: ${files.length} files, nothing found`);

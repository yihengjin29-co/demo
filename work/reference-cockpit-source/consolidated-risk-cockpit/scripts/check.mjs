import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of [
  'scripts/build.mjs',
  'tests/package-integrity.mjs',
  'tests/qa-warning-classification.cjs',
  'tests/qa-event-org-details.cjs',
]) {
  const result = spawnSync(process.execPath, [path.join(root, file)], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('PASS: build and all packaged tests');

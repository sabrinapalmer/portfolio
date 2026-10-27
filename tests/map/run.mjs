// Smoke tests for brinamaps/public/map/index.html. Each script drives the page in headless Chromium with every
// network service mocked, prints what it saw, and ends with "errors [...]". A run passes when every
// script exits cleanly with an empty error list. They do not check the printed values themselves.
// Run: npm run test:map   (set CHROME_PATH to a Chromium binary if the default path does not exist)
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
let failed = 0;
for (const f of readdirSync(dir).filter(f => f.endsWith('.mjs') && f !== 'run.mjs' && !f.startsWith('_')).sort()) {
  const r = spawnSync(process.execPath, [dir + f], { encoding: 'utf8', timeout: 180000 });
  const ok = r.status === 0 && /^errors \[\]\s*$/m.test(r.stdout);
  console.log((ok ? 'pass  ' : 'FAIL  ') + f);
  if (!ok) { failed++; console.log((r.stdout + r.stderr).split('\n').slice(-12).join('\n')); }
}
process.exit(failed ? 1 : 0);

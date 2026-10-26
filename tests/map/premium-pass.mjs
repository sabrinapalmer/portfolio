// The Premium check on the server: Apple-style signed subscription records turn into passes; anything else is refused.
// A throwaway certificate chain stands in for Apple's (the real check pins Apple's root, which only Apple can sign with).
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROOT = new URL('../../', import.meta.url).pathname;
process.env.TOMTOM_KEY = 'TTSECRET';
const P = await import(ROOT + 'brinamaps/api/_premium.js'), traffic = (await import(ROOT + 'brinamaps/api/traffic.js')).default, premiumApi = (await import(ROOT + 'brinamaps/api/premium.js')).default;
const errs = []; const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };

// root -> intermediate -> leaf, all P-256, like the App Store's chain
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chain-')), o = (...a) => execFileSync('openssl', a, { cwd: dir, stdio: 'pipe' });
for (const n of ['root', 'mid', 'leaf']) o('ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', n + '.key');
o('req', '-x509', '-new', '-key', 'root.key', '-subj', '/CN=Test Root', '-days', '30', '-out', 'root.pem', '-addext', 'basicConstraints=critical,CA:TRUE');
fs.writeFileSync(path.join(dir, 'ca.ext'), 'basicConstraints=critical,CA:TRUE\n');
o('req', '-new', '-key', 'mid.key', '-subj', '/CN=Test Mid', '-out', 'mid.csr');
o('x509', '-req', '-in', 'mid.csr', '-CA', 'root.pem', '-CAkey', 'root.key', '-CAcreateserial', '-days', '30', '-out', 'mid.pem', '-extfile', 'ca.ext');
o('req', '-new', '-key', 'leaf.key', '-subj', '/CN=Test Leaf', '-out', 'leaf.csr');
o('x509', '-req', '-in', 'leaf.csr', '-CA', 'mid.pem', '-CAkey', 'mid.key', '-CAcreateserial', '-days', '30', '-out', 'leaf.pem');
const der = n => new crypto.X509Certificate(fs.readFileSync(path.join(dir, n + '.pem'))).raw.toString('base64');
const leafKey = crypto.createPrivateKey(fs.readFileSync(path.join(dir, 'leaf.key')));
const rootFp = new crypto.X509Certificate(fs.readFileSync(path.join(dir, 'root.pem'))).fingerprint256.replace(/:/g, '');
const jws = (payload, key = leafKey) => {
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', x5c: [der('leaf'), der('mid'), der('root')] })).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return h + '.' + p + '.' + crypto.sign('sha256', Buffer.from(h + '.' + p), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
};
const good = { bundleId: 'com.sabrinapalmer.map', productId: 'com.sabrinapalmer.map.premium.monthly', originalTransactionId: '2000001', expiresDate: Date.now() + 30 * 864e5, environment: 'Sandbox' };
const opts = { rootFingerprint: rootFp, checkMarkers: false };
const refused = (tx, o2 = opts) => { try { P.verifyTransaction(tx, o2); return false; } catch (e) { return !!e.reject; } };

check(P.verifyTransaction(jws(good), opts).productId === good.productId, 'a valid subscription record is accepted');
check(refused(jws(good), { checkMarkers: false }), 'a record not chained to Apple\'s root is refused (real pinned root)');
check(refused(jws({ ...good, bundleId: 'com.other.app' })), 'a purchase from another app is refused');
check(refused(jws({ ...good, productId: 'com.sabrinapalmer.map.tip' })), 'a product that is not Premium is refused');
check(refused(jws({ ...good, expiresDate: Date.now() - 10 * 864e5 })), 'an expired subscription is refused');
check(!refused(jws({ ...good, expiresDate: Date.now() - 864e5 })), 'a subscription a day past renewal still works (grace period)');
check(refused(jws({ ...good, revocationDate: Date.now() })), 'a refunded subscription is refused');
const t = jws(good), parts = t.split('.');
check(refused(parts[0] + '.' + Buffer.from(JSON.stringify({ ...good, expiresDate: Date.now() + 9e12 })).toString('base64url') + '.' + parts[2]), 'an edited record is refused');
check(refused(jws(good, crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey)), 'a record signed by the wrong key is refused');
check(refused('not.a.jws') && refused(null), 'junk is refused');

const { pass } = P.passFor(P.verifyTransaction(jws(good), opts));
check(P.checkPass(pass), 'the pass it issues is accepted');
check(!P.checkPass(pass.slice(0, -2) + 'xx') && !P.checkPass(Buffer.from(JSON.stringify({ exp: 9e15 })).toString('base64url') + '.' + pass.split('.')[1]), 'an edited pass is refused');
check(!P.checkPass(pass, Date.now() + 60 * 864e5), 'a pass stops working after the subscription ends');

// The two endpoints
globalThis.fetch = async () => new Response('{"routes":[]}', { status: 200, headers: { 'content-type': 'application/json' } });
const run = async (h, req) => { const out = { headers: {} }; const res = { setHeader: (k, v) => { out.headers[k] = v; }, status(c) { out.code = c; return this; }, json(o) { out.body = o; return this; }, send(b) { out.body = String(b); return this; }, end() { return this; } };
  await h({ method: 'GET', headers: {}, ...req }, res); return out; };
check((await run(traffic, { url: '/api/traffic?ep=route&locs=32.1,-117.0:31.8,-116.6' })).code === 401, 'traffic without a pass is refused');
check((await run(traffic, { url: '/api/traffic?ep=route&locs=32.1,-117.0:31.8,-116.6&t=' + encodeURIComponent(pass) })).code === 200, 'traffic with a pass works');
check((await run(traffic, { url: '/api/traffic?ep=flow&style=relative0&z=5&x=1&y=2&t=forged.pass' })).code === 401, 'traffic tiles with a forged pass are refused');
check((await run(premiumApi, { method: 'POST', url: '/api/premium', headers: { origin: 'capacitor://localhost' }, body: { transaction: jws(good) } })).code === 403, '/api/premium refuses records not signed through Apple\'s root');
check((await run(premiumApi, { method: 'GET', url: '/api/premium' })).code === 405, '/api/premium only takes POST');
fs.rmSync(dir, { recursive: true, force: true });
console.log('errors', errs);

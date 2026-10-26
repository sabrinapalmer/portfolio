// Premium passes for live traffic. Not a route: Vercel skips files in api/ whose names start with an underscore.
//
// After an App Store purchase the app sends Apple's signed record of the subscription (a StoreKit 2 transaction,
// a JWS). verifyTransaction() checks it really comes from Apple and is for an active BrinaMaps subscription, and
// passFor() turns it into a short pass the app adds to its traffic requests. checkPass() is what /api/traffic uses.
import crypto from 'node:crypto';

export const BUNDLE_ID = 'com.sabrinapalmer.map';
export const PRODUCTS = ['com.sabrinapalmer.map.premium.monthly', 'com.sabrinapalmer.map.premium.yearly'];
// SHA-256 fingerprint of "Apple Root CA - G3", as published by Apple (support.apple.com/103100)
export const APPLE_ROOT_G3 = '63343ABFB89A6A03EBB57E9B3F5FA7BE7C4F5C756F3017B3A8C488C3653E9179';
const OID_LEAF = Buffer.from('06 0a 2a 86 48 86 f7 63 64 06 0b 01'.replace(/ /g, ''), 'hex');   // 1.2.840.113635.100.6.11.1
const OID_INTERMEDIATE = Buffer.from('06 0a 2a 86 48 86 f7 63 64 06 02 01'.replace(/ /g, ''), 'hex');   // 1.2.840.113635.100.6.2.1
const GRACE = 3 * 86400000;   // a pass stays good a few days past renewal, so a late renewal check never cuts traffic off mid-trip

const b64u = s => Buffer.from(s, 'base64url');
const fail = why => { const e = new Error(why); e.reject = true; throw e; };

// Checks a StoreKit 2 signed transaction and returns its payload. rootFingerprint is only overridden by tests.
export function verifyTransaction(jws, { rootFingerprint = APPLE_ROOT_G3, now = Date.now(), checkMarkers = true } = {}) {
  if (typeof jws !== 'string' || jws.length > 20000) fail('bad transaction');
  const parts = jws.split('.');
  if (parts.length !== 3) fail('bad transaction');
  let header, payload;
  try { header = JSON.parse(b64u(parts[0])); payload = JSON.parse(b64u(parts[1])); } catch (e) { fail('bad transaction'); }
  if (header.alg !== 'ES256' || !Array.isArray(header.x5c) || header.x5c.length < 3) fail('not signed by the App Store');
  let leaf, mid, root;
  try { [leaf, mid, root] = header.x5c.slice(0, 3).map(c => new crypto.X509Certificate(Buffer.from(c, 'base64'))); } catch (e) { fail('not signed by the App Store'); }
  if (root.fingerprint256.replace(/:/g, '').toUpperCase() !== rootFingerprint) fail('not signed by the App Store');
  if (!root.verify(root.publicKey) || !mid.verify(root.publicKey) || !leaf.verify(mid.publicKey)) fail('not signed by the App Store');
  for (const c of [leaf, mid]) if (now < Date.parse(c.validFrom) || now > Date.parse(c.validTo)) fail('App Store certificate out of date');
  if (checkMarkers && (!leaf.raw.includes(OID_LEAF) || !mid.raw.includes(OID_INTERMEDIATE))) fail('not signed by the App Store');
  const ok = crypto.verify('sha256', Buffer.from(parts[0] + '.' + parts[1]), { key: leaf.publicKey, dsaEncoding: 'ieee-p1363' }, b64u(parts[2]));
  if (!ok) fail('not signed by the App Store');
  if (payload.bundleId !== BUNDLE_ID) fail('not a BrinaMaps purchase');
  if (!PRODUCTS.includes(payload.productId)) fail('not a Premium subscription');
  if (payload.revocationDate) fail('subscription refunded');
  if (!payload.expiresDate || payload.expiresDate + GRACE < now) fail('subscription expired');
  return payload;
}

const secret = () => {
  const s = process.env.PREMIUM_SECRET || (process.env.TOMTOM_KEY ? 'derived:' + process.env.TOMTOM_KEY : '');
  if (!s) throw new Error('no secret');
  return crypto.createHash('sha256').update('brinamaps-premium:' + s).digest();
};
const sign = body => crypto.createHmac('sha256', secret()).update(body).digest('base64url');

export function passFor(tx, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ exp: Math.min(tx.expiresDate + GRACE, now + 400 * 86400000), o: String(tx.originalTransactionId || '').slice(0, 40), env: tx.environment === 'Sandbox' ? 's' : 'p' })).toString('base64url');
  return { pass: body + '.' + sign(body), expires: tx.expiresDate };
}

export function checkPass(pass, now = Date.now()) {
  if (typeof pass !== 'string' || pass.length > 400) return false;
  const [body, mac] = pass.split('.');
  if (!body || !mac) return false;
  const want = Buffer.from(sign(body)), got = Buffer.from(mac);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return false;
  try { return JSON.parse(b64u(body)).exp > now; } catch (e) { return false; }
}

// POST /api/premium  { transaction: "<StoreKit 2 signed transaction>" }  ->  { pass, expires }
// POST /api/premium  { gift: "<code>" }  ->  { pass, expires, gift: true }   (codes in PREMIUM_GIFT_CODES, comma separated)
// The app calls this after a purchase or restore, and again when its pass runs out.
import crypto from 'node:crypto';
import { verifyTransaction, passFor } from './_premium.js';

const GIFT_DAYS = 400;
function giftOk(code) {   // constant-time compare against each configured code
  const want = (process.env.PREMIUM_GIFT_CODES || '').split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
  const got = Buffer.from(String(code || '').trim().toUpperCase());
  return want.some(w => { const b = Buffer.from(w); return b.length === got.length && crypto.timingSafeEqual(b, got); });
}

const ORIGINS = [/^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com$/, /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin && ORIGINS.some(o => o.test(origin))) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  else if (origin) { res.status(403).json({ error: 'origin not allowed' }); return; }
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  res.setHeader('Cache-Control', 'no-store');
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  try {
    if (body && body.gift != null) {
      if (!giftOk(body.gift)) { await new Promise(r => setTimeout(r, 800)); res.status(403).json({ error: 'That code is not valid.' }); return; }
      const expires = Date.now() + GIFT_DAYS * 86400000, id = 'gift-' + crypto.createHash('sha256').update(String(body.gift).trim().toUpperCase()).digest('hex').slice(0, 10);
      res.status(200).json(Object.assign(passFor({ expiresDate: expires, originalTransactionId: id, environment: 'Production' }), { gift: true }));
      return;
    }
    const tx = verifyTransaction(body && body.transaction);
    res.status(200).json(passFor(tx));
  } catch (e) {
    if (e.reject) res.status(403).json({ error: e.message });
    else res.status(500).json({ error: 'could not check the subscription' });
  }
}

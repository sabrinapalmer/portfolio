// POST /api/premium  { transaction: "<StoreKit 2 signed transaction>" }  ->  { pass, expires }
// The app calls this after a purchase or restore, and again when its pass runs out.
import { verifyTransaction, passFor } from './_premium.js';

const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

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
    const tx = verifyTransaction(body && body.transaction);
    res.status(200).json(passFor(tx));
  } catch (e) {
    if (e.reject) res.status(403).json({ error: e.message });
    else res.status(500).json({ error: 'could not check the subscription' });
  }
}

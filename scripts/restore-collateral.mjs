// restore-collateral.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function getParfumoUrl(brand, slug) {
  for (const s of [slug + '-1', slug]) {
    try {
      const r = await fetch(`https://www.parfumo.com/Perfumes/${brand}/${s}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const html = await r.text();
      const all = [...html.matchAll(/https:\/\/media\.parfumo\.com\/perfumes\/[a-f0-9]{2}\/[a-f0-9]+-([^"'\s]+)_1200\.jpg/g)];
      const slugWords = slug.replace(/-/g, ' ').toLowerCase().split(' ');
      for (const m of all) {
        const urlSlug = m[1].toLowerCase().replace(/-/g, ' ');
        if (slugWords.some(w => w.length > 3 && urlSlug.includes(w))) return m[0];
      }
    } catch {}
  }
  return null;
}

const snap = await db.collection('perfumes').get();
const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

const targets = [
  { keyword: 'ARMAF CLUB DE NUIT BLING',     brand: 'Armaf', slug: 'club-de-nuit-bling' },
  { keyword: 'ARMAF ODYSSEY DUBAI CHOCOLAT',  brand: 'Armaf', slug: 'odyssey-dubai-chocolat' },
];

for (const t of targets) {
  const match = docs.find(d => (d.nombre || '').toUpperCase().includes(t.keyword));
  if (!match) { console.log('NOT FOUND:', t.keyword); continue; }
  console.log(`Buscando imagen para: ${match.nombre}`);
  const url = await getParfumoUrl(t.brand, t.slug);
  if (url) {
    await db.collection('perfumes').doc(match.id).update({ imagenes: [url] });
    console.log(`✅ Restaurado: ${url}`);
  } else {
    console.log(`❌ No encontrado en parfumo para slug: ${t.slug}`);
  }
}

process.exit(0);

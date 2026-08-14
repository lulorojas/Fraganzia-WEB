// restore-4-products.mjs — fix 2 accidental + 2 original broken + 2 missing
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Fetch parfumo page and return first image URL found (accepts any image on the page)
async function getParfumoFirst(brand, slugVariants) {
  for (const s of slugVariants) {
    try {
      const url = `https://www.parfumo.com/Perfumes/${brand}/${s}`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) { console.log(`  [${r.status}] ${url}`); continue; }
      const html = await r.text();
      // Extract title for verification
      const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleM ? titleM[1].trim() : '(no title)';
      console.log(`  Page: ${url} → ${title}`);
      // Extract parfumo image — try _1200.jpg first, then _800.jpg
      const m = html.match(/https:\/\/media\.parfumo\.com\/perfumes\/[a-f0-9]{2}\/[a-f0-9]+-[^"'\s]+_(?:1200|800|400)\.(?:jpg|webp)/);
      if (m) return m[0];
    } catch (e) {
      console.log(`  Error fetching: ${e.message}`);
    }
  }
  return null;
}

const snap = await db.collection('perfumes').get();
const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

function findDoc(keyword) {
  return docs.find(d => (d.nombre || '').toUpperCase().includes(keyword.toUpperCase()));
}

const products = [
  {
    keyword: 'CLUB DE NUIT BLING',
    brand: 'Armaf',
    slugs: ['club-de-nuit-bling-1', 'club-de-nuit-bling', 'club-de-nuit-bling-eau-de-parfum-1'],
    note: 'accidentally reverted',
  },
  {
    keyword: 'ODYSSEY DUBAI CHOCOLAT',
    brand: 'Armaf',
    slugs: ['odyssey-dubai-chocolat-1', 'odyssey-dubai-chocolat', 'odyssey-dubai-chocolat-eau-de-parfum-1'],
    note: 'accidentally reverted',
  },
  {
    keyword: 'ETER DESERT BREEZE',
    brand: 'Armaf',
    slugs: ['eter-desert-breeze-1', 'eter-desert-breeze', 'eter-desert-breeze-eau-de-parfum-1'],
    note: 'original broken (was silkperfumes.cl)',
  },
  {
    keyword: 'ASDAAF AMEERAT AL ARAB PRIVE ROSE',
    brand: 'Lattafa',
    slugs: ['asdaaf-ameerat-al-arab-prive-rose-1', 'ameerat-al-arab-prive-rose-1', 'ameerat-al-arab-prive-rose'],
    note: 'original broken (was perfumenz.co.nz)',
  },
];

for (const p of products) {
  const doc = findDoc(p.keyword);
  if (!doc) { console.log(`\nNOT IN FIRESTORE: ${p.keyword}`); continue; }
  console.log(`\n[${p.note}] ${doc.nombre}`);
  console.log(`  Current imagenes: ${JSON.stringify(doc.imagenes)}`);
  const url = await getParfumoFirst(p.brand, p.slugs);
  if (url) {
    await db.collection('perfumes').doc(doc.id).update({ imagenes: [url] });
    console.log(`  ✅ Assigned: ${url}`);
  } else {
    console.log(`  ❌ Not found on parfumo`);
  }
}

process.exit(0);

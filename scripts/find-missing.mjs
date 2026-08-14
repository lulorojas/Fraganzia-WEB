// find-missing.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function fetchParfumo(brand, slug) {
  for (const s of [slug + '-1', slug, slug + '-2']) {
    const url = `https://www.parfumo.com/Perfumes/${brand}/${s}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const m = html.match(/https:\/\/media\.parfumo\.com\/perfumes\/[a-f0-9]{2}\/[a-f0-9]+-[^"'\s]+_1200\.jpg/);
      if (m) return m[0];
    } catch {}
  }
  return null;
}

const targets = [
  { nombre: 'ARMAF ETER DESERT BREEZE 100ML',                brand: 'Armaf',           slug: 'eter-desert-breeze' },
  { nombre: 'LATTAFA ASDAAF AMEERAT AL ARAB PRIVE ROSE 100ML', brand: 'Lattafa',        slug: 'asdaaf-ameerat-al-arab-prive-rose' },
  { nombre: 'FRENCH AVENUE GENESIS GEMINI 90ML',             brand: 'French-Avenue',    slug: 'genesis-gemini' },
  { nombre: 'MAISON ALHAMBRA ROSE SEDUCTION VIP FEMME 100ML', brand: 'Maison-Alhambra', slug: 'rose-seduction-vip-femme' },
];

const snap = await db.collection('perfumes').get();
const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

for (const t of targets) {
  process.stdout.write(`Buscando ${t.nombre} ... `);
  const url = await fetchParfumo(t.brand, t.slug);
  if (url) {
    const match = docs.find(d => (d.nombre || '').toUpperCase().includes(t.nombre.split(' ').slice(0, 4).join(' ')));
    if (match) {
      await db.collection('perfumes').doc(match.id).update({ imagenes: [url] });
      console.log(`✅ ${url}`);
    } else {
      console.log(`✅ URL encontrada pero producto no hallado: ${url}`);
    }
  } else {
    console.log(`❌ No encontrado en parfumo`);
  }
}

process.exit(0);

// scripts/localize-destacados.mjs
// Descarga las imágenes externas de los perfumes "destacados" (los que se
// muestran primero en el Home, lo que Lighthouse mide), las optimiza igual
// que el resto del catálogo (resize 700px + jpeg q82 + webp q80) y actualiza
// Firestore para que apunten a /productos-18-09/ en vez de CDNs de terceros.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'productos-18-09');

const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function toSlug(nombre) {
  return nombre
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const snap = await db.collection('perfumes').where('destacado', '==', true).get();

let ok = 0, fail = 0;

for (const doc of snap.docs) {
  const d = doc.data();
  const img = d.imagenes?.[0];
  if (!img || img.startsWith('/productos-18-09/')) continue;

  const slug = toSlug(d.nombre);
  try {
    const res = await fetch(img);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    const resized = sharp(buf).resize(700, 700, { fit: 'inside', withoutEnlargement: true });
    await resized.clone().jpeg({ quality: 82 }).toFile(join(OUT_DIR, `${slug}.jpg`));
    await resized.clone().webp({ quality: 80 }).toFile(join(OUT_DIR, `${slug}.webp`));

    await doc.ref.update({ imagenes: [`/productos-18-09/${slug}.jpg`] });

    console.log(`OK  ${d.marca} ${d.nombre} -> ${slug}.jpg/.webp`);
    ok++;
  } catch (err) {
    console.log(`FAIL ${d.marca} ${d.nombre} (${img}) -> ${err.message}`);
    fail++;
  }
}

console.log(`\nListo: ${ok} localizados, ${fail} fallidos.`);

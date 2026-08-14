// upload-missing-images.mjs
// Sube las imágenes extraídas del PDF a Imgur y actualiza Firestore
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const IMGUR_CLIENT_ID = '546c25a59c58ad7';
const IMG_DIR = join(__dirname, 'pdf-product-imgs');

// ============================================================
// Mapeo: nombre en Firestore → imagen a usar
// ============================================================
const DIRECT_URLS = {
  'FRENCH AVENUE GENESIS GEMINI 90ML': 'https://fimgs.net/mdimg/perfume/375x500.107909.jpg',
  'LATTAFA KHAMRAH WAHA 100ML':        'https://fimgs.net/mdimg/perfume/375x500.132409.jpg',
};

const PDF_IMAGES = {
  'AL WATANIAH KENZ AL MALIK 100ML':        'KENZ_AL_MALIK_p6_1.png',
  'AL WATANIAH ROSE MYSTERY INTENSE 100ML': 'ROSE_MYSTERY_p6_4.png',
  'AL WATANIAH WATANI NOIR 100ML':          'WATANI_NOIR_p7_5.png',
  'AL WATANIAH SULTAN AL LAIL 100ML':       'SULTAN_AL_LAIL_p7_4.png',
  'BHARARA CHOCOLATE 100ML':                'BHARARA_CHOCOLATE_p11_0.png',
  'AL WATANIAH SABAH AL WARD 100ML':        'SABAH_AL_WARD_p31_2.png',
  'AL WATANIAH THAHAANI 100ML':             'THAHAANI_p31_5.png',
  'RASASI HAWAS FOR HER 100ML':             'RASASI_HAWAS_FOR_HER_p42_1.png',
};

async function uploadToImgur(pngPath) {
  const buf = readFileSync(pngPath);
  const b64 = buf.toString('base64');
  const form = new FormData();
  form.append('image', b64);
  form.append('type', 'base64');
  const res = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    body: form,
    headers: { 'Authorization': `Client-ID ${IMGUR_CLIENT_ID}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data));
  return data.data.link;
}

// Buscar todos los productos sin imagen en Firestore
console.log('=== Verificando productos en Firestore ===\n');
const snap = await db.collection('perfumes').get();
const emptyImgDocs = {};
snap.forEach(doc => {
  const d = doc.data();
  if (!d.imagenes || d.imagenes.length === 0) {
    emptyImgDocs[d.nombre?.toUpperCase()] = { id: doc.id, nombre: d.nombre };
  }
});

console.log(`Productos sin imagen: ${Object.keys(emptyImgDocs).length}`);
Object.values(emptyImgDocs).forEach(v => console.log('  -', v.nombre));
console.log('');

function findDoc(nombreBuscar) {
  const words = nombreBuscar.toUpperCase().split(' ').filter(w => w.length > 2);
  return Object.entries(emptyImgDocs).find(([k]) =>
    words.filter(w => k.includes(w)).length >= Math.min(words.length, 4)
  );
}

let ok = 0, fail = 0;

// Productos con URL directa
for (const [nombre, url] of Object.entries(DIRECT_URLS)) {
  const found = findDoc(nombre);
  if (!found) { console.log(`⚠️  No encontrado: ${nombre}`); fail++; continue; }
  const [, { id, nombre: realNombre }] = found;
  await db.collection('perfumes').doc(id).update({ imagenes: [url] });
  console.log(`✅ URL directa: ${realNombre}`);
  console.log(`   → ${url}`);
  ok++;
}

// Productos con imagen PDF → Imgur
for (const [nombre, pngFile] of Object.entries(PDF_IMAGES)) {
  const found = findDoc(nombre);
  if (!found) { console.log(`⚠️  No encontrado en Firestore: ${nombre}`); fail++; continue; }
  const [, { id, nombre: realNombre }] = found;

  const localPath = join(IMG_DIR, pngFile);
  if (!existsSync(localPath)) { console.log(`❌ Archivo no existe: ${pngFile}`); fail++; continue; }

  try {
    console.log(`⬆️  Subiendo a Imgur: ${pngFile}...`);
    const url = await uploadToImgur(localPath);
    await db.collection('perfumes').doc(id).update({ imagenes: [url] });
    console.log(`✅ Subido y actualizado: ${realNombre}`);
    console.log(`   → ${url}`);
    ok++;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    fail++;
  }
}

console.log(`\n=== RESULTADO: ✅ ${ok} actualizados | ❌ ${fail} fallidos ===`);
process.exit(0);
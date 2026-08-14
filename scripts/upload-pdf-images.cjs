// upload-pdf-images.cjs
// Sube las imágenes extraídas del PDF a Firebase Storage y actualiza Firestore
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./serviceAccount.json');

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'fraganzia-e9b70.firebasestorage.app',
});

const db = getFirestore();
const bucket = getStorage().bucket();

// Mapeo: archivo PNG extraído → fragmento del nombre del producto en Firestore
const MAPPINGS = [
  // archivo PNG (en scripts/pdf-images/) → keyword del nombre del producto
  { file: 'p12_4_EMPER_BLUE_STALLION.png',       keyword: 'BHARARA MAST' },
  { file: 'p12_5_UNKNOWN_5.png',                  keyword: 'EMPER BLUE STALLION' },
  { file: 'p13_6_FW_IMPERIUM.png',                keyword: 'EMPER MANDORA' },
  { file: 'p13_7_FW_PROUD_OF_YOU.png',            keyword: 'EMPER UOMO INTENSE' },
  { file: 'p14_1_FW_STAR_MEN_NEBULA.png',         keyword: 'FRENCH AVENUE AETHER EXTRAIT' },
  { file: 'p16_4_LATTAFA_AL_NOBLE_SAFEER.png',    keyword: "L'AFFAIR SUMMER SHOCKWAVE" },
  { file: 'p21_1_LATTAFA_MAAHIR_GOLD.png',        keyword: 'LATTAFA MAAHIR GOLD' },
  { file: 'p34_5_BHARARA_NICHE_FEMME.png',        keyword: 'EMPER DONNA INTENSE' },
  { file: 'p37_2_LATTAFA_ECLAIRE.png',            keyword: 'LATTAFA FAKHAR ROSE' },
  { file: 'p39_0_LATTAFA_SEHR_MAGIC_OF.png',      keyword: 'LATTAFA SEHR MAGIC OF' },
];

const PDF_IMAGES_DIR = path.join(__dirname, 'pdf-images');

async function uploadAndGetUrl(localPath, destFileName) {
  const destination = `perfumes/${destFileName}`;
  await bucket.upload(localPath, {
    destination,
    metadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
  });
  // Hacer el archivo público
  const file = bucket.file(destination);
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/fraganzia-e9b70.firebasestorage.app/${destination}`;
  return publicUrl;
}

async function main() {
  const snap = await db.collection('perfumes').get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Total documentos: ${docs.length}`);

  let applied = 0;
  let skipped = 0;
  let notFound = 0;

  for (const mapping of MAPPINGS) {
    const localPath = path.join(PDF_IMAGES_DIR, mapping.file);
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  Archivo no encontrado: ${mapping.file}`);
      notFound++;
      continue;
    }

    // Buscar documento en Firestore
    const kw = mapping.keyword.toUpperCase();
    const match = docs.find(d => {
      const name = (d.nombre || '').toUpperCase();
      return name.includes(kw);
    });

    if (!match) {
      console.log(`❌ No se encontró producto para keyword: "${mapping.keyword}"`);
      notFound++;
      continue;
    }

    if (match.imagenes && match.imagenes.length > 0) {
      console.log(`⏭️  Ya tiene imagen: ${match.nombre}`);
      skipped++;
      continue;
    }

    // Subir imagen
    const destFileName = `${match.id}.png`;
    console.log(`⬆️  Subiendo ${mapping.file} → ${destFileName} (${match.nombre})`);
    try {
      const url = await uploadAndGetUrl(localPath, destFileName);
      await db.collection('perfumes').doc(match.id).update({ imagenes: [url] });
      console.log(`   ✅ Aplicado: ${match.nombre}`);
      console.log(`   🔗 URL: ${url}`);
      applied++;
    } catch (err) {
      console.error(`   ❌ Error al subir/actualizar: ${err.message}`);
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Aplicados: ${applied}`);
  console.log(`Ya tenían imagen (saltados): ${skipped}`);
  console.log(`No encontrados: ${notFound}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });

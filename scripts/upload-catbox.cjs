// upload-catbox.cjs - sube imágenes a catbox.moe y actualiza Firestore
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

const serviceAccount = require('./serviceAccount.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const MAPPINGS = [
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

function uploadToCatbox(filePath) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const req = https.request({
      hostname: 'catbox.moe',
      path: '/user/api.php',
      method: 'POST',
      headers: form.getHeaders(),
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const url = data.trim();
        if (url.startsWith('https://')) resolve(url);
        else reject(new Error(`Respuesta inesperada: ${url}`));
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

async function main() {
  const snap = await db.collection('perfumes').get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  let applied = 0;

  for (const m of MAPPINGS) {
    const localPath = path.join(PDF_IMAGES_DIR, m.file);
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  No encontrado: ${m.file}`);
      continue;
    }

    const kw = m.keyword.toUpperCase();
    const match = docs.find(d => (d.nombre || '').toUpperCase().includes(kw));

    if (!match) {
      console.log(`❌ Producto no hallado: "${m.keyword}"`);
      continue;
    }

    if (match.imagenes?.length > 0) {
      console.log(`⏭️  Ya tiene imagen: ${match.nombre}`);
      continue;
    }

    process.stdout.write(`⬆️  ${match.nombre} ... `);
    try {
      const url = await uploadToCatbox(localPath);
      await db.collection('perfumes').doc(match.id).update({ imagenes: [url] });
      console.log(`✅ ${url}`);
      applied++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  console.log(`\n✅ Aplicados: ${applied}/10`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });

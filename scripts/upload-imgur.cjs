// upload-imgur.cjs
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const https = require('https');

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
const CLIENT_ID = '546c25a59c58ad7';

function uploadToImgur(filePath) {
  return new Promise((resolve, reject) => {
    const imageData = fs.readFileSync(filePath).toString('base64');
    const postData = `image=${encodeURIComponent(imageData)}&type=base64`;

    const req = https.request({
      hostname: 'api.imgur.com',
      path: '/3/image',
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${CLIENT_ID}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success && parsed.data?.link) {
            resolve(parsed.data.link);
          } else {
            reject(new Error(parsed.data?.error || data.substring(0, 200)));
          }
        } catch (e) {
          reject(new Error(data.substring(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
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
      const url = await uploadToImgur(localPath);
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

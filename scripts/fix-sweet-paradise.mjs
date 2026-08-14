// scripts/fix-sweet-paradise.mjs
// Corregir SWEET PARADISE a Gourmand
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fixSweetParadise() {
  console.log('🔧 Corrigiendo Sweet Paradise...\n');
  
  const snapshot = await db.collection('perfumes')
    .where('nombre', '==', 'FRENCH AVENUE AVE SWEET PARADISE 100ML')
    .get();
  
  if (snapshot.empty) {
    console.log('❌ No se encontró Sweet Paradise');
    process.exit(1);
  }
  
  const doc = snapshot.docs[0];
  await doc.ref.update({
    familiaOlfativa: 'Gourmand',
  });
  
  console.log('✅ FRENCH AVENUE AVE SWEET PARADISE → Gourmand');
  console.log('   (Perfume dulce/gourmand según su nombre)\n');
  
  process.exit(0);
}

fixSweetParadise().catch(console.error);

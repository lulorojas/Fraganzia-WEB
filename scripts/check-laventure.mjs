// scripts/check-laventure.mjs
// Verificar las familias actuales de L'Aventure y Detour
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function checkLaventure() {
  const snapshot = await db.collection('perfumes').get();
  const perfumes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const buscar = [
    'LAVENTURE',
    'DETOUR',
    'SWEET PARADISE',
  ];
  
  console.log('🔍 Familias actuales de perfumes detectados:\n');
  
  for (const keyword of buscar) {
    const encontrados = perfumes.filter(p => 
      p.nombre.toUpperCase().includes(keyword) || p.marca.toUpperCase().includes(keyword)
    );
    
    if (encontrados.length > 0) {
      console.log(`${keyword}:`);
      encontrados.forEach(p => {
        console.log(`  • ${p.marca} ${p.nombre}`);
        console.log(`    Actual: ${p.familiaOlfativa}`);
      });
      console.log();
    }
  }
  
  process.exit(0);
}

checkLaventure().catch(console.error);

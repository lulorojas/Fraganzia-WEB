// scripts/audit-image-hosts.mjs
// Lista todos los hosts de imagen usados en Firestore, para detectar fuentes
// no validadas (imgur, catbox, etc.) que podrían tener fotos incorrectas.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const snapshot = await db.collection('perfumes').get();
const hosts = {};

for (const doc of snapshot.docs) {
  const url = doc.data().imagenes?.[0];
  if (!url) continue;
  let host;
  try {
    host = url.startsWith('http') ? new URL(url).hostname : '(relativa/local)';
  } catch {
    host = '(url invalida)';
  }
  hosts[host] = (hosts[host] || 0) + 1;
}

console.log('Distribución de hosts de imagen:');
for (const [host, count] of Object.entries(hosts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${host}: ${count}`);
}
process.exit(0);

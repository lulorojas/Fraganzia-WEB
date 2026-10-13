// Borra las visitas anónimas (colección `visitas`) más viejas que la retención.
//
// Uso: node tools/limpiar-visitas.mjs [--dias=90] [--dry-run]
//
// El panel admin solo lee las últimas 500, así que las viejas no aportan y solo
// ocupan espacio. Corre una vez por semana desde .github/workflows/limpiar-visitas.yml.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { credencial } from './lib/credencial.mjs';

const DIAS = Number(process.argv.find((a) => a.startsWith('--dias='))?.split('=')[1] ?? 90);
const dryRun = process.argv.includes('--dry-run');
const LOTE = 400; // el límite de Firestore es 500 operaciones por lote

if (!Number.isFinite(DIAS) || DIAS < 7) throw new Error('--dias debe ser un número de al menos 7');

initializeApp({ credential: cert(credencial()) });
const db = getFirestore();

const corte = Timestamp.fromMillis(Date.now() - DIAS * 24 * 60 * 60 * 1000);
console.log(`visitas anteriores a ${corte.toDate().toISOString()} (${DIAS} días)${dryRun ? ' — simulación' : ''}`);

let borradas = 0;
for (;;) {
  const snap = await db.collection('visitas').where('createdAt', '<', corte).limit(LOTE).get();
  if (snap.empty) break;
  if (dryRun) {
    // Sin borrar no avanzaría la consulta: solo contamos esta primera tanda.
    borradas += snap.size;
    console.log(`(simulación) al menos ${snap.size} para borrar`);
    break;
  }
  const lote = db.batch();
  snap.docs.forEach((d) => lote.delete(d.ref));
  await lote.commit();
  borradas += snap.size;
}
console.log(dryRun ? `fin de la simulación` : `${borradas} visitas borradas`);

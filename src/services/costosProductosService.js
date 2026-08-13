import {
  collection, doc, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'costosProductos';

export async function obtenerCostos() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ perfumeId: d.id, ...d.data() }));
}

// Agrega el `set` al batch recibido, sin comitear — lo usa comprasService
// para que el costo de referencia se actualice en la misma escritura atómica
// que la compra que lo origina.
export function actualizarCostoEnBatch(batch, perfumeId, costoUnitario) {
  const ref = doc(db, COLLECTION, perfumeId);
  batch.set(ref, { costoUltimaCompra: costoUnitario, updatedAt: serverTimestamp() }, { merge: true });
}

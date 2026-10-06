import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'botProveedorLog';

/** Últimas N corridas del bot de precios, más recientes primero. */
export async function listarBotProveedorLog(max = 20) {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('creadoEn', 'desc'), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

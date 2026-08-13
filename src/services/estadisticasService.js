import {
  collection, doc, getDocs, setDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'estadisticas';

/**
 * Contadores de interés por perfume, escritos desde el navegador del cliente
 * (sin Cloud Functions, Principio II de la constitución).
 *
 * Usa `increment()`: es atómico y NO requiere leer el documento antes, así que
 * cada evento cuesta 1 escritura y 0 lecturas.
 *
 * Deduplicado por sesión (`sessionStorage`): recargar o volver atrás no infla
 * el contador ni gasta cuota de más. Una vista por perfume por sesión.
 */

function yaRegistrado(clave) {
  try {
    if (sessionStorage.getItem(clave)) return true;
    sessionStorage.setItem(clave, '1');
    return false;
  } catch {
    return false; // modo incógnito o storage bloqueado: se registra igual
  }
}

// Fire-and-forget: la analítica nunca debe romper la experiencia de compra.
function registrar(perfumeId, campos) {
  return setDoc(
    doc(db, COLLECTION, perfumeId),
    { perfumeId, ...campos, updatedAt: serverTimestamp() },
    { merge: true }
  ).catch(() => {});
}

export function incrementarVista(perfumeId) {
  if (!perfumeId || yaRegistrado(`vista:${perfumeId}`)) return Promise.resolve();
  return registrar(perfumeId, { vistas: increment(1) });
}

export function incrementarAgregadoCarrito(perfumeId) {
  if (!perfumeId) return Promise.resolve();
  return registrar(perfumeId, { agregadosCarrito: increment(1) });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function listarEstadisticas() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ perfumeId: d.id, ...d.data() }));
}

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'auditoria';

function ordenarPorFechaDesc(entradas) {
  return [...entradas].sort((a, b) => {
    const fechaA = a.modificadoAt?.toMillis?.() ?? 0;
    const fechaB = b.modificadoAt?.toMillis?.() ?? 0;
    return fechaB - fechaA;
  });
}

export async function listarAuditoria() {
  const snap = await getDocs(collection(db, COLLECTION));
  return ordenarPorFechaDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

// Filtrado en memoria: nunca vuelve a leer Firestore al cambiar un filtro.
export function filtrarAuditoria(entradas, filtros = {}) {
  let resultado = entradas;

  if (filtros.coleccion) resultado = resultado.filter((e) => e.coleccion === filtros.coleccion);
  if (filtros.socioId) resultado = resultado.filter((e) => e.modificadoPor === filtros.socioId);
  if (filtros.desde) {
    const desdeMs = new Date(filtros.desde).getTime();
    resultado = resultado.filter((e) => (e.modificadoAt?.toMillis?.() ?? 0) >= desdeMs);
  }
  if (filtros.hasta) {
    const hastaMs = new Date(filtros.hasta).getTime();
    resultado = resultado.filter((e) => (e.modificadoAt?.toMillis?.() ?? 0) <= hastaMs);
  }

  return resultado;
}

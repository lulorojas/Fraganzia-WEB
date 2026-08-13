import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'auditoria';

function ordenarPorFechaDesc(entradas) {
  return [...entradas].sort((a, b) => {
    const fechaA = a.modificadoAt?.toMillis?.() ?? 0;
    const fechaB = b.modificadoAt?.toMillis?.() ?? 0;
    return fechaB - fechaA;
  });
}

/**
 * Dos queries en vez de leer la colección entera: la regla de Firestore no
 * permite leer las entradas privadas del otro socio, y una query sin filtro
 * fallaría completa. Cada una es demostrablemente segura para la regla.
 *
 * Nota: `where('socioPrivado','==',null)` solo matchea documentos que tienen
 * el campo explícitamente en null — los que no lo tienen quedan fuera de todo
 * índice de ese campo. No hay entradas viejas sin el campo porque la colección
 * se vació al hacer el reset de datos de prueba.
 */
export async function listarAuditoria(socioId) {
  const [compartidas, propias] = await Promise.all([
    getDocs(query(collection(db, COLLECTION), where('socioPrivado', '==', null))),
    socioId
      ? getDocs(query(collection(db, COLLECTION), where('socioPrivado', '==', socioId)))
      : Promise.resolve({ docs: [] }),
  ]);

  const entradas = [...compartidas.docs, ...propias.docs].map((d) => ({ id: d.id, ...d.data() }));
  return ordenarPorFechaDesc(entradas);
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

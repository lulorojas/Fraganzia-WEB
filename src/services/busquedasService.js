import {
  collection, doc, getDocs, setDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'busquedas';
const MIN_LARGO = 3;

/**
 * Términos que la gente busca en el catálogo. El dato más valioso acá son las
 * búsquedas SIN resultado: lo que los clientes quieren y no tenemos.
 *
 * El id del documento es el término normalizado, así que cada término distinto
 * es un documento que se va incrementando — no crece una fila por búsqueda.
 */

// Normaliza a un id de documento seguro: sin mayúsculas, sin acentos y sin
// caracteres que Firestore no admite en un id (`/` sobre todo).
function normalizar(termino) {
  return termino
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
    .trim();
}

function yaRegistrado(clave) {
  try {
    if (sessionStorage.getItem(clave)) return true;
    sessionStorage.setItem(clave, '1');
    return false;
  } catch {
    return false;
  }
}

/**
 * Se llama con debounce desde el catálogo (no en cada tecla). Ignora términos
 * de menos de 3 caracteres y repeticiones del mismo término en la misma sesión.
 */
export function registrarBusqueda(termino, huboResultados) {
  const normalizado = normalizar(termino ?? '');
  if (normalizado.length < MIN_LARGO) return Promise.resolve();
  if (yaRegistrado(`busqueda:${normalizado}:${huboResultados ? 1 : 0}`)) return Promise.resolve();

  return setDoc(
    doc(db, COLLECTION, normalizado),
    {
      termino: normalizado,
      conteo: increment(1),
      sinResultados: increment(huboResultados ? 0 : 1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {});
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function listarBusquedas() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

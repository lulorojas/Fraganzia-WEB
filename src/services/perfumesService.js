import {
  collection, doc, getDoc, getDocs, query, where,
  addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { normalizarTexto } from '../utils/texto';
import { coincide } from '../utils/busqueda';

const COLLECTION = 'perfumes';

function ordenarPorFechaDesc(perfumes) {
  return [...perfumes].sort((a, b) => {
    const fechaA = a.createdAt?.toMillis?.() ?? 0;
    const fechaB = b.createdAt?.toMillis?.() ?? 0;
    return fechaB - fechaA;
  });
}

/**
 * Trae todos los perfumes públicos (`activo == true` resuelto por Firestore,
 * `disponible` en el cliente), ordenados del más nuevo al más viejo.
 *
 * Se lee el catálogo UNA vez y se cachea (ver usePerfumes): los filtros se
 * aplican en memoria con `filtrarPerfumes`, así tipear en el buscador o
 * cambiar un filtro no vuelve a leer ~400 documentos de Firestore.
 *
 * Nota: los índices compuestos de perfumes definidos en firestore.indexes.json
 * quedan sin uso por esta estrategia. Se dejan tal cual — fueron ratificados
 * en la constitución v1.0.0. Si el catálogo crece mucho y conviene mover los
 * filtros a Firestore, ya están definidos y desplegados.
 */
export async function listarPerfumesPublicos() {
  const snap = await getDocs(query(collection(db, COLLECTION), where('activo', '==', true)));
  return ordenarPorFechaDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }))).filter(
    (p) => p.disponible === true
  );
}

/** Aplica los filtros combinables del catálogo (FR-002) sobre la lista cacheada. */
export function filtrarPerfumes(perfumes, filtros = {}) {
  if (!perfumes) return perfumes;
  // La marca se compara sin mayúsculas ni tildes: en la base conviven
  // "Lattafa" y "LATTAFA". La búsqueda es por palabras sueltas (utils/busqueda).
  const marca = normalizarTexto(filtros.marca);
  return perfumes.filter(
    (p) =>
      (!filtros.genero || p.genero === filtros.genero) &&
      (!marca || normalizarTexto(p.marca) === marca) &&
      (!filtros.familiaOlfativa || p.familiaOlfativa === filtros.familiaOlfativa) &&
      (!filtros.destacado || p.destacado === true) &&
      coincide(p, filtros.busqueda)
  );
}

export async function obtenerPerfumePorId(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ─── Admin: lectura completa (incluye inactivos) ─────────────────────────────
export async function listarTodosLosPerfumes() {
  const snap = await getDocs(collection(db, COLLECTION));
  return ordenarPorFechaDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

// ─── Admin: escritura ────────────────────────────────────────────────────────
export async function crearPerfume(datos) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...datos,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function editarPerfume(id, datos) {
  await updateDoc(doc(db, COLLECTION, id), {
    ...datos,
    updatedAt: serverTimestamp(),
  });
}

export async function actualizarDisponibilidad(id, disponible) {
  await updateDoc(doc(db, COLLECTION, id), {
    disponible,
    updatedAt: serverTimestamp(),
  });
}

export async function actualizarActivo(id, activo) {
  await updateDoc(doc(db, COLLECTION, id), {
    activo,
    updatedAt: serverTimestamp(),
  });
}

export async function eliminarPerfume(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

import {
  collection, doc, getDoc, getDocs, query, where,
  addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'perfumes';

function ordenarPorFechaDesc(perfumes) {
  return [...perfumes].sort((a, b) => {
    const fechaA = a.createdAt?.toMillis?.() ?? 0;
    const fechaB = b.createdAt?.toMillis?.() ?? 0;
    return fechaB - fechaA;
  });
}

/**
 * Trae todos los perfumes con `activo == true` (único filtro resuelto por
 * Firestore, con índice de campo simple automático — sin necesidad de
 * índices compuestos) y aplica el resto de los filtros combinados en el
 * cliente: `disponible`, `genero`, `marca`, `familiaOlfativa`, `destacado`
 * y `busqueda` (FR-002 exige que los filtros sean combinables entre sí).
 *
 * Nota: los 4 índices compuestos de perfumes definidos en
 * firestore.indexes.json (activo+genero, activo+marca, activo+
 * familiaOlfativa, activo+destacado, todos +createdAt) quedan sin uso por
 * esta estrategia. Se dejan tal cual — fueron ratificados en la
 * constitución v1.0.0 y modificarlos requiere una enmienda formal, no una
 * limpieza unilateral. Si el catálogo crece y conviene mover estos filtros
 * a Firestore, ya están definidos y desplegados.
 */
export async function listarPerfumesPublicos(filtros = {}) {
  const snap = await getDocs(query(collection(db, COLLECTION), where('activo', '==', true)));
  let perfumes = ordenarPorFechaDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

  perfumes = perfumes.filter((p) => p.disponible === true);

  if (filtros.genero) perfumes = perfumes.filter((p) => p.genero === filtros.genero);
  if (filtros.marca) perfumes = perfumes.filter((p) => p.marca === filtros.marca);
  if (filtros.familiaOlfativa) {
    perfumes = perfumes.filter((p) => p.familiaOlfativa === filtros.familiaOlfativa);
  }
  if (filtros.destacado) perfumes = perfumes.filter((p) => p.destacado === true);

  if (filtros.busqueda) {
    const termino = filtros.busqueda.trim().toLowerCase();
    perfumes = perfumes.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(termino) || p.marca?.toLowerCase().includes(termino)
    );
  }

  return perfumes;
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

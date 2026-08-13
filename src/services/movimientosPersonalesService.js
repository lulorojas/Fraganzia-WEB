import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  crearMovimientoConAuditoria, editarMovimientoConAuditoria, anularMovimientoConAuditoria,
} from './movimientosService';

const COLLECTION = 'movimientosPersonales';

// Privado por socio (regla de Firestore restringida) — nunca se lee la
// colección completa, solo lo que pertenece a `socioId`.
export async function listarMovimientosPropios(socioId) {
  if (!socioId) return [];
  const snap = await getDocs(query(collection(db, COLLECTION), where('socioId', '==', socioId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => m.anulado !== true);
}

export async function crearMovimiento(datos, socioId) {
  return crearMovimientoConAuditoria(COLLECTION, datos, socioId);
}

export async function editarMovimiento(id, datosNuevos, valorAnterior, socioId) {
  return editarMovimientoConAuditoria(COLLECTION, id, datosNuevos, valorAnterior, socioId);
}

export async function anularMovimiento(id, valorAnterior, socioId) {
  return anularMovimientoConAuditoria(COLLECTION, id, valorAnterior, socioId);
}

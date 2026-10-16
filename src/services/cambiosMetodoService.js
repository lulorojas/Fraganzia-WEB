import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { fechaDeMovimiento, milisDeFecha } from '../utils/format';
import {
  crearMovimientoConAuditoria, editarMovimientoConAuditoria, anularMovimientoConAuditoria,
} from './movimientosService';

const COLLECTION = 'cambiosMetodo';

// Privado por socio (regla de Firestore restringida): nunca se lee la colección
// completa, solo lo que pertenece a `socioId`.
export async function listarCambiosPropios(socioId) {
  if (!socioId) return [];
  const snap = await getDocs(query(collection(db, COLLECTION), where('socioId', '==', socioId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.anulado !== true)
    .sort((a, b) => milisDeFecha(fechaDeMovimiento(b)) - milisDeFecha(fechaDeMovimiento(a)));
}

export async function crearCambio(datos, socioId) {
  return crearMovimientoConAuditoria(COLLECTION, datos, socioId);
}

export async function editarCambio(id, datosNuevos, valorAnterior, socioId) {
  return editarMovimientoConAuditoria(COLLECTION, id, datosNuevos, valorAnterior, socioId);
}

export async function anularCambio(id, valorAnterior, socioId) {
  return anularMovimientoConAuditoria(COLLECTION, id, valorAnterior, socioId);
}

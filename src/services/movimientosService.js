import {
  collection, doc, getDocs, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const AUDITORIA_COLLECTION = 'auditoria';

/**
 * Capa genérica compartida por los seis tipos de movimiento (ventasSocios,
 * ventasDecants, compras, gastos, movimientosPersonales, transferenciasSocios).
 * Nunca hay `deleteDoc`: anular = `anulado: true` + entrada en `auditoria`,
 * escritas atómicamente en el mismo `writeBatch` que el movimiento.
 */

export async function listarMovimientos(coleccion) {
  const snap = await getDocs(collection(db, coleccion));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => m.anulado !== true);
}

// ─── Primitivas a nivel de batch (para servicios que necesitan agregar
// escrituras adicionales al mismo batch antes de comitear) ──────────────────

export function crearMovimientoEnBatch(batch, coleccion, datos, socioId) {
  const ref = doc(collection(db, coleccion));
  batch.set(ref, {
    ...datos,
    anulado: false,
    creadoPor: socioId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  registrarAuditoriaEnBatch(batch, {
    coleccion,
    documentoId: ref.id,
    accion: 'create',
    valorAnterior: null,
    valorNuevo: datos,
    modificadoPor: socioId,
  });
  return ref;
}

export function editarMovimientoEnBatch(batch, coleccion, id, datosNuevos, valorAnterior, socioId) {
  const ref = doc(db, coleccion, id);
  batch.update(ref, { ...datosNuevos, updatedAt: serverTimestamp() });
  registrarAuditoriaEnBatch(batch, {
    coleccion,
    documentoId: id,
    accion: 'update',
    valorAnterior,
    valorNuevo: datosNuevos,
    modificadoPor: socioId,
  });
  return ref;
}

export function anularMovimientoEnBatch(batch, coleccion, id, valorAnterior, socioId) {
  const ref = doc(db, coleccion, id);
  batch.update(ref, { anulado: true, updatedAt: serverTimestamp() });
  registrarAuditoriaEnBatch(batch, {
    coleccion,
    documentoId: id,
    accion: 'void',
    valorAnterior,
    valorNuevo: null,
    modificadoPor: socioId,
  });
  return ref;
}

export function registrarAuditoriaEnBatch(batch, {
  coleccion, documentoId, accion, valorAnterior, valorNuevo, modificadoPor,
}) {
  const ref = doc(collection(db, AUDITORIA_COLLECTION));
  batch.set(ref, {
    coleccion,
    documentoId,
    accion,
    valorAnterior: valorAnterior ?? null,
    valorNuevo: valorNuevo ?? null,
    modificadoPor,
    modificadoAt: serverTimestamp(),
  });
  return ref;
}

// ─── Wrappers simples (batch propio + commit) para movimientos sin efectos
// secundarios adicionales ────────────────────────────────────────────────────

export async function crearMovimientoConAuditoria(coleccion, datos, socioId) {
  const batch = writeBatch(db);
  const ref = crearMovimientoEnBatch(batch, coleccion, datos, socioId);
  await batch.commit();
  return ref.id;
}

export async function editarMovimientoConAuditoria(coleccion, id, datosNuevos, valorAnterior, socioId) {
  const batch = writeBatch(db);
  editarMovimientoEnBatch(batch, coleccion, id, datosNuevos, valorAnterior, socioId);
  await batch.commit();
}

export async function anularMovimientoConAuditoria(coleccion, id, valorAnterior, socioId) {
  const batch = writeBatch(db);
  anularMovimientoEnBatch(batch, coleccion, id, valorAnterior, socioId);
  await batch.commit();
}

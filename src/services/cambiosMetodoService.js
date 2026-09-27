import {
  crearMovimientoConAuditoria, editarMovimientoConAuditoria, anularMovimientoConAuditoria,
} from './movimientosService';

const COLLECTION = 'cambiosMetodo';

export async function crearCambio(datos, socioId) {
  return crearMovimientoConAuditoria(COLLECTION, datos, socioId);
}

export async function editarCambio(id, datosNuevos, valorAnterior, socioId) {
  return editarMovimientoConAuditoria(COLLECTION, id, datosNuevos, valorAnterior, socioId);
}

export async function anularCambio(id, valorAnterior, socioId) {
  return anularMovimientoConAuditoria(COLLECTION, id, valorAnterior, socioId);
}

import {
  crearMovimientoConAuditoria, editarMovimientoConAuditoria, anularMovimientoConAuditoria,
} from './movimientosService';

const COLLECTION = 'movimientosPersonales';

export async function crearMovimiento(datos, socioId) {
  return crearMovimientoConAuditoria(COLLECTION, datos, socioId);
}

export async function editarMovimiento(id, datosNuevos, valorAnterior, socioId) {
  return editarMovimientoConAuditoria(COLLECTION, id, datosNuevos, valorAnterior, socioId);
}

export async function anularMovimiento(id, valorAnterior, socioId) {
  return anularMovimientoConAuditoria(COLLECTION, id, valorAnterior, socioId);
}

import {
  crearMovimientoConAuditoria, editarMovimientoConAuditoria, anularMovimientoConAuditoria,
} from './movimientosService';

const COLLECTION = 'ajustesStock';

export async function crearAjuste(datos, socioId) {
  return crearMovimientoConAuditoria(COLLECTION, datos, socioId);
}

export async function editarAjuste(id, datosNuevos, valorAnterior, socioId) {
  return editarMovimientoConAuditoria(COLLECTION, id, datosNuevos, valorAnterior, socioId);
}

export async function anularAjuste(id, valorAnterior, socioId) {
  return anularMovimientoConAuditoria(COLLECTION, id, valorAnterior, socioId);
}

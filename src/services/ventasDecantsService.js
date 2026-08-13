import {
  crearMovimientoConAuditoria, editarMovimientoConAuditoria, anularMovimientoConAuditoria,
} from './movimientosService';

const COLLECTION = 'ventasDecants';

export async function crearVentaDecant(datos, socioId) {
  return crearMovimientoConAuditoria(COLLECTION, datos, socioId);
}

export async function editarVentaDecant(id, datosNuevos, valorAnterior, socioId) {
  return editarMovimientoConAuditoria(COLLECTION, id, datosNuevos, valorAnterior, socioId);
}

export async function anularVentaDecant(id, valorAnterior, socioId) {
  return anularMovimientoConAuditoria(COLLECTION, id, valorAnterior, socioId);
}

import {
  crearMovimientoConAuditoria, editarMovimientoConAuditoria, anularMovimientoConAuditoria,
} from './movimientosService';

const COLLECTION = 'ventasSocios';

// El stock nunca se guarda como campo aparte: se recalcula siempre desde
// compras/ventasSocios vigentes (panelFinancieroCalculos), así que estas
// funciones solo necesitan persistir el movimiento y su auditoría.

export async function crearVenta(datos, socioId) {
  return crearMovimientoConAuditoria(COLLECTION, datos, socioId);
}

export async function editarVenta(id, datosNuevos, valorAnterior, socioId) {
  return editarMovimientoConAuditoria(COLLECTION, id, datosNuevos, valorAnterior, socioId);
}

export async function anularVenta(id, valorAnterior, socioId) {
  return anularMovimientoConAuditoria(COLLECTION, id, valorAnterior, socioId);
}

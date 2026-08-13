import { writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  crearMovimientoEnBatch, editarMovimientoEnBatch, anularMovimientoEnBatch,
} from './movimientosService';

const COLLECTION = 'compras';

function validarPagos(datos) {
  const sumaPagos = (datos.pagos || []).reduce((acc, p) => acc + p.monto, 0);
  if (Math.abs(sumaPagos - datos.montoTotal) >= 0.01) {
    throw new Error('La suma de los pagos no coincide con el monto total de la compra');
  }
}

export async function crearCompra(datos, socioId) {
  validarPagos(datos);
  const batch = writeBatch(db);
  const ref = crearMovimientoEnBatch(batch, COLLECTION, datos, socioId);
  await batch.commit();
  return ref.id;
}

export async function editarCompra(id, datosNuevos, valorAnterior, socioId) {
  validarPagos(datosNuevos);
  const batch = writeBatch(db);
  editarMovimientoEnBatch(batch, COLLECTION, id, datosNuevos, valorAnterior, socioId);
  await batch.commit();
}

export async function anularCompra(id, valorAnterior, socioId) {
  const batch = writeBatch(db);
  anularMovimientoEnBatch(batch, COLLECTION, id, valorAnterior, socioId);
  await batch.commit();
}

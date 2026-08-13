import { z } from 'zod';
import { METODOS_PAGO_SOCIOS } from '../constants';

const itemSchema = z.object({
  perfumeId: z.string().min(1, 'Elegí un perfume'),
  perfumeNombre: z.string().min(1),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
});

const pagoSchema = z.object({
  socioId: z.string().min(1),
  monto: z.coerce.number().min(0),
  metodo: z.enum(METODOS_PAGO_SOCIOS),
});

export const compraSchema = z.object({
  proveedor: z.string().min(1, 'El proveedor es obligatorio'),
  items: z.array(itemSchema).min(1, 'Agregá al menos un perfume'),
  montoTotal: z.coerce.number().positive('El monto debe ser mayor a 0'),
  pagos: z.array(pagoSchema).min(1, 'Agregá al menos un pago'),
  fecha: z.coerce.date(),
}).refine(
  (data) => Math.abs(data.pagos.reduce((acc, p) => acc + p.monto, 0) - data.montoTotal) < 0.01,
  { message: 'La suma de los pagos no coincide con el monto total', path: ['pagos'] }
);

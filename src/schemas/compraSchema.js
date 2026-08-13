import { z } from 'zod';
import { METODOS_PAGO_SOCIOS } from '../constants';

const pagoSchema = z.object({
  socioId: z.string().min(1),
  monto: z.coerce.number().min(0),
  metodo: z.enum(METODOS_PAGO_SOCIOS),
});

export const compraSchema = z.object({
  proveedor: z.string().min(1, 'El proveedor es obligatorio'),
  perfumeId: z.string().min(1, 'Elegí un perfume'),
  perfumeNombre: z.string().min(1),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  costoUnitario: z.coerce.number().positive('El costo debe ser mayor a 0'),
  costoTotal: z.coerce.number().positive(),
  pagos: z.array(pagoSchema).min(1, 'Agregá al menos un pago'),
  fecha: z.coerce.date(),
}).refine(
  (data) => Math.abs(data.pagos.reduce((acc, p) => acc + p.monto, 0) - data.costoTotal) < 0.01,
  { message: 'La suma de los pagos no coincide con el costo total', path: ['pagos'] }
);

import { z } from 'zod';
import { METODOS_PAGO_SOCIOS } from '../constants';

const itemSchema = z.object({
  perfumeId: z.string().min(1, 'Elegí un perfume'),
  perfumeNombre: z.string().min(1),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
});

const pagoSchema = z.object({
  socioId: z.string().min(1, 'Elegí quién pagó'),
  monto: z.coerce.number().min(0, 'El monto no puede ser negativo'),
  metodo: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método válido' }) }),
});

/**
 * El monto total se carga una sola vez; `pagos` dice cómo se cubrió (un socio
 * solo, mitad y mitad, o un reparto libre). El formulario autocalcula el
 * segundo monto a partir del primero, así que la suma cierra siempre.
 *
 * La tolerancia de medio peso es a propósito: el chequeo existe para atajar un
 * error de carga real, no para trabar el guardado por un redondeo — que fue
 * exactamente el problema que tenía la versión anterior de esta pantalla.
 */
export const compraSchema = z.object({
  proveedor: z.string().min(1, 'El proveedor es obligatorio'),
  items: z.array(itemSchema).min(1, 'Agregá al menos un perfume'),
  montoTotal: z.coerce.number().positive('El monto debe ser mayor a 0'),
  pagos: z.array(pagoSchema).min(1, 'Indicá quién pagó la compra'),
  fecha: z.coerce.date(),
}).superRefine((data, ctx) => {
  const suma = data.pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0);
  if (Math.abs(suma - data.montoTotal) > 0.5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pagos'],
      message: `Lo que puso cada uno suma ${suma.toFixed(2)} y el total es ${data.montoTotal.toFixed(2)}.`,
    });
  }
});

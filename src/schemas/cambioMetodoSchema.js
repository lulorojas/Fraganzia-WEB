import { z } from 'zod';
import { METODOS_PAGO_SOCIOS } from '../constants';

/**
 * Pasaje de efectivo a Mercado Pago o al revés, dentro del bolsillo de un mismo
 * socio (le pasás MP a alguien y te devuelve cash).
 *
 * `montoRecibido` viene precargado igual a `monto` porque el caso normal es
 * uno a uno. Se deja editar para el caso en que el cambio tenga diferencia: si
 * salen 100 y entran 95, esos 5 son un costo real y conviene que quede
 * registrado en vez de perderse.
 */
export const cambioMetodoSchema = z.object({
  socioId: z.string().min(1, 'Elegí de quién es la plata'),
  de: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método válido' }) }),
  a: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método válido' }) }),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  montoRecibido: z.coerce.number().positive('El monto recibido debe ser mayor a 0'),
  fecha: z.coerce.date(),
}).refine((d) => d.de !== d.a, {
  message: 'El origen y el destino tienen que ser distintos',
  path: ['a'],
});

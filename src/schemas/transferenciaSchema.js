import { z } from 'zod';
import { METODOS_PAGO_SOCIOS } from '../constants';

export const transferenciaSchema = z.object({
  de: z.string().min(1, 'Elegí quién transfiere'),
  a: z.string().min(1, 'Elegí quién recibe'),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  metodo: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método válido' }) }),
  fecha: z.coerce.date(),
}).refine((data) => data.de !== data.a, {
  message: 'Los socios de origen y destino deben ser distintos',
  path: ['a'],
});

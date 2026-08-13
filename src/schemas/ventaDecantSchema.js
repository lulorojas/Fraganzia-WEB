import { z } from 'zod';
import { METODOS_PAGO_SOCIOS } from '../constants';

export const ventaDecantSchema = z.object({
  perfumeId: z.string().min(1, 'Elegí un perfume'),
  perfumeNombre: z.string().min(1),
  tamano: z.string().min(1, 'Indicá el tamaño'),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().positive('El precio debe ser mayor a 0'),
  vendidoPor: z.string().min(1, 'Elegí quién vendió'),
  metodoPago: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método de pago válido' }) }),
  fecha: z.coerce.date(),
});

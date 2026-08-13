import { z } from 'zod';
import { METODOS_PAGO_SOCIOS, ESTADOS_VENTA_SOCIO } from '../constants';

export const ventaSocioSchema = z.object({
  perfumeId: z.string().min(1, 'Elegí un perfume'),
  perfumeNombre: z.string().min(1),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().positive('El precio debe ser mayor a 0'),
  vendidoPor: z.string().min(1, 'Elegí quién vendió'),
  metodoPago: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método de pago válido' }) }),
  estado: z.enum(ESTADOS_VENTA_SOCIO, { errorMap: () => ({ message: 'Elegí un estado válido' }) }),
  fecha: z.coerce.date(),
});

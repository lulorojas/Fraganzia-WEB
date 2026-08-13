import { z } from 'zod';
import { METODOS_PAGO_SOCIOS } from '../constants';

const itemSchema = z.object({
  perfumeId: z.string().min(1, 'Elegí un perfume'),
  perfumeNombre: z.string().min(1),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
});

// Un solo monto y un solo pagador, igual que gastoSchema. No hay split de pago
// por socio: el desbalance 50/50 se deriva de quién pagó, no de cuánto puso
// cada uno.
export const compraSchema = z.object({
  proveedor: z.string().min(1, 'El proveedor es obligatorio'),
  items: z.array(itemSchema).min(1, 'Agregá al menos un perfume'),
  montoTotal: z.coerce.number().positive('El monto debe ser mayor a 0'),
  pagadoPor: z.string().min(1, 'Elegí quién pagó'),
  metodoPago: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método de pago válido' }) }),
  fecha: z.coerce.date(),
});

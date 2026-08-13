import { z } from 'zod';
import { GASTO_CATEGORIAS, METODOS_PAGO_SOCIOS } from '../constants';

export const gastoSchema = z.object({
  categoria: z.enum(GASTO_CATEGORIAS, { errorMap: () => ({ message: 'Elegí una categoría válida' }) }),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  pagadoPor: z.string().min(1, 'Elegí quién pagó'),
  metodoPago: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método de pago válido' }) }),
  fecha: z.coerce.date(),
});

import { z } from 'zod';
import { METODOS_PAGO_SOCIOS, TIPOS_MOVIMIENTO_PERSONAL } from '../constants';

export const movimientoPersonalSchema = z.object({
  socioId: z.string().min(1, 'Elegí un socio'),
  tipo: z.enum(TIPOS_MOVIMIENTO_PERSONAL, { errorMap: () => ({ message: 'Elegí retiro o aporte' }) }),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  metodo: z.enum(METODOS_PAGO_SOCIOS, { errorMap: () => ({ message: 'Elegí un método válido' }) }),
  fecha: z.coerce.date(),
});

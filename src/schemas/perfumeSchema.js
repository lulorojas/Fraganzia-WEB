import { z } from 'zod';
import { GENEROS, FAMILIAS_OLFATIVAS, MARCAS } from '../constants';

export const perfumeSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  marca: z.enum(MARCAS, { errorMap: () => ({ message: 'Elegí una marca válida' }) }),
  genero: z.enum(GENEROS, { errorMap: () => ({ message: 'Elegí un género válido' }) }),
  familiaOlfativa: z.enum(FAMILIAS_OLFATIVAS, {
    errorMap: () => ({ message: 'Elegí una familia olfativa válida' }),
  }),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  notasSalida: z.array(z.string()).default([]),
  notasCorazon: z.array(z.string()).default([]),
  notasFondo: z.array(z.string()).default([]),
  precioUSD: z.coerce.number().positive('El precio debe ser mayor a 0'),
  volumenML: z.coerce.number().positive('El volumen debe ser mayor a 0'),
  imagenes: z.array(z.string()).default([]),
  destacado: z.boolean().default(false),
  disponible: z.boolean().default(true),
  activo: z.boolean().default(true),
});

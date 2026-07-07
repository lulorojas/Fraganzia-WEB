import { z } from 'zod';
import { GENEROS, FAMILIAS_OLFATIVAS, MARCAS } from '../constants';

// Acepta string CSV ("Bergamota, Rosa") o array — siempre produce array.
const arrayDesdeComa = z.preprocess((v) => {
  if (v === undefined || v === null || v === '') return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}, z.array(z.string()));

// Acepta string con saltos de línea o array — siempre produce array.
const arrayDesdeLineas = z.preprocess((v) => {
  if (v === undefined || v === null || v === '') return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return String(v).split('\n').map((s) => s.trim()).filter(Boolean);
}, z.array(z.string()));

export const perfumeSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  marca: z.enum(MARCAS, { errorMap: () => ({ message: 'Elegí una marca válida' }) }),
  genero: z.enum(GENEROS, { errorMap: () => ({ message: 'Elegí un género válido' }) }),
  familiaOlfativa: z.enum(FAMILIAS_OLFATIVAS, {
    errorMap: () => ({ message: 'Elegí una familia olfativa válida' }),
  }),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  notasSalida: arrayDesdeComa,
  notasCorazon: arrayDesdeComa,
  notasFondo: arrayDesdeComa,
  precioUSD: z.coerce.number().positive('El precio debe ser mayor a 0'),
  volumenML: z.coerce.number().positive('El volumen debe ser mayor a 0'),
  imagenes: arrayDesdeLineas,
  destacado: z.boolean().default(false),
  disponible: z.boolean().default(true),
  activo: z.boolean().default(true),
});

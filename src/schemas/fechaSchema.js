import { z } from 'zod';

/**
 * Un <input type="date"> entrega "YYYY-MM-DD", que `new Date()` interpreta a las
 * 00:00 UTC: en Argentina eso es el día anterior. Se fija al mediodía local para
 * que la fecha cargada sea la que se ve, en cualquier huso.
 */
export const fechaSchema = z.preprocess(
  (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00` : v),
  z.coerce.date()
);

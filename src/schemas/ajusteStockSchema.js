import { z } from 'zod';

/**
 * `cantidad` va con signo: positiva suma stock, negativa lo descuenta. Se pide
 * el motivo porque un ajuste manual no tiene un comprobante detrás — dentro de
 * unos meses el motivo es lo único que explica de dónde salió esa mercadería.
 *
 * No lleva monto: son unidades sin costo conocido (típicamente compras viejas
 * de las que no se recuerda lo que se pagó). Por eso el sistema las deja fuera
 * del cálculo de margen en vez de asumir que costaron cero.
 */
export const ajusteStockSchema = z.object({
  perfumeId: z.string().min(1, 'Elegí un perfume'),
  perfumeNombre: z.string().min(1),
  cantidad: z.coerce.number().int('Tiene que ser un número entero')
    .refine((n) => n !== 0, 'La cantidad no puede ser 0'),
  motivo: z.string().min(1, 'Contá de dónde salió o por qué se descuenta'),
  fecha: z.coerce.date(),
});

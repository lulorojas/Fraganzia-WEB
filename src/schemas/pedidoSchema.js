import { z } from 'zod';
import { METODOS_PAGO } from '../constants';

export const pedidoSchema = z.object({
  items: z
    .array(
      z.object({
        perfumeId: z.string(),
        nombre: z.string(),
        marca: z.string(),
        precioUSD: z.number(),
        precioARS: z.number(),
        cantidad: z.number().int().min(1),
      })
    )
    .min(1, 'El carrito no puede estar vacío'),
  metodoPago: z.enum(METODOS_PAGO),
  dolarBlueUsado: z.number(),
  subtotalARS: z.number(),
  descuentoARS: z.number(),
  totalARS: z.number(),
  clienteNombre: z.string().min(1, 'El nombre es obligatorio'),
  clienteEmail: z.string().optional(),
  estado: z.enum(['en_proceso', 'confirmado', 'cancelado']),
});

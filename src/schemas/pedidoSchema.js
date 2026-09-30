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
        cantidad: z.number().int().min(1).max(99),
      })
    )
    .min(1, 'El carrito no puede estar vacío')
    .max(30, 'El pedido tiene demasiados productos'),
  metodoPago: z.enum(METODOS_PAGO),
  dolarBlueUsado: z.number(),
  subtotalARS: z.number(),
  descuentoARS: z.number(),
  totalARS: z.number(),
  clienteNombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
  clienteEmail: z.string().max(120).optional(),
  estado: z.enum(['en_proceso', 'confirmado', 'cancelado']),
});

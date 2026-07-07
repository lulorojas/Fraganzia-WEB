import { WHATSAPP_NUMERO } from '../constants';
import { formatARS } from './format';

export function construirLinkWhatsApp(numero, mensaje) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function generarLinkConsultaPrecio(nombrePerfume, numero = WHATSAPP_NUMERO) {
  return construirLinkWhatsApp(numero, `Hola! Quiero consultar el precio de ${nombrePerfume}.`);
}

export function generarLinkWhatsApp({ clienteNombre, items, metodoPago, total, numero = WHATSAPP_NUMERO }) {
  const lineas = [
    '¡Hola Fraganzia! Quiero hacer un pedido:',
    '',
    ...items.map(
      (it) => `• ${it.cantidad}x ${it.marca} - ${it.nombre} (${formatARS(it.precioARS)} c/u)`
    ),
    '',
    `Método de pago: ${metodoPago}`,
    `Total: ${formatARS(total)}`,
    '',
    `Cliente: ${clienteNombre}`,
  ];
  return construirLinkWhatsApp(numero, lineas.join('\n'));
}

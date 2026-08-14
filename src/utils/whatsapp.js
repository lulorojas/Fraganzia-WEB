import { WHATSAPP_NUMERO } from '../constants';
import { formatARS } from './format';

// Formato correcto para WhatsApp Web y mobile
export function construirLinkWhatsApp(numero, mensaje) {
  // Asegurar que el número no tenga espacios, guiones ni símbolos
  const numeroLimpio = numero.replace(/\D/g, '');
  
  // Usar api.whatsapp.com que funciona tanto en web como mobile
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${mensajeCodificado}`;
}

export function generarLinkConsultaPrecio(nombrePerfume, numero = WHATSAPP_NUMERO) {
  return construirLinkWhatsApp(numero, `Hola! Quiero consultar el precio de ${nombrePerfume}.`);
}

export function generarLinkWhatsApp({ clienteNombre, items, metodoPago, total, numero = WHATSAPP_NUMERO }) {
  const metodoFormateado = metodoPago === 'Transferencia' ? 'Transferencia' : 'Efectivo';
  
  const lineas = [
    '¡Hola Fraganzia! Quiero hacer un pedido:',
    '',
    ...items.map(
      (it) => `• ${it.cantidad}x ${it.marca} - ${it.nombre} (${formatARS(it.precioARS)} c/u)`
    ),
    '',
    `Método de pago: ${metodoFormateado}`,
    `Total: ${formatARS(total)}`,
    '',
    `Cliente: ${clienteNombre}`,
  ];
  return construirLinkWhatsApp(numero, lineas.join('\n'));
}

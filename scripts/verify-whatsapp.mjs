// Test directo del link de WhatsApp

const WHATSAPP_NUMERO = '5491130097370';

function formatARS(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

function construirLinkWhatsApp(numero, mensaje) {
  const numeroLimpio = numero.replace(/\D/g, '');
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${mensajeCodificado}`;
}

function generarLinkWhatsApp({ clienteNombre, items, metodoPago, total, numero }) {
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

// Test con datos reales
const testLink = generarLinkWhatsApp({
  clienteNombre: 'Test Usuario',
  items: [
    { cantidad: 1, marca: 'LATTAFA', nombre: 'Khamrah', precioARS: 38000 }
  ],
  metodoPago: 'Transferencia',
  total: 38000,
  numero: WHATSAPP_NUMERO
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📱 LINK DE WHATSAPP GENERADO:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(testLink);
console.log('\n');

// Extraer datos del link
const url = new URL(testLink);
const phone = url.searchParams.get('phone');
const text = decodeURIComponent(url.searchParams.get('text'));

console.log('📞 Número:', phone);
console.log('🔢 Número sin formato:', WHATSAPP_NUMERO);
console.log('✅ Número correcto:', phone === WHATSAPP_NUMERO);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💬 MENSAJE DECODIFICADO:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(text);
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Este link debería abrir WhatsApp en el celular');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

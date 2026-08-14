// Script para probar la generación del link de WhatsApp

function construirLinkWhatsApp(numero, mensaje) {
  const numeroLimpio = numero.replace(/\D/g, '');
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${mensajeCodificado}`;
}

function formatARS(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
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

// Test
const testData = {
  clienteNombre: 'Juan Pérez',
  items: [
    { cantidad: 1, marca: 'ARMAF', nombre: 'Club de Nuit Intense', precioARS: 45000 },
    { cantidad: 2, marca: 'LATTAFA', nombre: 'Khamrah', precioARS: 38000 }
  ],
  metodoPago: 'Transferencia',
  total: 121000,
  numero: '5491112345678'
};

const link = generarLinkWhatsApp(testData);

console.log('\n🔗 LINK DE WHATSAPP GENERADO:\n');
console.log(link);
console.log('\n');

// Decodificar para ver el mensaje
const urlObj = new URL(link);
const mensaje = decodeURIComponent(urlObj.searchParams.get('text'));
console.log('📱 MENSAJE DECODIFICADO:\n');
console.log(mensaje);
console.log('\n');

// Verificar el número
console.log('📞 NÚMERO:', urlObj.searchParams.get('phone'));
console.log('\n');

// Verificar que sea un link válido
console.log('✅ Link válido:', link.startsWith('https://api.whatsapp.com/send?'));

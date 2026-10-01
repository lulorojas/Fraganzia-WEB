export const WHATSAPP_NUMERO = '5491130097370'; // +54 9 11 3009-7370

export const GENEROS = ['Masculino', 'Femenino', 'Unisex', 'Kids'];

export const FAMILIAS_OLFATIVAS = [
  'Oriental',
  'Floral',
  'Amaderado',
  'Aromático',
  'Acuático',
  'Gourmand',
  'Cítrico',
];

export const MARCAS = [
  'Afnan', 'Al Haramain', 'Al Wataniah', 'Anfar', 'Armaf', 'Bharara',
  'Dumont', 'Emper', 'Fragrance World', 'French Avenue', 'Grandeur',
  'Khadlaj', "L'Affair", 'Lattafa', 'Maison Alhambra', 'Nautica',
  'Orientica', 'Paris Corner', 'Pendora Scents', 'Rasasi', 'Rave', 'Rayhaan', 'Riiffs', 'Zimaya',
];

export const METODOS_PAGO = ['Transferencia', 'Efectivo'];

export const DESCUENTO_EFECTIVO = 0.05;
export const FACTOR_EFECTIVO = 0.95;

// Estados de un pedido, en el orden en que avanza. Los ve el cliente en
// /pedido/:id. 'confirmado' es el estado inicial: el cliente confirmó el
// pedido en la web (lo exige firestore.rules). 'en_proceso' es un estado
// viejo que se muestra como "En preparación".
export const ESTADOS_PEDIDO = ['confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];

export const ESTADO_PEDIDO_INFO = {
  confirmado: { label: 'Recibido', detalle: 'Recibimos tu pedido. Te escribimos por WhatsApp para coordinar el pago.', cls: 'text-sky-300' },
  en_proceso: { label: 'En preparación', detalle: 'Estamos preparando tu pedido.', cls: 'text-yellow-300' },
  preparando: { label: 'En preparación', detalle: 'Pago confirmado. Estamos preparando tu pedido.', cls: 'text-yellow-300' },
  enviado: { label: 'Enviado', detalle: 'Tu pedido está en camino (o listo para retirar).', cls: 'text-lila' },
  entregado: { label: 'Entregado', detalle: '¡Que lo disfrutes!', cls: 'text-emerald-400' },
  cancelado: { label: 'Cancelado', detalle: 'Este pedido fue cancelado. Si tenés dudas, escribinos.', cls: 'text-error' },
};

/** Número corto para mostrar y para hablar por WhatsApp ("#4F7K2A"). */
export const numeroPedido = (id) => `#${String(id).slice(0, 6).toUpperCase()}`;

export const DOLAR_BLUE_API = 'https://dolarapi.com/v1/dolares/blue';

// ─── Panel financiero interno de socios ──────────────────────────────────────

export const SOCIOS = [
  { id: 'luciano', nombre: 'Luciano' },
  { id: 'benja', nombre: 'Benja' },
];

export const METODOS_PAGO_SOCIOS = ['efectivo', 'mercadopago'];

export const GASTO_CATEGORIAS = ['Envíos', 'Insumos', 'Marketing', 'Alquiler', 'Otros'];

export const ESTADOS_VENTA_SOCIO = ['pendiente', 'cobrada'];

export const TIPOS_MOVIMIENTO_PERSONAL = ['retiro', 'aporte'];

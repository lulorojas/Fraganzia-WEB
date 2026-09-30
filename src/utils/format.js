export function formatARS(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatUSD(valor) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(valor);
}

/**
 * "Marca Nombre" para textos accesibles y títulos, sin repetir la marca cuando
 * el nombre ya la incluye (en el catálogo suele venir "LATTAFA KHAMRAH 100ML").
 */
export function nombreCompleto({ marca = '', nombre = '' }) {
  return nombre.toLowerCase().includes(marca.toLowerCase()) ? nombre : `${marca} ${nombre}`.trim();
}

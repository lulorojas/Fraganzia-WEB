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

/**
 * Cada movimiento guarda dos fechas distintas: `fecha` es cuándo pasó la
 * operación (la elige el socio y puede ser anterior a hoy, para cargar algo
 * atrasado) y `createdAt` es cuándo se cargó en el sistema.
 *
 * Para mostrar interesa la primera, que es la del hecho real. `createdAt` queda
 * como respaldo para que ningún movimiento aparezca sin fecha.
 */
export function fechaDeMovimiento(movimiento) {
  return movimiento?.fecha ?? movimiento?.createdAt ?? null;
}

function aDate(valor) {
  if (!valor) return null;
  const d = valor?.toDate ? valor.toDate() : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Acepta Timestamp de Firestore, Date o string ISO.
export function formatFecha(valor) {
  const d = aDate(valor);
  return d ? d.toLocaleDateString('es-AR') : '—';
}

export function formatFechaHora(valor) {
  const d = aDate(valor);
  return d ? d.toLocaleString('es-AR') : '—';
}

export function milisDeFecha(valor) {
  return aDate(valor)?.getTime() ?? 0;
}

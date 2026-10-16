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

function aDateCrudo(valor) {
  if (!valor) return null;
  const d = valor?.toDate ? valor.toDate() : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Las fechas cargadas como YYYY-MM-DD quedaban a las 00:00 UTC, que en Argentina
 * es el día anterior a las 21:00. Una fecha clavada justo en la medianoche UTC se
 * lee como el día que se quiso cargar (mediodía local); las demás se dejan igual.
 * Los formularios nuevos ya guardan mediodía local (ver schemas/fechaSchema).
 */
export function fechaRegistro(valor) {
  const d = aDateCrudo(valor);
  if (!d) return null;
  const esMedianocheUTC = d.getUTCHours() === 0 && d.getUTCMinutes() === 0
    && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  return esMedianocheUTC
    ? new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12)
    : d;
}

const aDate = fechaRegistro;

// YYYY-MM-DD en hora local, para precargar un <input type="date">.
export function fechaInput(valor = new Date()) {
  const d = fechaRegistro(valor);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

// dd/mm, siempre de dos dígitos (formatFecha en es-AR no rellena los ceros).
export function diaMes(valor) {
  const d = fechaRegistro(valor);
  if (!d) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

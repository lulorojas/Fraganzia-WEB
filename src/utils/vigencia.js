/**
 * Vigencia de las promociones (ley de Parkinson aplicada con plazos REALES).
 *
 * "El trabajo se expande hasta ocupar el tiempo disponible": una promo sin fecha de cierre se mira,
 * se deja para después y no se decide nunca; una promo con un cierre cercano se decide antes. Por eso cada
 * promo puede tener `venceEn` (fecha y hora de cierre).
 *
 * Regla de honestidad: NUNCA se muestra un plazo que no exista. Sin `venceEn` no hay ninguna cuenta
 * regresiva, y al llegar la fecha la promo deja de verse y de aplicarse sola (no hay contadores que se reinicien).
 *
 * Todo recibe `ahora` (ms) en vez de leer el reloj: así se prueba sin esperar y el pre-render
 * (que genera el HTML en el build) y el navegador calculan lo mismo.
 */

export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/** Umbrales de la etiqueta: dentro de 3 días se muestra cuánto falta; dentro de 24 h, además, se marca como urgente. */
export const AVISAR_DENTRO_DE_MS = 3 * DIA;
export const URGENTE_DENTRO_DE_MS = DIA;

/** Fecha en cualquiera de las formas en que llega (Timestamp de Firestore, ISO, número, Date) → ms, o null. */
export function aMilisegundos(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor.getTime();
  if (typeof valor === 'string') {
    const t = Date.parse(valor);
    return Number.isNaN(t) ? null : t;
  }
  if (typeof valor.toMillis === 'function') return valor.toMillis();
  const segundos = valor.seconds ?? valor._seconds;
  if (typeof segundos === 'number') return segundos * 1000 + Math.floor((valor.nanoseconds ?? valor._nanoseconds ?? 0) / 1e6);
  return null;
}

/** Cierre de la promo en ms, o null si no tiene fecha de cierre. */
export function finDePromo(promo) {
  return aMilisegundos(promo?.venceEn);
}

/** ¿Sigue vigente? Sin fecha de cierre, siempre. Con `ahora` null (no se conoce la hora) no se descarta nada. */
export function estaVigente(promo, ahora) {
  const fin = finDePromo(promo);
  return fin === null || ahora === null || ahora === undefined || ahora < fin;
}

export function vigentes(promociones, ahora) {
  return (promociones ?? []).filter((p) => estaVigente(p, ahora));
}

/** Desglose de lo que falta. ms <= 0 = ya terminó. */
export function restante(fin, ahora) {
  const ms = fin - ahora;
  const m = Math.max(0, ms);
  return { ms, dias: Math.floor(m / DIA), horas: Math.floor((m % DIA) / HORA), minutos: Math.floor((m % HORA) / MINUTO) };
}

/** "2 días y 4 h" · "1 día" · "5 h 20 min" · "12 min". Los minutos solo cuentan en el último día. */
export function textoRestante(ms) {
  if (ms <= 0) return 'terminó';
  const { dias, horas, minutos } = restante(ms, 0); // restante(fin, ahora) = fin − ahora; con ahora = 0 desglosa `ms`
  if (dias >= 4) return `${dias} días`;
  if (dias >= 1) return `${dias} ${dias === 1 ? 'día' : 'días'}${horas ? ` y ${horas} h` : ''}`;
  if (horas >= 1) return minutos ? `${horas} h ${minutos} min` : `${horas} h`;
  return `${Math.max(1, minutos)} min`;
}

function partesAR(ms) {
  const f = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  // Se completan los ceros a mano: según el navegador, es-AR devuelve "1/12" aunque se pida "2-digit".
  return Object.fromEntries(f.formatToParts(ms).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value.padStart(2, '0')]));
}

/** "30/11" (hora de Argentina). */
export function fechaCorta(ms) {
  const p = partesAR(ms);
  return `${p.day}/${p.month}`;
}

/** "30/11 a las 23:59" (hora de Argentina). */
export function fechaLarga(ms) {
  const p = partesAR(ms);
  return `${p.day}/${p.month} a las ${p.hour}:${p.minute}`;
}

/**
 * Qué mostrar en la etiqueta de una promo: null si ya terminó; "Termina en 2 días y 4 h" si falta poco
 * (urgente = menos de 24 h); y "Hasta el 30/11" si falta más (no se apura a nadie con una fecha lejana).
 */
export function etiquetaVigencia(fin, ahora) {
  const ms = fin - ahora;
  if (ms <= 0) return null;
  if (ms <= AVISAR_DENTRO_DE_MS) return { texto: `Termina en ${textoRestante(ms)}`, urgente: ms <= URGENTE_DENTRO_DE_MS, ms };
  return { texto: `Hasta el ${fechaCorta(fin)}`, urgente: false, ms };
}

/** Entre varias promos aplicadas, la que cierra primero (es la que manda el apuro). null si ninguna tiene cierre. */
export function cierreMasCercano(promociones, ahora) {
  const conCierre = (promociones ?? []).filter((p) => finDePromo(p) !== null && estaVigente(p, ahora));
  if (!conCierre.length) return null;
  return conCierre.reduce((a, b) => (finDePromo(b) < finDePromo(a) ? b : a));
}

// ─── Para el formulario del admin (hora local del navegador, que es la de quien carga la promo) ───

const dos = (n) => String(n).padStart(2, '0');

/** ms → "2026-11-30T23:59", el formato de <input type="datetime-local">. */
export function aInputLocal(ms) {
  if (ms === null || ms === undefined) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** "2026-11-30T23:59" → ms, o null si está vacío o no es una fecha. */
export function desdeInputLocal(texto) {
  if (!texto) return null;
  const t = new Date(texto).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Hoy (o dentro de `dias` días) a las 23:59, hora local. */
export function finDelDia(ahora, dias = 0) {
  const d = new Date(ahora);
  d.setDate(d.getDate() + dias);
  d.setHours(23, 59, 0, 0);
  return d.getTime();
}

/** Último día del mes a las 23:59, hora local. */
export function finDeMes(ahora) {
  const d = new Date(ahora);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 0, 0);
  return d.getTime();
}

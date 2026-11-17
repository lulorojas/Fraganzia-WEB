import { useSyncExternalStore } from 'react';

/**
 * Reloj compartido para las cuentas regresivas de las promociones: UN solo temporizador para todo el sitio
 * (en vez de uno por tarjeta), que avanza cada 30 s y solo mientras haya algo suscripto.
 *
 * Hidratación: las páginas llegan pre-generadas (tools/prerender.mjs) con la hora del build. Para que el primer
 * pintado en el navegador sea igual al HTML que ya está en pantalla, durante la hidratación se usa esa hora
 * (`fijarHoraDelBuild`) y recién después pasa a la hora real. Los textos que cambian con la hora llevan
 * `suppressHydrationWarning` (ver VigenciaPromo).
 */
const PASO_MS = 30_000;

let ahora = Date.now();
let horaDelBuild = null;
const oyentes = new Set();
let temporizador = null;

function avanzar() {
  ahora = Date.now();
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar) {
  oyentes.add(avisar);
  if (!temporizador) {
    ahora = Date.now(); // la hora puede haber quedado vieja si nadie estaba suscripto
    temporizador = setInterval(avanzar, PASO_MS);
  }
  return () => {
    oyentes.delete(avisar);
    if (!oyentes.size && temporizador) {
      clearInterval(temporizador);
      temporizador = null;
    }
  };
}

/** La hora (ms) con la que se generó el HTML pre-generado; la usa el primer pintado de la hidratación. */
export function fijarHoraDelBuild(ms) {
  horaDelBuild = Number.isFinite(ms) ? ms : null;
}

/** Fuerza una lectura nueva del reloj (por ejemplo, justo antes de confirmar un pedido). */
export function refrescarAhora() {
  avanzar();
  return ahora;
}

/** Hora actual en ms, actualizada cada 30 s. */
export function useAhora() {
  return useSyncExternalStore(suscribir, () => ahora, () => horaDelBuild ?? ahora);
}

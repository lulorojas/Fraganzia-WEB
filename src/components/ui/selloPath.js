// Geometría del sello de Fraganzia: un disco con borde festoneado (lacre) y una F cuya barra superior
// se eleva como una estela que se afina. Todo en una caja de 80 × 80.
// La usan el componente del logo y la herramienta que genera los íconos (tools/generar-iconos.mjs).

function bezier(p0, p1, p2, p3, t) {
  const m = 1 - t;
  return p0.map((_, k) => m ** 3 * p0[k] + 3 * m * m * t * p1[k] + 3 * m * t * t * p2[k] + t ** 3 * p3[k]);
}

/** Polígono de una curva cuyo grosor pasa de `w0` a `w1`: la estela de la F. */
function colaAfilada(p0, p1, p2, p3, w0, w1, pasos = 28) {
  const izq = [];
  const der = [];
  for (let k = 0; k <= pasos; k++) {
    const t = k / pasos;
    const [x, y] = bezier(p0, p1, p2, p3, t);
    const [x2, y2] = bezier(p0, p1, p2, p3, Math.min(1, t + 0.01));
    const [x1, y1] = bezier(p0, p1, p2, p3, Math.max(0, t - 0.01));
    const dx = x2 - x1;
    const dy = y2 - y1;
    const largo = Math.hypot(dx, dy) || 1;
    const nx = -dy / largo;
    const ny = dx / largo;
    const w = (w0 + (w1 - w0) * t ** 0.8) / 2;
    izq.push([x + nx * w, y + ny * w]);
    der.push([x - nx * w, y - ny * w]);
  }
  return `M${[...izq, ...der.reverse()].map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')}Z`;
}

/** La letra F: tallo, barra media y barra superior (la cola sale de su extremo). */
export const F_PATH =
  'M29 28.2a2.7 2.7 0 0 1 5.4 0V56.8a2.7 2.7 0 0 1 -5.4 0Z M31.7 40.2H44.5a2.5 2.5 0 0 1 0 5H31.7Z M31.7 25.6H44V30.9H31.7Z';
export const COLA_PATH = colaAfilada([44, 30], [53, 30], [58, 23], [52.5, 14.5], 5.4, 0.9);
/** Gota de humo en la punta de la estela. */
export const GOTA = { cx: 55, cy: 10.8, r: 1.2 };

/** Contorno del lacre: un círculo con `dientes` festones de amplitud `amp`. */
export function lacrePath({ dientes = 30, amp = 0.9 } = {}) {
  const puntos = [];
  for (let k = 0; k <= 360; k++) {
    const a = (k * Math.PI) / 180;
    const r = 37.2 + amp * Math.cos(dientes * a);
    puntos.push(`${(40 + r * Math.sin(a)).toFixed(2)} ${(40 - r * Math.cos(a)).toFixed(2)}`);
  }
  return `M${puntos.join(' L')}Z`;
}

// Borde fino (elegido): 30 dientes, poca amplitud. En tamaños chicos se usa liso para que no se ensucie.
export const LACRE_FINO = lacrePath({ dientes: 30, amp: 0.9 });
export const DISCO_LISO = lacrePath({ dientes: 30, amp: 0 });

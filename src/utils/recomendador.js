import { normalizarTexto } from './texto.js';
import { preciosPorMetodo } from './precios.js';

/**
 * Motor del asistente "Encontrá tu perfume". Todo corre en el navegador sobre
 * el catálogo que ya está en caché: sin backend y sin costo por consulta.
 *
 * Puntaje de cada perfume según las respuestas:
 *  - aroma: familia olfativa principal +4, relacionada +2, y +1 por cada
 *    palabra clave que aparezca en la descripción (hasta +3);
 *  - momento del día: familia afín +2;
 *  - género: exacto +3, unisex +2 (el resto queda afuera);
 *  - destacado +1.
 * El presupuesto filtra; si deja menos de 3 opciones, se relaja al rango vecino.
 */

export const AROMAS = {
  dulce: {
    etiqueta: 'Dulces y cálidos',
    detalle: 'vainilla, ámbar, caramelo',
    familias: ['Gourmand'],
    relacionadas: ['Oriental'],
    claves: ['vainilla', 'ambar', 'caramel', 'dulce', 'canela', 'miel', 'tonka', 'chocolate', 'coco', 'praline'],
  },
  amaderado: {
    etiqueta: 'Amaderados e intensos',
    detalle: 'oud, cuero, incienso',
    familias: ['Amaderado'],
    relacionadas: ['Oriental'],
    claves: ['oud', 'sandalo', 'cedro', 'cuero', 'incienso', 'tabaco', 'vetiver', 'pachuli', 'amader', 'especi'],
  },
  fresco: {
    etiqueta: 'Frescos y limpios',
    detalle: 'cítricos, marinos, lavanda',
    familias: ['Cítrico', 'Acuático', 'Aromático', 'Verde'],
    relacionadas: [],
    claves: ['bergamota', 'fresc', 'marin', 'lavanda', 'citric', 'limon', 'menta', 'acuat', 'verde', 'pomelo'],
  },
  floral: {
    etiqueta: 'Florales y frutales',
    detalle: 'rosa, jazmín, frutas',
    familias: ['Floral'],
    relacionadas: ['Gourmand'],
    claves: ['rosa', 'jazmin', 'floral', 'frut', 'peonia', 'flor', 'durazno', 'frutilla', 'pera'],
  },
  sorpresa: {
    etiqueta: 'No sé, sorprendeme',
    detalle: 'te muestro los más elegidos',
    familias: [],
    relacionadas: [],
    claves: [],
  },
};

export const MOMENTOS = {
  dia: { etiqueta: 'De día / oficina', familias: ['Cítrico', 'Acuático', 'Aromático', 'Floral', 'Verde'] },
  noche: { etiqueta: 'Noches y salidas', familias: ['Oriental', 'Gourmand', 'Amaderado'] },
  siempre: { etiqueta: 'Para todo momento', familias: [] },
};

export const GENEROS_ASISTENTE = {
  Masculino: 'Masculino',
  Femenino: 'Femenino',
  indistinto: 'Me da igual',
  Kids: 'Para chicos',
};

/** Precio por transferencia en pesos (en vivo si hay cotización, si no el guardado). */
export function precioARS(perfume, dolarMedio) {
  if (dolarMedio && perfume.precioUSD) return preciosPorMetodo(perfume.precioUSD, dolarMedio).precioTransferencia;
  return perfume.precioTransferencia ?? null;
}

const redondearMiles = (n) => Math.round(n / 1000) * 1000;

/**
 * Tres rangos de presupuesto calculados sobre los precios actuales del catálogo
 * (tercios), así no quedan desactualizados con la inflación.
 */
export function rangosDePresupuesto(perfumes, dolarMedio) {
  const precios = perfumes
    .map((p) => precioARS(p, dolarMedio))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  if (precios.length < 6) return [];
  const corte1 = redondearMiles(precios[Math.floor(precios.length / 3)]);
  const corte2 = redondearMiles(precios[Math.floor((precios.length * 2) / 3)]);
  return [
    { id: 'bajo', min: 0, max: corte1 },
    { id: 'medio', min: corte1, max: corte2 },
    { id: 'alto', min: corte2, max: Infinity },
  ];
}

function puntaje(perfume, { genero, aroma, momento }) {
  let total = 0;

  if (genero && genero !== 'indistinto') {
    if (perfume.genero === genero) total += 3;
    else if (perfume.genero === 'Unisex' && genero !== 'Kids') total += 2;
    else return null; // no corresponde al género pedido
  } else if (perfume.genero === 'Kids') {
    return null; // "Me da igual" no incluye perfumes infantiles
  }

  const perfil = AROMAS[aroma];
  if (perfil) {
    if (perfil.familias.includes(perfume.familiaOlfativa)) total += 4;
    else if (perfil.relacionadas.includes(perfume.familiaOlfativa)) total += 2;
    const descripcion = normalizarTexto(perfume.descripcion);
    if (descripcion) {
      total += Math.min(3, perfil.claves.filter((c) => descripcion.includes(c)).length);
    }
  }

  if (MOMENTOS[momento]?.familias.includes(perfume.familiaOlfativa)) total += 2;
  if (perfume.destacado) total += 1;
  return total;
}

/**
 * Devuelve los perfumes ordenados de más a menos recomendable, cada uno con
 * `precio` en pesos. `respuestas`: { genero, aroma, momento, presupuesto }.
 */
export function recomendar(perfumes, respuestas, { dolarMedio, rangos = [] } = {}) {
  const candidatos = (perfumes ?? [])
    .map((p) => ({ perfume: p, puntos: puntaje(p, respuestas), precio: precioARS(p, dolarMedio) }))
    .filter((c) => c.puntos !== null);

  const ordenar = (lista) =>
    [...lista].sort(
      (a, b) =>
        b.puntos - a.puntos ||
        Number(Boolean(b.perfume.destacado)) - Number(Boolean(a.perfume.destacado)) ||
        (a.precio ?? Infinity) - (b.precio ?? Infinity)
    );

  const indice = rangos.findIndex((r) => r.id === respuestas.presupuesto);
  if (indice === -1) return ordenar(candidatos);

  const enRango = (r) => (c) => c.precio != null && c.precio >= r.min && c.precio < r.max;
  let elegidos = candidatos.filter(enRango(rangos[indice]));
  // Pocas opciones en ese rango: sumar los rangos vecinos, sin mezclarlos
  // por encima de los que sí entran en el presupuesto.
  if (elegidos.length < 3) {
    const vecinos = [rangos[indice - 1], rangos[indice + 1]].filter(Boolean);
    const extra = candidatos.filter((c) => vecinos.some((r) => enRango(r)(c)));
    return [...ordenar(elegidos), ...ordenar(extra)];
  }
  return ordenar(elegidos);
}

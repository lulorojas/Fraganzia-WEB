import { normalizarTexto } from './texto.js';
import { preciosPorMetodo } from './precios.js';
import datosAsistente from '../data/asistente-perfumes.json';

/**
 * Motor del asistente "Encontrá tu perfume". Todo corre en el navegador sobre
 * el catálogo que ya está en caché: sin backend y sin costo por consulta.
 *
 * Hay dos caminos según la respuesta a "¿se parece a uno famoso?":
 *
 * 1. Con referencia (`parecido`): solo entran los perfumes inspirados en ese
 *    perfume (los de inspiración exacta primero, después variantes como
 *    "Aventus Absolu"), ordenados por similitud. Si no hay ninguno se sigue
 *    por el camino general y se avisa (`referenciaSinResultados`).
 *
 * 2. General, puntaje de cada perfume:
 *  - aroma: familia olfativa principal +4, relacionada +2, y +1 por cada
 *    palabra clave en sus notas reales (o en la descripción si no hay) (hasta +3);
 *  - afinar el aroma: +2 por cada nota del matiz elegido (hasta +4);
 *  - momento: uso ideal exacto +3, compatible +1 (sin dato: familia afín +2);
 *  - lo que prefiere evitar: esos perfumes quedan afuera (si dejaran menos de
 *    3 opciones, se mantienen al final de la lista);
 *  - destacado +1, y de los más recomendados de la casa +2.
 *
 * En los dos caminos el género filtra (exacto +3, unisex +2) y el presupuesto
 * también; si deja menos de 3 opciones, se relaja al rango vecino.
 *
 * Inspiración, similitud, notas, uso y "más recomendados" salen de
 * src/data/asistente-perfumes.json (ver tools/generar-datos-asistente.mjs).
 * Un perfume nuevo que todavía no esté ahí usa solo los datos del catálogo.
 */

/** Datos extra del asistente para un perfume ({} si no hay). */
const extra = (perfume) => datosAsistente[perfume.id] ?? {};

/** Perfume famoso en el que se inspira, si hay una referencia confiable. */
export function inspiracion(perfume) {
  return extra(perfume).i ?? null;
}

// Marcas que se omiten al mostrar una referencia en un botón ("Creed Aventus" -> "Aventus").
// Las más largas primero, para que "Giorgio Armani" gane sobre "Armani".
const MARCAS_FAMOSAS = [
  'Maison Francis Kurkdjian', 'Les Liquides Imaginaires', 'Stéphane Humbert Lucas 777', 'Giardini di Toscana',
  'Jean Paul Gaultier', 'Parfums de Marly', 'Louis Vuitton', 'Giorgio Armani', 'Emporio Armani', 'Carolina Herrera',
  'Dolce & Gabbana', 'Viktor & Rolf', 'Maison Crivelli', 'Marc-Antoine Barrois', 'Lorenzo Pazzaglia', 'Billie Eilish',
  'Ralph Lauren', 'Jimmy Choo', 'Hugo Boss', 'Roja Dove', 'Tom Ford', 'Jo Malone', 'Ex Nihilo', 'Arabian Oud',
  'Orto Parisi', 'Room 1015', 'Creed', 'Dior', 'Chanel', 'Xerjoff', 'YSL', 'Rabanne', 'Kilian', 'Armani', 'Initio',
  'Versace', 'Valentino', 'Mugler', 'Lancôme', 'Burberry', 'Kayali', 'Bvlgari', 'Azzaro', 'Nishane', 'Gucci',
  'BDK', 'Mancera', 'Montale', 'Hermès', 'Givenchy', 'Sospiro',
];

/**
 * Nombre corto de una referencia para mostrar ("Maison Francis Kurkdjian Baccarat Rouge 540" -> "Baccarat Rouge 540").
 * Si sin la marca queda algo demasiado corto o ambiguo ("K", "Her", "Woman"), se deja completo.
 */
export function nombreCorto(referencia) {
  const marca = MARCAS_FAMOSAS.find((m) => referencia.startsWith(m + ' '));
  const resto = marca ? referencia.slice(marca.length + 1) : referencia;
  return resto.length >= 6 ? resto : referencia;
}

const variantesDe = (opciones) =>
  Object.fromEntries(Object.entries(opciones).map(([valor, [etiqueta, claves]]) => [valor, { etiqueta, claves }]));

export const AROMAS = {
  dulce: {
    etiqueta: 'Dulces y cálidos',
    detalle: 'vainilla, ámbar, caramelo',
    familias: ['Gourmand'],
    relacionadas: ['Oriental'],
    claves: ['vainilla', 'ambar', 'caramel', 'dulce', 'canela', 'miel', 'tonka', 'chocolate', 'coco', 'praline'],
    variantes: variantesDe({
      vainilla: ['Vainilla y caramelo', ['vainilla', 'caramel', 'tonka', 'praline', 'miel']],
      cafe: ['Café y chocolate', ['cafe', 'chocolate', 'cacao', 'avellana']],
      frutal: ['Frutal y goloso', ['frut', 'frutilla', 'frambuesa', 'cereza', 'mango', 'pina', 'coco', 'durazno', 'lichi']],
      especiado: ['Especiado y cálido', ['canela', 'cardamomo', 'azafran', 'especi', 'ambar', 'tabaco']],
    }),
  },
  amaderado: {
    etiqueta: 'Amaderados e intensos',
    detalle: 'oud, cuero, incienso',
    familias: ['Amaderado'],
    relacionadas: ['Oriental'],
    claves: ['oud', 'sandalo', 'cedro', 'cuero', 'incienso', 'tabaco', 'vetiver', 'pachuli', 'amader', 'especi'],
    variantes: variantesDe({
      oud: ['Oud e incienso', ['oud', 'incienso', 'ahumad']],
      cuero: ['Cuero y tabaco', ['cuero', 'tabaco']],
      suave: ['Maderas suaves', ['sandalo', 'cedro', 'vetiver', 'iris', 'almizcl']],
      especiado: ['Especiado', ['especi', 'azafran', 'cardamomo', 'canela']],
    }),
  },
  fresco: {
    etiqueta: 'Frescos y limpios',
    detalle: 'cítricos, marinos, lavanda',
    familias: ['Cítrico', 'Acuático', 'Aromático', 'Verde'],
    relacionadas: [],
    claves: ['bergamota', 'fresc', 'marin', 'lavanda', 'citric', 'limon', 'menta', 'acuat', 'verde', 'pomelo'],
    variantes: variantesDe({
      citrico: ['Cítrico', ['citric', 'limon', 'bergamota', 'pomelo', 'mandarina', 'naranja', 'neroli']],
      marino: ['Marino o acuático', ['marin', 'acuat']],
      aromatico: ['Aromático (lavanda, menta)', ['lavanda', 'menta', 'verde']],
      frutal: ['Frutal fresco', ['manzana', 'pera', 'pina', 'frut']],
    }),
  },
  floral: {
    etiqueta: 'Florales y frutales',
    detalle: 'rosa, jazmín, frutas',
    familias: ['Floral'],
    relacionadas: ['Gourmand'],
    claves: ['rosa', 'jazmin', 'floral', 'frut', 'peonia', 'flor', 'durazno', 'frutilla', 'pera'],
    variantes: variantesDe({
      rosa: ['Rosa', ['rosa']],
      blancas: ['Flores blancas', ['jazmin', 'tuberosa', 'azahar', 'neroli']],
      frutal: ['Floral frutal', ['frut', 'frambuesa', 'lichi', 'durazno', 'pera', 'frutilla']],
      empolvado: ['Empolvado y suave', ['iris', 'violeta', 'almizcl']],
    }),
  },
  sorpresa: {
    etiqueta: 'No sé, sorprendeme',
    detalle: 'te muestro los más elegidos',
    familias: [],
    relacionadas: [],
    claves: [],
    variantes: {},
  },
};

/** Lo que se puede pedir evitar (selección múltiple). */
export const EVITAR = variantesDe({
  dulce: ['Muy dulce', ['vainilla', 'caramel', 'praline', 'chocolate', 'cacao', 'miel', 'dulce']],
  oud: ['Oud o ahumado', ['oud', 'ahumad', 'incienso']],
  floral: ['Muy floral', ['rosa', 'jazmin', 'tuberosa', 'floral', 'flor', 'peonia', 'azahar']],
  cuero: ['Cuero o tabaco', ['cuero', 'tabaco']],
  frutal: ['Muy frutal', ['frut', 'frutilla', 'frambuesa', 'cereza', 'mango', 'pina', 'lichi', 'durazno']],
});

// Usos ideales: C día·calor, O día·oficina, N noche·salidas, F noche·frío, T todo uso.
// `exacto` suma +3, `afines` +1; si el perfume no tiene dato se usa `familias` (+2).
const FAMILIAS_DIA = ['Cítrico', 'Acuático', 'Aromático', 'Floral', 'Verde'];
const FAMILIAS_NOCHE = ['Oriental', 'Gourmand', 'Amaderado'];
export const MOMENTOS = {
  calor: { etiqueta: 'Días de calor', exacto: 'C', afines: ['O', 'T'], familias: FAMILIAS_DIA },
  oficina: { etiqueta: 'Día a día / oficina', exacto: 'O', afines: ['C', 'T'], familias: FAMILIAS_DIA },
  noche: { etiqueta: 'Salidas de noche', exacto: 'N', afines: ['F', 'T'], familias: FAMILIAS_NOCHE },
  frio: { etiqueta: 'Noches de frío', exacto: 'F', afines: ['N', 'T'], familias: FAMILIAS_NOCHE },
  siempre: { etiqueta: 'Para todo momento', exacto: 'T', afines: [], familias: [] },
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

/** Puntos por género, o null si el perfume no corresponde al género pedido. */
function puntosGenero(perfume, genero) {
  if (genero && genero !== 'indistinto') {
    if (perfume.genero === genero) return 3;
    if (perfume.genero === 'Unisex' && genero !== 'Kids') return 2;
    return null;
  }
  return perfume.genero === 'Kids' ? null : 0; // "Me da igual" no incluye perfumes infantiles
}

// Si hay notas verificadas se usan solas: muchas descripciones del catálogo
// mencionan notas que el perfume no tiene. Si no, se usa la descripción.
const textoNotas = (perfume) => extra(perfume).c ?? normalizarTexto(perfume.descripcion);
const cuentaClaves = (texto, claves) => claves.filter((c) => texto.includes(c)).length;

/**
 * Referencias famosas con al menos un perfume del catálogo para ese género,
 * de la más imitada a la menos: [{ valor, etiqueta }].
 */
export function referenciasDisponibles(perfumes, genero) {
  const conteo = new Map();
  for (const p of perfumes ?? []) {
    const ref = inspiracion(p);
    if (ref && puntosGenero(p, genero) !== null) conteo.set(ref, (conteo.get(ref) ?? 0) + 1);
  }
  return [...conteo]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([valor]) => ({ valor, etiqueta: nombreCorto(valor) }));
}

/** Referencias que coinciden con lo que se escribió (todas las palabras, sin tildes). */
export function buscarReferencias(perfumes, genero, texto, max = 6) {
  const palabras = normalizarTexto(texto).split(/\s+/).filter(Boolean);
  if (!palabras.length) return [];
  return referenciasDisponibles(perfumes, genero)
    .filter((r) => palabras.every((p) => normalizarTexto(r.valor).includes(p)))
    .slice(0, max);
}

function puntajeGeneral(perfume, { genero, aroma, variante, momento }) {
  const base = puntosGenero(perfume, genero);
  if (base === null) return null;
  let total = base;
  const datos = extra(perfume);
  const texto = textoNotas(perfume);

  const perfil = AROMAS[aroma];
  if (perfil) {
    if (perfil.familias.includes(perfume.familiaOlfativa)) total += 4;
    else if (perfil.relacionadas.includes(perfume.familiaOlfativa)) total += 2;
    total += Math.min(3, cuentaClaves(texto, perfil.claves));
    const matiz = perfil.variantes[variante];
    if (matiz) total += Math.min(4, 2 * cuentaClaves(texto, matiz.claves));
  }

  const m = MOMENTOS[momento];
  if (m) {
    if (datos.u) total += datos.u === m.exacto ? 3 : m.afines.includes(datos.u) ? 1 : 0;
    else if (m.familias.includes(perfume.familiaOlfativa)) total += 2;
  }
  if (perfume.destacado) total += 1;
  if (datos.r) total += 2;
  return total;
}

/** Puntaje en modo "parecido a": inspiración exacta, después variantes; luego similitud. */
function puntajeParecido(perfume, { genero, parecido }) {
  const base = puntosGenero(perfume, genero);
  const ref = inspiracion(perfume);
  if (base === null || !ref) return null;
  const buscado = normalizarTexto(parecido);
  const propio = normalizarTexto(ref);
  const nivel = propio === buscado ? 200 : propio.includes(buscado) || buscado.includes(propio) ? 100 : 0;
  if (!nivel) return null;
  const datos = extra(perfume);
  return nivel + (datos.s ?? 70) + (datos.r ? 5 : 0) + base;
}

function aplicarPresupuesto(candidatos, presupuesto, rangos, ordenar) {
  const indice = rangos.findIndex((r) => r.id === presupuesto);
  if (indice === -1) return ordenar(candidatos);
  const enRango = (r) => (c) => c.precio != null && c.precio >= r.min && c.precio < r.max;
  const elegidos = candidatos.filter(enRango(rangos[indice]));
  // Pocas opciones en ese rango: sumar los rangos vecinos, sin mezclarlos
  // por encima de los que sí entran en el presupuesto.
  if (elegidos.length < 3) {
    const vecinos = [rangos[indice - 1], rangos[indice + 1]].filter(Boolean);
    const extras = candidatos.filter((c) => vecinos.some((r) => enRango(r)(c)));
    return [...ordenar(elegidos), ...ordenar(extras)];
  }
  return ordenar(elegidos);
}

/**
 * Devuelve `{ lista, referenciaSinResultados }`: los perfumes ordenados de más a
 * menos recomendable (cada uno con `precio` en pesos) y si se pidió un parecido
 * que no tiene alternativas en el catálogo.
 * `respuestas`: { genero, parecido, aroma, variante, evitar[], momento, presupuesto }.
 */
export function recomendar(perfumes, respuestas, { dolarMedio, rangos = [] } = {}) {
  const ordenar = (lista) =>
    [...lista].sort(
      (a, b) =>
        b.puntos - a.puntos ||
        Number(Boolean(b.perfume.destacado)) - Number(Boolean(a.perfume.destacado)) ||
        (a.precio ?? Infinity) - (b.precio ?? Infinity)
    );
  const armar = (fn) =>
    (perfumes ?? [])
      .map((p) => ({ perfume: p, puntos: fn(p, respuestas), precio: precioARS(p, dolarMedio) }))
      .filter((c) => c.puntos !== null);

  const quiereParecido = respuestas.parecido && respuestas.parecido !== 'no';
  if (quiereParecido) {
    const parecidos = armar(puntajeParecido);
    if (parecidos.length) {
      return { lista: aplicarPresupuesto(parecidos, respuestas.presupuesto, rangos, ordenar), referenciaSinResultados: false };
    }
  }

  let candidatos = armar(puntajeGeneral);
  const evitar = (respuestas.evitar ?? []).flatMap((k) => EVITAR[k]?.claves ?? []);
  if (evitar.length) {
    const evita = (c) => cuentaClaves(textoNotas(c.perfume), evitar) > 0;
    const sinEvitados = candidatos.filter((c) => !evita(c));
    candidatos = sinEvitados.length >= 3
      ? sinEvitados
      : candidatos.map((c) => (evita(c) ? { ...c, puntos: c.puntos - 100 } : c));
  }
  return {
    lista: aplicarPresupuesto(candidatos, respuestas.presupuesto, rangos, ordenar),
    referenciaSinResultados: Boolean(quiereParecido),
  };
}

import { normalizarTexto } from './texto.js';

// Búsqueda del catálogo: por palabras sueltas, sin tildes ni mayúsculas, en
// cualquier orden ("khamrah lattafa" encuentra "LATTAFA KHAMRAH 100ML").

export const palabras = (texto) => normalizarTexto(texto).split(/\s+/).filter(Boolean);

const textoBuscable = (p) => normalizarTexto(`${p.marca ?? ''} ${p.nombre ?? ''}`);

/** true si todas las palabras de la búsqueda aparecen en marca + nombre. */
export function coincide(perfume, busqueda) {
  const terminos = palabras(busqueda);
  if (!terminos.length) return true;
  const texto = textoBuscable(perfume);
  return terminos.every((t) => texto.includes(t));
}

/**
 * Sugerencias para el autocompletado: marcas y perfumes que coinciden, primero
 * los que empiezan con lo escrito y los destacados.
 */
export function sugerencias(perfumes, busqueda, { maxPerfumes = 6, maxMarcas = 2 } = {}) {
  const terminos = palabras(busqueda);
  if (!terminos.length || !perfumes?.length) return { marcas: [], perfumes: [] };
  const consulta = terminos.join(' ');

  const marcas = marcasDelCatalogo(perfumes)
    .filter(({ marca }) => normalizarTexto(marca).includes(consulta))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, maxMarcas);

  const puntaje = (p) => {
    const nombre = normalizarTexto(p.nombre);
    return (nombre.startsWith(consulta) ? 4 : 0) +
      (nombre.split(/\s+/).some((w) => w.startsWith(terminos[0])) ? 2 : 0) +
      (p.destacado ? 1 : 0);
  };
  const lista = perfumes
    .filter((p) => coincide(p, busqueda))
    .map((p) => ({ p, s: puntaje(p) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, maxPerfumes)
    .map(({ p }) => p);

  return { marcas, perfumes: lista };
}

// Distancia de edición (Levenshtein) con corte: si supera `max`, devuelve max + 1.
function distancia(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      actual[j] = Math.min(previa[j] + 1, actual[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      minFila = Math.min(minFila, actual[j]);
    }
    if (minFila > max) return max + 1;
    previa = actual;
  }
  return previa[b.length];
}

/**
 * Para búsquedas sin resultados: corrige cada palabra mal escrita por la más
 * parecida del vocabulario del catálogo ("latafa kamrah" → "lattafa khamrah").
 * Devuelve null si no encuentra una corrección que dé resultados.
 */
export function quisoDecir(perfumes, busqueda) {
  const terminos = palabras(busqueda);
  if (!terminos.length || !perfumes?.length) return null;

  const vocabulario = new Set();
  for (const p of perfumes) for (const w of palabras(`${p.marca} ${p.nombre}`)) if (w.length > 2) vocabulario.add(w);

  let cambio = false;
  const corregidos = terminos.map((t) => {
    if (t.length < 3 || [...vocabulario].some((w) => w.includes(t))) return t;
    const max = t.length <= 4 ? 1 : 2;
    let mejor = null;
    let mejorDist = max + 1;
    for (const w of vocabulario) {
      // Comparar contra el comienzo de la palabra también ("khamr" ≈ "khamrah").
      const d = Math.min(distancia(t, w, max), distancia(t, w.slice(0, t.length), max));
      if (d < mejorDist) {
        mejor = w;
        mejorDist = d;
      }
    }
    if (mejor) cambio = true;
    return mejor ?? t;
  });

  if (!cambio) return null;
  const propuesta = corregidos.join(' ');
  return perfumes.some((p) => coincide(p, propuesta)) ? propuesta : null;
}

const esTodoMayusculas = (s) => s === s.toUpperCase() && s !== s.toLowerCase();
const tipoTitulo = (s) => s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (c) => c.toUpperCase());

/**
 * Marcas presentes en el catálogo, unificando variantes ("LATTAFA" y
 * "Lattafa" son la misma). Para mostrar se prefiere la variante que no está
 * toda en mayúsculas; si solo hay mayúsculas, se pasa a "Tipo Título".
 */
export function marcasDelCatalogo(perfumes) {
  const grupos = new Map();
  for (const p of perfumes ?? []) {
    if (!p.marca) continue;
    const clave = normalizarTexto(p.marca);
    const g = grupos.get(clave) ?? { cantidad: 0, variantes: new Set() };
    g.cantidad += 1;
    g.variantes.add(p.marca.trim());
    grupos.set(clave, g);
  }
  return [...grupos.values()]
    .map(({ cantidad, variantes }) => {
      const lista = [...variantes];
      const marca = lista.find((v) => !esTodoMayusculas(v)) ?? tipoTitulo(lista[0]);
      return { marca, cantidad };
    })
    .sort((a, b) => a.marca.localeCompare(b.marca, 'es'));
}

// Lectura del catálogo mayorista de Franzebi Imports y cruce con los perfumes
// de Firestore. Sin efectos secundarios: la escritura vive en bot-proveedor.mjs.
import { createHash } from 'node:crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { normalizarTexto } from '../../src/utils/texto.js';

const LINKTREE = 'https://linktr.ee/Franzebi';
const TITULO_LINK = 'PERFUMES ARABES MAYORISTA';

export const LIMITES = {
  filasMinimas: 100,
  maxCambiosPct: 30,
  maxNuevosPct: 25,
  maxVariacionPrecioPct: 50,
};

function buscarLink(nodo) {
  if (Array.isArray(nodo)) return nodo.map(buscarLink).find(Boolean);
  if (nodo && typeof nodo === 'object') {
    if (nodo.title === TITULO_LINK && typeof nodo.url === 'string') return nodo.url;
    return Object.values(nodo).map(buscarLink).find(Boolean);
  }
  return undefined;
}

/** Descarga el PDF mayorista siguiendo el link actual del Linktree. */
export async function descargarPdf() {
  const html = await (await fetch(LINKTREE)).text();
  const json = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)?.[1];
  const url = json && buscarLink(JSON.parse(json));
  const id = url?.match(/\/file\/d\/([\w-]+)/)?.[1];
  if (!id) throw new Error(`no se encontró el link "${TITULO_LINK}" en ${LINKTREE}`);
  const res = await fetch(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.subarray(0, 4).toString() !== '%PDF') throw new Error('Drive no devolvió un PDF');
  return buffer;
}

export const hashPdf = (buffer) => createHash('sha256').update(buffer).digest('hex');

const GENEROS = { MASCULINAS: 'Masculino', FEMENINAS: 'Femenino', KIDS: 'Kids' };

/** Género de la página según su encabezado "FRAGANCIAS MASCULINAS/FEMENINAS/KIDS". */
export function generoDePagina(textos) {
  for (const t of textos) {
    const m = t.trim().match(/^FRAGANCIAS (MASCULINAS|FEMENINAS|KIDS)$/i);
    if (m) return GENEROS[m[1].toUpperCase()];
  }
  return undefined;
}

/** Filas `{ nombre, volumenML, precioUSD, genero }` a partir del texto de una página (en orden de lectura). */
export function filasDesdeTextos(textos) {
  const genero = generoDePagina(textos);
  const filas = [];
  let buf = [];
  for (const crudo of textos) {
    const s = crudo.trim();
    if (!s) continue;
    const precio = s.match(/^(\d+(?:[.,]\d+)?)\s*USD/i);
    if (!precio) {
      buf.push(s);
      continue;
    }
    const nombre = buf.join(' ').replace(/\s+/g, ' ').replace(/^.*MODELO PRECIO\s+/i, '').trim();
    const volumen = nombre.match(/(\d+)\s?ML$/i);
    if (volumen) {
      filas.push({ nombre, volumenML: Number(volumen[1]), precioUSD: Number(precio[1].replace(',', '.')), genero });
    }
    buf = [];
  }
  return filas;
}

export async function leerFilasDelPdf(buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const filas = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const { items } = await (await pdf.getPage(n)).getTextContent();
    filas.push(...filasDesdeTextos(items.map((i) => i.str)));
  }
  return filas;
}

const JPEG_SOI = Buffer.from([0xff, 0xd8, 0xff]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_IEND = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
const TAMANO_MINIMO_IMAGEN = 5000; // descarta logos/íconos decorativos del PDF

/**
 * Imágenes JPEG/PNG embebidas en el PDF, en el orden en que aparecen en el
 * archivo. El PDF no asocia explícitamente cada foto a su fila de texto; esa
 * asociación (si es segura) la resuelve `asociarImagenes`.
 */
export function extraerImagenesCrudas(buffer) {
  const imagenes = [];
  let pos = 0;
  while (pos < buffer.length - 8) {
    const soi = buffer.indexOf(JPEG_SOI, pos);
    const png = buffer.indexOf(PNG_SIG, pos);
    if (soi === -1 && png === -1) break;
    const esPng = png !== -1 && (soi === -1 || png < soi);
    const inicio = esPng ? png : soi;
    const fin = esPng
      ? buffer.indexOf(PNG_IEND, inicio + 8)
      : buffer.indexOf(JPEG_EOI, inicio + 2);
    if (fin === -1) break;
    const largoMarcador = esPng ? 8 : 2;
    const imagen = buffer.subarray(inicio, fin + largoMarcador);
    if (imagen.length > TAMANO_MINIMO_IMAGEN) imagenes.push(Buffer.from(imagen));
    pos = fin + largoMarcador;
  }
  return imagenes;
}

/**
 * Empareja imágenes con filas por orden, pero solo si la cantidad coincide
 * exacto con la cantidad de filas: si el PDF trajo una cantidad distinta de
 * fotos que de productos, no hay forma confiable de saber cuál va con cuál,
 * así que no se asocia ninguna (quedan igual que antes, para carga manual).
 */
export function asociarImagenes(filas, imagenes) {
  if (!filas.length || imagenes.length !== filas.length) return filas;
  return filas.map((fila, i) => ({ ...fila, imagenBuffer: imagenes[i] }));
}

/** Clave de comparación: sin tildes, símbolos ni espacios sobrantes ("100 ML" = "100ML"). */
export function clave(nombre) {
  return normalizarTexto(nombre)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/(\d) ml\b/g, '$1ml')
    .trim();
}

function marcaDe(nombre, marcas) {
  const k = clave(nombre);
  const conocida = marcas
    .filter((m) => k.startsWith(`${clave(m)} `))
    .sort((a, b) => b.length - a.length)[0];
  return conocida ?? nombre.split(' ')[0];
}

/**
 * Compara el PDF con los perfumes actuales. No escribe nada.
 * Devuelve { cambios, nuevos, omitidos, ambiguos }.
 */
export function cruzar(filas, perfumes) {
  const porClave = new Map();
  for (const p of perfumes) {
    const k = clave(p.nombre);
    porClave.set(k, [...(porClave.get(k) ?? []), p]);
  }
  const marcas = [...new Set(perfumes.map((p) => p.marca).filter(Boolean))];
  const vistas = new Set();
  const res = { cambios: [], nuevos: [], omitidos: [], ambiguos: [] };

  for (const fila of filas) {
    const k = clave(fila.nombre);
    if (vistas.has(k)) continue;
    vistas.add(k);

    if (!(fila.precioUSD > 0)) {
      res.omitidos.push({ nombre: fila.nombre, motivo: 'precio inválido' });
      continue;
    }
    const coinciden = porClave.get(k) ?? [];
    if (coinciden.length > 1) {
      res.ambiguos.push(fila.nombre);
    } else if (coinciden.length === 0) {
      res.nuevos.push({ ...fila, marca: marcaDe(fila.nombre, marcas) });
    } else {
      const [p] = coinciden;
      if (p.precioUSD === fila.precioUSD) continue;
      const variacion = p.precioUSD > 0 ? (Math.abs(fila.precioUSD - p.precioUSD) / p.precioUSD) * 100 : 0;
      if (variacion > LIMITES.maxVariacionPrecioPct) {
        res.omitidos.push({ nombre: fila.nombre, motivo: `variación de ${Math.round(variacion)}%` });
      } else {
        res.cambios.push({ id: p.id, nombre: p.nombre, anterior: p.precioUSD ?? null, nuevo: fila.precioUSD });
      }
    }
  }
  return res;
}

/** Devuelve el motivo para abortar sin escribir, o null si es seguro aplicar. */
export function motivoDeAborto(filas, resultado, totalPerfumes, { forzar = false } = {}) {
  if (filas.length < LIMITES.filasMinimas) {
    return `el PDF dio ${filas.length} filas (mínimo ${LIMITES.filasMinimas})`;
  }
  if (!forzar && totalPerfumes && (resultado.cambios.length / totalPerfumes) * 100 > LIMITES.maxCambiosPct) {
    return `cambian ${resultado.cambios.length} de ${totalPerfumes} precios (más del ${LIMITES.maxCambiosPct}%)`;
  }
  if ((resultado.nuevos.length / filas.length) * 100 > LIMITES.maxNuevosPct) {
    return `${resultado.nuevos.length} de ${filas.length} filas figuran como nuevas (más del ${LIMITES.maxNuevosPct}%): puede haber cambiado el formato de los nombres`;
  }
  return null;
}

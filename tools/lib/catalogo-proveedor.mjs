// Lectura del catálogo mayorista de Franzebi Imports y cruce con los perfumes
// de Firestore. Sin efectos secundarios: la escritura vive en bot-proveedor.mjs.
import './polyfills.mjs';
import { createHash } from 'node:crypto';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
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

/**
 * Núcleo de la lectura de filas. `items` son los textos de una página en orden de lectura, cada uno
 * `{ s, x, y }` (posición en puntos del PDF; solo hacen falta para emparejar fotos). Devuelve
 * `{ nombre, volumenML, precioUSD, genero, x, y }`: `y` es la altura del precio (el centro de la fila) y `x` el borde
 * izquierdo del nombre (las fotos de la tabla están a la izquierda de ese borde).
 */
export function filasDesdeItems(items) {
  const genero = generoDePagina(items.map((i) => i.s));
  const filas = [];
  let buf = [];
  for (const item of items) {
    const s = item.s.trim();
    if (!s) continue;
    const precio = s.match(/^(\d+(?:[.,]\d+)?)\s*USD/i);
    if (!precio) {
      buf.push({ ...item, s });
      continue;
    }
    const nombre = buf.map((b) => b.s).join(' ').replace(/\s+/g, ' ').replace(/^.*MODELO PRECIO\s+/i, '').trim();
    const volumen = nombre.match(/(\d+)\s?ML$/i);
    if (volumen) {
      // En la primera fila de la página el buffer trae el encabezado ("MODELO", "PRECIO"): el nombre empieza después.
      const desde = buf.findLastIndex((b) => /^PRECIO$/i.test(b.s)) + 1;
      const xs = buf.slice(desde).map((b) => b.x).filter(Number.isFinite);
      filas.push({
        nombre,
        volumenML: Number(volumen[1]),
        precioUSD: Number(precio[1].replace(',', '.')),
        genero,
        x: xs.length ? Math.min(...xs) : undefined,
        y: item.y,
      });
    }
    buf = [];
  }
  return filas;
}

/** Filas `{ nombre, volumenML, precioUSD, genero }` a partir del texto de una página (en orden de lectura). */
export function filasDesdeTextos(textos) {
  return filasDesdeItems(textos.map((s) => ({ s }))).map(({ x, y, ...fila }) => fila);
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
 * Empareja las fotos de UNA página con sus filas por POSICIÓN: la foto de cada producto está en la columna de la
 * izquierda, a la misma altura que su nombre y su precio. Es lo que hace una persona al mirar la tabla, y no
 * depende del orden de los objetos dentro del archivo ni de cuántas fotos trae el PDF en total (un producto
 * puede usar dos imágenes pegadas, y el proveedor agrega o saca filas al editar el catálogo).
 *
 *   filas: [{ x, y }]                       borde izquierdo del nombre y altura del precio (puntos del PDF)
 *   fotos: [{ id, x, y, w, h }]             esquina inferior izquierda y tamaño con que se dibuja cada imagen
 *   → [[foto, ...] | null, ...]             una entrada por fila; null = sin foto segura (queda oculta, como antes)
 *
 * Reglas, todas pensadas para NO poner una foto equivocada (publicar con la foto de otro perfume es peor que no tener foto):
 *  - la foto debe estar a la izquierda del nombre y su centro vertical dentro de la banda de la fila (la mitad de la
 *    distancia a la fila vecina, hasta 40 puntos);
 *  - se ignoran las imágenes chicas (logos, íconos);
 *  - varias piezas se aceptan solo si son contiguas (una al lado de la otra: un mismo dibujo partido en dos);
 *  - si una foto cae en dos filas, o hay varias piezas que no son contiguas, no se adivina: ninguna fila la recibe.
 */
export function emparejarPorPosicion(filas, fotos) {
  const TAMANO_MIN = 20; // puntos: lo que mide un logo o un ícono
  const GRANDES = fotos.filter((f) => f.w >= TAMANO_MIN && f.h >= TAMANO_MIN);
  const ys = filas.map((f) => f.y).sort((a, b) => a - b);
  const separacion = (fila) => {
    const vecinas = ys.filter((y) => y !== fila.y).map((y) => Math.abs(y - fila.y));
    return vecinas.length ? Math.min(...vecinas) : 66;
  };

  const candidatas = filas.map((fila) => {
    if (!Number.isFinite(fila.x) || !Number.isFinite(fila.y)) return [];
    const banda = Math.min(40, separacion(fila) / 2);
    return GRANDES.filter((f) => f.x + f.w <= fila.x + 6 && Math.abs(f.y + f.h / 2 - (fila.y + 3)) <= banda).sort((a, b) => a.x - b.x);
  });

  // Una foto que cae en dos filas es dudosa: no se le da a ninguna.
  const usos = new Map();
  candidatas.forEach((lista) => lista.forEach((f) => usos.set(f.id, (usos.get(f.id) ?? 0) + 1)));

  return candidatas.map((lista) => {
    if (!lista.length || lista.some((f) => usos.get(f.id) > 1)) return null;
    if (lista.length === 1) return lista;
    const contiguas = lista.every((f, i) => i === 0 || Math.abs(f.x - (lista[i - 1].x + lista[i - 1].w)) <= 4);
    return contiguas ? lista : null;
  });
}

/**
 * Empareja imágenes con filas por orden, pero solo si la cantidad coincide
 * exacto con la cantidad de filas: si el PDF trajo una cantidad distinta de
 * fotos que de productos, no hay forma confiable de saber cuál va con cuál,
 * así que no se asocia ninguna (quedan igual que antes, para carga manual).
 * Ya no la usa el bot (ver `leerFilasConFotos`); queda por compatibilidad y como respaldo.
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

const mul = (a, b) => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];

/** Fotos de una página con el lugar donde se dibujan: sigue la matriz de transformación del PDF (save/restore/transform). */
function fotosDePagina(operadores) {
  const pila = [];
  let m = [1, 0, 0, 1, 0, 0];
  const fotos = [];
  operadores.fnArray.forEach((fn, k) => {
    const a = operadores.argsArray[k];
    if (fn === OPS.save) pila.push(m);
    else if (fn === OPS.restore) m = pila.pop() ?? m;
    else if (fn === OPS.transform) m = mul(m, a);
    else if (fn === OPS.paintImageXObject) fotos.push({ id: a[0], x: m[4], y: m[5], w: Math.abs(m[0]), h: Math.abs(m[3]) });
  });
  return fotos;
}

/** pdfjs decodifica las imágenes en segundo plano (las compartidas viven en otra tabla): se espera a que esté lista. */
async function esperarImagen(pagina, id, ms = 3000) {
  const hasta = Date.now() + ms;
  for (;;) {
    if (pagina.objs.has(id)) return pagina.objs.get(id);
    if (pagina.commonObjs.has(id)) return pagina.commonObjs.get(id);
    if (Date.now() > hasta) return null;
    await new Promise((resolver) => setTimeout(resolver, 40));
  }
}

/** Píxeles de una imagen ya decodificada por pdfjs → sharp (null si no se puede leer). */
async function pixelesDeImagen(sharp, pagina, id) {
  const obj = await esperarImagen(pagina, id);
  if (!obj?.data || !obj.width || !obj.height) return null;
  const { width, height, data, kind } = obj;
  if (kind === 1) {
    // 1 bit por píxel (blanco y negro): se expande a 8 bits
    const salida = Buffer.alloc(width * height);
    const fila = Math.ceil(width / 8);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) salida[y * width + x] = data[y * fila + (x >> 3)] & (0x80 >> (x & 7)) ? 255 : 0;
    return sharp(salida, { raw: { width, height, channels: 1 } });
  }
  const canales = kind === 2 ? 3 : 4;
  return sharp(Buffer.from(data.buffer, data.byteOffset, data.length), { raw: { width, height, channels: canales } });
}

const MIN_PIXELES_FOTO = 80; // una foto de producto es mucho más grande: esto descarta restos y recortes minúsculos

/**
 * Lee el catálogo y devuelve las filas con su foto (`imagenBuffer`, JPEG) cuando se puede emparejar con seguridad por
 * posición en la página (ver `emparejarPorPosicion`). Las filas sin foto segura quedan sin `imagenBuffer`.
 * Reemplaza a `asociarImagenes(leerFilasDelPdf(...), extraerImagenesCrudas(...))`, que se rompía con cualquier
 * diferencia entre la cantidad de fotos y de filas.
 */
export async function leerFilasConFotos(buffer) {
  const { default: sharp } = await import('sharp');
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const resultado = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pagina = await pdf.getPage(n);
    const { items } = await pagina.getTextContent();
    const filas = filasDesdeItems(items.map((i) => ({ s: i.str, x: i.transform[4], y: i.transform[5] })));
    if (filas.length) {
      const fotos = fotosDePagina(await pagina.getOperatorList());
      const emparejadas = emparejarPorPosicion(filas, fotos);
      for (let k = 0; k < filas.length; k++) {
        const { x, y, ...fila } = filas[k];
        const piezas = emparejadas[k];
        let imagenBuffer;
        if (piezas) {
          try {
            imagenBuffer = await armarFoto(sharp, pagina, piezas);
          } catch {
            imagenBuffer = undefined; // sin foto antes que una foto rota
          }
        }
        resultado.push(imagenBuffer ? { ...fila, imagenBuffer } : fila);
      }
    }
    pagina.cleanup();
  }
  return resultado;
}

/** Una pieza = la foto; varias contiguas se pegan de izquierda a derecha. Aplana transparencias a blanco y guarda JPEG. */
async function armarFoto(sharp, pagina, piezas) {
  const imagenes = [];
  for (const pieza of piezas) {
    const im = await pixelesDeImagen(sharp, pagina, pieza.id);
    if (!im) return undefined;
    const png = await im.flatten({ background: '#ffffff' }).png().toBuffer();
    const { width, height } = await sharp(png).metadata();
    if (width < MIN_PIXELES_FOTO || height < MIN_PIXELES_FOTO) return undefined;
    imagenes.push({ png, width, height });
  }
  if (imagenes.length === 1) return sharp(imagenes[0].png).jpeg({ quality: 92 }).toBuffer();
  const alto = Math.max(...imagenes.map((i) => i.height));
  const ancho = imagenes.reduce((a, i) => a + i.width, 0);
  let izquierda = 0;
  return sharp({ create: { width: ancho, height: alto, channels: 3, background: '#ffffff' } })
    .composite(imagenes.map((i) => {
      const capa = { input: i.png, left: izquierda, top: Math.round((alto - i.height) / 2) };
      izquierda += i.width;
      return capa;
    }))
    .jpeg({ quality: 92 })
    .toBuffer();
}

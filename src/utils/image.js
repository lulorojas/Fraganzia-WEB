import locales from '../data/imagenes-locales.json';
import recortes from '../data/recortes.json';
import { hashTexto } from './hash';
import { VERSION_FOTOS } from './versionFotos';

// Hashes de las fotos que tools/localizar-imagenes.mjs ya descargó y optimizó.
const LOCALES = new Set(locales);
// Hashes con la foto recortada (sin fondo) que deja tools/recortar-fotos.mjs: se muestran sobre el escenario oscuro.
const RECORTADAS = new Set(recortes);

export const PLACEHOLDER_PERFUME = '/placeholder-perfume.svg';

/**
 * Fuentes para mostrar una foto de producto. Si hay copia local optimizada
 * (WebP a 400 y 800 px), usa esa con `srcSet` para que el navegador elija el
 * tamaño; si no (foto recién cargada desde el admin, todavía sin localizar),
 * usa la URL original.
 */
export function fuentesImagen(url) {
  if (!url) return { src: PLACEHOLDER_PERFUME };
  const hash = hashTexto(url);
  if (!LOCALES.has(hash)) return { src: url };
  return {
    src: `/img/p/${hash}-400.webp?v=${VERSION_FOTOS}`,
    srcSet: `/img/p/${hash}-400.webp?v=${VERSION_FOTOS} 400w, /img/p/${hash}-800.webp?v=${VERSION_FOTOS} 800w`,
  };
}

/** URL absoluta de la mejor versión de una foto (para Open Graph / JSON-LD). */
export function imagenGrande(url) {
  if (!url) return undefined;
  const hash = hashTexto(url);
  return LOCALES.has(hash) ? `/img/p/${hash}-800.webp?v=${VERSION_FOTOS}` : url;
}

// Los recortes de fondo quedaron en pausa (17/11/2026): en las cajas blancas sobre fondo blanco salen mal cortados, y cada perfume
// nuevo del bot necesitaría su recorte a mano. Las cards y la ficha usan la foto original en una ventana clara. Para retomarlos,
// poner esto en true (los archivos -cut.webp y src/data/recortes.json siguen en el repo).
const USAR_RECORTES = false;

/** Foto recortada (WebP con transparencia) para el escenario oscuro de las cards, o null si no se usan o todavía no hay. */
export function fuenteRecorte(url) {
  if (!USAR_RECORTES || !url) return null;
  const hash = hashTexto(url);
  return RECORTADAS.has(hash) ? `/img/p/${hash}-cut.webp` : null;
}

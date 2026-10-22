import locales from '../data/imagenes-locales.json';
import recortes from '../data/recortes.json';
import { hashTexto } from './hash';

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
    src: `/img/p/${hash}-400.webp`,
    srcSet: `/img/p/${hash}-400.webp 400w, /img/p/${hash}-800.webp 800w`,
  };
}

/** URL absoluta de la mejor versión de una foto (para Open Graph / JSON-LD). */
export function imagenGrande(url) {
  if (!url) return undefined;
  const hash = hashTexto(url);
  return LOCALES.has(hash) ? `/img/p/${hash}-800.webp` : url;
}

/** Foto recortada (WebP con transparencia) para el escenario oscuro de las cards, o null si todavía no hay. */
export function fuenteRecorte(url) {
  if (!url) return null;
  const hash = hashTexto(url);
  return RECORTADAS.has(hash) ? `/img/p/${hash}-cut.webp` : null;
}

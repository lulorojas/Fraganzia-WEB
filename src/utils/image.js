// Devuelve la ruta .webp equivalente para imágenes de producto locales
// (generadas por scripts/convert-images-webp.mjs). Para URLs externas
// (ej. imágenes subidas desde el admin a otro host) devuelve null,
// así el <picture> simplemente no agrega el <source webp>.
export function webpSrc(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.startsWith('/productos-18-09/')) return null;
  return url.replace(/\.(jpe?g|png)$/i, '.webp');
}

// Genera dist/sitemap.xml después de `vite build`: páginas fijas + una URL por
// perfume activo y disponible. Si no hay red o credenciales, escribe igual el
// sitemap con las páginas fijas: nunca rompe el build.
import { writeFileSync } from 'node:fs';
import { listarColeccion } from './lib/firestore-rest.mjs';

const SITE = 'https://fraganzia-e9b70.web.app';
const PAGINAS_FIJAS = ['/', '/catalogo', '/sobre-nosotros', '/contacto'];

let perfumes = [];
try {
  perfumes = (await listarColeccion('perfumes', { campos: ['activo', 'disponible', 'updatedAt'] })).filter(
    (p) => p.activo && p.disponible
  );
} catch (err) {
  console.warn(`sitemap: sin perfumes (${err.message}); solo páginas fijas`);
}

const url = (loc, lastmod) =>
  `  <url><loc>${SITE}${loc}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`;

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...PAGINAS_FIJAS.map((p) => url(p)),
  ...perfumes.map((p) => url(`/perfume/${p.id}`, p.updatedAt)),
  '</urlset>',
  '',
].join('\n');

writeFileSync('dist/sitemap.xml', xml);
console.log(`sitemap: ${PAGINAS_FIJAS.length + perfumes.length} URLs`);

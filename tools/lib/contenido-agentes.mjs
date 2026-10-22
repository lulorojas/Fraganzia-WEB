// Contenido pensado para agentes de IA y rastreadores que NO ejecutan JavaScript.
//
// Funciones puras (sin red ni archivos) para poder probarlas con `npm run test:bot`:
//   - preciosDe(p, dolarMedio, promociones)  precios en pesos por método, con promo
//   - htmlFicha(...)       bloque HTML semántico de una ficha (h1, descripción, notas, precios)
//   - jsonLdFicha(...)     Product con dos Offer (transferencia y efectivo) + BreadcrumbList
//   - jsonLdSitio(...)     Organization + WebSite con buscador
//   - jsonLdCatalogo(...)  ItemList del catálogo
//   - llmsTxt / llmsFull / catalogoJson   archivos de texto para modelos de lenguaje
//
// Los precios en pesos dependen del dólar del día: todo lo que se publica lo aclara.
import { preciosPorMetodo, getMejorPromo } from '../../src/utils/precios.js';

export const SITE = 'https://fraganzia-e9b70.web.app';
const NOMBRE = 'Fraganzia';
const INSTAGRAM = 'https://www.instagram.com/fraganzia.ar/';

export const escapar = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const miles = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
const lista = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
const redondear = (n) => Math.round(n / 1000) * 1000;

/** Precios en pesos de un perfume: base, con la mejor promoción aplicada, o null si no hay cotización/precio. */
export function preciosDe(p, dolarMedio, promociones = []) {
  let base = null;
  if (dolarMedio && p.precioUSD) base = preciosPorMetodo(p.precioUSD, dolarMedio);
  else if (p.precioTransferencia) base = { precioTransferencia: p.precioTransferencia, precioEfectivo: p.precioEfectivo ?? null };
  if (!base) return null;
  const promo = getMejorPromo(p.id, promociones);
  const pct = promo?.descuentoPorcentaje ?? 0;
  const aplicar = (n) => (n == null ? null : pct ? redondear(n * (1 - pct / 100)) : n);
  return {
    transferencia: aplicar(base.precioTransferencia),
    efectivo: aplicar(base.precioEfectivo),
    antesTransferencia: pct ? base.precioTransferencia : null,
    antesEfectivo: pct && base.precioEfectivo != null ? base.precioEfectivo : null,
    descuento: pct,
    promocion: promo?.titulo ?? null,
  };
}

const URL_FICHA = (p) => `${SITE}/perfume/${p.id}`;
const URL_MARCA = (marca) => `${SITE}/catalogo?marca=${encodeURIComponent(marca)}`;

function resumenCorto(p) {
  return [p.marca, p.genero, p.familiaOlfativa && `familia ${p.familiaOlfativa}`, p.volumenML && `${p.volumenML} ml`]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Bloque semántico con TODO lo que un agente necesita de una ficha. Va fuera de
 * `#root` (la app lo quita al montar) y fuera de pantalla, para no duplicar nada
 * a quien ve la página.
 */
export function htmlFicha(p, precios) {
  const salida = lista(p.notasSalida);
  const corazon = lista(p.notasCorazon);
  const fondo = lista(p.notasFondo);
  const hayNotas = salida.length || corazon.length || fondo.length;
  const linea = (titulo, notas) => (notas.length ? `<li>${titulo}: ${escapar(notas.join(', '))}</li>` : '');

  return [
    '<div id="contenido-estatico" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden">',
    `<article>`,
    `<nav aria-label="Ruta"><a href="${SITE}/">Inicio</a> › <a href="${SITE}/catalogo">Catálogo</a> › <a href="${escapar(URL_MARCA(p.marca))}">${escapar(p.marca)}</a></nav>`,
    `<h1>${escapar(p.nombre)}</h1>`,
    `<p>${escapar(resumenCorto(p))}. Perfume árabe original vendido por ${NOMBRE}.</p>`,
    p.descripcion ? `<p>${escapar(p.descripcion)}</p>` : '',
    hayNotas
      ? `<h2>Pirámide olfativa</h2><ul>${linea('Notas de salida', salida)}${linea('Notas de corazón', corazon)}${linea('Notas de fondo', fondo)}</ul>`
      : '',
    precios
      ? `<h2>Precio</h2><ul><li>Transferencia: ${miles(precios.transferencia)}${precios.antesTransferencia ? ` (antes ${miles(precios.antesTransferencia)})` : ''}</li>${precios.efectivo != null ? `<li>Efectivo: ${miles(precios.efectivo)}${precios.antesEfectivo ? ` (antes ${miles(precios.antesEfectivo)})` : ''}</li>` : ''}</ul><p>Precios en pesos argentinos, calculados con el dólar del día. ${precios.descuento ? `Promoción vigente: ${precios.descuento}% de descuento.` : ''}</p>`
      : `<h2>Precio</h2><p>Precio a consultar por WhatsApp.</p>`,
    `<h2>Cómo comprar</h2><p>Agregá el perfume al carrito, confirmá el pedido con tu nombre y envialo por WhatsApp para coordinar el pago (transferencia o efectivo) y la entrega. Envíos solo al AMBA.</p>`,
    `<p><a href="${escapar(URL_MARCA(p.marca))}">Más perfumes de ${escapar(p.marca)}</a> · <a href="${SITE}/catalogo">Ver todo el catálogo</a></p>`,
    '</article>',
    '</div>',
  ]
    .filter(Boolean)
    .join('');
}

/** @graph con el Product (dos ofertas) y el BreadcrumbList de una ficha. */
export function jsonLdFicha(p, precios, imagen) {
  const url = URL_FICHA(p);
  const oferta = (nombre, precio, metodo) => ({
    '@type': 'Offer',
    name: nombre,
    url,
    priceCurrency: 'ARS',
    price: precio,
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    acceptedPaymentMethod: metodo,
    seller: { '@type': 'Organization', name: NOMBRE },
  });
  const propiedades = [
    p.familiaOlfativa && { '@type': 'PropertyValue', name: 'Familia olfativa', value: p.familiaOlfativa },
    p.volumenML && { '@type': 'PropertyValue', name: 'Volumen', value: `${p.volumenML} ml` },
    lista(p.notasSalida).length && { '@type': 'PropertyValue', name: 'Notas de salida', value: lista(p.notasSalida).join(', ') },
    lista(p.notasCorazon).length && { '@type': 'PropertyValue', name: 'Notas de corazón', value: lista(p.notasCorazon).join(', ') },
    lista(p.notasFondo).length && { '@type': 'PropertyValue', name: 'Notas de fondo', value: lista(p.notasFondo).join(', ') },
  ].filter(Boolean);

  const ofertas = precios
    ? [
        oferta('Pago por transferencia', precios.transferencia, 'https://purl.org/goodrelations/v1#ByBankTransferInAdvance'),
        precios.efectivo != null && oferta('Pago en efectivo', precios.efectivo, 'https://purl.org/goodrelations/v1#Cash'),
      ].filter(Boolean)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${url}#producto`,
        name: p.nombre,
        url,
        brand: { '@type': 'Brand', name: p.marca },
        image: imagen,
        description: p.descripcion || `${p.nombre} de ${p.marca}, perfume árabe original.`,
        category: 'Perfumes',
        audience: p.genero ? { '@type': 'PeopleAudience', suggestedGender: p.genero } : undefined,
        additionalProperty: propiedades.length ? propiedades : undefined,
        offers: ofertas,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITE}/catalogo` },
          { '@type': 'ListItem', position: 3, name: p.marca, item: URL_MARCA(p.marca) },
          { '@type': 'ListItem', position: 4, name: p.nombre, item: url },
        ],
      },
    ],
  };
}

/** Organización + sitio con buscador (la búsqueda del catálogo acepta ?buscar=). */
export function jsonLdSitio() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organizacion`,
        name: NOMBRE,
        url: `${SITE}/`,
        logo: `${SITE}/icon-512.png`,
        sameAs: [INSTAGRAM],
        areaServed: 'Área Metropolitana de Buenos Aires, Argentina',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#sitio`,
        name: NOMBRE,
        url: `${SITE}/`,
        inLanguage: 'es-AR',
        publisher: { '@id': `${SITE}/#organizacion` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/catalogo?buscar={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/** Lista de los primeros perfumes del catálogo (el catálogo completo está en /catalogo.json). */
export function jsonLdCatalogo(perfumes, max = 60) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo de perfumes árabes',
    numberOfItems: perfumes.length,
    itemListElement: perfumes.slice(0, max).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: URL_FICHA(p),
      name: p.nombre,
    })),
  };
}

const fechaDe = (generadoEn) => String(generadoEn ?? '').slice(0, 10);

/** /llms.txt: resumen corto para modelos de lenguaje (formato llmstxt.org). */
export function llmsTxt({ cantidad, marcas, generadoEn, dolarMedio }) {
  return [
    `# ${NOMBRE}`,
    '',
    `> Tienda argentina de perfumes árabes originales (Lattafa, Armaf, Al Haramain, Afnan y más) con precios en pesos, pago por transferencia o efectivo y envíos solo al AMBA. Catálogo actual: ${cantidad} perfumes de ${marcas} marcas.`,
    '',
    `Los precios en pesos se calculan con el dólar del día${dolarMedio ? ` (referencia al ${fechaDe(generadoEn)}: dólar medio $${Math.round(dolarMedio)})` : ''}: tomalos como referencia y confirmá el valor vigente en la página de cada perfume. Cada perfume tiene dos precios: Transferencia (base) y Efectivo (más bajo).`,
    '',
    '## Cómo comprar',
    '',
    '- Se elige el perfume, se agrega al carrito y se confirma el pedido solo con el nombre (sin cuenta).',
    '- El pedido se envía por WhatsApp para coordinar el pago (transferencia o efectivo) y la entrega.',
    '- Envíos solo al AMBA. El cliente puede seguir su pedido con un link.',
    '',
    '## Páginas principales',
    '',
    `- [Catálogo](${SITE}/catalogo): todos los perfumes, con filtros por género, marca, aroma y precio.`,
    `- [Decants](${SITE}/decants): porciones de 3, 5 y 10 ml para probar antes de comprar el frasco.`,
    `- [Nosotros](${SITE}/sobre-nosotros): quiénes somos.`,
    `- [Contacto](${SITE}/contacto): WhatsApp e Instagram.`,
    '',
    '## Datos para agentes',
    '',
    `- [Catálogo completo en texto](${SITE}/llms-full.txt): una línea por perfume con marca, género, familia, notas y precios.`,
    `- [Catálogo en JSON](${SITE}/catalogo.json): los mismos datos, estructurados.`,
    `- [Mapa del sitio](${SITE}/sitemap.xml)`,
    '',
    '## Filtros por link',
    '',
    `- Por género: ${SITE}/catalogo?genero=Masculino | Femenino | Unisex | Kids`,
    `- Por marca: ${SITE}/catalogo?marca=Lattafa`,
    `- Por aroma: ${SITE}/catalogo?familia=Oriental`,
    `- Búsqueda: ${SITE}/catalogo?buscar=yara`,
    '',
  ].join('\n');
}

/** /llms-full.txt: una entrada por perfume. */
export function llmsFull(perfumes, { dolarMedio, promociones, generadoEn }) {
  const entradas = perfumes.map((p) => {
    const precios = preciosDe(p, dolarMedio, promociones);
    const notas = [
      lista(p.notasSalida).length && `salida: ${lista(p.notasSalida).join(', ')}`,
      lista(p.notasCorazon).length && `corazón: ${lista(p.notasCorazon).join(', ')}`,
      lista(p.notasFondo).length && `fondo: ${lista(p.notasFondo).join(', ')}`,
    ].filter(Boolean);
    const precio = precios
      ? `Transferencia ${miles(precios.transferencia)}${precios.efectivo != null ? ` · Efectivo ${miles(precios.efectivo)}` : ''}${precios.descuento ? ` (${precios.descuento}% off)` : ''}`
      : 'precio a consultar';
    return [
      `### [${p.nombre}](${URL_FICHA(p)})`,
      `${resumenCorto(p)}. ${precio}.`,
      notas.length ? `Notas — ${notas.join('; ')}.` : '',
      p.descripcion ? p.descripcion.replace(/\s+/g, ' ').trim() : '',
    ]
      .filter(Boolean)
      .concat('')
      .join('\n');
  });
  return [
    `# ${NOMBRE} — catálogo completo`,
    '',
    `> ${perfumes.length} perfumes árabes originales. Precios en pesos argentinos al ${fechaDe(generadoEn)}, calculados con el dólar del día${dolarMedio ? ` (medio $${Math.round(dolarMedio)})` : ''}; pueden haber cambiado. Envíos solo al AMBA.`,
    '',
    ...entradas,
  ].join('\n');
}

/** /catalogo.json: los datos esenciales de cada perfume. */
export function catalogoJson(perfumes, { dolarMedio, promociones, generadoEn }) {
  return {
    sitio: NOMBRE,
    url: `${SITE}/`,
    generadoEn,
    moneda: 'ARS',
    aviso: 'Los precios en pesos dependen del dólar del día; confirmá el valor vigente en la página de cada perfume.',
    envios: 'Solo AMBA',
    perfumes: perfumes.map((p) => {
      const precios = preciosDe(p, dolarMedio, promociones);
      return {
        nombre: p.nombre,
        marca: p.marca,
        genero: p.genero ?? null,
        familiaOlfativa: p.familiaOlfativa ?? null,
        volumenML: p.volumenML ?? null,
        url: URL_FICHA(p),
        precioTransferencia: precios?.transferencia ?? null,
        precioEfectivo: precios?.efectivo ?? null,
        descuentoPorcentaje: precios?.descuento || null,
        notasSalida: lista(p.notasSalida),
        notasCorazon: lista(p.notasCorazon),
        notasFondo: lista(p.notasFondo),
        descripcion: p.descripcion ?? null,
      };
    }),
  };
}

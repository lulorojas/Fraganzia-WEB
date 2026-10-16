import { useEffect } from 'react';

export const SITE_URL = 'https://fraganzia-e9b70.web.app';
const SITE_NAME = 'Fraganzia';
const DEFAULT_TITLE = 'Fraganzia | Perfumes árabes originales en Argentina';
const DEFAULT_DESCRIPTION =
  'Perfumes árabes originales de Lattafa, Armaf, Al Haramain y más. Precios en pesos actualizados, pago por transferencia o efectivo y envíos en AMBA.';

function setMeta(selector, attr, key, content) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Título, descripción, canonical, Open Graph y (opcional) JSON-LD por página.
 * Sin dependencias: toca directamente las etiquetas de <head> que ya trae
 * index.html. Google renderiza JS, así que ve estos valores por ruta.
 */
export function useDocumentMeta({ title, description, path, image, jsonLd } = {}) {
  const jsonLdTexto = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const titulo = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;

    document.title = titulo;
    setMeta('meta[name="description"]', 'name', 'description', desc);
    setMeta('meta[property="og:title"]', 'property', 'og:title', titulo);
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image || `${SITE_URL}/icon-512.png`);
    setCanonical(url);

    let script;
    if (jsonLdTexto) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = jsonLdTexto;
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, path, image, jsonLdTexto]);
}

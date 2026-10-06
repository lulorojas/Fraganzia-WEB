import { preciosPorMetodo } from './precios.js';

/** Precio por transferencia en pesos: en vivo si hay cotización, si no el guardado. */
export function precioTransferencia(perfume, dolarMedio) {
  if (dolarMedio && perfume.precioUSD) return preciosPorMetodo(perfume.precioUSD, dolarMedio).precioTransferencia;
  return perfume.precioTransferencia ?? null;
}

const redondearMiles = (n) => Math.round(n / 1000) * 1000;

/**
 * Tres bandas de precio calculadas sobre el catálogo actual (tercios): no quedan
 * desactualizadas con el dólar. [] si hay muy pocos perfumes con precio.
 */
export function bandasDePrecio(perfumes, dolarMedio) {
  const precios = (perfumes ?? [])
    .map((p) => precioTransferencia(p, dolarMedio))
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

export const ORDENES = [
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'nombre', label: 'Nombre A–Z' },
];

/** Aplica la banda de precio y el orden elegidos; sin ninguno devuelve la lista tal cual (más nuevos primero). */
export function aplicarOrdenYPrecio(perfumes, { orden, precio }, dolarMedio, bandas) {
  if (!perfumes || (!orden && !precio)) return perfumes;
  const banda = bandas.find((b) => b.id === precio);
  let lista = perfumes;
  if (banda) {
    lista = lista.filter((p) => {
      const valor = precioTransferencia(p, dolarMedio);
      return valor != null && valor >= banda.min && valor < banda.max;
    });
  }
  const precioDe = (p, sinPrecio) => precioTransferencia(p, dolarMedio) ?? sinPrecio;
  // Los perfumes sin precio quedan siempre al final.
  if (orden === 'precio-asc') return [...lista].sort((a, b) => precioDe(a, Infinity) - precioDe(b, Infinity));
  if (orden === 'precio-desc') return [...lista].sort((a, b) => precioDe(b, -Infinity) - precioDe(a, -Infinity));
  if (orden === 'nombre') return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return lista;
}

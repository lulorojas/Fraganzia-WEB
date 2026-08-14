export function valorDolarMedio(dolar) {
  return (dolar.compra + dolar.venta) / 2;
}

export function usdAArs(precioUSD, dolarMedio) {
  return precioUSD * dolarMedio;
}

function redondearMiles(n) {
  return Math.round(n / 1000) * 1000;
}

export function preciosPorMetodo(precioUSD, dolarMedio) {
  const precioBase = usdAArs(precioUSD, dolarMedio);
  return {
    precioTransferencia: redondearMiles(precioBase * 1.40),
    precioEfectivo: redondearMiles(precioBase * 1.35),
  };
}

/**
 * Devuelve la mejor promoción aplicable para un perfume dado.
 * - Si perfumeIds es vacío/null → aplica a TODOS los perfumes.
 * - Si perfumeIds tiene valores → solo aplica a esos IDs.
 * - Entre varias promos aplicables, devuelve la de mayor descuento.
 */
export function getMejorPromo(perfumeId, promociones) {
  if (!promociones?.length) return null;
  const aplicables = promociones.filter((p) => {
    if (!p.descuentoPorcentaje || p.descuentoPorcentaje <= 0) return false;
    if (!p.perfumeIds || p.perfumeIds.length === 0) return true;
    return p.perfumeIds.includes(perfumeId);
  });
  if (!aplicables.length) return null;
  return aplicables.reduce((best, p) =>
    p.descuentoPorcentaje > best.descuentoPorcentaje ? p : best
  );
}

/**
 * Calcula el total con promo 2x1: por cada 2 unidades, la más barata es gratis.
 * Items pueden tener precioARS (ya calculado) o precioUSD (usa esEfectivo + dolarMedio).
 */
export function calcularTotal2x1(items, esEfectivo, dolarMedio) {
  const units = [];
  for (const item of items) {
    const precio = item.precioARS != null
      ? item.precioARS
      : (esEfectivo
          ? preciosPorMetodo(item.precioUSD, dolarMedio).precioEfectivo
          : preciosPorMetodo(item.precioUSD, dolarMedio).precioTransferencia);
    for (let i = 0; i < item.cantidad; i++) units.push(precio);
  }
  units.sort((a, b) => b - a);
  let total = 0;
  for (let i = 0; i < units.length; i++) {
    if (i % 2 === 0) total += units[i];
  }
  return Math.round(total / 1000) * 1000;
}

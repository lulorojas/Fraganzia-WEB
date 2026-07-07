export function valorDolarMedio(dolar) {
  return (dolar.compra + dolar.venta) / 2;
}

export function usdAArs(precioUSD, dolarMedio) {
  return precioUSD * dolarMedio;
}

export function preciosPorMetodo(precioUSD, dolarMedio) {
  const precioARS = usdAArs(precioUSD, dolarMedio);
  return {
    precioTransferencia: precioARS,
    precioEfectivo: precioARS * 0.95,
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

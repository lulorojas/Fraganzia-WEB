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

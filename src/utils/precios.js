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
    return aplicaAPerfume(p, perfumeId);
  });
  if (!aplicables.length) return null;
  return aplicables.reduce((best, p) =>
    p.descuentoPorcentaje > best.descuentoPorcentaje ? p : best
  );
}

export function aplicaAPerfume(promo, perfumeId) {
  return !promo.perfumeIds?.length || promo.perfumeIds.includes(perfumeId);
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
  return Math.round(costo2x1(units) / 1000) * 1000;
}

// Por cada 2 unidades, la más barata es gratis.
function costo2x1(units) {
  const ordenadas = [...units].sort((a, b) => b - a);
  let total = 0;
  for (let i = 0; i < ordenadas.length; i += 2) total += ordenadas[i];
  return total;
}

/**
 * Subtotal, descuentos y total del carrito, aplicando cada promoción solo a los
 * perfumes que alcanza (`perfumeIds` vacío = todos).
 * - 2×1: se arma con las unidades que entran en la promo (mínimo 2).
 * - Descuento %: cada perfume recibe el mejor % que le corresponde.
 * `lineas` detalla cuánto descuenta cada promo y suma exactamente `descuentoARS`.
 */
export function calcularCarritoConPromos(items, promociones, esEfectivo, dolarMedio) {
  const itemsConPrecio = items.map((item) => {
    const { precioTransferencia, precioEfectivo } = preciosPorMetodo(item.precioUSD, dolarMedio);
    return { ...item, precioARS: esEfectivo ? precioEfectivo : precioTransferencia };
  });
  const subtotalARS = itemsConPrecio.reduce((acc, i) => acc + i.precioARS * i.cantidad, 0);

  const promo2x1 = promociones?.find((p) => p.tipo === '2x1') ?? null;
  const del2x1 = promo2x1 ? itemsConPrecio.filter((i) => aplicaAPerfume(promo2x1, i.perfumeId)) : [];
  const unidades2x1 = del2x1.reduce((acc, i) => acc + i.cantidad, 0);
  const usa2x1 = unidades2x1 >= 2;

  const porcentuales = promociones?.filter((p) => p.tipo !== '2x1') ?? [];
  const descuentos = new Map();
  let descuentoTotal = 0;

  if (usa2x1) {
    const units = del2x1.flatMap((i) => Array(i.cantidad).fill(i.precioARS));
    const ahorro = units.reduce((a, b) => a + b, 0) - costo2x1(units);
    descuentos.set(promo2x1.id ?? '2x1', { nombre: promo2x1.titulo, tipo: '2x1', monto: ahorro });
    descuentoTotal += ahorro;
  }

  for (const item of itemsConPrecio) {
    if (usa2x1 && aplicaAPerfume(promo2x1, item.perfumeId)) continue;
    const promo = getMejorPromo(item.perfumeId, porcentuales);
    if (!promo) continue;
    const ahorro = (item.precioARS * item.cantidad * promo.descuentoPorcentaje) / 100;
    const clave = promo.id ?? promo.titulo;
    const previo = descuentos.get(clave);
    descuentos.set(clave, {
      nombre: promo.titulo,
      tipo: 'descuento',
      pct: promo.descuentoPorcentaje,
      monto: (previo?.monto ?? 0) + ahorro,
    });
    descuentoTotal += ahorro;
  }

  const totalARS = Math.round((subtotalARS - descuentoTotal) / 1000) * 1000;
  const descuentoARS = subtotalARS - totalARS;

  const lineas = [...descuentos.values()].map((l) => ({ ...l, monto: Math.round(l.monto) }));
  if (lineas.length) {
    const resto = descuentoARS - lineas.reduce((acc, l) => acc + l.monto, 0);
    lineas[lineas.length - 1].monto += resto;
  }

  return { itemsConPrecio, subtotalARS, totalARS, descuentoARS, lineas };
}

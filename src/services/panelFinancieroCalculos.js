import { SOCIOS } from '../constants';
import { usdAArs } from '../utils/precios';

/**
 * Funciones puras de cálculo del panel financiero. Reciben los movimientos ya
 * leídos de Firestore (filtrados `anulado != true` por `movimientosService`) y
 * devuelven totales — nunca leen ni escriben Firestore, nunca guardan estado
 * propio. Se recalculan desde cero cada vez que se llaman, por eso nunca hay
 * drift al editar un movimiento pasado (ver research.md, Decisión 2).
 *
 * Convención de "quién tiene la plata": el socio que vendió/pagó una
 * operación es quien físicamente recibió o entregó el dinero — su total
 * individual (efectivo/Mercado Pago) refleja eso. El desbalance de propiedad
 * 50/50 que eso genera con el otro socio se acumula aparte, en el saldo neto.
 */

const OTRO_SOCIO = { luciano: 'benja', benja: 'luciano' };

/**
 * Una compra puede pagarla un socio solo o repartirse entre los dos. La forma
 * canónica es `pagos: [{ socioId, monto, metodo }]`.
 *
 * Las compras cargadas antes de habilitar el reparto guardan un único pagador
 * en `pagadoPor`/`metodoPago` por el total: se leen como un pago único, así los
 * totales históricos no cambian al desplegar esto.
 */
export function pagosDeCompra(compra = {}) {
  if (Array.isArray(compra.pagos) && compra.pagos.length > 0) return compra.pagos;
  if (compra.pagadoPor) {
    return [{ socioId: compra.pagadoPor, monto: compra.montoTotal ?? 0, metodo: compra.metodoPago }];
  }
  return [];
}

export function totalDeCompra(compra = {}) {
  if (compra.montoTotal != null) return compra.montoTotal;
  return pagosDeCompra(compra).reduce((acc, p) => acc + (p.monto ?? 0), 0);
}

function totalesVacios() {
  return SOCIOS.reduce((acc, s) => {
    acc[s.id] = { efectivo: 0, mercadopago: 0 };
    return acc;
  }, {});
}

export function calcularTotalesPorSocio({
  movimientosPersonales = [],
  ventasSocios = [],
  ventasDecants = [],
  compras = [],
  gastos = [],
  transferenciasSocios = [],
}) {
  const totales = totalesVacios();

  const sumar = (socioId, metodo, monto) => {
    if (!totales[socioId] || !metodo) return;
    totales[socioId][metodo] = (totales[socioId][metodo] || 0) + monto;
  };

  movimientosPersonales.forEach((m) => {
    sumar(m.socioId, m.metodo, m.tipo === 'aporte' ? m.monto : -m.monto);
  });

  ventasSocios
    .filter((v) => v.estado === 'cobrada')
    .forEach((v) => sumar(v.vendidoPor, v.metodoPago, v.cantidad * v.precioUnitario));

  ventasDecants.forEach((v) => sumar(v.vendidoPor, v.metodoPago, v.cantidad * v.precioUnitario));

  gastos.forEach((g) => sumar(g.pagadoPor, g.metodoPago, -g.monto));

  // Cada socio descuenta de su plata lo que efectivamente puso, que con reparto
  // no es necesariamente el total de la compra.
  compras.forEach((c) => {
    pagosDeCompra(c).forEach((p) => sumar(p.socioId, p.metodo, -(p.monto ?? 0)));
  });

  // La transferencia mueve plata real de un socio al otro: quien la hace deja
  // de tenerla y quien la recibe pasa a tenerla. Sin esto la deuda se salda en
  // el saldo neto pero la plata nunca aparece en el bolsillo de quien cobró.
  transferenciasSocios.forEach((t) => {
    sumar(t.de, t.metodo, -(t.monto ?? 0));
    sumar(t.a, t.metodo, t.monto ?? 0);
  });

  return Object.fromEntries(
    Object.entries(totales).map(([socioId, t]) => [
      socioId,
      { ...t, total: t.efectivo + t.mercadopago },
    ])
  );
}

// Positivo = 'benja' le debe a 'luciano'; negativo = 'luciano' le debe a 'benja'.
export function calcularSaldoNeto({
  ventasSocios = [],
  ventasDecants = [],
  compras = [],
  gastos = [],
  transferenciasSocios = [],
}) {
  let saldo = 0;
  const signo = (socioId) => (socioId === 'luciano' ? 1 : -1);

  // Quien vende retiene la plata del cliente: es deudor de la mitad ajena
  // (signo invertido respecto de gastos/compras, donde quien paga es acreedor).
  ventasSocios
    .filter((v) => v.estado === 'cobrada')
    .forEach((v) => {
      saldo -= signo(v.vendidoPor) * ((v.cantidad * v.precioUnitario) / 2);
    });

  ventasDecants.forEach((v) => {
    saldo -= signo(v.vendidoPor) * ((v.cantidad * v.precioUnitario) / 2);
  });

  gastos.forEach((g) => {
    saldo += signo(g.pagadoPor) * (g.monto / 2);
  });

  // Una compra puede pagarla uno solo o repartirse. El desbalance es cuánto
  // puso un socio por encima de la mitad que le tocaba.
  //
  // Se mide sobre un solo socio (Luciano) a propósito: lo que él puso de más
  // es exactamente lo que el otro puso de menos, así que sumar los dos lados
  // contaría la deuda dos veces.
  compras.forEach((c) => {
    const total = totalDeCompra(c);
    const pagoLuciano = pagosDeCompra(c)
      .filter((p) => p.socioId === 'luciano')
      .reduce((acc, p) => acc + (p.monto ?? 0), 0);
    saldo += pagoLuciano - total / 2;
  });

  transferenciasSocios.forEach((t) => {
    saldo += signo(t.de) * t.monto;
  });

  return saldo;
}

/**
 * Stock = comprado − vendido, por producto. Nunca es negativo: si se vendió
 * más de lo comprado (venta cargada sin su compra previa), el piso es 0 —
 * "no queda nada", que es lo que representa el mundo real. Solo aparecen
 * productos que efectivamente se compraron alguna vez.
 */
export function calcularStockPorProducto(compras = [], ventasSocios = []) {
  const stock = {};
  compras.forEach((c) => {
    (c.items || []).forEach((item) => {
      stock[item.perfumeId] = (stock[item.perfumeId] || 0) + item.cantidad;
    });
  });
  ventasSocios
    .filter((v) => v.estado === 'cobrada')
    .forEach((v) => {
      if (stock[v.perfumeId] === undefined) return;
      stock[v.perfumeId] -= v.cantidad;
    });
  return Object.fromEntries(
    Object.entries(stock).map(([perfumeId, cantidad]) => [perfumeId, Math.max(0, cantidad)])
  );
}

/**
 * Cuánto entraría si se vendiera todo el stock actual: el stock valorizado a
 * PRECIO DE VENTA (no a costo). Usa el precio de catálogo del perfume
 * (`precioUSD` convertido con el dólar del momento), que es el precio de lista
 * por transferencia; si se cobra en efectivo entra un 5% menos.
 *
 * Como toda venta se reparte 50/50, a cada socio le corresponde la mitad.
 *
 * Sin cotización de dólar no se puede valorizar: devuelve `sinCotizacion` para
 * que la UI lo diga en vez de mostrar $0, que se leería como "no queda nada".
 */
export function calcularPorCobrarStock(stockPorProducto = {}, perfumes = [], dolarMedio = null) {
  const porProducto = {};
  if (!dolarMedio) {
    return { total: 0, porSocio: {}, porProducto, sinCotizacion: true, sinPrecio: [] };
  }

  const precioUSDDe = new Map((perfumes ?? []).map((p) => [p.id, p.precioUSD]));
  const sinPrecio = [];
  let total = 0;

  Object.entries(stockPorProducto).forEach(([perfumeId, cantidad]) => {
    if (cantidad <= 0) return;
    const precioUSD = precioUSDDe.get(perfumeId);
    // Perfume borrado del catálogo o sin precio: se cuenta aparte en vez de
    // valorizarlo en 0 y ensuciar el total por lo bajo sin avisar.
    if (!precioUSD) {
      sinPrecio.push(perfumeId);
      return;
    }
    const monto = cantidad * usdAArs(precioUSD, dolarMedio);
    porProducto[perfumeId] = monto;
    total += monto;
  });

  const mitad = total / 2;
  const porSocio = SOCIOS.reduce((acc, s) => {
    acc[s.id] = mitad;
    return acc;
  }, {});

  return { total, porSocio, porProducto, sinCotizacion: false, sinPrecio };
}

function mesDe(fecha) {
  const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function porFechaAsc(a, b) {
  const fa = a.fecha?.toDate ? a.fecha.toDate().getTime() : new Date(a.fecha).getTime();
  const fb = b.fecha?.toDate ? b.fecha.toDate().getTime() : new Date(b.fecha).getTime();
  return (fa || 0) - (fb || 0);
}

/**
 * Atribuye cada venta de perfume a la compra de la que salió esa unidad,
 * usando FIFO: se vende primero lo que se compró primero, que es como se mueve
 * el stock real.
 *
 * Esto permite medir la ganancia POR COMPRA sin saber cuánto costó cada perfume
 * por separado — que es un dato que el sistema no guarda. Se compara lo que
 * costó el lote entero contra lo que se vendió de ese lote.
 *
 * El costo por unidad dentro de una compra se reparte en partes iguales. Es
 * exacto cuando el lote se vende completo (el caso que importa para la ganancia
 * final) y una aproximación mientras se vende de a poco.
 *
 * Las unidades vendidas sin una compra que las respalde (stock previo al
 * sistema, o carga incompleta) se devuelven aparte en vez de contarse con costo
 * cero, que inflaría la ganancia sin avisar.
 */
export function asignarVentasACompras(compras = [], ventasSocios = []) {
  const lotesPorPerfume = {};
  const porCompra = {};

  [...compras].sort(porFechaAsc).forEach((c) => {
    const unidades = (c.items ?? []).reduce((acc, i) => acc + (i.cantidad ?? 0), 0);
    const montoTotal = totalDeCompra(c);
    porCompra[c.id] = {
      compraId: c.id,
      proveedor: c.proveedor,
      fecha: c.fecha,
      montoTotal,
      unidades,
      costoUnitario: unidades ? montoTotal / unidades : 0,
      unidadesVendidas: 0,
      ingresoAtribuido: 0,
    };
    (c.items ?? []).forEach((i) => {
      lotesPorPerfume[i.perfumeId] = lotesPorPerfume[i.perfumeId] ?? [];
      lotesPorPerfume[i.perfumeId].push({ compraId: c.id, restante: i.cantidad ?? 0 });
    });
  });

  const porVenta = [];
  let unidadesSinCosto = 0;
  let ingresoSinCosto = 0;

  [...ventasSocios]
    .filter((v) => v.estado === 'cobrada')
    .sort(porFechaAsc)
    .forEach((v) => {
      const precio = v.precioUnitario ?? 0;
      let porAsignar = v.cantidad ?? 0;
      let costo = 0;

      (lotesPorPerfume[v.perfumeId] ?? []).forEach((lote) => {
        if (porAsignar <= 0 || lote.restante <= 0) return;
        const toma = Math.min(lote.restante, porAsignar);
        lote.restante -= toma;
        porAsignar -= toma;
        costo += toma * porCompra[lote.compraId].costoUnitario;
        porCompra[lote.compraId].unidadesVendidas += toma;
        porCompra[lote.compraId].ingresoAtribuido += toma * precio;
      });

      if (porAsignar > 0) {
        unidadesSinCosto += porAsignar;
        ingresoSinCosto += porAsignar * precio;
      }

      porVenta.push({
        mes: mesDe(v.fecha),
        ingreso: (v.cantidad ?? 0) * precio,
        costo,
        unidadesSinCosto: porAsignar,
      });
    });

  return { porCompra: Object.values(porCompra), porVenta, unidadesSinCosto, ingresoSinCosto };
}

/**
 * Ganancia de cada compra: cuánto entró por vender ese lote contra lo que costó
 * la parte del lote ya vendida. `recuperadoPct` dice cuánto de lo que se pagó
 * por la compra ya volvió en ventas.
 */
export function calcularGananciaPorCompra(compras = [], ventasSocios = []) {
  const { porCompra, unidadesSinCosto, ingresoSinCosto } = asignarVentasACompras(compras, ventasSocios);

  const detalle = porCompra
    .map((c) => {
      const costoVendido = c.unidadesVendidas * c.costoUnitario;
      const ganancia = c.ingresoAtribuido - costoVendido;
      return {
        ...c,
        costoVendido,
        ganancia,
        // Margen sobre la venta: de cada $100 que entraron, cuánto es ganancia.
        margenPct: c.ingresoAtribuido > 0 ? (ganancia / c.ingresoAtribuido) * 100 : null,
        recuperadoPct: c.montoTotal > 0 ? (c.ingresoAtribuido / c.montoTotal) * 100 : 0,
        vendidoTodo: c.unidades > 0 && c.unidadesVendidas >= c.unidades,
      };
    })
    .sort(porFechaAsc);

  const ingresoTotal = detalle.reduce((acc, c) => acc + c.ingresoAtribuido, 0);
  const gananciaTotal = detalle.reduce((acc, c) => acc + c.ganancia, 0);

  return {
    detalle,
    ingresoTotal,
    gananciaTotal,
    // Promedio ponderado por facturación, no promedio simple de porcentajes:
    // una compra grande pesa más que una chica, que es lo que corresponde.
    margenPromedioPct: ingresoTotal > 0 ? (gananciaTotal / ingresoTotal) * 100 : null,
    unidadesSinCosto,
    ingresoSinCosto,
  };
}

/**
 * Ganancia real mes a mes: lo que entró por ventas menos el costo de lo que
 * efectivamente se vendió (no lo que se compró) menos los gastos del mes.
 *
 * Comprar stock no aparece como pérdida: esa plata no se perdió, se convirtió
 * en mercadería y su costo recién pesa cuando esa mercadería se vende.
 *
 * Los decants suman como ingreso pero sin costo asociado: salen de un frasco
 * que sigue contando como stock, así que su costo ya está en la compra de ese
 * frasco y todavía no se descontó. Se devuelven aparte para poder aclararlo.
 */
export function calcularEvolucionGanancia({
  ventasSocios = [], ventasDecants = [], compras = [], gastos = [],
} = {}) {
  const { porVenta } = asignarVentasACompras(compras, ventasSocios);
  const porMes = {};

  const mes = (clave) => {
    porMes[clave] = porMes[clave] ?? {
      mes: clave, ingresoPerfumes: 0, costoVendido: 0, ingresoDecants: 0, gastos: 0,
    };
    return porMes[clave];
  };

  porVenta.forEach((v) => {
    if (!v.mes) return;
    const m = mes(v.mes);
    m.ingresoPerfumes += v.ingreso;
    m.costoVendido += v.costo;
  });

  ventasDecants.forEach((v) => {
    const clave = mesDe(v.fecha);
    if (!clave) return;
    mes(clave).ingresoDecants += (v.cantidad ?? 0) * (v.precioUnitario ?? 0);
  });

  gastos.forEach((g) => {
    const clave = mesDe(g.fecha);
    if (!clave) return;
    mes(clave).gastos += g.monto ?? 0;
  });

  return Object.values(porMes)
    .map((m) => ({
      ...m,
      ingreso: m.ingresoPerfumes + m.ingresoDecants,
      ganancia: m.ingresoPerfumes - m.costoVendido + m.ingresoDecants - m.gastos,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

export function calcularRankingPerfumes(ventasSocios = []) {
  const porPerfume = {};
  ventasSocios
    .filter((v) => v.estado === 'cobrada')
    .forEach((v) => {
      porPerfume[v.perfumeId] = porPerfume[v.perfumeId] || { perfumeId: v.perfumeId, perfumeNombre: v.perfumeNombre, cantidad: 0 };
      porPerfume[v.perfumeId].cantidad += v.cantidad;
    });
  return Object.values(porPerfume).sort((a, b) => b.cantidad - a.cantidad);
}

export function calcularTamanosDecantPorPerfume(ventasDecants = [], perfumeId) {
  const porTamano = {};
  ventasDecants
    .filter((v) => v.perfumeId === perfumeId)
    .forEach((v) => {
      porTamano[v.tamano] = (porTamano[v.tamano] || 0) + v.cantidad;
    });
  return Object.entries(porTamano)
    .map(([tamano, cantidad]) => ({ tamano, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

export function calcularEvolucionVentas(ventasSocios = [], ventasDecants = []) {
  const porMes = {};
  const acumular = (fecha, importe) => {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    porMes[clave] = porMes[clave] || { mes: clave, ingreso: 0, cantidad: 0 };
    porMes[clave].ingreso += importe;
    porMes[clave].cantidad += 1;
  };

  ventasSocios
    .filter((v) => v.estado === 'cobrada')
    .forEach((v) => acumular(v.fecha, v.cantidad * v.precioUnitario));
  ventasDecants.forEach((v) => acumular(v.fecha, v.cantidad * v.precioUnitario));

  return Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes));
}

export function calcularIngresoTotal(ventasSocios = [], ventasDecants = []) {
  const ingresoVentas = ventasSocios
    .filter((v) => v.estado === 'cobrada')
    .reduce((acc, v) => acc + v.cantidad * v.precioUnitario, 0);
  const ingresoDecants = ventasDecants.reduce((acc, v) => acc + v.cantidad * v.precioUnitario, 0);
  return ingresoVentas + ingresoDecants;
}

/**
 * Unidades efectivamente vendidas por cada socio (perfumes cobrados + decants),
 * no cantidad de movimientos cargados en el sistema. Se atribuye a `vendidoPor`
 * (quién hizo la venta), no a `creadoPor` (quién la tipeó).
 */
export function calcularActividadPorSocio({ ventasSocios = [], ventasDecants = [] }) {
  const actividad = SOCIOS.reduce((acc, s) => {
    acc[s.id] = { perfumes: 0, decants: 0, total: 0 };
    return acc;
  }, {});

  ventasSocios
    .filter((v) => v.estado === 'cobrada')
    .forEach((v) => {
      if (!actividad[v.vendidoPor]) return;
      actividad[v.vendidoPor].perfumes += v.cantidad;
      actividad[v.vendidoPor].total += v.cantidad;
    });

  ventasDecants.forEach((v) => {
    if (!actividad[v.vendidoPor]) return;
    actividad[v.vendidoPor].decants += v.cantidad;
    actividad[v.vendidoPor].total += v.cantidad;
  });

  return actividad;
}

export { OTRO_SOCIO };

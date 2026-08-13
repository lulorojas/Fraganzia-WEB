import { SOCIOS } from '../constants';

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

  compras.forEach((c) => sumar(c.pagadoPor, c.metodoPago, -c.montoTotal));

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

  // Quien paga la compra pone plata por los dos: es acreedor de la mitad.
  compras.forEach((c) => {
    saldo += signo(c.pagadoPor) * (c.montoTotal / 2);
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

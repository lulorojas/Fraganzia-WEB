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

  compras.forEach((c) => (c.pagos || []).forEach((p) => sumar(p.socioId, p.metodo, -p.monto)));

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

  compras.forEach((c) => {
    (c.pagos || []).forEach((p) => {
      saldo += signo(p.socioId) * (p.monto - c.montoTotal / 2);
    });
  });

  transferenciasSocios.forEach((t) => {
    saldo += signo(t.de) * t.monto;
  });

  return saldo;
}

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
      stock[v.perfumeId] = (stock[v.perfumeId] || 0) - v.cantidad;
    });
  return stock;
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

export function calcularActividadPorSocio({
  ventasSocios = [],
  ventasDecants = [],
  compras = [],
  gastos = [],
  movimientosPersonales = [],
  transferenciasSocios = [],
}) {
  const actividad = SOCIOS.reduce((acc, s) => {
    acc[s.id] = 0;
    return acc;
  }, {});
  const contar = (socioId) => {
    if (actividad[socioId] === undefined) return;
    actividad[socioId] += 1;
  };
  [...ventasSocios].forEach((v) => contar(v.creadoPor));
  [...ventasDecants].forEach((v) => contar(v.creadoPor));
  [...compras].forEach((c) => contar(c.creadoPor));
  [...gastos].forEach((g) => contar(g.creadoPor));
  [...movimientosPersonales].forEach((m) => contar(m.creadoPor));
  [...transferenciasSocios].forEach((t) => contar(t.creadoPor));
  return actividad;
}

export { OTRO_SOCIO };

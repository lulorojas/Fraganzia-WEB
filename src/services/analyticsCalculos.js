import { SOCIOS } from '../constants';
import {
  asignarVentasACompras, itemsDeVenta, mesDe, totalDeVenta, unidadesDeVenta,
} from './panelFinancieroCalculos';
import { fechaRegistro } from '../utils/format';

/**
 * Cálculos de la pantalla Analytics y del gráfico diario del Inicio. Son
 * funciones puras: reciben los movimientos ya leídos y devuelven totales.
 *
 * Todo lo que es "ganancia" sigue la misma cuenta que el resto del panel:
 * (vendido − costo de la mercadería vendida − gastos del mes) ÷ 2 socios.
 * Una venta pendiente de cobro no cuenta como vendida hasta que se cobra.
 */

const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const nombreDeMes = (indice) => NOMBRES_MES[indice];

export function claveDeMes(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

/** Los últimos `cantidad` meses, del más viejo al actual. */
export function mesesRecientes(cantidad = 6, hoy = new Date()) {
  const meses = [];
  for (let i = cantidad - 1; i >= 0; i -= 1) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const nombre = NOMBRES_MES[d.getMonth()];
    meses.push({
      clave: claveDeMes(d),
      nombre,
      label: nombre[0].toUpperCase() + nombre.slice(1),
      corto: nombre[0].toUpperCase() + nombre.slice(1, 3),
      anio: d.getFullYear(),
      indice: d.getMonth(),
    });
  }
  return meses;
}

export function mesAnteriorClave(clave) {
  const [anio, mes] = clave.split('-').map(Number);
  return claveDeMes(new Date(anio, mes - 2, 1));
}

export function nombreDeDia(fecha) {
  const nombre = NOMBRES_DIA[fecha.getDay()];
  return nombre[0].toUpperCase() + nombre.slice(1);
}

const bolsa = () => ({ unidades: 0, monto: 0 });

function mesVacio(clave) {
  return {
    clave,
    perfumes: bolsa(),
    decants: bolsa(),
    costo: 0,
    gastos: 0,
    porSocio: Object.fromEntries(SOCIOS.map((s) => [s.id, { perfumes: bolsa(), decants: bolsa() }])),
  };
}

/**
 * Una fila por cada mes pedido, con ceros donde no hubo movimiento, así los
 * gráficos de 6 meses siempre tienen los 6 puntos.
 */
export function calcularResumenMensual(
  { ventasSocios = [], ventasDecants = [], compras = [], gastos = [], ajustesStock = [] },
  meses
) {
  const porMes = Object.fromEntries(meses.map((m) => [m.clave, mesVacio(m.clave)]));

  const { porVenta } = asignarVentasACompras(compras, ventasSocios, ajustesStock);
  porVenta.forEach((v) => {
    const m = porMes[v.mes];
    if (!m) return;
    m.perfumes.unidades += v.unidades;
    m.perfumes.monto += v.ingreso;
    m.costo += v.costo;
    const socio = m.porSocio[v.vendidoPor];
    if (socio) {
      socio.perfumes.unidades += v.unidades;
      socio.perfumes.monto += v.ingreso;
    }
  });

  ventasDecants.forEach((v) => {
    const m = porMes[mesDe(v.fecha)];
    if (!m) return;
    const monto = (v.cantidad ?? 0) * (v.precioUnitario ?? 0);
    m.decants.unidades += v.cantidad ?? 0;
    m.decants.monto += monto;
    const socio = m.porSocio[v.vendidoPor];
    if (socio) {
      socio.decants.unidades += v.cantidad ?? 0;
      socio.decants.monto += monto;
    }
  });

  gastos.forEach((g) => {
    const m = porMes[mesDe(g.fecha)];
    if (m) m.gastos += g.monto ?? 0;
  });

  return meses.map((meta) => {
    const m = porMes[meta.clave];
    const vendido = m.perfumes.monto + m.decants.monto;
    const gananciaNegocio = vendido - m.costo - m.gastos;
    return {
      ...meta,
      ...m,
      vendido,
      gananciaNegocio,
      gananciaPorSocio: gananciaNegocio / SOCIOS.length,
    };
  });
}

export function variacionPct(actual, anterior) {
  if (!anterior) return null;
  return ((actual - anterior) / anterior) * 100;
}

/** "5 ml", "5ml", "5" → "5 ml". Las ventas viejas tienen el tamaño tipeado a mano. */
export function normalizarTamano(tamano) {
  const n = parseInt(String(tamano ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? `${n} ml` : String(tamano ?? '—');
}

const ventasDelMes = (lista, clave) => lista.filter((v) => mesDe(v.fecha) === clave);

export function rankingPerfumesDelMes(ventasSocios = [], clave) {
  const porPerfume = {};
  ventasDelMes(ventasSocios.filter((v) => v.estado === 'cobrada'), clave).forEach((v) => {
    itemsDeVenta(v).forEach((item) => {
      const fila = porPerfume[item.perfumeId] ?? {
        perfumeId: item.perfumeId, nombre: item.perfumeNombre, unidades: 0, monto: 0,
      };
      fila.unidades += item.cantidad ?? 0;
      fila.monto += (item.cantidad ?? 0) * (item.precioUnitario ?? 0);
      porPerfume[item.perfumeId] = fila;
    });
  });
  return Object.values(porPerfume).sort((a, b) => b.unidades - a.unidades || b.monto - a.monto);
}

export function rankingDecantsDelMes(ventasDecants = [], clave) {
  const porPerfume = {};
  ventasDelMes(ventasDecants, clave).forEach((v) => {
    const fila = porPerfume[v.perfumeId] ?? {
      perfumeId: v.perfumeId, nombre: v.perfumeNombre, unidades: 0, monto: 0, tamanos: {},
    };
    const tamano = normalizarTamano(v.tamano);
    fila.unidades += v.cantidad ?? 0;
    fila.monto += (v.cantidad ?? 0) * (v.precioUnitario ?? 0);
    fila.tamanos[tamano] = (fila.tamanos[tamano] ?? 0) + (v.cantidad ?? 0);
    porPerfume[v.perfumeId] = fila;
  });
  return Object.values(porPerfume)
    .map(({ tamanos, ...fila }) => ({
      ...fila,
      tamanoTop: Object.entries(tamanos).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
    }))
    .sort((a, b) => b.unidades - a.unidades || b.monto - a.monto);
}

export function decantsPorTamanoDelMes(ventasDecants = [], clave) {
  const porTamano = {};
  ventasDelMes(ventasDecants, clave).forEach((v) => {
    const tamano = normalizarTamano(v.tamano);
    const fila = porTamano[tamano] ?? { tamano, unidades: 0, monto: 0 };
    fila.unidades += v.cantidad ?? 0;
    fila.monto += (v.cantidad ?? 0) * (v.precioUnitario ?? 0);
    porTamano[tamano] = fila;
  });
  return Object.values(porTamano).sort((a, b) => parseInt(a.tamano, 10) - parseInt(b.tamano, 10));
}

/**
 * Una entrada por día del mes, de 1 a `hastaDia`. Cada barra del Inicio apila
 * perfumes (cobrados) y decants.
 */
export function calcularVentasPorDia({ ventasSocios = [], ventasDecants = [] }, clave, hastaDia) {
  const dias = Array.from({ length: hastaDia }, (_, i) => ({
    dia: i + 1, perfumes: bolsa(), decants: bolsa(), total: 0,
  }));

  const sumar = (fecha, tipo, unidades, monto) => {
    const d = fechaRegistro(fecha);
    if (!d || claveDeMes(d) !== clave) return;
    const fila = dias[d.getDate() - 1];
    if (!fila) return;
    fila[tipo].unidades += unidades;
    fila[tipo].monto += monto;
    fila.total += monto;
  };

  ventasSocios
    .filter((v) => v.estado === 'cobrada')
    .forEach((v) => sumar(v.fecha, 'perfumes', unidadesDeVenta(v), totalDeVenta(v)));
  ventasDecants.forEach((v) => sumar(
    v.fecha, 'decants', v.cantidad ?? 0, (v.cantidad ?? 0) * (v.precioUnitario ?? 0)
  ));

  return dias;
}

/**
 * Perfumes que están pendientes de cobro: ventas cargadas con estado
 * "pendiente". El Inicio los muestra aparte del "por cobrar" del stock.
 */
export function calcularPendientesDeCobro(ventasSocios = []) {
  const pendientes = ventasSocios.filter((v) => v.estado === 'pendiente');
  return {
    cantidad: pendientes.length,
    monto: pendientes.reduce((acc, v) => acc + totalDeVenta(v), 0),
  };
}

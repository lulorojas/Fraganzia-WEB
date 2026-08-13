/**
 * Analítica del negocio derivada de los pedidos online (`pedidos`), que son la
 * única fuente de demanda real de clientes que existe hoy. Funciones puras:
 * reciben los pedidos ya leídos y devuelven totales.
 *
 * Lo que NO se puede calcular todavía (no hay datos): perfumes más vistos,
 * más consultados y tiempo en la app. La colección `estadisticas` existe en las
 * reglas pero nadie escribe en ella — haría falta instrumentar el sitio público.
 */

function itemsDe(pedidos) {
  return pedidos.flatMap((p) => p.items ?? []);
}

export function calcularPerfumesMasPedidos(pedidos = [], limite = 8) {
  const porPerfume = {};
  itemsDe(pedidos).forEach((item) => {
    const clave = item.perfumeId ?? item.nombre;
    if (!clave) return;
    porPerfume[clave] = porPerfume[clave] ?? {
      perfumeId: item.perfumeId,
      nombre: item.nombre,
      marca: item.marca,
      unidades: 0,
      ingreso: 0,
    };
    porPerfume[clave].unidades += item.cantidad ?? 0;
    porPerfume[clave].ingreso += (item.precioARS ?? 0) * (item.cantidad ?? 0);
  });
  return Object.values(porPerfume)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, limite);
}

export function calcularMarcasMasPedidas(pedidos = [], limite = 5) {
  const porMarca = {};
  itemsDe(pedidos).forEach((item) => {
    if (!item.marca) return;
    porMarca[item.marca] = porMarca[item.marca] ?? { marca: item.marca, unidades: 0, ingreso: 0 };
    porMarca[item.marca].unidades += item.cantidad ?? 0;
    porMarca[item.marca].ingreso += (item.precioARS ?? 0) * (item.cantidad ?? 0);
  });
  return Object.values(porMarca)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, limite);
}

export function calcularResumenPedidos(pedidos = []) {
  const cantidad = pedidos.length;
  const facturado = pedidos.reduce((acc, p) => acc + (p.totalARS ?? 0), 0);
  const unidades = itemsDe(pedidos).reduce((acc, i) => acc + (i.cantidad ?? 0), 0);
  return {
    cantidad,
    facturado,
    unidades,
    ticketPromedio: cantidad ? facturado / cantidad : 0,
    unidadesPorPedido: cantidad ? unidades / cantidad : 0,
  };
}

export function calcularEvolucionPedidos(pedidos = [], meses = 6) {
  const porMes = {};
  pedidos.forEach((p) => {
    const d = p.createdAt?.toDate ? p.createdAt.toDate() : null;
    if (!d) return;
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    porMes[clave] = porMes[clave] ?? { mes: clave, pedidos: 0, ingreso: 0 };
    porMes[clave].pedidos += 1;
    porMes[clave].ingreso += p.totalARS ?? 0;
  });
  return Object.values(porMes)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .slice(-meses);
}

/**
 * Perfumes que los clientes pidieron pero que hoy no tienen stock cargado:
 * demanda comprobada sin nada para vender. Es la lista de "qué reponer".
 */
export function calcularOportunidadesReposicion(pedidos = [], stockPorProducto = {}, limite = 5) {
  return calcularPerfumesMasPedidos(pedidos, Infinity)
    .filter((p) => p.perfumeId && (stockPorProducto[p.perfumeId] ?? 0) === 0)
    .slice(0, limite);
}

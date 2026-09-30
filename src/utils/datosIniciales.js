/**
 * Datos públicos "congelados" en el HTML durante el build (tools/prerender.mjs):
 * catálogo, promociones activas, config y cotización del dólar.
 *
 * Se cargan en la caché de React Query ANTES del primer render, así:
 *  - React arranca mostrando lo mismo que el HTML pre-renderizado (sin
 *    parpadeos ni saltos de layout);
 *  - las páginas no esperan al SDK de Firestore para mostrar productos.
 *
 * Se marcan con la fecha del build como `updatedAt`: para React Query ya están
 * viejos, así que en cuanto un componente los usa se vuelven a pedir a
 * Firestore en segundo plano y se reemplazan por los datos en vivo.
 */
export function sembrarDatosIniciales(queryClient) {
  const el = document.getElementById('datos-iniciales');
  if (!el) return;

  let datos;
  try {
    datos = JSON.parse(el.textContent);
  } catch {
    return;
  }

  const updatedAt = Date.parse(datos.generadoEn) || 1;
  const sembrar = (key, value) => {
    if (value !== undefined && value !== null) queryClient.setQueryData(key, value, { updatedAt });
  };

  sembrar(['perfumes', 'public'], datos.perfumes);
  sembrar(['promociones', 'activas'], datos.promociones);
  sembrar(['config', 'general'], datos.config);
  sembrar(['dolarBlue'], datos.dolarBlue);
}

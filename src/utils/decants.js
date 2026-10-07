// Catálogo de decants: fracciones del perfume completo en 3/5/10ml.
// Precio = costo del líquido por ml (lo que sale el perfume completo,
// prorrateado) multiplicado x3 — igual criterio en USD que el resto del
// catálogo, así reutiliza preciosPorMetodo() para transferencia/efectivo.
export const ML_DECANT = [3, 5, 10];

export function precioDecantUSD(perfume, ml) {
  return (perfume.precioUSD / perfume.volumenML) * ml * 3;
}

// Catálogo de decants: fracciones del perfume completo en 3/5/10ml.
// Precio = costo del líquido por ml (lo que sale el perfume completo,
// prorrateado) multiplicado x3 — igual criterio en USD que el resto del
// catálogo, así reutiliza preciosPorMetodo() para transferencia/efectivo.
export const ML_DECANT = [3, 5, 10];

export function precioDecantUSD(perfume, ml) {
  return (perfume.precioUSD / perfume.volumenML) * ml * 3;
}

// Perfumes que se venden en decant. Se listan acá para que el catálogo
// funcione sin tocar Firestore; marcar `decant` en el admin suma otros.
const IDS_DECANT = new Set([
  'VPjJNrfTC9KAdfeTWXbo', // Al Haramain Amber Oud Gold Edition 120 ml
  'wepPuwOZj4bsa3qplU5u', // Afnan 9PM Night Out
  'ObXU3hG57XWPMdjy2eHN', // Maison Alhambra Philos Pura
  'VQxKIDYWdf47gwXIaONg', // Rasasi Hawas For Him Ice
  'KMzWBGyFrYtZEtjfclUr', // Lattafa Yara Rosa
  'flOqjOfGiHBsmkQ3VqCN', // Armaf Club de Nuit Intense (masculino)
  'MJUrJAvdDc6tymU5DR5X', // Afnan 9PM
  'Y8Bn823khq2XOsnrxygy', // Armaf Odyssey Mandarin Sky
  'jvvpGl2Yq9WMNflz1zkC', // Lattafa Confidential Private Gold
  'TxgVBhYKlLqCMKtAO85S', // Rayhaan Wolf
  'SsVrBekwX9aLv2wZcboq', // Maison Alhambra Jorge di Profumo Deep Blue
  '4DgvQGctkSeYfOGsdPhy', // Lattafa Ajwad 60 ml
]);

export const esDecant = (perfume) => perfume.decant === true || IDS_DECANT.has(perfume.id);

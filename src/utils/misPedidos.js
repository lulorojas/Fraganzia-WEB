// Pedidos hechos desde este navegador, para poder volver a su seguimiento
// (/mis-pedidos) sin cuenta. Solo se guardan los ids, el más nuevo primero.
const STORAGE_KEY = 'fraganzia_pedidos';
const MAXIMO = 20;

export function listarPedidosLocales() {
  try {
    const ids = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function guardarPedidoLocal(id) {
  try {
    const ids = [id, ...listarPedidosLocales().filter((x) => x !== id)].slice(0, MAXIMO);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Sin storage: el cliente igual tiene el link en su mensaje de WhatsApp.
  }
}

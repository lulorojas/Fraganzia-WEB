const STORAGE_KEY = 'fraganzia_carrito';

export function leerCarrito() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function guardarCarrito(estado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    // localStorage puede no estar disponible (modo privado); el carrito
    // sigue funcionando en memoria para la sesión actual.
  }
}

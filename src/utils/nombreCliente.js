// El nombre del último pedido se recuerda en este navegador: quien vuelve a
// comprar no lo tiene que escribir de nuevo. Si el storage no está disponible
// (modo privado, bloqueado), simplemente no se recuerda.
const CLAVE = 'fraganzia:nombre-cliente';

export function leerNombreCliente() {
  try {
    return localStorage.getItem(CLAVE) ?? '';
  } catch {
    return '';
  }
}

export function guardarNombreCliente(nombre) {
  try {
    localStorage.setItem(CLAVE, nombre);
  } catch {
    // Sin storage: no se recuerda.
  }
}
